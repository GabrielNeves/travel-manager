import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';

export interface AirportResult {
  name: string;
  iataCode: string;
  cityName: string;
  countryCode: string;
}

export function useAirportSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['airports', debouncedQuery],
    queryFn: () =>
      apiClient<AirportResult[]>(
        `/airports/search?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
