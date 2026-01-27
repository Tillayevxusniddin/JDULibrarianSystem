import multer from 'multer';
import { Request } from 'express';
import ApiError from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv',
    'application/csv',
    'text/x-csv',
    'application/x-csv',
    'text/comma-separated-values',
    'text/x-comma-separated-values',
    // 'application/vnd.ms-excel' removed (duplicate)
  ];

  // Also check file extension as a fallback because some clients send generic binary/octet-stream types
  const isCsvOrExcelExtension = file.originalname.match(/\.(xls|xlsx|csv)$/i);

  if (allowedMimeTypes.includes(file.mimetype) || isCsvOrExcelExtension) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, 'Faqat Excel yoki CSV fayllarini yuklash mumkin (.xls, .xlsx, .csv)'),
    );
  }
};

export const uploadExcel = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
});
