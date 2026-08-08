export const ROLES = {
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  UNAUTHORIZED: "/unauthorized",

  FACULTY_DASHBOARD: "/faculty",
  FACULTY_COURSES: "/faculty/courses",
  FACULTY_COURSE_DETAIL: "/faculty/courses/:id",
  FACULTY_QUESTIONS: "/faculty/questions",
  FACULTY_QUIZZES: "/faculty/quizzes",
  FACULTY_QUIZ_DETAIL: "/faculty/quizzes/:id",
  FACULTY_QUIZ_CREATE: "/faculty/quizzes/new",
  FACULTY_QUIZ_RESULTS: "/faculty/quizzes/:id/results",

  STUDENT_DASHBOARD: "/student",
  STUDENT_QUIZZES: "/student/quizzes",
  STUDENT_QUIZ_TAKE: "/student/quizzes/:quizId/take",
  STUDENT_RESULTS: "/student/results",
  STUDENT_RESULT_DETAIL: "/student/results/:studentQuizId",
  STUDENT_PROFILE: "/student/profile",
} as const;

export const QUIZ_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export const STUDENT_QUIZ_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  AUTO_SUBMITTED: "Auto-submitted",
};
