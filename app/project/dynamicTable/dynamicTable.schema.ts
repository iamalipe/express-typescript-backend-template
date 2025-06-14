import { z } from 'zod';
import { mongoIdRegex } from '../../../utils/general.utils';

const fields = z.object({
  name: z.string().min(3).max(100),
  id: z.string().min(3).max(100),
  type: z.enum(['String', 'Number', 'Boolean']),
  isRequired: z.boolean().default(false),
  description: z.string().min(2).max(1000).optional(),
  defaultValue: z.any(),
});

export const createSchema = z.object({
  params: z.object({
    projectSlug: z.string().min(3).max(100),
  }),
  body: z.object({
    name: z.string().min(3).max(100),
    slug: z.string().min(3).max(100),
    isCollection: z.boolean().default(false),
    description: z.string().min(2).max(1000).optional(),
    fields: z.array(fields).default([]),
  }),
});

export const updateSchema = z.object({
  params: z.object({
    projectSlug: z.string().min(3).max(100),
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
  body: z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(2).max(1000).optional(),
    fields: z.array(fields).default([]),
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
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().min(0)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().min(1).max(100)),
  }),
});

export type createSchemaType = z.infer<typeof createSchema>;
export type updateSchemaType = z.infer<typeof updateSchema>;
export type deleteSchemaType = z.infer<typeof deleteSchema>;
export type getSchemaType = z.infer<typeof getSchema>;
export type getAllSchemaType = z.infer<typeof getAllSchema>;
