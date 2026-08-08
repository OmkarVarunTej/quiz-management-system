import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quizService, QuizInput } from "@/services/quiz.service";

export const quizKeys = {
  all: (courseId?: string) => ["quizzes", courseId ?? "all"] as const,
  detail: (id: string) => ["quizzes", "detail", id] as const,
};

export function useQuizzes(courseId?: string) {
  return useQuery({ queryKey: quizKeys.all(courseId), queryFn: () => quizService.list(courseId) });
}

export function useQuiz(id?: string) {
  return useQuery({
    queryKey: quizKeys.detail(id!),
    queryFn: () => quizService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuizInput) => quizService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function useUpdateQuiz(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<QuizInput>) => quizService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function useAssignQuestions(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => quizService.assignQuestions(id, questionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useRemoveQuizQuestion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => quizService.removeQuestion(id, questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function usePublishQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizService.publish(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useCloseQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizService.close(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}
