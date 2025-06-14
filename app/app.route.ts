import express from 'express';

import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import changeLogRouter from './changeLog/changeLog.route';
import projectRouter from './project/project.route';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/project', jwtAuth, projectRouter);

export default appRouter;
