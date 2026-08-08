import { z } from "zod";

export const facultyRegisterSchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(72),
  }),
};

export const studentRegisterSchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    regNo: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(72),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};
