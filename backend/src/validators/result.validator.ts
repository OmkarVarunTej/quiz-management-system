import { z } from "zod";

export const quizIdParamSchema = {
  params: z.object({ quizId: z.string().uuid() }),
};

export const studentQuizIdParamSchema = {
  params: z.object({ studentQuizId: z.string().uuid() }),
};

export const listResultsQuerySchema = {
  params: z.object({ quizId: z.string().uuid() }),
  query: z.object({
    regNo: z.string().optional(),
    sort: z.enum(["asc", "desc"]).default("asc"),
  }),
};
