import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './product.controller';
import {
  createManySchema,
  createSchema,
  deleteSchema,
  getAllSchema,
  getSchema,
  updateSchema,
} from './product.schema';

const router = express.Router();

// NOTE : Just an Experiment
router.get('/sync', controller.syncWithElasticController);
router.post('/search', controller.searchElasticController);

router.post('/', validate(createSchema), controller.createController);
router.post(
  '/many',
  validate(createManySchema),
  controller.createManyController,
);
router.get('/', validate(getAllSchema), controller.getAllController);

router.put('/:id', validate(updateSchema), controller.updateController);
router.delete('/:id', validate(deleteSchema), controller.deleteController);
router.get('/:id', validate(getSchema), controller.getController);

export default router;
