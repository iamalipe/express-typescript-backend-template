import { nanoid } from 'nanoid';
import { db } from '../../services/db.services';
import { generateSlug } from '../../utils/general.utils';
import { addChangeLogEntry } from '../changeLog/changeLog.service';
import { IProduct } from './product.model';

export const createProduct = async (
  data: Pick<
    IProduct,
    'name' | 'price' | 'category' | 'description' | 'userId'
  >,
) => {
  // unique check
  // const uniqueCheck = await db.project
  //   .findOne({
  //     slug: new RegExp(data.slug, 'i'),
  //   })
  //   .lean();

  // if (uniqueCheck)
  //   throw new AppError('already exists', { status: 400, path: 'slug' });

  const slug = generateSlug(data.name);

  const createDoc = new db.product({
    name: data.name,
    slug: `${slug}-${nanoid(6)}`,
    description: data.description,
    category: data.category,
    price: data.price,
    userId: data.userId,
  });
  const createSave = await createDoc.save();
  const createData = createSave.toObject();

  addChangeLogEntry({
    keys: ['name', 'slug', 'description', 'category', 'price'],
    module: 'product',
    title: `'${createData.name}' Product Created`,
    newValue: createData,
    referenceId: createData?._id?.toString(),
    referenceModel: 'Product',
  });

  return createData;
};

export const updateProduct = async (
  id: string,
  data: Partial<Pick<IProduct, 'name' | 'description' | 'category' | 'price'>>,
) => {
  const findResult = await db.product.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateValues: Partial<IProduct> = {};
  const changeLogKeys: string[] = [];
  if (data.name !== undefined && data.name !== findResult.name) {
    updateValues['name'] = data.name;
    changeLogKeys.push('name');
  }

  if (
    data.description !== undefined &&
    data.description !== findResult.description
  ) {
    updateValues['description'] = data.description;
    changeLogKeys.push('description');
  }
  if (data.category !== undefined && data.category !== findResult.category) {
    updateValues['category'] = data.category;
    changeLogKeys.push('category');
  }
  if (data.price !== undefined && data.price !== findResult.price) {
    updateValues['price'] = data.price;
    changeLogKeys.push('price');
  }

  if (Object.keys(updateValues).length === 0)
    throw new AppError('no data to update', { status: 400 });

  const updatedResult = await db.product.findByIdAndUpdate(
    id,
    {
      $set: updateValues,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  addChangeLogEntry({
    keys: changeLogKeys,
    module: 'product',
    title: `'${updatedData.name}' Product Updated`,
    newValue: updatedData,
    oldValue: findResult,
    referenceId: updatedData?._id?.toString(),
    referenceModel: 'Product',
  });

  return updatedData;
};

export const getAllProduct = async (filter?: any) => {
  const findAllResult = await db.product.find(filter);

  return findAllResult;
};

export const getProduct = async (id: string) => {
  const findResult = await db.product.findById(id);

  return findResult;
};

export const deleteProduct = async (id: string) => {
  const findResult = await db.product.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deleteResult = await db.product.deleteOne({ _id: id });

  if (deleteResult.acknowledged === false)
    throw new AppError('record not found', { status: 404 });
  if (deleteResult.deletedCount === 0)
    throw new AppError('record not found', { status: 404 });

  addChangeLogEntry({
    keys: ['name', 'slug', 'description', 'category', 'price'],
    module: 'product',
    title: `'${findResult.name}' Product Deleted`,
    oldValue: findResult,
    referenceId: findResult?._id?.toString(),
    referenceModel: 'Product',
  });

  return findResult;
};
