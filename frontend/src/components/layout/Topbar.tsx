import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  DropdownSimple,
} from "@/components/layout/DropdownSimple";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <DropdownSimple
        trigger={
          <button className="flex items-center gap-2 rounded-full pr-1 hover:bg-secondary" aria-label="Account menu">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user ? getInitials(user.name) : <User className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
          </button>
        }
      >
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </DropdownSimple>
    </header>
  );
}
