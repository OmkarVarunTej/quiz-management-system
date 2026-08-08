import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../utils/jwt";
import { Messages } from "../constants/messages";

/**
 * Verifies the Bearer JWT and attaches the decoded payload to req.user.
 * No cookies are used - the token must be sent as `Authorization: Bearer <token>`.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized(Messages.AUTH.TOKEN_MISSING);
    }

    const token = header.split(" ")[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch {
      throw ApiError.unauthorized(Messages.AUTH.TOKEN_INVALID);
    }
  }
);
