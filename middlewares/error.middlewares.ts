import { SpanStatusCode, trace } from '@opentelemetry/api';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

const tracer = trace.getTracer(
  'error.middlewares.ts',
  process.env.NODE_ENV === 'development' ? '1.0.0-dev' : '1.0.0',
);

/**
 * The globalErrorHandler function handles various types of errors, such as AppError, Zod validation
 * errors, Prisma errors, and unhandled errors, returning appropriate responses for each case.
 * @param {Error} err - The `err` parameter in the `globalErrorHandler` function represents the error
 * that occurred during the request processing. Depending on the type of error, the function handles
 * different cases such as `AppError`, `ZodError`, `Prisma.PrismaClientKnownRequestError`, `Prisma.P
 * @param {Request} _req - The `_req` parameter in the `globalErrorHandler` function represents the
 * incoming request object in Express.js. It contains information about the HTTP request made to the
 * server, such as headers, body, parameters, query strings, etc. This parameter is typically used to
 * access and manipulate the request data within the
 * @param {Response} res - The `res` parameter in the `globalErrorHandler` function is an object
 * representing the HTTP response that the server sends back to the client. It allows you to set the
 * status code, headers, and body of the response that will be returned to the client making the
 * request.
 * @param {NextFunction} _next - The `_next` parameter in the `globalErrorHandler` function is a
 * reference to the next middleware function in the Express middleware chain. It is a callback function
 * that is used to pass control to the next middleware function in the stack. If an error occurs and
 * you want to skip the remaining middleware functions and
 * @returns The `globalErrorHandler` function returns a JSON response with specific error handling
 * based on the type of error encountered. Here is a summary of the possible return scenarios:
 */
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const span = tracer.startSpan('globalErrorHandler');
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.recordException(err);
  span.end();
  // NOTE : AppError handling
  if (err instanceof AppError) {
    const status = err.options
      ? err.options.status
        ? err.options.status
        : 400
      : 400;
    const errors = err.options
      ? err.options.path
        ? [{ message: err.message, path: err.options.path }]
        : []
      : [];

    res.status(status).json({
      success: false,
      message: err.message,
      errors: errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // NOTE : Handled Zod - validation errors
  if (err instanceof z.ZodError) {
    const newErrors = err.issues.map((error) => {
      let path = '';
      if (error.path.includes('body')) {
        const err = error.path.filter((ex) => ex !== 'body');
        path = err.join('.');
      } else if (error.path.includes('query')) {
        const err = error.path.filter((ex) => ex !== 'query');
        path = err.join('.');
      } else if (error.path.includes('params')) {
        const err = error.path.filter((ex) => ex !== 'params');
        path = err.join('.');
      } else {
        path = error.path.join('.');
      }

      return {
        path: path,
        message: error.message,
      };
    });

    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: newErrors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // NOTE : Handle Mongoose errors

  // WARN : Unhandled errors
  logger.error('Unhandled errors : globalErrorHandler', err.message);
  res.status(500).json({
    success: false,
    errors: [],
    message: err.message,
    timestamp: new Date().toISOString(),
  });
  return;
};
