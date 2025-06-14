import { NextFunction, Request, Response } from 'express';

/**
 * The function `basicAuth` in TypeScript is a middleware that performs basic authentication by
 * checking the authorization header and validating the provided credentials.
 * @param cred - The `cred` parameter in the `basicAuth` function represents the credentials object
 * containing the username and password that will be used for basic authentication. It has the
 * following structure:
 * @returns The `basicAuth` function is returning another function that takes `req`, `res`, and `next`
 * as parameters. This inner function is responsible for handling basic authentication by checking the
 * authorization header, extracting credentials, validating them against the provided credentials
 * (`cred`), and either allowing the request to proceed by calling `next()` or sending a 401 status
 * with an appropriate message if the credentials are invalid
 */
export const basicAuth = (cred: { username: string; password: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic');
      res.status(401).send('Authentication required');
      return;
    }

    // Get credentials from header
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    const username = auth[0];
    const password = auth[1];

    // Validate credentials
    if (username === cred.username && password === cred.password) {
      // req.user = username; // Optional: attach user to request for later use
      next();
      return;
    }

    res.setHeader('WWW-Authenticate', 'Basic');
    res.status(401).send('Invalid credentials');
  };
};
