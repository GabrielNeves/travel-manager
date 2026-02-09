import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsUpDown, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAirportSearch, type AirportResult } from '@/hooks/use-airports';
import { cn } from '@/lib/utils';

interface AirportComboboxProps {
  value: { city: string; code: string } | null;
  onSelect: (city: string, code: string) => void;
  placeholder?: string;
}

export function AirportCombobox({
  value,
  onSelect,
  placeholder = 'Select airport...',
}: AirportComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: airports, isLoading } = useAirportSearch(search);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input the moment it mounts
  const inputCallbackRef = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (airport: AirportResult) => {
    onSelect(airport.cityName, airport.iataCode);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          onClick={() => setOpen(true)}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Plane className="size-4 shrink-0" />
              {value.city} ({value.code})
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      ) : (
        <input
          ref={inputCallbackRef}
          placeholder="Search city or airport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              setSearch('');
            }
          }}
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-[240px] overflow-y-auto p-1">
            {search.length < 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            )}
            {search.length >= 2 && isLoading && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Searching...
              </p>
            )}
            {search.length >= 2 && !isLoading && (!airports || airports.length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No airports found
              </p>
            )}
            {airports && airports.length > 0 &&
              airports.map((airport) => (
                <button
                  key={`${airport.iataCode}-${airport.name}`}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  )}
                  onClick={() => handleSelect(airport)}
                >
                  <Plane className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col text-left">
                    <span>
                      {airport.name} ({airport.iataCode})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {airport.cityName}{airport.countryCode ? `, ${airport.countryCode}` : ''}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
