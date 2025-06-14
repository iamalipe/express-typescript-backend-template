import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { getAllSchemaType, getSchemaType } from './changeLog.schema';
// import { Prisma } from '../../prisma-client';

const getController = async (req: Request, res: Response) => {
  const params = req.params as getSchemaType['params'];
  const result = await db.changeLog.findById(params.id).lean();

  if (!result) throw new AppError('record not found', { status: 404 });

  res.status(200).json({ success: true, data: result });
};

const getAllController = async (req: Request, res: Response) => {
  const query = req.query as unknown as getAllSchemaType['query'];
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);
  const skip = (page - 1) * limit;

  const filter = {};
  let orderBy = undefined;

  // switch (query.orderBy) {
  //   default:
  //     orderBy = {
  //       [query.orderBy]: query.order,
  //     };
  //     break;
  // }

  const result = await db.changeLog
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort(orderBy);

  const total = await db.changeLog.countDocuments(filter);

  const sort = {
    orderBy: query.orderBy,
    order: query.order,
  };

  const pagination = {
    page,
    limit,
    total,
    current: result.length,
  };

  res.status(200).json({ success: true, data: result, sort, pagination });
};

export default {
  getController,
  getAllController,
};
