import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PriceRecordResponse {
  id: string;
  alertId: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string | null;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  bookingLink: string | null;
  checkedAt: string;
}

interface PriceHistoryResponse {
  records: PriceRecordResponse[];
  total: number;
}

export type PriceSort = 'recent' | 'cheapest';

export function usePriceHistory(
  alertId: string,
  sort: PriceSort = 'recent',
  limit = 50,
  offset = 0,
) {
  return useQuery({
    queryKey: ['alerts', alertId, 'prices', { sort, limit, offset }],
    queryFn: () =>
      apiClient<PriceHistoryResponse>(
        `/alerts/${alertId}/prices?sort=${sort}&limit=${limit}&offset=${offset}`,
      ),
    enabled: !!alertId,
  });
}

export interface DailyPricePoint {
  date: string;
  lowestPrice: number;
}

interface DailyPricesResponse {
  points: DailyPricePoint[];
}

export function useDailyPrices(alertId: string) {
  return useQuery({
    queryKey: ['alerts', alertId, 'prices', 'daily'],
    queryFn: () =>
      apiClient<DailyPricesResponse>(`/alerts/${alertId}/prices/daily`),
    enabled: !!alertId,
  });
}
