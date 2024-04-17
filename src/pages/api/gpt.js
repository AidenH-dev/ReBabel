import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      //const { question } = req.body; // Assuming body parser middleware is configured
//
      //if (!question) {
      //  return res.status(400).json({ error: 'No question provided' });
      //}

      const assistantId = 'asst_mc7zfIt9K7ja3RGsy66UZwjJ'; // Replace with your actual Assistant ID

      const response = await axios.post('https://api.openai.com/v1/threads/runs', {
        assistant_id: assistantId,
        thread: {
          messages: [
            { role: "user", content: "generate me a sentence" }
          ]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,  // Ensure your environment variable is set
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // New code to retrieve the assistant's message
      const threadId = response.data.thread_id;  // Get the thread ID from the response
      const messageResponse = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,  // Ensure your environment variable is set
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      const messages = messageResponse.data.data[0].content[0].text.value;
      // Combine original response with assistant's message
      //const fullResponse = { ...response.data, message: messageResponse.data[1].content };  // Assuming assistant's message is the second element (index 1)
      //const msgResponse = messageResponse.data[0].content[0]
      console.log("\nMESSAGE RESPONSE", messages)
      return res.status(200).json({messages});

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
