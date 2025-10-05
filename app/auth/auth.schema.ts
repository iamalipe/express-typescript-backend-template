import { z } from 'zod';
import { zFileS3 } from '../../utils/validation.utils';

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(8),
  }),
});
export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
});
export const passKeyLoginSchema = z.object({
  body: z.object({
    email: z.email().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
});

export const profileImageUpdateSchema = z.object({
  body: z.object({
    profileImage: z.union([zFileS3, z.null()]),
    remove: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .default(false),
  }),
});

export const userProfileUpdateSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(255).trim().optional(),
    lastName: z.string().min(2).max(255).trim().optional(),
    sex: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.date().optional(),
    jobTitle: z.array(z.string().min(2).max(255).trim()).optional(),
  }),
});

export type registerSchemaType = z.infer<typeof registerSchema>;
export type loginSchemaType = z.infer<typeof loginSchema>;
export type passKeyLoginSchemaType = z.infer<typeof passKeyLoginSchema>;
export type changePasswordSchemaType = z.infer<typeof changePasswordSchema>;
export type profileImageUpdateSchemaType = z.infer<
  typeof profileImageUpdateSchema
>;
export type userProfileUpdateSchemaType = z.infer<
  typeof userProfileUpdateSchema
>;
