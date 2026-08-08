import { z } from "zod";

export const createCourseSchema = {
  body: z.object({
    name: z.string().min(2).max(150),
    code: z.string().min(2).max(30),
  }),
};

export const updateCourseSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    code: z.string().min(2).max(30).optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const enrollStudentSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    regNo: z.string().min(2),
  }),
};
