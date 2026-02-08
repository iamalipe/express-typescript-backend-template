import express from 'express';

import { trace } from '@opentelemetry/api';
import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import blogRouter from './blog/blog.route';
import changeLogRouter from './changeLog/changeLog.route';
import copyMeRouter from './copyMe/copyMe.route';
import productRouter from './product/product.route';
import testingRouter from './testing/testing';

const tracer = trace.getTracer(
  'app.route.ts',
  process.env.NODE_ENV === 'development' ? '1.0.0-dev' : '1.0.0',
);

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/copy-me', jwtAuth, copyMeRouter);
appRouter.use('/product', jwtAuth, productRouter);
appRouter.use('/blog', blogRouter);

if (process.env.NODE_ENV === 'development') {
  appRouter.use('/testing', testingRouter);
}

export default appRouter;
