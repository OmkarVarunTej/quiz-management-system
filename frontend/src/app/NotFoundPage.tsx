import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/20 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">404 — Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button asChild>
        <Link to="/login">Back to login</Link>
      </Button>
    </div>
  );
}
