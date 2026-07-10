import express from 'express';

import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import blogRouter from './blog/blog.route';
import changeLogRouter from './changeLog/changeLog.route';
import productRouter from './product/product.route';
import testingRouter from './testing/testing';

import {
  longPollDemoController,
  readableStreamDemoController,
  sseDemoController,
} from './app.controller';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/product', jwtAuth, productRouter);
appRouter.use('/blog', blogRouter);
appRouter.get('/sse-demo', sseDemoController);
appRouter.get('/readable-stream-demo', readableStreamDemoController);
appRouter.get('/long-poll-demo', longPollDemoController);

if (process.env.NODE_ENV === 'development') {
  appRouter.use('/testing', testingRouter);
}

export default appRouter;
