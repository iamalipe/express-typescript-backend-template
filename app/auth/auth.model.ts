import mongoose, { type Document, Schema, type Types } from 'mongoose';
import { comparePassword, hashPassword } from '../../utils/auth.utils';

// Type definitions
export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  connectState?: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'AWAY';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ISession extends Document {
  ip?: string;
  userAgent?: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definitions
const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    connectState: {
      type: String,
      enum: ['OFFLINE', 'ONLINE', 'BUSY'],
      default: 'OFFLINE',
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'User',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual relationships for Artist
userSchema.virtual('copyMe', {
  ref: 'CopyMe',
  localField: '_id',
  foreignField: 'userId',
});

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
