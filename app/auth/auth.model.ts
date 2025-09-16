import {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from '@simplewebauthn/server';
import mongoose, { type Document, Schema, type Types } from 'mongoose';
import { comparePassword, hashPassword } from '../../utils/auth.utils';

// Type definitions
export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  sex: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  jobTitle: string[];
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  webAuthn: IWebAuthnPasskey[];
  currentChallenge?: string;
}

export interface ISession extends Document {
  ip?: string;
  userAgent?: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebAuthnPasskey extends Document {
  id: Base64URLString;
  publicKey: string;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

const WebAuthnPasskeySchema = new Schema<IWebAuthnPasskey>(
  {
    id: { type: String, required: true }, // unique per device
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true },
    transports: [String], // optional
    backedUp: Boolean, // optional
    deviceType: String, // optional
  },
  {
    _id: false, // Disable automatic _id field
  },
);

// Schema definitions
const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    dateOfBirth: {
      type: Date,
    },
    jobTitle: {
      type: [String],
      default: [],
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    webAuthn: [WebAuthnPasskeySchema],
    currentChallenge: String,
  },
  {
    timestamps: true,
    collection: 'User',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual relationships for Artist
// userSchema.virtual('copyMe', {
//   ref: 'CopyMe',
//   localField: '_id',
//   foreignField: 'userId',
// });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (err) {
    next(err as any);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return await comparePassword(this.password, candidatePassword);
};

const sessionSchema = new Schema<ISession>(
  {
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'Session',
  },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
export const SessionModel = mongoose.model<ISession>('Session', sessionSchema);
