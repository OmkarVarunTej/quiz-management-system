import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";

interface QuizTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export function QuizTimer({ initialSeconds, onExpire }: QuizTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds > 0]);

  const isLow = seconds <= 60;
  const isMedium = seconds <= 300 && !isLow;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold tabular-nums",
        isLow
          ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
          : isMedium
          ? "border-warning/40 bg-warning/10 text-warning-foreground"
          : "border-border bg-secondary text-foreground"
      )}
      role="timer"
      aria-live="polite"
    >
      <Timer className="h-4 w-4" />
      {formatDuration(seconds)}
    </div>
  );
}
