import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Quiz Management System</h1>
          <p className="text-sm text-muted-foreground">Cloud-based academic assessment platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
