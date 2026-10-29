// register(body), login(body), me.

import api from "./client";
import type { LoginBody, RegisterBody, AuthResponse } from "@/types/api";
import type { CurrentUser } from "@/types/models";

export const loginUser = async (body: LoginBody) => {
  const res = await api.post<AuthResponse>("/auth/login", body);
  return res.data;
};

export const registerUser = async (body: RegisterBody) => {
  const res = await api.post<AuthResponse>("/auth/register", body);
  return res.data;
};

export const me = async () => {
  const res = await api.get<CurrentUser>("/auth/me");
  return res.data;
};
