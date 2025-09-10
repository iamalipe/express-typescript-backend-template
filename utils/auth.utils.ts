import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import {
  JWT_EXPIRY,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from '../config/default';
import { PublicUser } from '../types/PublicUser.type';

/**
 * The function `hashPassword` uses the argon2 hashing algorithm to securely hash a given password.
 * @param {string} password - The `hashPassword` function takes a `password` parameter of type string.
 * This parameter represents the password that needs to be hashed using the Argon2 hashing algorithm.
 * @returns The `hashPassword` function is returning the hashed version of the input password using the
 * argon2 hashing algorithm.
 */
export const hashPassword = async (password: string) => {
  const hash = await argon2.hash(password);
  return hash;
};

/**
 * The function `comparePassword` uses argon2 to verify if a given password matches a hashed password.
 * @param {string} hash - The `hash` parameter in the `comparePassword` function is typically a hashed
 * password stored in a database or any other storage. It is the result of applying a one-way hash
 * function to the original password for security purposes.
 * @param {string} password - The `password` parameter is a string that represents the user's input
 * password that needs to be compared with the hashed password.
 * @returns The `comparePassword` function is returning a boolean value indicating whether the provided
 * `password` matches the `hash` value after verification using the argon2 library.
 */
export const comparePassword = async (hash: string, password: string) => {
  const result = await argon2.verify(hash, password);
  return result;
};

/**
 * The function `generateJWT` generates a JSON Web Token (JWT) using the provided payload and specific
 * options.
 * @param payload - The `payload` parameter in the `generateJWT` function is an object that contains
 * key-value pairs of data that you want to include in the JSON Web Token (JWT) payload. This data can
 * be any information that you want to encode into the JWT, such as user details or permissions.
 * @returns The function `generateJWT` returns a JSON Web Token (JWT) generated using the `jwt.sign`
 * method with the provided payload, JWT_SECRET, and options.
 */
export const generateJWT = (payload: { [key: string]: any }) => {
  const options: any = { expiresIn: JWT_EXPIRY };
  const token = jwt.sign(payload, JWT_SECRET, options);
  return token;
};

/**
 * The function generates a refresh JWT token with a specified payload and expiration time.
 * @param payload - The `payload` parameter in the `generateRefreshJWT` function is an object that
 * contains key-value pairs of data that you want to include in the JSON Web Token (JWT) payload. This
 * data can be any information that you want to encode into the JWT, such as user ID, roles,
 * @returns The function `generateRefreshJWT` returns a refresh token generated using the `jwt.sign`
 * method with the provided payload, refresh token secret, and options including the expiry time.
 */
export const generateRefreshJWT = (payload: { [key: string]: any }) => {
  const options: any = { expiresIn: REFRESH_TOKEN_EXPIRY };
  const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
  return token;
};

/**
 * The function `verifyJWT` verifies a JWT token and returns an object indicating whether the token is
 * valid, expired, and the decoded payload.
 * @param {string} token - The `token` parameter is a string that represents a JSON Web Token (JWT)
 * that needs to be verified for authenticity and validity.
 * @returns The function `verifyJWT` returns an object with three properties: `valid`, `expired`, and
 * `decoded`. The `valid` property indicates whether the JWT token is valid or not. The `expired`
 * property indicates whether the token has expired or not. The `decoded` property contains the decoded
 * token payload if the token is valid, otherwise it is set to `null`.
 */
export const verifyJWT = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PublicUser;
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message === 'jwt expired',
      decoded: null,
    };
  }
};

/**
 * The function `verifyRefreshJWT` verifies a refresh JWT token and returns its validity and expiration
 * status along with the decoded information.
 * @param {string} token - The `token` parameter is a string representing a refresh token that needs to
 * be verified for authenticity and expiration.
 * @returns The function `verifyRefreshJWT` returns an object with the following properties:
 * - `valid`: a boolean indicating whether the token is valid or not
 * - `expired`: a boolean indicating whether the token has expired or not
 * - `decoded`: the decoded token payload if the token is valid, otherwise null
 */
export const verifyRefreshJWT = (token: string) => {
  try {
    // return sessionId
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string };
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message === 'jwt expired',
      decoded: null,
    };
  }
};

/**
 * The function reIssueAccessToken takes a refresh token, verifies it, retrieves session information
 * from the database, generates a new access token, and returns it.
 * @param {string} refreshToken - The `reIssueAccessToken` function takes a `refreshToken` as a
 * parameter. This token is used to verify the user's session and generate a new access token for the
 * user. The `refreshToken` is typically a long-lived token that is used to obtain a new access token
 * without requiring the
 * @returns The function `reIssueAccessToken` returns a new access token generated based on the user
 * information retrieved from the database session associated with the provided refresh token.
 */
// export const reIssueAccessToken = async (refreshToken: string) => {
//   const { decoded } = verifyRefreshJWT(refreshToken);

//   if (!decoded) throw new AppError('session expired', { status: 401 });

//   const sessionInfo = await db.session.findFirst({
//     where: {
//       id: decoded.id,
//       valid: true,
//       expiresAt: { gte: new Date() }, // Check if session hasn't expired
//     },
//     include: {
//       user: {
//         omit: {
//           password: true,
//         },
//       },
//     },
//   });

//   if (!sessionInfo) throw new AppError('session expired', { status: 401 });

//   const accessToken = generateJWT(sessionInfo.user);

//   return accessToken;
// };
