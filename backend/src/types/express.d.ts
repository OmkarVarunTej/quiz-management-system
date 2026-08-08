import { RoleType } from "../constants/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: RoleType;
        email: string;
      };
    }
  }
}

export {};
