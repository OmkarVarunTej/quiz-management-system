import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, BookOpen, HelpCircle, ClipboardList, GraduationCap } from "lucide-react";
import { Sidebar, NavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/faculty", icon: LayoutDashboard, end: true },
  { label: "Courses", to: "/faculty/courses", icon: BookOpen },
  { label: "Question Bank", to: "/faculty/questions", icon: HelpCircle },
  { label: "Quizzes", to: "/faculty/quizzes", icon: ClipboardList },
];

export function FacultyLayout() {
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
            <span className="text-sm font-bold">QMS Faculty</span>
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
