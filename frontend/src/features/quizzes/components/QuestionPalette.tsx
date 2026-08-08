import { cn } from "@/lib/utils";

export type QuestionPaletteStatus = "answered" | "unanswered" | "current";

interface QuestionPaletteProps {
  count: number;
  currentIndex: number;
  isAnswered: (index: number) => boolean;
  onNavigate: (index: number) => void;
}

export function QuestionPalette({ count, currentIndex, isAnswered, onNavigate }: QuestionPaletteProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, idx) => {
          const answered = isAnswered(idx);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => onNavigate(idx)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : answered
                  ? "border-success/40 bg-success/10 text-success hover:bg-success/20"
                  : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
              aria-label={`Go to question ${idx + 1}${answered ? " (answered)" : " (unanswered)"}`}
              aria-current={isCurrent}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-success/40 bg-success/10" /> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-border bg-secondary/50" /> Not answered
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-primary bg-primary" /> Current
        </div>
      </div>
    </div>
  );
}
