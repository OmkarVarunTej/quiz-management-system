import { api } from "@/lib/axios";
import { ApiSuccess, QuizAnalytics } from "@/types";

export const analyticsService = {
  async getQuizAnalytics(quizId: string) {
    const { data } = await api.get<ApiSuccess<QuizAnalytics>>(`/analytics/quiz/${quizId}`);
    return data.data;
  },
};
