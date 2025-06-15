import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { generateJWT } from '../../utils/auth.utils';
import { loginSchemaType, registerSchemaType } from './auth.schema';

export const registerController = async (req: Request, res: Response) => {
  const body = req.body as registerSchemaType['body'];
  const userDoc = new db.user({
    fullName: body.fullName,
    email: body.email,
    password: body.password,
  });
  const userSave = await userDoc.save();
  const user = userSave.toObject();

  const ip = req.headers['x-forwarded-for'] as string;
  const userAgent = req.headers['user-agent'];

  const sessionDoc = new db.session({
    ip,
    userAgent,
    userId: user.id,
  });
  await sessionDoc.save();

  const token = generateJWT({ id: user.id });

  const { password: pw, ...userObject } = user;

  // Set cookie
  res.cookie('access', token, {
    httpOnly: true,
    sameSite: 'strict',
  });

  res.status(201).json({ success: true, data: userObject });
};

export const loginController = async (req: Request, res: Response) => {
  const body = req.body as loginSchemaType['body'];
  const user = await db.user
    .findOne({
      email: new RegExp(body.email, 'i'),
    })
    .select('+password');

  if (!user)
    throw new AppError('user not found', { status: 404, path: 'email' });
  if (!user.password)
    throw new AppError('password not found', { status: 404, path: 'password' });
  // const verifyResult = await comparePassword(user.password, body.password);
  const verifyResult = await user.comparePassword(body.password);
  if (!verifyResult)
    throw new AppError('password is wrong', { status: 404, path: 'password' });

  const ip = req.headers['x-forwarded-for'] as string;
  const userAgent = req.headers['user-agent'];

  const sessionDoc = new db.session({
    ip,
    userAgent,
    userId: user.id,
  });
  await sessionDoc.save();

  const token = generateJWT({ id: user.id });

  // Set cookie
  res.cookie('access', token, {
    httpOnly: true,
    sameSite: 'strict',
  });
  const userObjectAll = user.toObject();
  const { password: pw, ...userObject } = userObjectAll;

  res.status(200).json({ success: true, data: userObject });
};

export const getCurrentUser = (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    res.sendStatus(401);
    return;
  }

  res.status(200).json({ success: true, data: user });
};
