import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitializing: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setAuth: (accessToken, user) => set({ accessToken, user, isInitializing: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ accessToken: null, user: null, isInitializing: false }),
  setInitialized: () => set({ isInitializing: false }),
}));
