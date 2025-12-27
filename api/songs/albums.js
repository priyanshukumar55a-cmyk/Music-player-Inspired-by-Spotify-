import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const songsDir = path.join(process.cwd(), "public/songs");
  const folders = fs.readdirSync(songsDir);
  res.status(200).json(folders);
}
