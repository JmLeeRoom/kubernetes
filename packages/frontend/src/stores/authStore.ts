import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  groups: string[];
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  logout: () => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        login: (tokens, user) => set({ ...tokens, user, isAuthenticated: true }),
        logout: () =>
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          }),
        setTokens: (tokens) => set(tokens),
      }),
      { name: 'mlops-auth', partialize: (s) => ({ refreshToken: s.refreshToken }) }
    )
  )
);
