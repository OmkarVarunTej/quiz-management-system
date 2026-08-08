export const Role = {
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];
