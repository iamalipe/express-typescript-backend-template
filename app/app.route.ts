import express from 'express';

import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import changeLogRouter from './changeLog/changeLog.route';
import productRouter from './product/product.route';
import testingRouter from './testing/testing';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/product', jwtAuth, productRouter);

if (process.env.NODE_ENV === 'development') {
  appRouter.use('/testing', testingRouter);
}

export default appRouter;
