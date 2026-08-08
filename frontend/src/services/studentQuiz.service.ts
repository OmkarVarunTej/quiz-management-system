import { api } from "@/lib/axios";
import { ApiSuccess, Quiz, QuizSession } from "@/types";

export const studentQuizService = {
  async listAvailable() {
    const { data } = await api.get<ApiSuccess<Quiz[]>>("/student-quizzes/available");
    return data.data;
  },
  async start(quizId: string) {
    const { data } = await api.post<ApiSuccess<unknown>>(`/student-quizzes/${quizId}/start`);
    return data.data;
  },
  async getSession(quizId: string) {
    const { data } = await api.get<ApiSuccess<QuizSession>>(`/student-quizzes/${quizId}/session`);
    return data.data;
  },
  async saveAnswer(quizId: string, questionId: string, selectedOptionId: string | null) {
    const { data } = await api.patch<ApiSuccess<unknown>>(`/student-quizzes/${quizId}/answer`, {
      questionId,
      selectedOptionId,
    });
    return data.data;
  },
  async submit(quizId: string, autoSubmitted = false) {
    const { data } = await api.post<ApiSuccess<unknown>>(`/student-quizzes/${quizId}/submit`, {
      autoSubmitted,
    });
    return data.data;
  },
};
