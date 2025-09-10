import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';

import { healthCheckController, rootController } from './app/app.controller';
import appRouter from './app/app.route';
import { CORS_OPTIONS, PORT } from './config/default';
import { globalErrorHandler } from './middlewares/error.middlewares';
import { limiter } from './middlewares/limiter.middlewares';
import { resTime } from './middlewares/resTime.middlewares';
import { dbConnect, dbDisconnect } from './services/db.services';
import type { PublicUser } from './types/PublicUser.type';
import './utils/appError.utils';
import { logger, requestLogger } from './utils/logger';
import { startMetricsServer } from './utils/metrics.utils';

const app = express();

app.use(requestLogger);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', '127.0.0.1');
app.use(cors(CORS_OPTIONS));
app.use(limiter);
app.use(resTime);

app.get('/', rootController);
app.get('/healthcheck', healthCheckController);
app.use('/api', appRouter);
app.use(globalErrorHandler);

const start = async (): Promise<void> => {
  try {
    app.listen(PORT, () => {
      logger.info(`App is running on port http://localhost:${PORT}.`);
      dbConnect();
      startMetricsServer();
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error('An unknown error occurred');
    }
    dbDisconnect();
    process.exit(1);
  }
};
start();

declare global {
  namespace Express {
    interface Request {
      user: PublicUser;
    }
  }
  var AppError: {
    new (
      message: string,
      options?: { path?: string; status?: number },
    ): AppError;
  };
  interface AppError extends Error {
    options?: { path?: string; status?: number };
  }
}
