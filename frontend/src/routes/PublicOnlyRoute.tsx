import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageSpinner } from "@/components/ui/spinner";

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner />;

  if (isAuthenticated && user) {
    return <Navigate to={user.role === "FACULTY" ? "/faculty" : "/student"} replace />;
  }

  return <Outlet />;
}
