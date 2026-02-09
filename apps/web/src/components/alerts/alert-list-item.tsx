import { format } from 'date-fns';
import { Plane, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type FlightAlertResponse } from '@/hooks/use-alerts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AlertListItemProps {
  alert: FlightAlertResponse;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertListItem({ alert, isSelected, onClick }: AlertListItemProps) {
  const isRoundTrip = alert.tripType === 'ROUND_TRIP';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-md border transition-colors hover:bg-muted/50',
        isSelected && 'bg-accent border-primary/30',
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Plane className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">
          {alert.departureAirportCode}
        </span>
        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">
          {alert.destinationAirportCode}
        </span>
        <Badge
          variant={isRoundTrip ? 'default' : 'secondary'}
          className="text-[10px] px-1.5 py-0 shrink-0"
        >
          {isRoundTrip ? 'RT' : 'OW'}
        </Badge>
        <Badge
          variant={alert.status === 'ACTIVE' ? 'default' : 'outline'}
          className="text-[10px] px-1.5 py-0 shrink-0 ml-auto"
        >
          {alert.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {format(new Date(alert.departureDate), 'MMM d')}
          {alert.returnDate && (
            <> - {format(new Date(alert.returnDate), 'MMM d')}</>
          )}
        </span>
        <span className="ml-auto font-medium text-foreground">
          {formatCurrency(alert.priceThreshold)}
        </span>
      </div>

      {alert.lowestPrice != null && (
        <div className="text-xs mt-1">
          <span className={alert.lowestPrice <= alert.priceThreshold ? 'text-green-600' : 'text-muted-foreground'}>
            Lowest: {formatCurrency(alert.lowestPrice)}
          </span>
        </div>
      )}
    </button>
  );
}
