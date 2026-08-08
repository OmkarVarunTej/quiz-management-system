export const Messages = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid email or password",
    UNAUTHORIZED: "You must be logged in to access this resource",
    FORBIDDEN: "You do not have permission to perform this action",
    TOKEN_MISSING: "Authorization token is missing",
    TOKEN_INVALID: "Authorization token is invalid or expired",
    EMAIL_TAKEN: "An account with this email already exists",
    REGNO_TAKEN: "An account with this registration number already exists",
  },
  GENERIC: {
    NOT_FOUND: (entity: string) => `${entity} not found`,
    CREATED: (entity: string) => `${entity} created successfully`,
    UPDATED: (entity: string) => `${entity} updated successfully`,
    DELETED: (entity: string) => `${entity} deleted successfully`,
    FETCHED: (entity: string) => `${entity} fetched successfully`,
  },
  QUIZ: {
    NOT_PUBLISHED: "Quiz is not published yet",
    NOT_ACTIVE: "Quiz is not currently active",
    ALREADY_SUBMITTED: "You have already submitted this quiz",
    NOT_STARTED_YET: "You have not started this quiz",
    RESULTS_NOT_PUBLISHED: "Results for this quiz have not been published yet",
  },
} as const;
