import { Types } from 'mongoose';
import { db } from '../../services/db.services';
import { updateCheck } from '../../utils/general.utils';
import { IBlog } from './blog.model';

const createOne = async (
  data: Pick<IBlog, 'topic' | 'content'>,
  userId: string,
) => {
  const createDoc = await db.blog.create(data);
  const createData = createDoc.toObject();

  return createData;
};

const updateOne = async (
  id: string,
  data: Partial<Pick<IBlog, 'topic' | 'content'>>,
  userId: string,
) => {
  const findResult = await db.blog.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateSet: any = {};

  if (updateCheck(data.topic, findResult.topic)) {
    updateSet.topic = data.topic;
  }
  if (updateCheck(data.content, findResult.content)) {
    updateSet.content = data.content;
  }

  const updatedResult = await db.blog.findByIdAndUpdate(
    id,
    {
      $set: updateSet,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  return updatedData;
};

const deleteOne = async (id: string, userId: string) => {
  const findResult = await db.blog.findById(id).lean();

  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deletedResult = await db.blog.findByIdAndDelete(id).lean();

  return deletedResult;
};

const getOne = async (id: string, userId: string) => {
  const pipeline = [
    {
      $match: {
        _id: new Types.ObjectId(id),
      },
    },
  ];

  const result = await db.blog.aggregate(pipeline);

  if (!result || result.length === 0)
    throw new AppError('record not found', { status: 404 });

  return result[0];
};

const getAll = async (query: {
  limit: number;
  page: number;
  orderBy: string | 'createdAt';
  order: string | 'asc' | 'desc';
  userId?: string;
  search?: string;
}) => {
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);

  // Build match stage
  const matchStage: any = {};
  // if (query.userId) {
  //   matchStage.userId = new Types.ObjectId(query.userId);
  // }
  if (query.search) {
    // matchStage.$text = { $search: query.search };
  }

  // Build sort stage
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sortStage: any = {};
  sortStage[query.orderBy] = sortOrder;

  // Build pagination
  const skip = page > 0 ? (page - 1) * limit : 0;

  const pipeline = [
    {
      $match: matchStage,
    },
    {
      $sort: sortStage,
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await db.blog.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  const pagination = {
    page,
    limit,
    total,
    current: data.length,
  };
  const sort = {
    order: query.order,
    orderBy: query.orderBy,
  };

  return {
    data,
    pagination,
    sort,
  };
};

export default {
  createOne,
  updateOne,
  deleteOne,
  getOne,
  getAll,
};
