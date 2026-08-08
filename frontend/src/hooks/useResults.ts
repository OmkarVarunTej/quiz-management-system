import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resultService } from "@/services/result.service";

export function useResultsForQuiz(quizId?: string, params?: { regNo?: string; sort?: "asc" | "desc" }) {
  return useQuery({
    queryKey: ["results", "quiz", quizId, params],
    queryFn: () => resultService.listForQuiz(quizId!, params),
    enabled: !!quizId,
  });
}

export function usePublishResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => resultService.publishForQuiz(quizId),
    onSuccess: (_data, quizId) => {
      qc.invalidateQueries({ queryKey: ["results", "quiz", quizId] });
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useMyResults() {
  return useQuery({ queryKey: ["results", "my"], queryFn: resultService.listMine });
}

export function useResultDetail(studentQuizId?: string) {
  return useQuery({
    queryKey: ["results", "detail", studentQuizId],
    queryFn: () => resultService.getDetail(studentQuizId!),
    enabled: !!studentQuizId,
  });
}
