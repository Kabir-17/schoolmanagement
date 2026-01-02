import { IUserDocument } from '../app/modules/user/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email?: string;
        role: string;
        schoolId?: string;
        isActive: boolean;
      };
    }
  }
}

export {};

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    email?: string;
    role: string;
    schoolId?: string;
    isActive: boolean;
  };
}