import express from 'express';
import { jwtAuth } from '../../middlewares/jwtAuth.middlewares';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './blog.controller';
import {
  createSchema,
  deleteSchema,
  getAllSchema,
  getSchema,
  updateSchema,
} from './blog.schema';

const router = express.Router();
router.post('/', jwtAuth, validate(createSchema), controller.createController);
router.put(
  '/:id',
  jwtAuth,
  validate(updateSchema),
  controller.updateController,
);
router.delete(
  '/:id',
  jwtAuth,
  validate(deleteSchema),
  controller.deleteController,
);
router.get('/:id', validate(getSchema), controller.getController);
router.get('/', validate(getAllSchema), controller.getAllController);

export default router;
