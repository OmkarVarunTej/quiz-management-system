import { Link } from "react-router-dom";
import { Award, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMyResults } from "@/hooks/useResults";
import { formatDate } from "@/lib/utils";

export function StudentResultsPage() {
  const { data: results, isLoading, isError, refetch } = useMyResults();

  return (
    <div>
      <PageHeader title="My Results" description="Published results for the quizzes you've taken." />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !results?.length ? (
        <EmptyState icon={Award} title="No published results yet" description="Once your faculty publishes results, they'll appear here." />
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const pct = r.totalMarks > 0 ? Math.round((r.obtainedMarks / r.totalMarks) * 100) : 0;
            return (
              <Link key={r.id} to={`/student/results/${r.studentQuizId}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-foreground">{r.quiz?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Published {formatDate(r.publishedAt)} · {r.correctCount} correct · {r.wrongCount} wrong · {r.skippedCount} skipped
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {r.obtainedMarks}/{r.totalMarks}
                        </p>
                        <Badge variant={pct >= 50 ? "success" : "destructive"}>{pct}%</Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
