import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { RoleType } from "../constants/roles";

export interface JwtPayload {
  id: string;
  role: RoleType;
  email: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
