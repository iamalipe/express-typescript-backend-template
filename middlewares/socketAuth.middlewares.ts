import * as cookie from 'cookie';
import { ExtendedError, Socket } from 'socket.io';
import { verifyJWT } from '../utils/auth.utils';

export const socketAuth = (
  socket: Socket,
  next: (err?: ExtendedError) => void,
) => {
  const cookieHeader = socket.request.headers.cookie;
  if (!cookieHeader) return next(new Error(`Authentication cookie missing.`));
  const cookies = cookie.parse(cookieHeader);
  const accessToken = cookies.access;
  if (!accessToken)
    return next(new Error(`Authentication cookie access token missing.`));
  const { decoded, expired } = verifyJWT(accessToken);
  if (expired) return next(new Error(`Authentication cookie expired.`));
  if (!decoded) return next(new Error(`Authentication error`));
  socket.request.user = decoded;
  next();
};
