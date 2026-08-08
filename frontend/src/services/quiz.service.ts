import { api } from "@/lib/axios";
import { ApiSuccess, Quiz } from "@/types";

export interface QuizInput {
  courseId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
}

export const quizService = {
  async list(courseId?: string) {
    const { data } = await api.get<ApiSuccess<Quiz[]>>("/quizzes", { params: { courseId } });
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Quiz>>(`/quizzes/${id}`);
    return data.data;
  },
  async create(payload: QuizInput) {
    const { data } = await api.post<ApiSuccess<Quiz>>("/quizzes", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<QuizInput>) {
    const { data } = await api.patch<ApiSuccess<Quiz>>(`/quizzes/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/quizzes/${id}`);
  },
  async assignQuestions(id: string, questionIds: string[]) {
    const { data } = await api.post<ApiSuccess<Quiz>>(`/quizzes/${id}/questions`, { questionIds });
    return data.data;
  },
  async removeQuestion(id: string, questionId: string) {
    const { data } = await api.delete<ApiSuccess<Quiz>>(`/quizzes/${id}/questions/${questionId}`);
    return data.data;
  },
  async publish(id: string) {
    const { data } = await api.post<ApiSuccess<Quiz>>(`/quizzes/${id}/publish`);
    return data.data;
  },
  async close(id: string) {
    const { data } = await api.post<ApiSuccess<Quiz>>(`/quizzes/${id}/close`);
    return data.data;
  },
};
