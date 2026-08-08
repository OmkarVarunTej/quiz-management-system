import { NextFunction, Request, Response } from "express";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps async controller functions so thrown/rejected errors are
 * forwarded to Express's error-handling middleware instead of
 * crashing the process or requiring try/catch in every controller.
 */
export const asyncHandler = (fn: AsyncFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
