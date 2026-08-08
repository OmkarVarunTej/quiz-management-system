import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { Role } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [role, setRole] = useState<Role>("STUDENT");
  const { facultyLogin, studentLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      if (role === "FACULTY") {
        await facultyLogin(values.email, values.password);
      } else {
        await studentLogin(values.email, values.password);
      }
      toast({ title: "Welcome back!", variant: "success" });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || (role === "FACULTY" ? "/faculty" : "/student"), { replace: true });
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Choose your role and enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary p-1">
          <button
            type="button"
            onClick={() => setRole("STUDENT")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
              role === "STUDENT" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4" /> Student
          </button>
          <button
            type="button"
            onClick={() => setRole("FACULTY")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
              role === "FACULTY" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            <GraduationCap className="h-4 w-4" /> Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" placeholder="you@university.edu" autoComplete="email" {...register("email")} error={!!errors.email} />
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} error={!!errors.password} />
          </FormField>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in as {role === "FACULTY" ? "Faculty" : "Student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
