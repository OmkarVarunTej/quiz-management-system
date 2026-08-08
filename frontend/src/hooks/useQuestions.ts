import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionService, QuestionInput } from "@/services/question.service";

export const questionKeys = {
  all: (courseId?: string) => ["questions", courseId ?? "all"] as const,
  detail: (id: string) => ["questions", "detail", id] as const,
};

export function useQuestions(courseId?: string) {
  return useQuery({ queryKey: questionKeys.all(courseId), queryFn: () => questionService.list(courseId) });
}

export function useQuestion(id?: string) {
  return useQuery({
    queryKey: questionKeys.detail(id!),
    queryFn: () => questionService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionInput) => questionService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useUpdateQuestion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<QuestionInput>) => questionService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useUploadQuestionImage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => questionService.uploadImage(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}
