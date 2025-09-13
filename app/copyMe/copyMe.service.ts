import { Types } from 'mongoose';
import { db } from '../../services/db.services';
import { ICopyMe } from './copyMe.model';

const createOne = async (
  data: Partial<
    Omit<ICopyMe, '_id' | 'createdAt' | 'updatedAt'> & { userId: string }
  >,
) => {
  // unique check - using stringField as unique identifier
  // const uniqueCheck = await db.copyMe
  //   .findOne({
  //     stringField: new RegExp(data.stringField, 'i'),
  //   })
  //   .lean();

  // if (uniqueCheck)
  //   throw new AppError('already exists', { status: 400, path: 'stringField' });

  const { userId, ...copyMeData } = data;
  const createDoc = await db.copyMe.create({
    ...copyMeData,
    userId: new Types.ObjectId(userId), // Convert string to ObjectId
  });
  const createData = createDoc.toObject();

  // addChangeLogEntry({
  //   keys: ['stringField', 'numberField', 'enumField', 'booleanField'],
  //   module: 'copyMe',
  //   title: `'${createData.stringField}' CopyMe Created`,
  //   newValue: createData,
  //   referenceId: createData.id,
  // });

  return createData;
};

const updateOne = async (
  id: string,
  data: Partial<Omit<ICopyMe, '_id' | 'createdAt' | 'updatedAt'>>,
) => {
  const findResult = await db.copyMe.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updatedResult = await db.copyMe.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  // addChangeLogEntry({
  //   keys: changeLogKeys,
  //   module: 'copyMe',
  //   title: `'${updatedData.stringField}' CopyMe Updated`,
  //   newValue: updatedData,
  //   oldValue: findResult,
  //   referenceId: updatedData.id,
  // });

  return updatedData;
};

const deleteOne = async (id: string) => {
  const findResult = await db.copyMe.findById(id).lean();

  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deletedResult = await db.copyMe.findByIdAndDelete(id).lean();

  return deletedResult;
};

const getOne = async (id: string) => {
  const pipeline = [
    {
      $match: {
        _id: new Types.ObjectId(id),
      },
    },
  ];

  const result = await db.copyMe.aggregate(pipeline);

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
}) => {
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);

  // Build match stage
  const matchStage: any = {};
  if (query.userId) {
    matchStage.userId = new Types.ObjectId(query.userId);
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

  const result = await db.copyMe.aggregate(pipeline);
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
