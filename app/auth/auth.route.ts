import express from 'express';
import { jwtAuth } from '../../middlewares/jwtAuth.middlewares';
import { validate } from '../../middlewares/validate.middlewares';
import * as controller from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

const router = express.Router();
router.post('/login', validate(loginSchema), controller.loginController);
router.post(
  '/register',
  validate(registerSchema),
  controller.registerController,
);
router.get('/me', jwtAuth, controller.getCurrentUser);

export default router;
