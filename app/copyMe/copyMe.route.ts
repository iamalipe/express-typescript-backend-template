import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import { validateMulter } from '../../middlewares/multer.middlewares';
import controller from './copyMe.controller';
import {
  createManySchema,
  createSchema,
  deleteSchema,
  getAllSchema,
  getSchema,
  updateSchema,
} from './copyMe.schema';

const router = express.Router();

const fileUploads = validateMulter({
  validateFiles: [
    {
      fieldName: 'fileImage',
      isArray: false,
      fileSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      s3Upload: true,
      s3Folder: 'copy-me/images',
      s3Type: 'public',
    },
    {
      fieldName: 'fileDoc',
      isArray: false,
      fileSize: 20 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf', 'text/plain'],
      s3Upload: true,
      s3Folder: 'copy-me/docs',
      s3Type: 'private',
    },
  ],
});

router.post('/', fileUploads, validate(createSchema), controller.createController);
router.post(
  '/many',
  validate(createManySchema),
  controller.createManyController,
);
router.put('/:id', fileUploads, validate(updateSchema), controller.updateController);
router.delete('/:id', validate(deleteSchema), controller.deleteController);
router.get('/:id', validate(getSchema), controller.getController);
router.get('/', validate(getAllSchema), controller.getAllController);

export default router;
