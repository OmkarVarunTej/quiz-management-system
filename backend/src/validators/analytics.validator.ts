import { z } from "zod";

export const quizAnalyticsParamSchema = {
  params: z.object({ quizId: z.string().uuid() }),
};
