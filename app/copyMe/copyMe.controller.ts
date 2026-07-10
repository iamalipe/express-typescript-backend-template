import { Request, Response } from 'express';
import {
  createManySchemaType,
  createSchemaType,
  deleteSchemaType,
  getAllSchemaType,
  getSchemaType,
  updateSchemaType,
} from './copyMe.schema';
import copyMeService from './copyMe.service';

type TableConfigType = {
  search: boolean;
  searchPlaceholder?: string;
};

const config: TableConfigType = {
  search: true,
  searchPlaceholder: 'Search by required string or description',
};

const extractFileUrl = (file: any): string | undefined => {
  if (!file) return undefined;
  if (typeof file === 'string') return file;
  if (file && typeof file === 'object' && 's3Url' in file) {
    return file.s3Url;
  }
  return undefined;
};

// CREATE ONE
const createController = async (req: Request, res: Response) => {
  const body = req.body as createSchemaType['body'];

  const result = await copyMeService.createOne(
    {
      ...body,
      fileImage: extractFileUrl(body.fileImage),
      fileDoc: extractFileUrl(body.fileDoc),
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

// CREATE MANY
const createManyController = async (req: Request, res: Response) => {
  const body = req.body as createManySchemaType['body'];
  const createPayload = body.map((e) => ({
    ...e,
    fileImage: extractFileUrl(e.fileImage),
    fileDoc: extractFileUrl(e.fileDoc),
    userId: req.user.id,
  }));

  const result = await copyMeService.createMany(createPayload, req.user.id);

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

  const updatedResult = await copyMeService.updateOne(
    params.id,
    {
      ...body,
      fileImage: extractFileUrl(body.fileImage),
      fileDoc: extractFileUrl(body.fileDoc),
    },
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

  const deletedResult = await copyMeService.deleteOne(params.id, req.user.id);

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
  const result = await copyMeService.getOne(params.id, req.user.id);

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

  const result = await copyMeService.getAll({
    ...query,
    order: query.order as 'asc' | 'desc',
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    sort: result.sort,
    pagination: result.pagination,
    config,
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
