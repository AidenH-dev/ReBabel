import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { lesson } = req.query;

  if (!lesson) {
    return res.status(400).json({ error: "Missing lesson query parameter" });
  }

  try {
    // Load the vocabulary.json file
    const filePath = path.join(process.cwd(), "public", "vocabulary-Genki1.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(fileContents);

    console.log("Total vocabulary data loaded:", data.length);
    console.log("Filtering for Lesson:", lesson);

    const lessonNumber = parseInt(lesson, 10); // Convert lesson to a number

    // Filter data based on lesson
    const filteredData = data.filter((entry) => entry.Lesson === lessonNumber);

    console.log("Filtered data:", filteredData);

    res.status(200).json(filteredData);
  } catch (error) {
    console.error("Error loading vocabulary data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
