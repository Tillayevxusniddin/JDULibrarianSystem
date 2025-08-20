// middlewares/uploadAvatar.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Yuklash uchun papka mavjudligini tekshirish va yaratish
const uploadDir = 'public/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Fayl nomini unikal qilish
    const user_id = req.user!.id; // authenticate middleware'dan keladi
    const uniqueSuffix = Date.now();
    cb(
      null,
      `user-${user_id}-${uniqueSuffix}${path.extname(file.originalname)}`,
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
    cb(new Error('Faqat rasm formatidagi fayllarni yuklash mumkin!'));
  }
};

export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2 MB
  },
});
