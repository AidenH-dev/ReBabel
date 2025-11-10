//IMPORTANT NOTICE: The prompt may not be sufficiently strict enough to proivde the same JSON object sturucture/naming (MAKE SURE IT DOES)

import axios from "axios";
import path from "path";
import { promises as fs } from "fs";
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { lessons } = req.query;
  if (!lessons) {
    return res.status(400).json({ error: "Lesson parameter is required in the URL." });
  }

  const OPENAI_API_KEY = process.env.OPENAI_KEY;
  const userMessage =
    req.body.message ||
    "Generate a JSON object with a practice sentence to translate from English to Japanese";

  // 1) Load and filter vocabulary data
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
    .map(({ "Japanese(Hiragana/Katakana)": japanese, English: english }) => ({
      japanese,
      english,
    }));

  console.log("Filtering for Lesson:", lessonNumber);
  console.log("Filtered Vocabulary Pool:", vocabularyPool);

  if (vocabularyPool.length === 0) {
    return res.status(404).json({ error: `No vocabulary found for Lesson ${lessonNumber}.` });
  }

  // 2) Load and filter grammar data
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
    .map(({ Title: title, Description: description }) => ({
      title,
      description,
    }));

  console.log("Filtered Grammar Pool:", grammarPool);

  if (grammarPool.length === 0) {
    return res.status(404).json({ error: `No grammar found for Lesson ${lessonNumber}.` });
  }

  // 3) Prepare system instructions (role: "system") + user message (role: "user")
  const systemInstructions = `
  You are a formal, straightforward AI tutor focusing on correct verb conjugation and adverb usage.
  You will generate one simple English sentence for translation. 
  You will also generate one sentance that is expected japanese version of that english sentence. 
  Respond with English, hiragana, and katakana only (no kanji), and ensure feedback is direct and grammar-focused.
  Keep scenarios practical and relevant. Always maintain a formal tone.
  this is the naming scheme of the response object {english_sentence: "example response" expected_japanese_translation: "何か"}

  Vocabulary Pool:
  ${JSON.stringify(vocabularyPool)}

  Grammar Pool:
  ${JSON.stringify(grammarPool)}

  Instructions:
  The assistant evaluates translations, providing feedback in only English, hiragana, and katakana, suitable for beginners.
  The feedback is clear, direct, and focused on correct verb usage, adverbs, vocabulary, and grammar, as specified in the given pools.
  `;

  try {
    // 4) Make a single call to the Chat Completions endpoint with GPT-4
    const completionResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4", // Use GPT-4 here
        messages: [
          { role: "system", content: systemInstructions },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7, // Adjust if needed
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistantMessage = completionResponse?.data?.choices?.[0]?.message?.content;
    if (assistantMessage) {
      return res.status(200).json({ message: assistantMessage });
    } else {
      return res.status(500).json({ error: "No message received from the assistant." });
    }
  } catch (error) {
    console.error("Error during the OpenAI API process:", error);
    return res.status(500).json({ error: "Failed to retrieve response from OpenAI" });
  }
})
