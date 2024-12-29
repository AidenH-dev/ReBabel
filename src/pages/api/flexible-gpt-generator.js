import axios from "axios";
import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { lessons } = req.query;

  if (!lessons) {
    return res.status(400).json({ error: "Lesson parameter is required in the URL." });
  }

  const OPENAI_API_KEY = process.env.OPENAI_KEY;
  const userMessage = req.body.message || "Generate a JSON object with a practice sentence to translate from English to Japanese";

  let vocabularyData;
  try {
    const filePath = path.join(process.cwd(), "public/data", "vocabulary-Genki1.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    vocabularyData = JSON.parse(fileContents);

    console.log("Total vocabulary data loaded:", vocabularyData.length);
  } catch (error) {
    console.error("Error loading vocabulary file:", error);
    return res.status(500).json({ error: "Failed to load vocabulary data." });
  }

  const lessonNumber = parseInt(lessons.replace("Lesson ", ""), 10);
  const vocabularyPool = vocabularyData
    .filter((item) => item.Lesson === lessonNumber)
    .map(({ "Japanese(Hiragana/Katakana)": japanese, English: english }) => ({ japanese, english }));

  console.log("Filtering for Lesson:", lessonNumber);
  console.log("Filtered Vocabulary Pool:", vocabularyPool);

  if (vocabularyPool.length === 0) {
    return res.status(404).json({ error: `No vocabulary found for Lesson ${lessonNumber}.` });
  }

  let grammarData;
  try {
    const grammarFilePath = path.join(process.cwd(), "public/data", "grammar-Genki1.json");
    const grammarFileContents = await fs.readFile(grammarFilePath, "utf8");
    grammarData = JSON.parse(grammarFileContents);

    console.log("Total grammar data loaded:", grammarData.length);
  } catch (error) {
    console.error("Error loading grammar file:", error);
    return res.status(500).json({ error: "Failed to load grammar data." });
  }

  const grammarPool = grammarData
    .filter((item) => item.Lesson === lessonNumber)
    .map(({ Title: title, Description: description }) => ({ title, description }));

  console.log("Filtered Grammar Pool:", grammarPool);

  if (grammarPool.length === 0) {
    return res.status(404).json({ error: `No grammar found for Lesson ${lessonNumber}.` });
  }

  return res.status(200)
  const assistantInitializationData = {
    description: "This GPT is designed to be formal and straightforward in its interactions. It generates one simple English sentence for translation, focusing on correct verb conjugation and adverb usage.",
    vocabulary_pool: vocabularyPool,
    grammar_pool: grammarPool,
    instructions: "The assistant evaluates translations, providing feedback in only English, hiragana, and katakana, suitable for beginners and not using any kanji. It sticks to common daily scenarios for practical relevance. The feedback is clear, direct, and focused on correct verb usage, adverbs, vocabulary, and grammar, as specified in the given pools. The GPT maintains a formal tone throughout, ensuring that its guidance is precise and to the point, facilitating an effective and efficient learning experience."
  };

  try {
    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      assistantInitializationData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    const threadId = threadResponse.data.id;

    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: "user",
        content: userMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {},
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    let attempts = 0;
    const maxAttempts = 15;
    const pollingInterval = 3000;
    let runComplete = false;

    while (attempts < maxAttempts && !runComplete) {
      const runStatusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runResponse.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (runStatusResponse.data.status === "completed") {
        runComplete = true;
        break;
      }

      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }

    if (!runComplete) {
      return res.status(408).json({ error: "Assistant response timeout" });
    }

    const messageResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const assistantMessage = messageResponse.data.data.find((msg) => msg.role === "assistant")?.content;

    if (assistantMessage) {
      return res.status(200).json({ message: assistantMessage });
    } else {
      return res.status(500).json({ error: "Assistant response not found in thread messages" });
    }
  } catch (error) {
    console.error("Error during the OpenAI API process:", error);
    res.status(500).json({ error: "Failed to retrieve response from OpenAI" });
  }
}
