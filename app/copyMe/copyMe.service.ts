import { Types } from 'mongoose';
import { db } from '../../services/db.services';
import { updateCheck } from '../../utils/general.utils';
import { ICopyMe } from './copyMe.model';

const createOne = async (data: Partial<ICopyMe> & { userId: string }, userId: string) => {
  // unique check per user
  const uniqueCheck = await db.copyMe.findOne({
    stringRequired: new RegExp(`^${data.stringRequired}$`, 'i'),
    userId: new Types.ObjectId(userId),
  }).lean();

  if (uniqueCheck) {
    throw new AppError('record already exists', { status: 400, path: 'stringRequired' });
  }

  const createDoc = await db.copyMe.create({
    ...data,
    userId: new Types.ObjectId(userId),
  });

  return createDoc.toObject();
};

const createMany = async (data: (Partial<ICopyMe> & { userId: string })[], userId: string) => {
  const uniqueArray = data.filter(
    (obj, index, self) =>
      index ===
      self.findIndex(
        (o) =>
          `${o.stringRequired}|${o.userId}`.toLowerCase() ===
          `${obj.stringRequired}|${obj.userId}`.toLowerCase(),
      ),
  );

  const existingLogs = await db.copyMe.find({
    $or: uniqueArray.map((d) => ({
      stringRequired: new RegExp(`^${d.stringRequired}$`, 'i'),
      userId: new Types.ObjectId(d.userId),
    })),
  }).select('stringRequired userId').lean();

  const uniqueArrayFinal = uniqueArray.filter(
    (obj) =>
      existingLogs.findIndex(
        (o) =>
          `${o.stringRequired}|${o.userId.toString()}`.toLowerCase() ===
          `${obj.stringRequired}|${obj.userId}`.toLowerCase(),
      ) === -1,
  );

  const uniqueArrayFailed = uniqueArray.filter(
    (obj) =>
      existingLogs.findIndex(
        (o) =>
          `${o.stringRequired}|${o.userId.toString()}`.toLowerCase() ===
          `${obj.stringRequired}|${obj.userId}`.toLowerCase(),
      ) !== -1,
  );

  if (uniqueArrayFinal.length === 0) {
    return { success: [], failed: uniqueArrayFailed };
  }

  const createDocs = await db.copyMe.insertMany(uniqueArrayFinal);
  return { success: createDocs, failed: uniqueArrayFailed };
};

const updateOne = async (
  id: string,
  data: Partial<ICopyMe>,
  userId: string,
) => {
  const findResult = await db.copyMe.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  // Ownership Check (Vulnerability Fix)
  if (findResult.userId.toString() !== userId) {
    throw new AppError('Unauthorized access to record', { status: 403 });
  }

  const updateSet: any = {};

  // Simple helper to check and update changed fields
  const fields = [
    'stringRequired', 'stringTextarea', 'stringOptional', 'stringTextareaOptional',
    'numberDecimal', 'numberInt', 'numberSlider', 'dateOnly', 'dateTime',
    'dateRangeStart', 'dateRangeEnd', 'dateTimeRangeStart', 'dateTimeRangeEnd',
    'booleanSwitch', 'enumString', 'customOptionalString', 'fileImage', 'fileDoc',
    'singleArray', 'arrayObject', 'twoDArray', 'nestedObject'
  ];

  fields.forEach(field => {
    if (updateCheck(data[field], findResult[field])) {
      updateSet[field] = data[field];
    }
  });

  const updatedResult = await db.copyMe.findByIdAndUpdate(
    id,
    {
      $set: updateSet,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  return updatedResult.toObject();
};

const deleteOne = async (id: string, userId: string) => {
  const findResult = await db.copyMe.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  // Ownership Check (Vulnerability Fix)
  if (findResult.userId.toString() !== userId) {
    throw new AppError('Unauthorized access to record', { status: 403 });
  }

  const deletedResult = await db.copyMe.findByIdAndDelete(id).lean();
  return deletedResult;
};

const getOne = async (id: string, userId: string) => {
  const findResult = await db.copyMe.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  // Ownership Check (Vulnerability Fix)
  if (findResult.userId.toString() !== userId) {
    throw new AppError('Unauthorized access to record', { status: 403 });
  }

  return findResult;
};

const getAll = async (query: {
  limit: number;
  page: number;
  orderBy: string;
  order: 'asc' | 'desc';
  userId: string;
  search?: string;
  enumString?: 'Active' | 'Inactive' | 'Block' | 'Pending';
  booleanSwitch?: string;
}) => {
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);

  // Build match stage (with User Isolation)
  const matchFilter: any = {
    userId: new Types.ObjectId(query.userId),
  };

  // Filter parameters
  if (query.enumString) {
    matchFilter.enumString = query.enumString;
  }
  if (query.booleanSwitch !== undefined && query.booleanSwitch !== '') {
    matchFilter.booleanSwitch = query.booleanSwitch === 'true';
  }

  // Text search optimization using the text index
  if (query.search) {
    matchFilter.$text = { $search: query.search };
  }

  // Build sort stage
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sortStage: any = {};
  sortStage[query.orderBy] = sortOrder;

  // Build pagination
  const skip = page > 0 ? (page - 1) * limit : 0;
  const dbQuery =
    page > 0
      ? db.copyMe.find(matchFilter).sort(sortStage).skip(skip).limit(limit)
      : db.copyMe.find(matchFilter).sort(sortStage);

  const [data, total] = await Promise.all([
    dbQuery.lean(),
    db.copyMe.countDocuments(matchFilter),
  ]);

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
  createMany,
  updateOne,
  deleteOne,
  getOne,
  getAll,
};
