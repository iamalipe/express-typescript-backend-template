import { z } from 'zod';
import { mongoIdRegex } from '../../utils/general.utils';

export const createSchema = z.object({
  body: z.object({
    stringField: z.string().min(1).max(255).optional(),
    numberField: z.number().int().min(0).optional(),
    floatField: z.number().optional(),
    enumField: z.enum(['A', 'B', 'C']).optional(),
    bigStringField: z.string().min(1).max(1000).optional(),
    arrayField: z.array(z.string()).optional(),
    // Fixed: Transform string to Date object
    dateField: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    // Fixed: Transform string to Date object
    datetimeField: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    objectField: z
      .object({
        key1: z.string(),
        key2: z.number(),
      })
      .optional(),
    arrayOfObjectsField: z
      .array(
        z.object({
          name: z.string(),
          value: z.number(),
        }),
      )
      .optional(),
    mixedField: z.any().optional(),
    booleanField: z.boolean().optional(),
    bufferField: z.instanceof(Buffer).optional(),
  }),
});

export const updateSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
  body: z.object({
    stringField: z.string().min(1).max(255).optional(),
    numberField: z.number().int().min(0).optional(),
    floatField: z.number().optional(),
    enumField: z.enum(['A', 'B', 'C']).optional(),
    bigStringField: z.string().min(1).max(1000).optional(),
    arrayField: z.array(z.string()).optional(),
    dateField: z.date().optional(),
    datetimeField: z.date().optional(),
    objectField: z
      .object({
        key1: z.string(),
        key2: z.number(),
      })
      .optional(),
    arrayOfObjectsField: z
      .array(
        z.object({
          name: z.string(),
          value: z.number(),
        }),
      )
      .optional(),
    mixedField: z.any().optional(),
    booleanField: z.boolean().optional(),
    bufferField: z.instanceof(Buffer).optional(),
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
    order: z
      .string()
      .optional()
      .refine((val) => !val || ['asc', 'desc'].includes(val), {
        message: "Order must be 'asc' or 'desc'",
      })
      .transform((val) => (val === '' || val === undefined ? 'desc' : val))
      .default('desc'),
    orderBy: z
      .string()
      .optional()
      .transform((val) => (val === '' || val === undefined ? 'createdAt' : val))
      .default('createdAt'),
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
