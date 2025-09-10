import { Request, Response } from 'express';
import {
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

  const result = await productService.createOne({
    ...body,
    userId: req?.user?.id,
  });

  res.status(201).json({
    success: true,
    data: result,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'Product created successfully',
  });
};

// UPDATE ONE
const updateController = async (req: Request, res: Response) => {
  const params = req.params as updateSchemaType['params'];
  const body = req.body as updateSchemaType['body'];

  const updatedResult = await productService.updateOne(params.id, body);

  res.status(200).json({
    success: true,
    data: updatedResult,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'Product updated successfully',
  });
};

// DELETE ONE
const deleteController = async (req: Request, res: Response) => {
  const params = req.params as deleteSchemaType['params'];

  const deletedResult = await productService.deleteOne(params.id);

  res.status(200).json({
    success: true,
    data: deletedResult,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'Product deleted successfully',
  });
};

// GET ONE
const getController = async (req: Request, res: Response) => {
  const params = req.params as getSchemaType['params'];
  const result = await productService.getOne(params.id);

  res.status(200).json({
    success: true,
    data: result,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'Product retrieved successfully',
  });
};

// GET ALL
const getAllController = async (req: Request, res: Response) => {
  const query = req.query as unknown as getAllSchemaType['query'];
  const result = await productService.getAll(query);

  res.status(200).json({
    success: true,
    data: result.data,
    sort: result.sort,
    pagination: result.pagination,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'Products retrieved successfully',
  });
};

export default {
  createController,
  updateController,
  deleteController,
  getController,
  getAllController,
};
