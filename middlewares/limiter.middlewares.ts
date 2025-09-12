import { rateLimit } from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 300, // each IP can make up to 30 requests per `windowsMs` (1 minute)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
  message: 'Too many requests, please try again later',
  // NOTE : and be use redis
  // store: new RedisStore({
  //   sendCommand: (...args: string[]) => redis.sendCommand(args as any),
  // }),
});
