import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

function getUploadsDir(): string {
  const dir = process.env.UPLOADS_DIR ?? "./data/uploads";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, getUploadsDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB safety net (client compresses to ~300KB)
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Дозволені лише зображення (JPEG, PNG, WebP, HEIC)"));
    }
  },
});
