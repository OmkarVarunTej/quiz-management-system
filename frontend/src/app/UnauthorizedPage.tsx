import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const homePath = user?.role === "FACULTY" ? "/faculty" : "/student";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/20 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        You don't have permission to view this page with your current role.
      </p>
      <div className="flex gap-3">
        {user ? (
          <Button asChild>
            <Link to={homePath}>Go to my dashboard</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Back to login</Link>
          </Button>
        )}
        {user && (
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        )}
      </div>
    </div>
  );
}
