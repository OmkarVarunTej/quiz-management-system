# Cloud-Based Quiz Management System — Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL (Supabase) backend for a semester Cloud Computing project.

## Tech Stack

- **Runtime:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL via Supabase, accessed through Prisma ORM
- **Auth:** JWT (Bearer tokens, no cookies) + bcrypt password hashing
- **Validation:** Zod (body/params/query)
- **Storage:** Supabase Storage (question images), via `multer` memory storage + `@supabase/supabase-js`
- **Security/Ops:** Helmet, CORS, express-rate-limit, Morgan logging
- **Deployment target:** Render

## Project Structure

```
src/
  config/        env.ts (Zod-validated environment)
  constants/     roles, http-status codes, message strings
  controllers/   thin HTTP layer — calls services, shapes responses
  interfaces/    shared TS interfaces
  lib/           prisma client, supabase client (singletons)
  middlewares/   auth, role/authorize, validate, error handler, rate limiter, upload, 404
  routes/        Express routers per module
  services/      all business logic + Prisma calls
  types/         Express request augmentation (req.user)
  utils/         ApiError, ApiResponse, asyncHandler, jwt, password hashing, seeded shuffle
  validators/    Zod schemas per module
  app.ts         Express app assembly (middleware pipeline)
  server.ts      HTTP server bootstrap + graceful shutdown
prisma/
  schema.prisma  Full data model
  migrations/    SQL migration history
  seed.ts        Demo data seed script
```

## Database Schema

Entities: **Faculty, Student, Course, Quiz, Question, Option, QuizQuestion, StudentQuiz, StudentAnswer, Result** — plus an implicit `Course <-> Student` many-to-many enrollment table.

Enums: `QuizStatus (DRAFT/PUBLISHED/CLOSED)`, `StudentQuizStatus (NOT_STARTED/IN_PROGRESS/SUBMITTED/AUTO_SUBMITTED)`, `AnswerStatus (CORRECT/WRONG/SKIPPED)`.

All foreign keys cascade on delete except `StudentAnswer.selectedOptionId`, which sets NULL if an option is removed. Unique constraints prevent duplicate emails/regNos/course codes, duplicate question-in-quiz entries, and duplicate quiz attempts per student.

**The schema has already been applied to your live Supabase project** (`quiz-management-system`, project ref `zqnlpbsqcdzxbwvwuueq`, region `ap-south-1`) using the Supabase connector — all 11 tables exist and are verified. A `question-images` public storage bucket was also created.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Supabase **pooled** connection string (port 6543, `pgbouncer=true`) |
| `DIRECT_URL` | Supabase **direct** connection string (port 5432) — required for migrations |
| `SUPABASE_URL` | `https://zqnlpbsqcdzxbwvwuueq.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard → Project Settings → API. **Not exposed by the MCP connector for security — copy it yourself.** |
| `JWT_SECRET` | Any long random string |

Get your DB password and connection strings from: Supabase Dashboard → Project Settings → Database.

## Running Locally

```bash
npm install
cp .env.example .env   # then fill in real values
npx prisma generate

# The schema is already live in Supabase, so you do NOT need to run
# `prisma migrate dev` again. To keep Prisma's local migration history
# in sync with what's already in the database, run:
npx prisma migrate resolve --applied 20260806000000_init_quiz_management_schema

npm run dev             # starts on http://localhost:5000
```

Seed demo data (1 faculty, 1 student, 1 course, 1 quiz):
```bash
npm run prisma:seed
```
Demo login: `faculty@example.com` / `student@example.com`, password `Password123!`.

## Migration Commands

```bash
npm run prisma:migrate          # create + apply a new migration (dev)
npm run prisma:migrate:deploy   # apply pending migrations (prod/CI)
npm run prisma:studio           # visual DB browser
```

## API Overview

Base path: `/api/v1`

### Auth (`/auth`)
- `POST /auth/faculty/register`, `POST /auth/faculty/login`
- `POST /auth/student/register`, `POST /auth/student/login`
- `GET /auth/me` (any authenticated user)

### Courses (`/courses`) — Faculty create/update/delete; both roles can list/view
- `POST /courses` · `GET /courses` · `GET /courses/:id` · `PATCH /courses/:id` · `DELETE /courses/:id`
- `GET /courses/:id/students` · `POST /courses/:id/students` (enroll by regNo) · `DELETE /courses/:id/students/:studentId`

### Question Bank (`/questions`) — Faculty only
- `POST /questions` · `GET /questions?courseId=` · `GET /questions/:id` · `PATCH /questions/:id` · `DELETE /questions/:id`
- `POST /questions/:id/image` (multipart `image` field → uploaded to Supabase Storage)

### Quizzes (`/quizzes`) — Faculty create/manage; students see published quizzes for their courses
- `POST /quizzes` · `GET /quizzes` · `GET /quizzes/:id` · `PATCH /quizzes/:id` · `DELETE /quizzes/:id`
- `POST /quizzes/:id/questions` (assign, sets order + recomputes total marks) · `DELETE /quizzes/:id/questions/:questionId`
- `POST /quizzes/:id/publish` · `POST /quizzes/:id/close`

### Student Quiz Taking (`/student-quizzes`) — Student only
- `GET /student-quizzes/available`
- `POST /student-quizzes/:quizId/start` (generates per-student randomized question + option order, seeded so refresh is stable)
- `GET /student-quizzes/:quizId/session` (current questions in randomized order + remaining time + saved answers)
- `PATCH /student-quizzes/:quizId/answer` (auto-save one answer)
- `POST /student-quizzes/:quizId/submit` (`{ autoSubmitted: boolean }` — auto-evaluates, creates unpublished `Result`)

### Results (`/results`)
- Faculty: `POST /results/quiz/:quizId/publish` · `GET /results/quiz/:quizId?regNo=&sort=asc|desc`
- Student: `GET /results/my` (published only) · `GET /results/:studentQuizId` (marks + correct answers, only if published)

All responses follow `{ success, message, data }` (or `{ success: false, message, errors }` on failure).

## Business Rules Implemented

- Quizzes can only be edited/have questions assigned while in `DRAFT`; publishing requires ≥1 question.
- A student can only start a quiz they're enrolled in, that is `PUBLISHED`, and within its `startTime`/`endTime` window (if set).
- Question order and each question's option order are randomized **per student** using a deterministic seeded shuffle (`studentId:quizId` / `studentId:quizId:questionId`), so a page refresh mid-quiz shows the same order rather than reshuffling.
- Submission (manual or auto, via the `autoSubmitted` flag) evaluates every answer, computes correct/wrong/skipped counts and marks, and writes an unpublished `Result`.
- Students cannot see any result (marks or correct answers) until faculty explicitly publishes results for that quiz.
- Faculty can search/sort published-or-not results by student registration number.

## Security Note

⚠️ Row Level Security (RLS) is **disabled** on all 11 tables. This is safe as long as the backend only ever connects with the Prisma `DATABASE_URL` (a direct Postgres connection using your database password, not the Supabase client). If you ever call these tables from a browser using the `anon`/publishable key, enable RLS with appropriate policies first — otherwise any client could read/write every row.

## Remaining Manual Steps

1. Get your Supabase database password (Dashboard → Project Settings → Database) and the service role key (Dashboard → Project Settings → API), and fill them into `.env`.
2. Run `npx prisma generate` (requires normal internet access — this was built in a sandboxed environment that couldn't reach Prisma's binary CDN, so it hasn't been generated/compiled here).
3. Run the `prisma migrate resolve --applied ...` command above once, so your local migration history matches the already-applied schema.
4. Deploy to Render: set the same environment variables there, build command `npm install && npm run build`, start command `npm start`.
