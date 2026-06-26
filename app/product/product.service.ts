import { tool } from 'ai';
import { Types } from 'mongoose';
import { db } from '../../services/db.services';
import { updateCheck } from '../../utils/general.utils';
import { IProduct } from './product.model';
import {
  createSchema,
  createSchemaType,
  createManySchema,
  createManySchemaType,
  updateSchema,
  updateSchemaType,
  deleteSchema,
  deleteSchemaType,
  getSchema,
  getSchemaType,
  getAllSchema,
  getAllSchemaType,
} from './product.schema';

const createOne = async (
  data: Pick<
    IProduct,
    'name' | 'description' | 'category' | 'userId' | 'price'
  >,
  userId: string,
) => {
  // unique check - using stringField as unique identifier
  const uniqueCheck = await db.product
    .findOne({
      name: new RegExp(data.name, 'i'),
      category: new RegExp(data.category, 'i'),
      userId: data.userId,
    })
    .lean();

  if (uniqueCheck)
    throw new AppError('record already exists', { status: 400, path: 'name' });

  const createDoc = await db.product.create(data);
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
const createMany = async (
  data: Pick<
    IProduct,
    'name' | 'description' | 'category' | 'userId' | 'price'
  >[],
  userId: string,
) => {
  const uniqueArray = data.filter(
    (obj, index, self) =>
      index ===
      self.findIndex(
        (o) =>
          `${o.name}|${o.category}|${o.userId}`.toLowerCase() ===
          `${obj.name}|${obj.category}|${obj.userId}`.toLowerCase(),
      ),
  );

  // Find existing products that match any of the incoming (name, category, userId) tuples
  const existingProducts = await db.product
    .find({
      $or: uniqueArray.map((d) => ({
        name: new RegExp(`^${d.name}$`, 'i'),
        category: new RegExp(`^${d.category}$`, 'i'),
        userId: d.userId,
      })),
    })
    .select('name category userId')
    .lean();

  const uniqueArrayFinal = uniqueArray.filter(
    (obj) =>
      existingProducts.findIndex(
        (o) =>
          `${o.name}|${o.category}|${o.userId.toString()}`.toLowerCase() ===
          `${obj.name}|${obj.category}|${obj.userId}`.toLowerCase(),
      ) === -1,
  );

  const uniqueArrayFailed = uniqueArray.filter(
    (obj) =>
      existingProducts.findIndex(
        (o) =>
          `${o.name}|${o.category}|${o.userId.toString()}`.toLowerCase() ===
          `${obj.name}|${obj.category}|${obj.userId}`.toLowerCase(),
      ) !== -1,
  );

  if (uniqueArrayFinal.length === 0) {
    // Nothing to insert, return empty array
    return { success: [], failed: uniqueArrayFailed };
  }

  // Insert only non-duplicate data
  const createDocs = await db.product.insertMany(uniqueArrayFinal);
  return { success: createDocs, failed: uniqueArrayFailed };
};

const updateOne = async (
  id: string,
  data: Partial<Pick<IProduct, 'name' | 'description' | 'category' | 'price'>>,
  userId: string,
) => {
  const findResult = await db.product.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateSet: any = {};

  if (updateCheck(data.name, findResult.name)) {
    updateSet.name = data.name;
  }
  if (updateCheck(data.category, findResult.category)) {
    updateSet.category = data.category;
  }
  if (updateCheck(data.description, findResult.description)) {
    updateSet.description = data.description;
  }
  if (updateCheck(data.price, findResult.price)) {
    updateSet.price = data.price;
  }

  const updatedResult = await db.product.findByIdAndUpdate(
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

const deleteOne = async (id: string, userId: string) => {
  const findResult = await db.product.findById(id).lean();

  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deletedResult = await db.product.findByIdAndDelete(id).lean();

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

  const result = await db.product.aggregate(pipeline);

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
  const matchFilter: any = {};
  // if (query.userId) {
  //   matchFilter.userId = new Types.ObjectId(query.userId);
  // }
  if (query.search) {
    matchFilter.name = new RegExp(query.search, 'i');
  }

  // Build sort stage
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sortStage: any = {};
  sortStage[query.orderBy] = sortOrder;

  // Build pagination
  const skip = page > 0 ? (page - 1) * limit : 0;
  const dbQuery =
    page > 0
      ? db.product.find(matchFilter).sort(sortStage).skip(skip).limit(limit)
      : db.product.find(matchFilter).sort(sortStage);

  const [data, total] = await Promise.all([
    dbQuery.lean(),
    db.product.countDocuments(matchFilter),
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

const createOneProductAITool = tool({
  description: 'Creates a single product. Use this tool when you need to create a new product entry.',
  inputSchema: createSchema,
  execute: async (input: createSchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const result = await createOne(
      {
        ...input.body,
        userId: userId,
      },
      userId,
    );

    return {
      success: true,
      data: result,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

const createManyProductAITool = tool({
  description: 'Creates multiple products in bulk. Use this tool to batch create several products at once.',
  inputSchema: createManySchema,
  execute: async (input: createManySchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const data = input.body.map((item) => ({ ...item, userId }));
    const result = await createMany(data, userId);

    return {
      success: true,
      data: result,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

const updateOneProductAITool = tool({
  description: 'Updates fields of an existing product (e.g., name, description, category, price) using its unique product ID.',
  inputSchema: updateSchema,
  execute: async (input: updateSchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const result = await updateOne(input.params.id, input.body, userId);

    return {
      success: true,
      data: result,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

const deleteOneProductAITool = tool({
  description: 'Deletes an existing product by its unique product ID.',
  inputSchema: deleteSchema,
  execute: async (input: deleteSchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const result = await deleteOne(input.params.id, userId);

    return {
      success: true,
      data: result,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

const getOneProductAITool = tool({
  description: 'Retrieves details of a single product using its unique product ID.',
  inputSchema: getSchema,
  execute: async (input: getSchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const result = await getOne(input.params.id, userId);

    return {
      success: true,
      data: result,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

const getAllProductAITool = tool({
  description: 'Retrieves a list of products with optional search terms, pagination (page, limit), and custom sorting (order, orderBy).',
  inputSchema: getAllSchema,
  execute: async (input: getAllSchemaType) => {
    const userId: any = ''; // FIXME later fix this userId issue
    const query = {
      limit: input.query.limit,
      page: input.query.page,
      orderBy: input.query.orderBy,
      order: input.query.order,
      userId: userId,
      search: input.query.search,
    };
    const result = await getAll(query);

    return {
      success: true,
      data: result.data,
      sort: result.sort,
      pagination: result.pagination,
      errors: [],
      timestamp: new Date().toISOString(),
      message: 'success',
    };
  },
});

export default {
  createOne,
  createMany,
  updateOne,
  deleteOne,
  getOne,
  getAll,
  createOneProductAITool,
  createManyProductAITool,
  updateOneProductAITool,
  deleteOneProductAITool,
  getOneProductAITool,
  getAllProductAITool,
};
