import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * The `validate` function in TypeScript takes a schema and returns a middleware function that parses
 * and validates request data before passing it to the next handler.
 * @param {ZodTypeAny} schema - The `schema` parameter in the `validate` function is of type
 * `ZodTypeAny`, which is likely a schema definition from the Zod library. This schema is used to
 * validate and parse the incoming request data, which includes the request body, query parameters, and
 * route parameters. The `
 * @returns A RequestHandler function is being returned.
 */
export const validate = (schema: ZodTypeAny): RequestHandler => {
  return async (req, res, next) => {
    const parseData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    Object.assign(req, parseData);

    next();
  };
};
