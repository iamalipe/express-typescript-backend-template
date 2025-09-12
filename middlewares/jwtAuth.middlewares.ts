import { NextFunction, Request, Response } from 'express';
import { db } from '../services/db.services';
import { cacheGet, cacheSet } from '../services/redis.service';
import { PublicUser } from '../types/PublicUser.type';
import { verifyJWT } from '../utils/auth.utils';

/**
 * The function `jwtAuth` is responsible for handling JWT authentication by verifying access tokens,
 * refreshing tokens if needed, and setting user data in the request object.
 * @param {Request} req - The `req` parameter in the `jwtAuth` function stands for the Request object,
 * which represents the HTTP request and contains information about the request such as headers,
 * parameters, and body data. It is typically provided by the Express.js framework when handling
 * incoming HTTP requests.
 * @param {Response} res - The `res` parameter in the `jwtAuth` function stands for the response object
 * in Express.js. It is used to send a response back to the client making the request. This object
 * contains methods and properties that allow you to send data, set cookies, and control the HTTP
 * response that will be
 * @param {NextFunction} next - The `next` parameter in the `jwtAuth` function is a callback function
 * that is used to pass control to the next middleware function in the stack. When called, it invokes
 * the next middleware function in the chain. This is commonly used in Express.js middleware functions
 * to move to the next middleware or
 * @returns The `jwtAuth` function returns either the decoded user information if the access token is
 * valid, or it refreshes the access token using the refresh token and returns the decoded user
 * information. If neither of these conditions are met, it throws an `AppError` with a status of 401
 * indicating unauthorized access.
 */
export const jwtAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies?.access;

  if (!accessToken) {
    throw new AppError('Unauthorized', { status: 401 });
  }

  const { decoded, expired } = verifyJWT(accessToken);

  if (expired) {
    throw new AppError('Session expired', { status: 401 });
  }

  if (decoded) {
    const key = `user:${decoded.id}`;
    let user = await cacheGet<PublicUser>(key);
    if (!user) {
      user = await db.user.findById(decoded.id).lean();
      if (!user) throw new AppError('Unauthorized', { status: 401 });
      await cacheSet(key, user, 60 * 5); // 5 min
    }
    req.user = user;
    next();
    return;
  }

  throw new AppError('Unauthorized', { status: 401 });
};
