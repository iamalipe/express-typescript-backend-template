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
router.post('/passkey/register', jwtAuth, controller.passKeyRegister);
router.post('/passkey/register-verify', jwtAuth, controller.passKeyVerify);
router.post('/passkey/login', controller.passKeyLogin);
router.post('/passkey/login-verify', controller.passKeyLoginVerify);

export default router;
