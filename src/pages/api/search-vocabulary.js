// pages/api/search-vocabulary.js

import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  try {
    // Grab 'query' from query-string (the search term the user typed)
    const { query } = req.query; 

    // Load the full vocabulary file
    const filePath = path.join(process.cwd(), "public/data", "vocabulary-Genki1.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(fileContents);

    // If no search query is provided, return everything
    if (!query || !query.trim()) {
      return res.status(200).json(data);
    }

    // Otherwise, filter items where 'English' or 'Japanese(Hiragana/Katakana)' 
    // includes the search term (case-insensitive).
    const lowerQuery = query.toLowerCase();
    const filteredData = data.filter((item) => {
      const englishText = item.English?.toLowerCase() || "";
      const japaneseText = (
        item["Japanese(Hiragana/Katakana)"] ||
        item.Japanese || 
        ""
      ).toLowerCase();

      // Return true if either English or Japanese text contains the query
      return englishText.includes(lowerQuery) || japaneseText.includes(lowerQuery);
    });

    return res.status(200).json(filteredData);
  } catch (error) {
    console.error("Error loading or searching vocabulary data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
