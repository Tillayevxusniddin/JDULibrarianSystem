import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import ApiError from '../utils/ApiError.js';

const uploadDir = 'public/uploads/posts';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const user_id = req.user!.id;
    const uniqueSuffix = Date.now();
    cb(
      null,
      `post-${user_id}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Faqat rasm formatidagi fayllarni yuklash mumkin!'));
  }
};

export const uploadPostImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB
});
