import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";

import { AuthLayout } from "@/layouts/AuthLayout";
import { FacultyLayout } from "@/layouts/FacultyLayout";
import { StudentLayout } from "@/layouts/StudentLayout";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";

import { FacultyDashboardPage } from "@/features/faculty/pages/FacultyDashboardPage";
import { CoursesPage } from "@/features/courses/pages/CoursesPage";
import { CourseDetailPage } from "@/features/courses/pages/CourseDetailPage";
import { QuestionBankPage } from "@/features/questions/pages/QuestionBankPage";
import { QuizzesPage } from "@/features/quizzes/pages/QuizzesPage";
import { CreateQuizPage } from "@/features/quizzes/pages/CreateQuizPage";
import { QuizDetailPage } from "@/features/quizzes/pages/QuizDetailPage";
import { QuizResultsPage } from "@/features/results/pages/QuizResultsPage";

import { StudentDashboardPage } from "@/features/students/pages/StudentDashboardPage";
import { AvailableQuizzesPage } from "@/features/quizzes/pages/AvailableQuizzesPage";
import { TakeQuizPage } from "@/features/quizzes/pages/TakeQuizPage";
import { StudentResultsPage } from "@/features/results/pages/StudentResultsPage";
import { ResultDetailPage } from "@/features/results/pages/ResultDetailPage";
import { StudentProfilePage } from "@/features/students/pages/StudentProfilePage";

import { NotFoundPage } from "@/app/NotFoundPage";
import { UnauthorizedPage } from "@/app/UnauthorizedPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public routes */}
              <Route element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>
              </Route>

              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Faculty routes */}
              <Route element={<ProtectedRoute allowedRoles={["FACULTY"]} />}>
                <Route element={<FacultyLayout />}>
                  <Route path="/faculty" element={<FacultyDashboardPage />} />
                  <Route path="/faculty/courses" element={<CoursesPage />} />
                  <Route path="/faculty/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/faculty/questions" element={<QuestionBankPage />} />
                  <Route path="/faculty/quizzes" element={<QuizzesPage />} />
                  <Route path="/faculty/quizzes/new" element={<CreateQuizPage />} />
                  <Route path="/faculty/quizzes/:id" element={<QuizDetailPage />} />
                  <Route path="/faculty/quizzes/:id/results" element={<QuizResultsPage />} />
                </Route>
              </Route>

              {/* Student routes */}
              <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student" element={<StudentDashboardPage />} />
                  <Route path="/student/quizzes" element={<AvailableQuizzesPage />} />
                  <Route path="/student/results" element={<StudentResultsPage />} />
                  <Route path="/student/results/:studentQuizId" element={<ResultDetailPage />} />
                  <Route path="/student/profile" element={<StudentProfilePage />} />
                </Route>
                {/* Quiz-taking uses its own focused layout (no sidebar) */}
                <Route path="/student/quizzes/:quizId/take" element={<TakeQuizPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
