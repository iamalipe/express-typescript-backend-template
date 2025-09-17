import { Request, Response } from 'express';
import {
  createSchemaType,
  deleteSchemaType,
  getAllSchemaType,
  getSchemaType,
  updateSchemaType,
} from './blog.schema';
import blogService from './blog.service';

// CREATE ONE
const createController = async (req: Request, res: Response) => {
  const body = req.body as createSchemaType['body'];

  const result = await blogService.createOne(
    {
      ...body,
    },
    req.user.id,
  );

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

  const updatedResult = await blogService.updateOne(
    params.id,
    body,
    req.user.id,
  );

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

  const deletedResult = await blogService.deleteOne(params.id, req.user.id);

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
  const result = await blogService.getOne(params.id, req?.user?.id);

  res.status(200).json({
    success: true,
    data: result,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// GET ALL
const getAllController = async (req: Request, res: Response) => {
  const query = req.query as unknown as getAllSchemaType['query'];
  console.time('getAllController');
  const result = await blogService.getAll({ ...query, userId: req?.user?.id });
  console.timeEnd('getAllController');

  res.status(200).json({
    success: true,
    data: result.data,
    sort: result.sort,
    pagination: result.pagination,
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
