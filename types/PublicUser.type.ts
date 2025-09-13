import { IUser } from '../app/auth/auth.model';

export type PublicUser = Pick<
  IUser,
  'email' | 'createdAt' | 'updatedAt' | '_id' | 'id'
>;
