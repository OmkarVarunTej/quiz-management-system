import { RoleType } from "../constants/roles";

export interface AuthTokenPayload {
  id: string;
  role: RoleType;
  email: string;
}

export interface LoginResult<T> {
  token: string;
  [key: string]: T | string;
}
