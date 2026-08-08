import { api } from "@/lib/axios";
import { ApiSuccess, ResultDetail, ResultSummary } from "@/types";

export const resultService = {
  async publishForQuiz(quizId: string) {
    const { data } = await api.post<ApiSuccess<{ publishedCount: number }>>(`/results/quiz/${quizId}/publish`);
    return data.data;
  },
  async listForQuiz(quizId: string, params?: { regNo?: string; sort?: "asc" | "desc" }) {
    const { data } = await api.get<ApiSuccess<ResultSummary[]>>(`/results/quiz/${quizId}`, { params });
    return data.data;
  },
  async listMine() {
    const { data } = await api.get<ApiSuccess<ResultSummary[]>>("/results/my");
    return data.data;
  },
  async getDetail(studentQuizId: string) {
    const { data } = await api.get<ApiSuccess<ResultDetail>>(`/results/${studentQuizId}`);
    return data.data;
  },
};
