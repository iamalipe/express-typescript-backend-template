import express from 'express';

import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import changeLogRouter from './changeLog/changeLog.route';
import copyMeRouter from './copyMe/copyMe.route';
import testingRouter from './testing/testing';

import {
  longPollDemoController,
  readableStreamDemoController,
  sseDemoController,
} from './app.controller';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/copy-me', jwtAuth, copyMeRouter);

appRouter.get('/sse-demo', sseDemoController);
appRouter.get('/readable-stream-demo', readableStreamDemoController);
appRouter.get('/long-poll-demo', longPollDemoController);

if (process.env.NODE_ENV === 'development') {
  appRouter.use('/testing', testingRouter);
}

export default appRouter;
