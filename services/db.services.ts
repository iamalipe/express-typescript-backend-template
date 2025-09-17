import mongoose from 'mongoose';
import { SessionModel, UserModel } from '../app/auth/auth.model';
import { BlogModel } from '../app/blog/blog.model';
import { ChangeLogModel } from '../app/changeLog/changeLog.model';
import { CopyMeModel } from '../app/copyMe/copyMe.model';
import { ProductModel } from '../app/product/product.model';
import { DATABASE_URL } from '../config/default';
import { logger } from '../utils/logger';
import { databaseResponseTimeHistogram } from '../utils/metrics.utils';

export function histogramPlugin(schema: mongoose.Schema) {
  schema.pre(/^find|save|update|delete/, function (next) {
    // @ts-ignore
    this._histogramTimer = databaseResponseTimeHistogram.startTimer();
    next();
  });

  schema.post(/^find|save|update|delete/, function (result, next) {
    // @ts-ignore
    if (this._histogramTimer) {
      // @ts-ignore
      this._histogramTimer({
        // @ts-ignore
        operation: this.op || 'unknown',
        success: result ? true : false,
      });
    }
    next();
  });
}

// Apply to all schemas
mongoose.plugin(histogramPlugin);

export const dbConnect = async () => {
  // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
  await mongoose.connect(DATABASE_URL, {
    serverApi: { version: '1', strict: true, deprecationErrors: true },
  });
  if (!mongoose.connection.db) {
    throw new Error('Database connection failed!');
  }
  await mongoose.connection.db.admin().command({ ping: 1 });
  logger.info(`Successfully connected to Database.`);
};

export const dbDisconnect = async () => {
  // Close the Mongoose connection
  await mongoose.disconnect();
  logger.info('Successfully disconnected from Database.');
};

export const db = {
  user: UserModel,
  session: SessionModel,
  changeLog: ChangeLogModel,
  copyMe: CopyMeModel,
  product: ProductModel,
  blog: BlogModel,
};
