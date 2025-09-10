import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
export const passKeyLoginSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});

export type registerSchemaType = z.infer<typeof registerSchema>;
export type loginSchemaType = z.infer<typeof loginSchema>;
export type passKeyLoginSchemaType = z.infer<typeof passKeyLoginSchema>;
