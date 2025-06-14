import express from 'express';
import { validate } from '../../../middlewares/validate.middlewares';
import controller from './dynamic.controller';
import {
  createSchema,
  // deleteSchema,
  // getAllSchema,
  // getSchema,
  updateSchema,
} from './dynamicTable.schema';

const router = express.Router();
router.post(
  '/:projectSlug/',
  validate(createSchema),
  controller.createController,
);
router.put(
  '/:projectSlug/:id',
  validate(updateSchema),
  controller.updateController,
);
// router.delete('/:id', validate(deleteSchema), controller.deleteController);
// router.get('/:id', validate(getSchema), controller.getController);
// router.get('/', validate(getAllSchema), controller.getAllController);

export default router;
