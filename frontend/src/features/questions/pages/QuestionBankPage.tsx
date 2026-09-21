import { useMemo, useState } from "react";
import { Plus, HelpCircle, Pencil, Trash2, ImageUp, ImageIcon, FileUp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCourses } from "@/hooks/useCourses";
import { useDeleteQuestion, useQuestions } from "@/hooks/useQuestions";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";
import { QuestionFormDialog } from "../components/QuestionFormDialog";
import { QuestionImageDialog } from "../components/QuestionImageDialog";
import { ImportPdfDialog } from "../components/ImportPdfDialog";
import { Question } from "@/types";


export function QuestionBankPage() {
  const { data: courses } = useCourses();
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const { data: questions, isLoading, isError, refetch } = useQuestions(courseFilter === "all" ? undefined : courseFilter);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [importPdfOpen, setImportPdfOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [imageTarget, setImageTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const deleteQuestion = useDeleteQuestion();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!questions) return [];
    const q = debouncedSearch.toLowerCase();
    return questions.filter((item) => item.text.toLowerCase().includes(q));
  }, [questions, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteQuestion.mutateAsync(deleting.id);
      toast({ title: "Question deleted", variant: "success" });
      setDeleting(null);
    } catch (err) {
      toast({ title: "Could not delete question", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Question Bank"
        description="Create and manage reusable quiz questions for your courses."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportPdfOpen(true)}
              disabled={!courses?.length}
              className="gap-1.5"
            >
              <FileUp className="h-4 w-4" /> Import from PDF
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              disabled={!courses?.length}
            >
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          </div>
        }
      />


      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search questions..." className="max-w-sm" />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!courses?.length ? (
        <EmptyState icon={HelpCircle} title="Create a course first" description="You need at least one course before adding questions." />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title={questions?.length ? "No questions match your search" : "No questions yet"}
          description={questions?.length ? "Try a different search term." : "Add your first question to start building quizzes."}
          actionLabel={!questions?.length ? "Add Question" : undefined}
          onAction={!questions?.length ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 gap-3">
                  {q.imageUrl ? (
                    <img src={q.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-md border border-border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-secondary/40">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{q.course?.code}</Badge>
                      <Badge variant="secondary">{q.marks} marks</Badge>
                      <Badge variant="secondary">{q.options.length} options</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{q.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Correct: {q.options.find((o) => o.isCorrect)?.text || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-start">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImageTarget(q)} aria-label="Upload image">
                    <ImageUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(q);
                      setFormOpen(true);
                    }}
                    aria-label="Edit question"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(q)}
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        question={editing}
        defaultCourseId={courseFilter !== "all" ? courseFilter : undefined}
      />
      <ImportPdfDialog
        open={importPdfOpen}
        onOpenChange={setImportPdfOpen}
        defaultCourseId={courseFilter !== "all" ? courseFilter : undefined}
      />
      <QuestionImageDialog open={!!imageTarget} onOpenChange={(o) => !o && setImageTarget(null)} question={imageTarget} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this question?"
        description="This will remove it from the question bank and from any quizzes using it."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteQuestion.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
