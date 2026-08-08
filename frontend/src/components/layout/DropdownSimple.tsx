import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function DropdownSimple({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <div
        className={cn(
          "absolute right-0 z-40 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-border bg-card shadow-lg transition-all",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div onClick={() => setOpen(false)}>{children}</div>
      </div>
    </div>
  );
}
