import { Link } from "react-router-dom";
import { MailQuestion, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";

export function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground">
          <MailQuestion className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Self-service password reset isn't available yet. Please contact your course administrator.</p>
        </div>
        <FormField label="Email address" htmlFor="email">
          <Input id="email" type="email" placeholder="you@university.edu" disabled />
        </FormField>
        <Button className="w-full" disabled>
          Send reset link
        </Button>
        <Button variant="ghost" asChild className="w-full">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
