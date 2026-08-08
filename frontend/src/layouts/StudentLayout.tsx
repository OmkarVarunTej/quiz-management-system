import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, Award, User, GraduationCap } from "lucide-react";
import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, end: true },
  { label: "Available Quizzes", to: "/student/quizzes", icon: ClipboardCheck },
  { label: "Results", to: "/student/results", icon: Award },
  { label: "Profile", to: "/student/profile", icon: User },
];

export function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <Sidebar
        items={navItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={
          <div className="flex items-center gap-2 text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">QMS Student</span>
          </div>
        }
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
