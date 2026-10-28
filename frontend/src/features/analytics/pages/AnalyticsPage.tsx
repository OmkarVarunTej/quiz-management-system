import { Fragment, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, ChevronDown, ChevronRight, Clock, Hourglass, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSpinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useQuizAnalytics } from "@/hooks/useAnalytics";
import { formatDateTime, formatTimeSpent } from "@/lib/utils";

export function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const quizId = params.get("quizId") ?? undefined;
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes();
  const { data: analytics, isLoading, isError, refetch } = useQuizAnalytics(quizId);

  // Draft quizzes can't have attempts yet.
  const selectableQuizzes = quizzes?.filter((q) => q.status !== "DRAFT") ?? [];

  const maxAvgSeconds = Math.max(1, ...(analytics?.questions.map((q) => q.avgSeconds) ?? [0]));

  const summaryCards = analytics
    ? [
        { label: "Submitted attempts", value: String(analytics.summary.attempts), icon: Users },
        { label: "Average time to finish", value: formatTimeSpent(analytics.summary.avgTotalSeconds), icon: Clock },
        { label: "Fastest finish", value: formatTimeSpent(analytics.summary.fastestSeconds), icon: Zap },
        { label: "Slowest finish", value: formatTimeSpent(analytics.summary.slowestSeconds), icon: Hourglass },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="See how long students took on each question and on the whole quiz."
      />

      <div className="mb-6 max-w-md">
        {quizzesLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={quizId}
            onValueChange={(value) => {
              setParams({ quizId: value });
              setExpanded(null);
            }}
          >
            <SelectTrigger aria-label="Choose a quiz">
              <SelectValue placeholder="Choose a quiz..." />
            </SelectTrigger>
            <SelectContent>
              {selectableQuizzes.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.title}
                  {q.course?.name ? ` · ${q.course.name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!quizId ? (
        <EmptyState
          icon={BarChart3}
          title={selectableQuizzes.length || quizzesLoading ? "Pick a quiz" : "No published quizzes yet"}
          description={
            selectableQuizzes.length || quizzesLoading
              ? "Choose a quiz above to see time analytics for its attempts."
              : "Publish a quiz and have students attempt it to see analytics here."
          }
        />
      ) : isLoading ? (
        <PageSpinner />
      ) : isError || !analytics ? (
        <ErrorState onRetry={() => refetch()} />
      ) : analytics.summary.attempts === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No submitted attempts yet"
          description="Analytics will appear here once students submit this quiz."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Time per question</CardTitle>
              <p className="text-sm text-muted-foreground">Across all students who spent time on the question.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="min-w-[180px]">Average time</TableHead>
                    <TableHead>Fastest</TableHead>
                    <TableHead>Slowest</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.questions.map((q) => (
                    <TableRow key={q.questionId}>
                      <TableCell className="font-mono text-xs">Q{q.number}</TableCell>
                      <TableCell>
                        <p className="max-w-md truncate text-foreground" title={q.text}>
                          {q.text}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(q.avgSeconds / maxAvgSeconds) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium tabular-nums">{formatTimeSpent(q.avgSeconds)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatTimeSpent(q.minSeconds)}</TableCell>
                      <TableCell className="tabular-nums">{formatTimeSpent(q.maxSeconds)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{q.attemptedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time per student</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a student to see how long they spent on each question.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg. No.</TableHead>
                    <TableHead>Total time</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Tab switches</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.students.map((s) => {
                    const isOpen = expanded === s.studentQuizId;
                    return (
                      <Fragment key={s.studentQuizId}>
                        <TableRow>
                          <TableCell className="font-medium text-foreground">
                            <button
                              type="button"
                              onClick={() => setExpanded(isOpen ? null : s.studentQuizId)}
                              aria-expanded={isOpen}
                              className="flex items-center gap-2 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {s.student.name}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{s.student.regNo}</TableCell>
                          <TableCell className="font-semibold tabular-nums">{formatTimeSpent(s.totalSeconds)}</TableCell>
                          <TableCell className="tabular-nums">
                            {s.obtainedMarks} / {s.totalMarks}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(s.submittedAt)}</TableCell>
                          <TableCell className={s.tabSwitchCount ? "font-semibold text-destructive tabular-nums" : "text-muted-foreground tabular-nums"}>
                            {s.tabSwitchCount}
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.terminatedForTabSwitching ? "destructive" : s.autoSubmitted ? "warning" : "success"}>
                              {s.terminatedForTabSwitching ? "Auto-submitted (tab switching)" : s.autoSubmitted ? "Auto-submitted" : "Submitted"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                            <TableCell colSpan={7}>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                {s.questionTimes.map((t) => (
                                  <div
                                    key={t.questionId}
                                    className="rounded-md border border-border bg-card px-3 py-2"
                                    title={`Question ${t.number}: ${t.status.toLowerCase()}`}
                                  >
                                    <p className="text-xs text-muted-foreground">
                                      Q{t.number} ·{" "}
                                      <span
                                        className={
                                          t.status === "CORRECT"
                                            ? "text-success"
                                            : t.status === "WRONG"
                                            ? "text-destructive"
                                            : ""
                                        }
                                      >
                                        {t.status === "SKIPPED" ? "skipped" : t.status.toLowerCase()}
                                      </span>
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums text-foreground">
                                      {formatTimeSpent(t.seconds)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Total time runs from when the student started the quiz until they submitted. Time per question only counts while
            the quiz tab is open. A dash means no time was recorded (for example, attempts made before this feature was added).
          </p>
        </div>
      )}
    </div>
  );
}
