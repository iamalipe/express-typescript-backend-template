import { z } from 'zod';
import { mongoIdRegex } from '../../utils/general.utils';
import { zFileS3 } from '../../utils/validation.utils';

// Helper for boolean coercion from form-data/query parameters
const coerceBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true' || val === '1';
  }
  return !!val;
}, z.boolean());

export const createSchema = z.object({
  body: z.object({
    stringRequired: z.string().min(1, 'stringRequired is required').max(255),
    stringTextarea: z.string().min(5, 'stringTextarea must be at least 5 chars').max(2000),
    stringOptional: z.string().max(255).optional(),
    stringTextareaOptional: z.string().max(2000).optional(),

    numberDecimal: z.coerce.number().positive('Must be a positive decimal number'),
    numberInt: z.coerce.number().int('Must be an integer'),
    numberSlider: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),

    dateOnly: z.coerce.date(),
    dateTime: z.coerce.date(),
    dateRangeStart: z.coerce.date(),
    dateRangeEnd: z.coerce.date(),
    dateTimeRangeStart: z.coerce.date(),
    dateTimeRangeEnd: z.coerce.date(),

    booleanSwitch: coerceBoolean,
    enumString: z.enum(['Active', 'Inactive', 'Block', 'Pending']),
    customOptionalString: z.string().min(1, 'customOptionalString is required'),

    fileImage: z.union([zFileS3, z.string().url(), z.null()]).optional(),
    fileDoc: z.union([zFileS3, z.string().url(), z.null()]).optional(),

    // Structured fields
    // Preprocess / transform to support array parsing from JSON string (since multipart form-data sends arrays as strings)
    singleArray: z.preprocess((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return val;
    }, z.array(z.string())),

    arrayObject: z.preprocess((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val;
    }, z.array(z.object({ label: z.string().min(1), value: z.string().min(1) }))),

    twoDArray: z.preprocess((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val;
    }, z.array(z.array(z.number()))),

    nestedObject: z.preprocess((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return {}; }
      }
      return val;
    }, z.object({
      title: z.string().min(1),
      priority: z.coerce.number().int(),
    })),
  }).refine((data) => data.dateRangeStart <= data.dateRangeEnd, {
    message: 'Date range start must be before or equal to date range end',
    path: ['dateRangeEnd'],
  }).refine((data) => data.dateTimeRangeStart <= data.dateTimeRangeEnd, {
    message: 'Date-time range start must be before or equal to date-time range end',
    path: ['dateTimeRangeEnd'],
  }),
});

export const createManySchema = z.object({
  body: z.array(createSchema.shape.body).min(1),
});

export const updateSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid ID format'),
  }),
  body: createSchema.shape.body.partial().refine((data) => {
    if (data.dateRangeStart && data.dateRangeEnd) {
      return data.dateRangeStart <= data.dateRangeEnd;
    }
    return true;
  }, {
    message: 'Date range start must be before or equal to date range end',
    path: ['dateRangeEnd'],
  }).refine((data) => {
    if (data.dateTimeRangeStart && data.dateTimeRangeEnd) {
      return data.dateTimeRangeStart <= data.dateTimeRangeEnd;
    }
    return true;
  }, {
    message: 'Date-time range start must be before or equal to date-time range end',
    path: ['dateTimeRangeEnd'],
  }),
});

export const deleteSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid ID format'),
  }),
});

export const getSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid ID format'),
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
    search: z.string().optional(),
  }),
});

export type createSchemaType = z.infer<typeof createSchema>;
export type createManySchemaType = z.infer<typeof createManySchema>;
export type updateSchemaType = z.infer<typeof updateSchema>;
export type deleteSchemaType = z.infer<typeof deleteSchema>;
export type getSchemaType = z.infer<typeof getSchema>;
export type getAllSchemaType = z.infer<typeof getAllSchema>;
