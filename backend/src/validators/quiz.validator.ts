import { z } from "zod";

export const createQuizSchema = {
  body: z.object({
    courseId: z.string().uuid(),
    title: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    durationMinutes: z.coerce.number().int().min(1).max(600),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
  }),
};

export const updateQuizSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const assignQuestionsSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    questionIds: z.array(z.string().uuid()).min(1),
  }),
};

export const listQuizzesQuerySchema = {
  query: z.object({
    courseId: z.string().uuid().optional(),
  }),
};
