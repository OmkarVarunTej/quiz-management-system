import { useState } from "react";
import { useParams } from "react-router-dom";
import { Send, ArrowUpDown, Award } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PageSpinner } from "@/components/ui/spinner";
import { useQuiz } from "@/hooks/useQuizzes";
import { usePublishResults, useResultsForQuiz } from "@/hooks/useResults";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";

export function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quiz } = useQuiz(id);
  const [regNo, setRegNo] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const debouncedRegNo = useDebounce(regNo);
  const { data: results, isLoading, isError, refetch } = useResultsForQuiz(id, { regNo: debouncedRegNo || undefined, sort });
  const [publishConfirm, setPublishConfirm] = useState(false);
  const publishResults = usePublishResults();
  const { toast } = useToast();

  const handlePublish = async () => {
    if (!id) return;
    try {
      const res = await publishResults.mutateAsync(id);
      toast({ title: "Results published", description: `${res.publishedCount} result(s) are now visible to students.`, variant: "success" });
      setPublishConfirm(false);
    } catch (err) {
      toast({ title: "Could not publish results", description: (err as Error).message, variant: "error" });
    }
  };

  const allPublished = results && results.length > 0 && results.every((r) => r.published);

  return (
    <div>
      <Breadcrumb items={[{ label: "Quizzes", to: "/faculty/quizzes" }, { label: quiz?.title || "Results", to: id ? `/faculty/quizzes/${id}` : undefined }, { label: "Results" }]} />
      <PageHeader
        title="Results"
        description={quiz ? `${quiz.title} · Total marks: ${quiz.totalMarks}` : undefined}
        action={
          <Button onClick={() => setPublishConfirm(true)} disabled={!results?.length || allPublished}>
            <Send className="h-4 w-4" /> {allPublished ? "Results published" : "Publish results"}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={regNo} onChange={setRegNo} placeholder="Search by registration number..." className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}>
          <ArrowUpDown className="h-4 w-4" /> Sort by marks: {sort === "asc" ? "Low to high" : "High to low"}
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !results?.length ? (
        <EmptyState
          icon={Award}
          title="No attempts yet"
          description="Results will appear here once students submit this quiz."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Reg. No.</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead>Wrong</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">{r.student?.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.student?.regNo}</TableCell>
                    <TableCell className="font-semibold">
                      {r.obtainedMarks} / {r.totalMarks}
                    </TableCell>
                    <TableCell className="text-success">{r.correctCount}</TableCell>
                    <TableCell className="text-destructive">{r.wrongCount}</TableCell>
                    <TableCell className="text-muted-foreground">{r.skippedCount}</TableCell>
                    <TableCell>
                      <Badge variant={r.published ? "success" : "secondary"}>{r.published ? "Published" : "Unpublished"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={publishConfirm}
        onOpenChange={setPublishConfirm}
        title="Publish results to students?"
        description="All students who attempted this quiz will be able to see their marks and correct answers."
        confirmLabel="Publish results"
        isLoading={publishResults.isPending}
        onConfirm={handlePublish}
      />
    </div>
  );
}
