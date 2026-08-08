# Cloud-Based Quiz Management System — Frontend

React 19 + TypeScript + Vite frontend for the Quiz Management System, styled as a minimal, professional university portal (white / slate / blue), inspired by VTOP, Moodle, Canvas, and Google Classroom.

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router DOM · TanStack Query · Axios · React Hook Form + Zod · shadcn-style components (Radix primitives) · Lucide React · Framer Motion (minimal use)

No Redux — global state is TanStack Query (server state) plus two small Context providers (`AuthContext`, `ToastContext`).

## Project Structure

```
src/
  app/            NotFoundPage, UnauthorizedPage
  components/
    common/       SearchBar, ConfirmDialog, FileUpload, EmptyState, ErrorState, PageHeader, Breadcrumb
    ui/           Button, Input, Textarea, Label, Card, Badge, Avatar, Dialog, Select, Table, Pagination, Spinner, Skeleton
    forms/        FormField (label + input + error wrapper)
    layout/       Sidebar, Topbar, DropdownSimple
  features/
    auth/         LoginPage (role toggle), ForgotPasswordPage (placeholder)
    courses/      CoursesPage, CourseDetailPage, CourseFormDialog, EnrollStudentDialog
    questions/    QuestionBankPage, QuestionFormDialog, QuestionImageDialog
    quizzes/      QuizzesPage, CreateQuizPage, QuizDetailPage, AssignQuestionsDialog,
                  AvailableQuizzesPage, TakeQuizPage (exam interface), QuizTimer, QuestionPalette
    results/      QuizResultsPage (faculty), StudentResultsPage, ResultDetailPage
    faculty/      FacultyDashboardPage
    students/     StudentDashboardPage, StudentProfilePage
  hooks/          useCourses, useQuestions, useQuizzes, useStudentQuiz, useResults, useDebounce
  layouts/        AuthLayout, FacultyLayout, StudentLayout
  lib/            axios instance (interceptors), cn/date/duration utils
  routes/         ProtectedRoute (role guard), PublicOnlyRoute
  services/       auth, course, question, quiz, studentQuiz, result — the only files that call axios
  context/        AuthContext, ToastContext
  types/          shared TypeScript interfaces matching the backend API
  constants/      route paths, status label maps
  utils/          localStorage helpers (token/user)
  App.tsx, main.tsx
```

## Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api/v1` |

## Running the Project

```bash
npm install
npm run dev       # http://localhost:5173
```

Make sure the backend (see the backend README) is running and `VITE_API_BASE_URL` points to it. Use the seeded demo accounts (`faculty@example.com` / `student@example.com`, password `Password123!`) to log in.

## Build

```bash
npm run build      # tsc -b && vite build -> dist/
npm run preview    # preview the production build locally
```

This project was verified to type-check and build cleanly (`npm run build`) in this environment.

## Authentication

- Faculty and student login share one `/login` screen with a role toggle.
- JWT is stored in `localStorage` and attached as `Authorization: Bearer <token>` via an Axios request interceptor.
- A response interceptor auto-logs-out (clears session, redirects to `/login`) on any `401`.
- `ProtectedRoute` gates faculty/student routes by role; `PublicOnlyRoute` redirects already-logged-in users away from `/login`.

## Routing

| Path | Access | Page |
|---|---|---|
| `/login` | public | Login (role toggle) |
| `/forgot-password` | public | Placeholder |
| `/unauthorized` | any | Wrong-role access |
| `/faculty` | faculty | Dashboard |
| `/faculty/courses`, `/faculty/courses/:id` | faculty | Course list / detail + enrollment |
| `/faculty/questions` | faculty | Question bank |
| `/faculty/quizzes`, `/new`, `/:id`, `/:id/results` | faculty | Quiz list, create, manage, results |
| `/student` | student | Dashboard |
| `/student/quizzes`, `/quizzes/:quizId/take` | student | Available quizzes, exam interface |
| `/student/results`, `/results/:studentQuizId` | student | Results list / detail |
| `/student/profile` | student | Profile |
| `*` | any | 404 |

## Quiz-Taking Interface

`TakeQuizPage` implements the exam experience: starts (or resumes) the attempt, shows a live countdown timer synced to the server's `remainingSeconds`, a question palette (answered/unanswered/current), previous/next navigation, per-answer auto-save with a saving/saved indicator, a flag-for-review toggle, a confirm-before-submit dialog showing how many questions are answered, and a `beforeunload` warning while the attempt is in progress. When the timer hits zero it auto-submits (`autoSubmitted: true`).

## Remaining Manual Steps

1. Point `VITE_API_BASE_URL` at your running backend.
2. If deploying separately from the backend, set the backend's `CORS_ORIGIN` to this app's deployed URL.
3. Optional: for large-scale production use, code-split heavy routes (e.g. `TakeQuizPage`) with `React.lazy` — the current single-bundle build is ~190KB gzipped, fine for a semester project but flagged by Vite's chunk-size warning.
