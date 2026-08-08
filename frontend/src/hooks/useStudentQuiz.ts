import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentQuizService } from "@/services/studentQuiz.service";

export function useAvailableQuizzes() {
  return useQuery({ queryKey: ["student-quizzes", "available"], queryFn: studentQuizService.listAvailable });
}

export function useQuizSession(quizId?: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ["student-quizzes", "session", quizId],
    queryFn: () => studentQuizService.getSession(quizId!),
    enabled: !!quizId && (options?.enabled ?? true),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useStartQuiz() {
  return useMutation({
    mutationFn: (quizId: string) => studentQuizService.start(quizId),
  });
}

export function useSaveAnswer(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string | null }) =>
      studentQuizService.saveAnswer(quizId, questionId, selectedOptionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-quizzes", "session", quizId] }),
  });
}

export function useSubmitQuiz(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (autoSubmitted: boolean) => studentQuizService.submit(quizId, autoSubmitted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-quizzes"] });
      qc.invalidateQueries({ queryKey: ["results"] });
    },
  });
}
