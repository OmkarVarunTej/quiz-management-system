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

export const submitQuizSchema = {
  params: z.object({ quizId: z.string().uuid() }),
  body: z.object({
    autoSubmitted: z.boolean().default(false),
  }),
};
