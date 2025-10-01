import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const OPENAI_API_KEY = process.env.OPENAI_KEY;
  const assistantId = 'asst_mc7zfIt9K7ja3RGsy66UZwjJ';
  const userMessage = req.body.message || 'Generate a JSON object with a practice sentence to translate from English to Japanese';

  try {
    // Step 1: Create a Thread
    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads',
      {},
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );
    const threadId = threadResponse.data.id;

    // Step 2: Add Message to the Thread
    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: 'user',
        content: userMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    // Step 3: Create a Run for Assistant's Response
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { assistant_id: assistantId },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );
    const runId = runResponse.data.id;

    // Step 4: Poll for Run Completion Status
    let attempts = 0;
    const maxAttempts = 15;
    const pollingInterval = 3000;
    let runComplete = false;
    let extractedArguments = null;

    while (attempts < maxAttempts && !runComplete) {
      const runStatusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
        }
      );

      const runStatus = runStatusResponse.data.status;
      console.log(`Run status: ${runStatus}`);

      if (runStatus === 'completed') {
        runComplete = true;
        break;
      } else if (runStatus === 'requires_action') {
        // Check for the action details
        const requiredAction = runStatusResponse.data.required_action;
        console.log('Assistant requires action:', JSON.stringify(requiredAction, null, 2));

        // Extract the arguments from requiredAction
        extractedArguments = requiredAction.submit_tool_outputs.tool_calls[0].function.arguments;
        
        // Exit the loop early if we got the arguments
        runComplete = true;
        break;
      }

      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }

    if (extractedArguments) {
      // If we have extracted arguments, return them directly
      return res.status(200).json({ message: extractedArguments });
    } else if (!runComplete) {
      return res.status(408).json({ error: 'Assistant response timeout or action required not fulfilled' });
    }

    // Step 5: Retrieve the Assistant’s Message if needed
    const messageResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    const messages = messageResponse.data.data;
    const assistantMessage = messages.find((msg) => msg.role === 'assistant')?.content;

    if (assistantMessage) {
      return res.status(200).json({ message: assistantMessage });
    } else {
      return res.status(500).json({ error: 'Assistant response not found in thread messages' });
    }
  } catch (error) {
    console.error('Error during the OpenAI API process:', error);
    res.status(500).json({ error: 'Failed to retrieve response from OpenAI' });
  }
}
