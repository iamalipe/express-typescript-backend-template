import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './project.controller';
import {
  createSchema,
  deleteSchema,
  getSchema,
  updateSchema,
} from './project.schema';

import dynamicTableRouter from './dynamicTable/dynamicTable.route';

const router = express.Router();

router.post('/', validate(createSchema), controller.createController);
router.put('/:id', validate(updateSchema), controller.updateController);
router.delete('/:id', validate(deleteSchema), controller.deleteController);
router.get('/:id', validate(getSchema), controller.getController);
router.get('/', controller.getAllController);

router.use('/', dynamicTableRouter);

export default router;
