import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// 1. S3 klientini sozlash
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 2. multer-s3 sozlamalari
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME!,
  acl: 'public-read', // Yuklangan fayllar hamma uchun ochiq (URL orqali) bo'ladi
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    // Faylni S3'da qaysi papkaga va qanday nom bilan saqlashni aniqlaymiz
    let folder = 'others';
    if (file.fieldname === 'profilePicture') folder = 'uploads/avatars';
    if (file.fieldname === 'logoImage') folder = 'uploads/logos';
    if (file.fieldname === 'postImage') folder = 'uploads/posts';
    if (file.fieldname === 'coverImage') folder = 'uploads/books';

    const fileName = `${folder}/${Date.now()}_${path.basename(
      file.originalname,
    )}`;
    cb(null, fileName);
  },
});

// 3. Tayyor multer middleware'ini eksport qilish
export const uploadToS3 = multer({
  storage: s3Storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
});

// 4. S3'dan faylni o'chirish uchun yordamchi funksiya
export const deleteFromS3 = async (fileUrl: string | null | undefined) => {
  if (!fileUrl || !fileUrl.includes('s3')) return; // Faqat S3 URL'larini o'chiramiz

  try {
    const bucketName = process.env.S3_BUCKET_NAME!;
    const key = new URL(fileUrl).pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);
    console.log(`✅ Successfully deleted ${key} from S3.`);
  } catch (error) {
    console.error(`❌ Error deleting ${fileUrl} from S3:`, error);
  }
};
