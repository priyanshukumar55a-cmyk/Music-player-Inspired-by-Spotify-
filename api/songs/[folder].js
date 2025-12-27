import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { folder } = req.query;

  const songsDir = path.join(process.cwd(), "public/songs", folder);

  if (!fs.existsSync(songsDir)) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const files = fs.readdirSync(songsDir)
    .filter(file => file.endsWith(".mp3"));

  res.status(200).json(files);
}
