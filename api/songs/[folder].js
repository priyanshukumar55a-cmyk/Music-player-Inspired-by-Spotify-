import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { folder } = req.query;
  const dir = path.join(process.cwd(), "public/songs", folder);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".mp3"));
  res.status(200).json(files);
}
