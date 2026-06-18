import { z } from 'zod';
import { ipToHex } from '../../utils/ip.utils';

export const lookupSchema = z.object({
  query: z.object({
    ip: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          try {
            ipToHex(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid IP address format (must be a valid IPv4 or IPv6 address)',
        }
      ),
  }),
});

export type lookupSchemaType = z.infer<typeof lookupSchema>;
