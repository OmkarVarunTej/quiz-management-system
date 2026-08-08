import { cn } from "@/lib/utils";

export function BadgeDot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", className)} />;
}
