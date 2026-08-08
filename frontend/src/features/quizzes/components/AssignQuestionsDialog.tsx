import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { HelpCircle } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { useAssignQuestions } from "@/hooks/useQuizzes";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Quiz } from "@/types";

export function AssignQuestionsDialog({
  open,
  onOpenChange,
  quiz,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: Quiz;
}) {
  const { data: questions, isLoading } = useQuestions(quiz.courseId);
  const assignQuestions = useAssignQuestions(quiz.id);
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (open) {
      setSelected(new Set((quiz.quizQuestions || []).map((qq) => qq.question.id)));
    }
  }, [open, quiz.quizQuestions]);

  const filtered = (questions || []).filter((q) => q.text.toLowerCase().includes(debouncedSearch.toLowerCase()));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    try {
      await assignQuestions.mutateAsync(Array.from(selected));
      toast({ title: "Questions updated", variant: "success" });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not update questions", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign questions</DialogTitle>
          <DialogDescription>Select which questions from the question bank belong to this quiz.</DialogDescription>
        </DialogHeader>

        <SearchBar value={search} onChange={setSearch} placeholder="Search questions..." />

        <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading questions...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No questions found" description="Add questions to this course's question bank first." />
          ) : (
            filtered.map((q) => (
              <label
                key={q.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  selected.has(q.id) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={selected.has(q.id)}
                  onChange={() => toggle(q.id)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{q.text}</p>
                  <p className="text-xs text-muted-foreground">{q.marks} marks · {q.options.length} options</p>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <p className="mr-auto self-center text-xs text-muted-foreground">{selected.size} selected</p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} isLoading={assignQuestions.isPending} disabled={selected.size === 0}>
            Save questions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
