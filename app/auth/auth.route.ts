import express from 'express';
import { jwtAuth } from '../../middlewares/jwtAuth.middlewares';
import { validateMulter } from '../../middlewares/multer.middlewares';
import { validate } from '../../middlewares/validate.middlewares';
import * as controller from './auth.controller';
import {
  loginSchema,
  profileImageUpdateSchema,
  registerSchema,
} from './auth.schema';

const router = express.Router();
router.post('/login', validate(loginSchema), controller.loginController);
router.post(
  '/register',
  validate(registerSchema),
  controller.registerController,
);
router.get('/me', jwtAuth, controller.getCurrentUser);
router.get('/logout', jwtAuth, controller.userLogout);
router.put(
  '/profile-image',
  jwtAuth,
  validateMulter({
    validateFiles: [
      {
        fieldName: 'profileImage',
        isArray: false,
        fileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        s3Upload: true,
        s3Folder: 'profile-image',
        s3Type: 'public',
      },
    ],
  }),
  validate(profileImageUpdateSchema),
  controller.profileImageUpdate,
);
router.post('/passkey/register', jwtAuth, controller.passKeyRegister);
router.post('/passkey/register-verify', jwtAuth, controller.passKeyVerify);
router.post('/passkey/login', controller.passKeyLogin);
router.post('/passkey/login-verify', controller.passKeyLoginVerify);

export default router;
