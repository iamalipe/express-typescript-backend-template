import { z } from 'zod';
import { mongoIdRegex } from '../../utils/general.utils';
import {
  paginationSchema,
  sortArraySchema,
} from '../../utils/validation.utils';

export const createSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(2).max(1000).optional(),
  }),
});

export const updateSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(2).max(1000).optional(),
  }),
});

export const deleteSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
});

export const getSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
});

export const getAllSchema = z.object({
  query: z.object({
    sort: sortArraySchema,
    ...paginationSchema.shape,
  }),
});

export type createSchemaType = z.infer<typeof createSchema>;
export type updateSchemaType = z.infer<typeof updateSchema>;
export type deleteSchemaType = z.infer<typeof deleteSchema>;
export type getSchemaType = z.infer<typeof getSchema>;
export type getAllSchemaType = z.infer<typeof getAllSchema>;
