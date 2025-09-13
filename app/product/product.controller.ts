import { Request, Response } from 'express';
import {
  createManySchemaType,
  createSchemaType,
  deleteSchemaType,
  getAllSchemaType,
  getSchemaType,
  updateSchemaType,
} from './product.schema';
import productService from './product.service';

// CREATE ONE
const createController = async (req: Request, res: Response) => {
  const body = req.body as createSchemaType['body'];

  const result = await productService.createOne(
    {
      ...body,
      userId: req.user.id,
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
const createManyController = async (req: Request, res: Response) => {
  const body = req.body as createManySchemaType['body'];
  const createPayload = body.map((e) => ({ ...e, userId: req.user.id }));

  const result = await productService.createMany(createPayload, req.user.id);

  res.status(201).json({
    success: true,
    data: result,
    info: { success: result.success.length, failed: result.failed.length },
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// UPDATE ONE
const updateController = async (req: Request, res: Response) => {
  const params = req.params as updateSchemaType['params'];
  const body = req.body as updateSchemaType['body'];

  const updatedResult = await productService.updateOne(
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

  const deletedResult = await productService.deleteOne(params.id, req.user.id);

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
  const result = await productService.getOne(params.id, req.user.id);

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

  const result = await productService.getAll({ ...query, userId: req.user.id });

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
  createManyController,
  updateController,
  deleteController,
  getController,
  getAllController,
};
