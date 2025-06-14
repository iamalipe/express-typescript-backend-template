import { IUser } from '../app/auth/auth.model';

export type PublicUser = Omit<IUser, 'password'>;
