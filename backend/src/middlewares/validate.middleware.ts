import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates req.body / req.params / req.query against a Zod schema shaped as
 * { body?: ZodObject, params?: ZodObject, query?: ZodObject }.
 * On success, the parsed (and coerced) values are written back onto req.
 */
export const validate = (schema: {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params) as typeof req.params;
      if (schema.query) req.query = schema.query.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.badRequest("Validation failed", err.flatten().fieldErrors));
      }
      next(err);
    }
  };
};
