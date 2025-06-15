import { Request, Response } from 'express';
// import { db } from '../../services/db.services';
// import { addChangeLogEntry } from '../changeLog/changeLog.service';
import {
  createSchemaType,
  deleteSchemaType,
  getSchemaType,
  // deleteSchemaType,
  // getSchemaType,
  updateSchemaType,
} from './product.schema';
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProduct,
  updateProduct,
} from './product.service';

// CREATE ONE
const createController = async (req: Request, res: Response) => {
  const body = req.body as createSchemaType['body'];

  const result = await createProduct({ ...body, userId: req.user.id });

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

  const updatedResult = await updateProduct(params.id, body);

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
  const findResult = await deleteProduct(params.id);
  res.status(200).json({
    success: true,
    data: findResult,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// GET ONE
const getController = async (req: Request, res: Response) => {
  const params = req.params as getSchemaType['params'];
  const result = await getProduct(params.id);
  if (!result) throw new AppError('record not found', { status: 404 });
  res.status(200).json({
    success: true,
    data: result.toObject(),
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// GET ALL
const getAllController = async (req: Request, res: Response) => {
  const data = await getAllProduct({
    userId: req.user.id,
  });

  const dataObj = data.map((item) => item.toObject());

  res.status(200).json({
    success: true,
    data: dataObj,
    totalCount: data.length,
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
