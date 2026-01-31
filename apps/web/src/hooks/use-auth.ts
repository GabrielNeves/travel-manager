import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient, type AuthResponse, type MeResponse } from '@/lib/api-client';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const { user, isInitializing, clearAuth } = useAuthStore();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) =>
      apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    onSuccess: () => {
      clearAuth();
      qc.removeQueries({ queryKey: ['auth', 'me'] });
    },
    onError: () => {
      clearAuth();
      qc.removeQueries({ queryKey: ['auth', 'me'] });
    },
  });

  return {
    user,
    isInitializing,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

export async function initAuth(): Promise<void> {
  const store = useAuthStore.getState();

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      store.setInitialized();
      return;
    }

    const { accessToken } = (await res.json()) as { accessToken: string };
    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      store.setInitialized();
      return;
    }

    const user = (await meRes.json()) as MeResponse;
    store.setAuth(accessToken, {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    });
  } catch {
    store.setInitialized();
  }
}
