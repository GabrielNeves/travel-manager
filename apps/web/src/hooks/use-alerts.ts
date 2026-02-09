import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export interface FlightAlertResponse {
  id: string;
  userId: string;
  departureCity: string;
  departureAirportCode: string | null;
  destinationCity: string;
  destinationAirportCode: string | null;
  tripType: string;
  departureDate: string;
  departureDateEnd: string | null;
  departureDayShift: string[];
  returnDate: string | null;
  returnDateEnd: string | null;
  returnDayShift: string[];
  priceThreshold: number;
  airlines: string[];
  maxFlightDuration: number | null;
  checkFrequency: string;
  status: string;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
  lowestPrice: number | null;
  lowestPriceAirline: string | null;
  lowestPriceFlightNumber: string | null;
  lowestPriceDepartureTime: string | null;
  priceRecordCount: number;
}

export interface CreateAlertInput {
  departureCity: string;
  departureAirportCode: string;
  destinationCity: string;
  destinationAirportCode: string;
  tripType: string;
  departureDate: string;
  departureDateEnd?: string;
  departureDayShift: string[];
  returnDate?: string;
  returnDateEnd?: string;
  returnDayShift?: string[];
  priceThreshold: number;
  airlines?: string[];
  maxFlightDuration?: number;
  checkFrequency?: string;
}

export function useAlerts(status?: string) {
  const params = status ? `?status=${status}` : '';

  return useQuery({
    queryKey: ['alerts', status],
    queryFn: () => apiClient<FlightAlertResponse[]>(`/alerts${params}`),
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => apiClient<FlightAlertResponse>(`/alerts/${id}`),
    enabled: !!id,
  });
}

export interface UpdateAlertInput {
  departureCity?: string;
  departureAirportCode?: string;
  destinationCity?: string;
  destinationAirportCode?: string;
  tripType?: string;
  departureDate?: string;
  departureDateEnd?: string | null;
  departureDayShift?: string[];
  returnDate?: string | null;
  returnDateEnd?: string | null;
  returnDayShift?: string[];
  priceThreshold?: number;
  airlines?: string[];
  maxFlightDuration?: number | null;
  checkFrequency?: string;
}

export function useCreateAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAlertInput) =>
      apiClient<FlightAlertResponse>('/alerts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created successfully');
    },
    onError: () => {
      toast.error('Failed to create alert');
    },
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertInput }) =>
      apiClient<FlightAlertResponse>(`/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['alerts', data.id], data);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated successfully');
    },
    onError: () => {
      toast.error('Failed to update alert');
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted');
    },
    onError: () => {
      toast.error('Failed to delete alert');
    },
  });
}

export function usePauseAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<FlightAlertResponse>(`/alerts/${id}/pause`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      qc.setQueryData(['alerts', data.id], data);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert paused');
    },
    onError: () => {
      toast.error('Failed to pause alert');
    },
  });
}

export function useResumeAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<FlightAlertResponse>(`/alerts/${id}/resume`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      qc.setQueryData(['alerts', data.id], data);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert resumed');
    },
    onError: () => {
      toast.error('Failed to resume alert');
    },
  });
}
