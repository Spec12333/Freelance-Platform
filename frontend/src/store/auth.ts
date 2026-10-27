// Zustand store: user, token, login(), logout(); persisted to localStorage.

import { CurrentUser } from "@/types/models";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  user: CurrentUser | null;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "Auth",
    },
  ),
);
