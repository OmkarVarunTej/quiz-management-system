import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useResultDetail } from "@/hooks/useResults";
import { cn } from "@/lib/utils";

const statusConfig = {
  CORRECT: { icon: CheckCircle2, className: "text-success", label: "Correct" },
  WRONG: { icon: XCircle, className: "text-destructive", label: "Wrong" },
  SKIPPED: { icon: MinusCircle, className: "text-muted-foreground", label: "Skipped" },
} as const;

export function ResultDetailPage() {
  const { studentQuizId } = useParams<{ studentQuizId: string }>();
  const { data, isLoading, isError, refetch } = useResultDetail(studentQuizId);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const pct = data.totalMarks > 0 ? Math.round((data.obtainedMarks / data.totalMarks) * 100) : 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Results", to: "/student/results" }, { label: data.quiz.title }]} />
      <PageHeader title={data.quiz.title} description="Detailed breakdown of your attempt" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {data.obtainedMarks}/{data.totalMarks}
            </p>
            <p className="text-xs text-muted-foreground">Marks ({pct}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{data.correctCount}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{data.wrongCount}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{data.skippedCount}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {data.answers.map((a, idx) => {
          const config = statusConfig[a.status];
          const Icon = config.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {idx + 1}. {a.question}
                  </p>
                  <Badge variant="outline" className={cn("shrink-0 gap-1", config.className)}>
                    <Icon className="h-3 w-3" /> {config.label}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {a.options.map((opt) => {
                    const isSelected = opt.text === a.selectedOption;
                    const isCorrect = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                          isCorrect
                            ? "border-success/40 bg-success/5 text-success"
                            : isSelected
                            ? "border-destructive/40 bg-destructive/5 text-destructive"
                            : "border-border text-foreground"
                        )}
                      >
                        <span>{opt.text}</span>
                        <span className="flex items-center gap-2 text-xs font-medium">
                          {isSelected && <Badge variant="outline">Your answer</Badge>}
                          {isCorrect && <Badge variant="success">Correct answer</Badge>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.marksAwarded} / {a.marks} marks awarded
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
