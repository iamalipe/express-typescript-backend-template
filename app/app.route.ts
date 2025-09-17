import express from 'express';

import { jwtAuth } from '../middlewares/jwtAuth.middlewares';
import authRouter from './auth/auth.route';
import blogRouter from './blog/blog.route';
import changeLogRouter from './changeLog/changeLog.route';
import copyMeRouter from './copyMe/copyMe.route';
import productRouter from './product/product.route';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/change-log', changeLogRouter);
appRouter.use('/copy-me', jwtAuth, copyMeRouter);
appRouter.use('/product', jwtAuth, productRouter);
appRouter.use('/blog', blogRouter);

export default appRouter;
