import express from 'express';
import { jwtAuth } from '../../middlewares/jwtAuth.middlewares';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './ipLookup.controller';
import { lookupSchema } from './ipLookup.schema';

const router = express.Router();

// GET /api/ip/lookup?ip=... (public)
router.get('/lookup', validate(lookupSchema), controller.lookupController);

// POST /api/ip/update (protected)
router.post('/update', jwtAuth, controller.updateController);

export default router;
