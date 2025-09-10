import { Types } from 'mongoose';
import { db } from '../../services/db.services';
import { IProduct } from './product.model';

const createOne = async (
  data: Partial<
    Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'> & { userId: string }
  >,
) => {
  // Check if product with same name already exists for this user
  const existingProduct = await db.product
    .findOne({
      name: new RegExp(`^${data.name}$`, 'i'),
      userId: new Types.ObjectId(data.userId),
    })
    .lean();

  if (existingProduct) {
    throw new AppError('Product with this name already exists', {
      status: 400,
      path: 'name',
    });
  }

  const { userId, ...productData } = data;
  const createDoc = await db.product.create({
    ...productData,
    userId: new Types.ObjectId(userId), // Convert string to ObjectId
  });
  const createData = createDoc.toObject();

  return createData;
};

const updateOne = async (
  id: string,
  data: Partial<Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>>,
) => {
  const findResult = await db.product.findById(id).lean();
  if (!findResult) throw new AppError('Product not found', { status: 404 });

  // If updating name, check for duplicates
  if (data.name) {
    const existingProduct = await db.product
      .findOne({
        name: new RegExp(`^${data.name}$`, 'i'),
        userId: findResult.userId,
        _id: { $ne: new Types.ObjectId(id) },
      })
      .lean();

    if (existingProduct) {
      throw new AppError('Product with this name already exists', {
        status: 400,
        path: 'name',
      });
    }
  }

  const updatedResult = await db.product.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('Product not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  return updatedData;
};

const deleteOne = async (id: string) => {
  const findResult = await db.product.findById(id).lean();

  if (!findResult) throw new AppError('Product not found', { status: 404 });

  const deletedResult = await db.product.findByIdAndDelete(id).lean();

  return deletedResult;
};

const getOne = async (id: string) => {
  const result = await db.product.findById(id).lean();

  if (!result) throw new AppError('Product not found', { status: 404 });

  return result;
};

const getAll = async (query: any) => {
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Add category filter if provided
  if (query.category) {
    filter.category = query.category;
  }

  // Add search filter if provided
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Build query conditionally
  let mongoQuery = db.product.find(filter).sort({
    [query.orderBy]: query.order === 'asc' ? 1 : -1,
  });

  // Apply pagination only if both page and limit are valid
  if (page > 0) {
    const skip = (page - 1) * limit;
    mongoQuery = mongoQuery.skip(skip).limit(limit);
  }

  const [result, total] = await Promise.all([
    mongoQuery.lean(),
    db.product.countDocuments(filter),
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
