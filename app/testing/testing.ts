import express, { Request, Response } from 'express';
import multer from 'multer';
import z from 'zod';
import { validateMulter } from '../../middlewares/multer.middlewares';
import { validate } from '../../middlewares/validate.middlewares';
import { cacheGet, cacheSet } from '../../services/cache.service';
import { s3Get } from '../../services/s3.services';
import { zFileS3 } from '../../utils/validation.utils';
const upload = multer();

const router = express.Router();

export const uploadTestingSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255),
    description: z.string().min(2).max(2000),
    file: zFileS3,
    images: z.array(zFileS3),
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
  validate(uploadTestingSchema),
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

// Cache testing route
router.post('/cache', async (req: Request, res: Response) => {
  const body = req.body;

  console.time('cacheGet');
  const cachedData = await cacheGet('test-key');
  console.timeEnd('cacheGet');
  console.log('getData', cachedData);

  console.time('cacheSet');
  await cacheSet('test-key', body, 60); // Cache for 60 seconds
  console.timeEnd('cacheSet');

  res.status(200).json({
    success: true,
    data: body,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
});

// Fetch image from S3 route
router.get('/get-image/*', async (req: Request, res: Response) => {
  const key = req.params[0];
  if (!key) {
    throw new AppError('Key is required', { status: 400 });
  }

  try {
    const s3Response = await s3Get(key);
    if (s3Response.ContentType) {
      res.setHeader('Content-Type', s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      res.setHeader('Content-Length', s3Response.ContentLength);
    }

    const stream = s3Response.Body as any;
    if (stream) {
      stream.pipe(res);
    } else {
      throw new AppError('Image stream not found', { status: 404 });
    }
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      throw new AppError('Image not found', { status: 404 });
    }
    throw error;
  }
});

export default router;
