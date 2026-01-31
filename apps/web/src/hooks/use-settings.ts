import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, type MeResponse } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

// ---- Settings (UserSettings model) ----

export interface UserSettings {
  notifyInApp: boolean;
  notifyWhatsApp: boolean;
  notifyPush: boolean;
  notifyOnHistoricalLow: boolean;
  defaultCheckFrequency: string;
}

export function useSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient<UserSettings>('/settings'),
  });

  const mutation = useMutation({
    mutationFn: (input: Partial<UserSettings>) =>
      apiClient<UserSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data);
      toast.success('Settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

// ---- Profile (User model) ----

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  language?: string;
  country?: string;
  timezone?: string;
}

export function useProfile() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient<MeResponse>('/auth/me'),
  });

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiClient<MeResponse>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data);
      // Update Zustand store so sidebar reflects name change immediately
      const store = useAuthStore.getState();
      if (store.user) {
        store.setAuth(store.accessToken!, {
          ...store.user,
          name: data.name,
        });
      }
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
