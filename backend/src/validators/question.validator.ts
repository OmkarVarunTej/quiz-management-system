import { z } from "zod";

export const createQuestionSchema = {
  body: z.object({
    courseId: z.string().uuid(),
    text: z.string().min(3).max(2000),
    marks: z.coerce.number().int().min(1).max(100).default(1),
    options: z
      .array(
        z.object({
          text: z.string().min(1).max(500),
          isCorrect: z.boolean().default(false),
        })
      )
      .min(2, "At least 2 options are required")
      .max(8)
      .refine((opts) => opts.some((o) => o.isCorrect), {
        message: "At least one option must be marked correct",
      }),
  }),
};

export const updateQuestionSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    text: z.string().min(3).max(2000).optional(),
    marks: z.coerce.number().int().min(1).max(100).optional(),
    options: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          text: z.string().min(1).max(500),
          isCorrect: z.boolean().default(false),
        })
      )
      .min(2)
      .max(8)
      .optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const listQuestionsQuerySchema = {
  query: z.object({
    courseId: z.string().uuid().optional(),
  }),
};
