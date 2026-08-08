import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { RoleType } from "../constants/roles";
import { Messages } from "../constants/messages";

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 */
export const authorize = (...roles: RoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized(Messages.AUTH.UNAUTHORIZED);
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(Messages.AUTH.FORBIDDEN);
    }
    next();
  };
};
