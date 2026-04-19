import api from "../lib/axios";
import type { AuthResponse, User } from "@jewelry/shared";

export const authApi = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ ok: boolean }>("/auth/password", { currentPassword, newPassword }).then((r) => r.data),
};
