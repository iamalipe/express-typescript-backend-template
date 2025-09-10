import { z } from 'zod';
import { mongoIdRegex } from '../../utils/general.utils';

const productCategories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Automotive',
  'Toys',
  'Food & Beverage',
  'Health',
] as const;

export const createSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(255, 'Product name cannot exceed 255 characters'),
    category: z.enum(productCategories, {
      error: () => ({ message: 'Invalid product category' }),
    }),
    price: z.number().min(0, 'Price cannot be negative'),
    description: z
      .string()
      .min(1, 'Product description is required')
      .max(1000, 'Product description cannot exceed 1000 characters'),
  }),
});

export const updateSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid id'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(255, 'Product name cannot exceed 255 characters')
      .optional(),
    category: z
      .enum(productCategories, {
        error: () => ({ message: 'Invalid product category' }),
      })
      .optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    description: z
      .string()
      .min(1, 'Product description is required')
      .max(1000, 'Product description cannot exceed 1000 characters')
      .optional(),
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
    category: z.enum(productCategories).optional(),
    search: z.string().optional(),
  }),
});

export type createSchemaType = z.infer<typeof createSchema>;
export type updateSchemaType = z.infer<typeof updateSchema>;
export type deleteSchemaType = z.infer<typeof deleteSchema>;
export type getSchemaType = z.infer<typeof getSchema>;
export type getAllSchemaType = z.infer<typeof getAllSchema>;
