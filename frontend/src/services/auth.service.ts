import { api } from "@/lib/axios";
import { ApiSuccess, AuthUser, Role } from "@/types";

interface LoginResponse {
  faculty?: { id: string; name: string; email: string };
  student?: { id: string; name: string; regNo: string; email: string };
  token: string;
}

function toAuthUser(res: LoginResponse, role: Role): AuthUser {
  const entity = res.faculty || res.student!;
  return { id: entity.id, name: entity.name, email: entity.email, role, regNo: (entity as any).regNo };
}

export const authService = {
  async facultyLogin(email: string, password: string) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/faculty/login", { email, password });
    return { token: data.data.token, user: toAuthUser(data.data, "FACULTY") };
  },
  async facultyRegister(name: string, email: string, password: string) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/faculty/register", { name, email, password });
    return { token: data.data.token, user: toAuthUser(data.data, "FACULTY") };
  },
  async studentLogin(email: string, password: string) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/student/login", { email, password });
    return { token: data.data.token, user: toAuthUser(data.data, "STUDENT") };
  },
  async studentRegister(name: string, regNo: string, email: string, password: string) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/student/register", {
      name,
      regNo,
      email,
      password,
    });
    return { token: data.data.token, user: toAuthUser(data.data, "STUDENT") };
  },
  async me() {
    const { data } = await api.get<ApiSuccess<AuthUser>>("/auth/me");
    return data.data;
  },
};
