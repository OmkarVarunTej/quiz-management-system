import { z } from "zod";

export const quizIdParamSchema = {
  params: z.object({ quizId: z.string().uuid() }),
};

export const saveAnswerSchema = {
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().nullable(),
  }),
};

export const recordTimeSchema = {
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    entries: z
      .array(
        z.object({
          questionId: z.string().uuid(),
          seconds: z.number().int().min(1).max(86_400),
        })
      )
      .min(1)
      .max(200),
  }),
};

export const submitQuizSchema = {
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    autoSubmitted: z.boolean().default(false),
  }),
};

export const tabSwitchSchema = {
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    questionId: z.string().uuid().optional(),
  }),
};
