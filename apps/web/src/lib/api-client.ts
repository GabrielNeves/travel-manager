import { useAuthStore } from '@/stores/auth-store';

const API_BASE = '/api';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  language: string;
  country: string | null;
  timezone: string | null;
  emailVerified: boolean;
}

export interface RefreshResponse {
  accessToken: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) return null;
  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) return null;

    const data = (await res.json()) as RefreshResponse;
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryRes.ok) {
        const text = await retryRes.text();
        throw new ApiError(retryRes.status, text);
      }
      return retryRes.json() as Promise<T>;
    }

    useAuthStore.getState().clearAuth();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
