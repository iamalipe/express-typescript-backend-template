import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { generateJWT } from '../../utils/auth.utils';
import {
  loginSchemaType,
  passKeyLoginSchemaType,
  registerSchemaType,
} from './auth.schema';

export const registerController = async (req: Request, res: Response) => {
  const body = req.body as registerSchemaType['body'];
  const userDoc = new db.user({
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    password: body.password,
    sex: body.sex,
    dateOfBirth: body.dateOfBirth,
    jobTitle: body.jobTitle,
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
  } catch (err) {
    console.log(err);
    throw err;
  }
};
