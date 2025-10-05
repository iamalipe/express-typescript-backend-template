import express, { Request, Response } from 'express';
import multer from 'multer';
import z from 'zod';
import { validateMulter } from '../../middlewares/multer.middlewares';
const upload = multer();

const router = express.Router();

export const uploadTestingSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255),
    description: z.string().min(2).max(2000),
    file: z.file(),
    images: z.array(z.file()),
  }),
});
export type uploadTestingSchemaType = z.infer<typeof uploadTestingSchema>;
router.post(
  '/upload-testing',
  validateMulter({
    validateFiles: [
      {
        fieldName: 'file',
        isArray: false,
        fileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        s3Upload: true,
        s3Folder: 'uploads',
        s3Type: 'public',
      },
      {
        fieldName: 'images',
        isArray: true,
        fileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        s3Upload: true,
        s3Folder: 'images',
        s3Type: 'public',
      },
    ],
  }),
  async (req: Request, res: Response) => {
    const body = req.body as uploadTestingSchemaType['body'];
    res.status(200).json({
      success: true,
      data: body,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    });
  },
);

export default router;
