import { z } from 'zod';
import { mongoIdRegex } from '../../utils/general.utils';

export const createChatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).optional(),
    model: z.string().optional(),
  }),
});

export const continueChatSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid chat id'),
  }),
  body: z.object({
    message: z.string().trim().min(1),
    model: z.string().optional(),
  }),
});

export const tempChatSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
      }),
    ),
    model: z.string().optional(),
  }),
});

export const listChatsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().min(1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(z.number().min(1).max(100)),
  }),
});

export const getChatSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid chat id'),
  }),
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().min(1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(z.number().min(1).max(100)),
  }),
});

export const chatReactSchema = z.object({
  body: z.object({
    messages: z.array(
      z.object({
        id: z.string().optional(),
        role: z.enum(['user', 'assistant', 'system', 'data']),
        content: z.string().optional(),
        parts: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().optional(),
            }).passthrough()
          )
          .optional(),
      }).passthrough()
    ),
    model: z.string().optional(),
  }),
});

export type createChatSchemaType = z.infer<typeof createChatSchema>;
export type continueChatSchemaType = z.infer<typeof continueChatSchema>;
export type tempChatSchemaType = z.infer<typeof tempChatSchema>;
export type listChatsSchemaType = z.infer<typeof listChatsSchema>;
export type getChatSchemaType = z.infer<typeof getChatSchema>;
export type chatReactSchemaType = z.infer<typeof chatReactSchema>;

