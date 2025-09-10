import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './copyMe.controller';
import {
  createSchema,
  deleteSchema,
  getAllSchema,
  getSchema,
  updateSchema,
} from './copyMe.schema';

const router = express.Router();
router.post('/', validate(createSchema), controller.createController);
router.put('/:id', validate(updateSchema), controller.updateController);
router.delete('/:id', validate(deleteSchema), controller.deleteController);
router.get('/:id', validate(getSchema), controller.getController);
router.get('/', validate(getAllSchema), controller.getAllController);

export default router;
