import { z } from 'zod';

// NOTE : THIS FILE ONLY FOR COPY PASTE

export const paginationSchema = z.object({
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
});
export const sortArraySchema = z
  .array(
    z.object({
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
        .transform((val) =>
          val === '' || val === undefined ? 'createdAt' : val,
        )
        .default('createdAt'),
    }),
  )
  .transform((val) =>
    val.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.orderBy === item.orderBy),
    ),
  )
  .default([]);
