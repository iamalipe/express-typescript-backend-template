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
  const result = await db.copyMe.findById(id).lean();

  if (!result) throw new AppError('record not found', { status: 404 });

  return result;
};

const getAll = async (query: any) => {
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Build query conditionally
  let mongoQuery = db.copyMe.find(filter).sort({
    [query.orderBy]: query.order === 'asc' ? 1 : -1,
  });

  // Apply pagination only if both page and limit are valid
  if (page > 0) {
    const skip = (page - 1) * limit;
    mongoQuery = mongoQuery.skip(skip).limit(limit);
  }

  const [result, total] = await Promise.all([
    mongoQuery.lean(),
    db.copyMe.countDocuments(filter),
  ]);

  const pagination = {
    page,
    limit,
    total,
    current: result.length,
  };
  const sort = {
    order: query.order,
    orderBy: query.orderBy,
  };

  return {
    data: result,
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
