import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './changeLog.controller';
import { getAllSchema, getSchema } from './changeLog.schema';

const router = express.Router();

router.get('/:id', validate(getSchema), controller.getController);
router.get('/', validate(getAllSchema), controller.getAllController);

export default router;
