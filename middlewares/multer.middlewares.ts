import { NextFunction, Request, RequestHandler, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { s3Upload } from '../services/s3.services';

// 1. Ensure temp folder exists
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 2. Setup multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export type MimeTypes =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'video/mp4'
  | 'video/mpeg'
  | 'video/quicktime'
  | 'video/x-msvideo'
  | 'video/x-ms-wmv'
  | 'audio/mpeg'
  | 'audio/mp4'
  | 'audio/x-ms-wma'
  | 'audio/x-wav';

export type ValidateMulterType = {
  validateFiles: {
    fieldName: string;
    isArray: boolean;
    fileSize: number;
    allowedMimeTypes: MimeTypes[];
    s3Upload?: boolean;
    s3Folder?: string;
    s3Type?: 'private' | 'public';
  }[];
};
export const validateMulter = (params?: ValidateMulterType): RequestHandler => {
  const validateFiles = params?.validateFiles || [];

  if (validateFiles.length === 0) {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }

  const maxFileSize = Math.max(...validateFiles.map((file) => file.fileSize));
  const allowedMimeTypes = validateFiles
    .map((file) => file.allowedMimeTypes)
    .flat()
    .filter((mimeType) => mimeType !== undefined);
  const fieldname = validateFiles.map((file) => file.fieldName);

  const multerMiddleware = multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (!fieldname.includes(file.fieldname)) {
        return cb(new Error('Invalid file name'));
      }
      if (
        allowedMimeTypes.length > 0 &&
        !allowedMimeTypes.includes(file.mimetype?.toLowerCase() || '')
      ) {
        return cb(new Error('Invalid file type'));
      }
      cb(null, true);
    },
    limits: { fileSize: maxFileSize }, // 5MB max
  }).any();

  return async (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (err) => {
      if (err) {
        next(
          new AppError(err.message || 'Invalid file', {
            path: err?.field || 'file',
            status: 400,
          }),
        );
        return;
      }
      // @ts-ignore
      const files = (req.files as Express.Multer.File[]) || [];
      const newBody = {};
      await Promise.all(
        validateFiles.map(async (file) => {
          let filterFiles = files.filter(
            (fileX) =>
              fileX.fieldname === file.fieldName &&
              fileX.size <= file.fileSize &&
              file.allowedMimeTypes.includes(
                fileX.mimetype?.toLowerCase() || '',
              ),
          );

          if (file.s3Upload) {
            filterFiles = await Promise.all(
              filterFiles.map(async (fileX) => {
                const s3Url = await s3Upload({
                  fileName: fileX.filename || '',
                  folder: file.s3Folder || 'uploads',
                  path: fileX.path || '',
                  type: file.s3Type || 'private',
                });
                return { ...fileX, s3Url };
              }),
            );
          }

          if (file.isArray) {
            newBody[file.fieldName] = filterFiles;
          } else {
            newBody[file.fieldName] = filterFiles?.[0] || null;
          }
        }),
      );
      req.body = { ...req.body, ...newBody };
      next();
    });
  };
};
