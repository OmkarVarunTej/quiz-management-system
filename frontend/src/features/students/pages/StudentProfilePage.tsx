import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import { Mail, Hash, GraduationCap } from "lucide-react";

export function StudentProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />
      <Card className="max-w-lg">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-foreground">{user.name}</p>
              <Badge variant="secondary" className="mt-1">
                <GraduationCap className="mr-1 h-3 w-3" /> Student
              </Badge>
            </div>
          </div>
          <dl className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium text-foreground">{user.email}</dd>
              </div>
            </div>
            {user.regNo && (
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Registration number</dt>
                  <dd className="font-mono text-sm font-medium text-foreground">{user.regNo}</dd>
                </div>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
