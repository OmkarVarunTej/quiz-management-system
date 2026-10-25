import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export function useQuizAnalytics(quizId?: string) {
  return useQuery({
    queryKey: ["analytics", "quiz", quizId],
    queryFn: () => analyticsService.getQuizAnalytics(quizId!),
    enabled: !!quizId,
  });
}
