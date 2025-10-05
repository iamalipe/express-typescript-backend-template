import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { cacheDel, cacheGet, cacheSet } from '../../services/redis.service';
import { generateJWT } from '../../utils/auth.utils';
import {
  loginSchemaType,
  passKeyLoginSchemaType,
  profileImageUpdateSchemaType,
  registerSchemaType,
} from './auth.schema';

export const registerController = async (req: Request, res: Response) => {
  const body = req.body as registerSchemaType['body'];

  const uniqueCheck = await db.user
    .findOne({
      email: new RegExp(body.email, 'i'),
    })
    .lean();

  if (uniqueCheck)
    throw new AppError('email already exists', { status: 400, path: 'email' });

  const userDoc = await db.user.create({
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    password: body.password,
    role: 'user',
  });
  const user = userDoc.toObject();

  const ip = req.headers['x-forwarded-for'] as string;
  const userAgent = req.headers['user-agent'];

  await db.session.create({
    ip,
    userAgent,
    userId: user.id,
  });

  const token = generateJWT({ id: user.id });

  const returnData = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Set cookie
  res.cookie('access', token, {
    httpOnly: true,
    sameSite: 'strict',
  });

  // TODO SEND Email verification link

  res.status(201).json({
    success: true,
    data: returnData,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
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

  await db.session.create({
    ip,
    userAgent,
    userId: user.id,
  });

  const token = generateJWT({ id: user.id });

  // Set cookie
  res.cookie('access', token, {
    httpOnly: true,
    sameSite: 'strict',
  });
  const userObject = user.toObject();

  const returnData = {
    email: userObject.email,
    firstName: userObject.firstName,
    lastName: userObject.lastName,
    sex: userObject.sex,
    role: userObject.role,
    dateOfBirth: userObject.dateOfBirth,
    jobTitle: userObject.jobTitle,
    createdAt: userObject.createdAt,
    updatedAt: userObject.updatedAt,
  };

  res.status(200).json({
    success: true,
    data: returnData,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const key = `user:${req.user.id}`;
  let currentUser = await cacheGet(key);
  if (!currentUser) {
    currentUser = await db.user.findById(req.user.id).lean();
    if (!currentUser) throw new AppError('Unauthorized', { status: 401 });
    await cacheSet(key, currentUser, 60 * 5);
  }

  res.status(200).json({
    success: true,
    data: currentUser,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

export const profileImageUpdate = async (req: Request, res: Response) => {
  const body = req.body as profileImageUpdateSchemaType['body'];

  let profileImage: string | null = null;
  if (body.remove) {
    profileImage = null;
  } else if (body.profileImage?.s3Url) {
    profileImage = body.profileImage.s3Url;
  }

  const updatedUser = await db.user.findByIdAndUpdate(
    req.user.id,
    {
      profileImage,
    },
    {
      new: true,
    },
  );

  await cacheDel(`user:${req.user.id}`);

  res.status(200).json({
    success: true,
    data: updatedUser,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

// NOTE : Passkey setup
const rpName = 'Your App';
const rpID = ['localhost'];
const origin = ['http://localhost:5173'];

export const passKeyRegister = async (req: Request, res: Response) => {
  const user = await db.user.findById(req.user.id);

  if (!user) {
    throw new AppError('user not found');
  }
  const excludeCredentials = user.webAuthn.map((c) => ({
    id: c.id,
    transports: c.transports,
  }));

  const options: PublicKeyCredentialCreationOptionsJSON =
    await generateRegistrationOptions({
      rpName: rpName,
      rpID: 'localhost',
      userName: user.id.toString(),
      userDisplayName: user.email,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: 'none',
      // Prevent users from re-registering existing authenticators
      excludeCredentials: excludeCredentials,
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: 'preferred',
        userVerification: 'preferred',
        // Optional
        authenticatorAttachment: 'platform',
      },
    });

  user.currentChallenge = options.challenge;
  await user.save();

  res.status(200).json({ success: true, data: options });
};

export const passKeyVerify = async (req: Request, res: Response) => {
  const { attResp } = req.body;
  const user = await db.user.findById(req.user.id);
  if (!user) {
    throw new AppError('user not found');
  }

  const verification = await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge: user.currentChallenge!,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError('Verification failed');
  }

  const { registrationInfo } = verification;
  const { credential, credentialDeviceType, credentialBackedUp } =
    registrationInfo;

  // Create a Buffer from the Uint8Array
  const publicKeyBuffer = Buffer.from(credential.publicKey);
  const base64String = publicKeyBuffer.toString('base64');

  const newPasskey = {
    // A unique identifier for the credential
    id: credential.id,
    // The public key bytes, used for subsequent authentication signature verification
    publicKey: base64String,
    // publicKey: credential.publicKey,
    // The number of times the authenticator has been used on this site so far
    counter: credential.counter,
    // How the browser can talk with this credential's authenticator
    transports: credential.transports,
    // Whether the passkey is single-device or multi-device
    deviceType: credentialDeviceType,
    // Whether the passkey has been backed up in some way
    backedUp: credentialBackedUp,
  };
  // @ts-ignore
  user.webAuthn.push(newPasskey);
  user.currentChallenge = undefined;
  await user.save();

  res.status(200).json({ success: true });
  // res.status(201).json({
  //   success: true,
  //   data: result,
  //   info: { success: result.success.length, failed: result.failed.length },
  //   errors: [],
  //   timestamp: new Date().toISOString(),
  //   message: 'success',
  // });
};

export const passKeyLogin = async (req: Request, res: Response) => {
  const body = req.body as passKeyLoginSchemaType['body'];
  let allowCredentials:
    | {
        id: Base64URLString;
        transports?: AuthenticatorTransportFuture[];
      }[]
    | undefined = undefined;

  if (body.email) {
    const user = await db.user.findOne({
      email: new RegExp(body.email, 'i'),
    });
    if (user) {
      allowCredentials = user.webAuthn.map((c) => ({
        id: c.id,
        transports: c.transports,
      }));
    }
  }
  const options = await generateAuthenticationOptions({
    rpID: 'localhost',
    userVerification: 'required',
    allowCredentials: allowCredentials,
  });

  res.cookie('challenge', options.challenge, {
    httpOnly: true,
    sameSite: 'strict',
  });

  res.status(200).json({ success: true, data: options });
  // res.status(201).json({
  //   success: true,
  //   data: result,
  //   info: { success: result.success.length, failed: result.failed.length },
  //   errors: [],
  //   timestamp: new Date().toISOString(),
  //   message: 'success',
  // });
};

export const passKeyLoginVerify = async (req: Request, res: Response) => {
  try {
    const { attResp } = req.body;
    const challenge = req.cookies?.challenge;
    if (!challenge) {
      throw new AppError('Unknown credential : challenge missing');
    }

    const user = await db.user.findOne({ 'webAuthn.id': attResp.rawId }).lean();
    if (!user) {
      throw new AppError('Unknown credential');
    }
    const cred = user.webAuthn.find((c) => c.id === attResp.rawId);

    if (!cred) {
      throw new AppError('Unknown credential');
    }

    const publicKeyBuffer = Buffer.from(cred.publicKey, 'base64');

    const verification = await verifyAuthenticationResponse({
      response: attResp,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: new Uint8Array(publicKeyBuffer),
        counter: cred.counter,
        transports: cred.transports,
      },
    });

    if (!verification.verified) {
      throw new AppError('Verification failed');
    }

    const ip = req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];

    const sessionDoc = new db.session({
      ip,
      userAgent,
      userId: user._id?.toString(),
    });
    await sessionDoc.save();

    const token = generateJWT({ id: user._id?.toString() });

    // Set cookie
    res.clearCookie('challenge');
    res.cookie('access', token, {
      httpOnly: true,
      sameSite: 'strict',
    });
    const userObjectAll = user;
    const { password: pw, ...userObject } = userObjectAll;

    res.status(200).json({ success: true, data: userObject });
    // res.status(201).json({
    //   success: true,
    //   data: result,
    //   info: { success: result.success.length, failed: result.failed.length },
    //   errors: [],
    //   timestamp: new Date().toISOString(),
    //   message: 'success',
    // });
  } catch (err) {
    console.log(err);
    throw err;
  }
};
