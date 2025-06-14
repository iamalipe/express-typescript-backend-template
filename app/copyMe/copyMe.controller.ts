import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { addChangeLogEntry } from '../changeLog/changeLog.service';
import {
  createSchemaType,
  deleteSchemaType,
  getAllSchemaType,
  getSchemaType,
  updateSchemaType,
} from './copyMe.schema';
import { createCopyMe, updateCopyMe } from './copyMe.service';

// CREATE ONE
const createController = async (req: Request, res: Response) => {
  const body = req.body as createSchemaType['body'];

  const result = await createCopyMe({ ...body, userId: req.user.id });

  res.status(201).json({
    success: true,
    data: result,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// UPDATE ONE
const updateController = async (req: Request, res: Response) => {
  const params = req.params as updateSchemaType['params'];
  const body = req.body as updateSchemaType['body'];

  const updatedResult = await updateCopyMe(params.id, body);

  res.status(200).json({
    success: true,
    data: updatedResult,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// DELETE ONE
const deleteController = async (req: Request, res: Response) => {
  const params = req.params as deleteSchemaType['params'];

  const findResult = await db.genre.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deletedResult = await db.genre.delete({
    where: {
      id: params.id,
    },
  });

  addChangeLogEntry({
    keys: ['name', 'originYear', 'description', 'popularInCountry'],
    module: 'genre',
    title: `'${deletedResult.name}' Genre Deleted`,
    oldValue: deletedResult,
    referenceId: deletedResult.id,
  });

  res.status(200).json({
    success: true,
    data: deletedResult,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// GET ONE
const getController = async (req: Request, res: Response) => {
  const params = req.params as getSchemaType['params'];
  const result = await db.genre.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!result) throw new AppError('record not found', { status: 404 });

  res.status(200).json({
    success: true,
    data: result,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// CREATE MANY

// UPDATE MANY

// DELETE MANY

// GET ALL
const getAllController = async (req: Request, res: Response) => {
  const query = req.query as unknown as getAllSchemaType['query'];
  const limit = parseInt(query.limit as unknown as string, 10);
  const page = parseInt(query.page as unknown as string, 10);
  const skip = (page - 1) * limit;

  const filter: Prisma.GenreWhereInput = {};
  let orderBy: Prisma.GenreOrderByWithRelationInput[] | undefined = undefined;

  if (query.sort.length > 0) {
    orderBy = query.sort.map((sort) => {
      switch (sort.orderBy) {
        default:
          return {
            [sort.orderBy]: sort.order,
          };
      }
    });
  }

  const result = await db.genre.findMany({
    where: filter,
    skip: page > 0 ? skip : undefined,
    take: page > 0 ? limit : undefined,
    orderBy: orderBy,
  });

  const total = await db.genre.count({ where: filter });

  const sort = query.sort;

  const pagination = {
    page,
    limit,
    total,
    current: result.length,
  };

  res.status(200).json({
    success: true,
    data: result,
    sort,
    pagination,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

export default {
  createController,
  updateController,
  deleteController,
  getController,
  getAllController,
};
