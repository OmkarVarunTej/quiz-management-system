import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-primary", className)} style={{ width: size, height: size }} />;
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}
