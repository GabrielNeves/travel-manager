import { useState } from 'react';
import { format } from 'date-fns';
import {
  Pause,
  Play,
  Trash2,
  Pencil,
  Plane,
  ArrowRight,
  Clock,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useAlert,
  useDeleteAlert,
  usePauseAlert,
  useResumeAlert,
} from '@/hooks/use-alerts';
import { formatCurrency } from '@/lib/utils';
import { PriceHistoryChart } from './price-history-chart';

const FREQUENCY_LABELS: Record<string, string> = {
  HOURS_1: 'Every 1 hour',
  HOURS_3: 'Every 3 hours',
  HOURS_6: 'Every 6 hours',
  HOURS_12: 'Every 12 hours',
  HOURS_24: 'Every 24 hours',
};

const DAY_SHIFT_LABELS: Record<string, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  NIGHT: 'Night',
};

interface AlertDetailPanelProps {
  alertId: string;
  onDelete: () => void;
  onEdit: () => void;
}

export function AlertDetailPanel({ alertId, onDelete, onEdit }: AlertDetailPanelProps) {
  const { data: alert, isLoading } = useAlert(alertId);
  const deleteAlert = useDeleteAlert();
  const pauseAlert = usePauseAlert();
  const resumeAlert = useResumeAlert();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 p-1 pt-[60px]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Alert not found</p>
      </div>
    );
  }

  const isRoundTrip = alert.tripType === 'ROUND_TRIP';
  const isActive = alert.status === 'ACTIVE';

  const handleDelete = async () => {
    await deleteAlert.mutateAsync(alert.id);
    setDeleteOpen(false);
    onDelete();
  };

  const handleToggleStatus = async () => {
    if (isActive) {
      await pauseAlert.mutateAsync(alert.id);
    } else {
      await resumeAlert.mutateAsync(alert.id);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-4 p-1 pt-[60px]">
        {/* Actions bar */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={pauseAlert.isPending || resumeAlert.isPending}
          >
            {isActive ? (
              <>
                <Pause className="mr-2 size-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Resume
              </>
            )}
          </Button>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Alert</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this alert? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteAlert.isPending}
                >
                  {deleteAlert.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Route info */}
        <Card className="-mt-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plane className="size-5" />
              <CardTitle className="text-base">Route</CardTitle>
              <Badge
                variant={isRoundTrip ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isRoundTrip ? 'Round Trip' : 'One Way'}
              </Badge>
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className="text-xs"
              >
                {alert.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-3 text-lg">
              <span className="font-semibold">
                {alert.departureCity} ({alert.departureAirportCode})
              </span>
              <ArrowRight className="size-5 text-muted-foreground" />
              <span className="font-semibold">
                {alert.destinationCity} ({alert.destinationAirportCode})
              </span>
            </div>

            {alert.airlines.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Airlines: {alert.airlines.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              <CardTitle className="text-base">Dates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Departure</p>
                <p className="font-medium">
                  {format(new Date(alert.departureDate), 'MMM d, yyyy')}
                  {alert.departureDateEnd && (
                    <> - {format(new Date(alert.departureDateEnd), 'MMM d, yyyy')}</>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {alert.departureDayShift.map((s) => DAY_SHIFT_LABELS[s] ?? s).join(', ')}
                </p>
              </div>

              {isRoundTrip && alert.returnDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {format(new Date(alert.returnDate), 'MMM d, yyyy')}
                    {alert.returnDateEnd && (
                      <> - {format(new Date(alert.returnDateEnd), 'MMM d, yyyy')}</>
                    )}
                  </p>
                  {alert.returnDayShift.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {alert.returnDayShift.map((s) => DAY_SHIFT_LABELS[s] ?? s).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price & Monitoring */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5" />
              <CardTitle className="text-base">Price Monitoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price Threshold</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(alert.priceThreshold)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Lowest Found</p>
                {alert.lowestPrice != null ? (
                  <>
                    <p
                      className={`text-xl font-semibold ${alert.lowestPrice <= alert.priceThreshold ? 'text-green-600' : ''}`}
                    >
                      {formatCurrency(alert.lowestPrice)}
                    </p>
                    {alert.lowestPriceAirline && (
                      <p className="text-sm text-muted-foreground">
                        {alert.lowestPriceAirline}
                        {alert.lowestPriceFlightNumber && ` ${alert.lowestPriceFlightNumber}`}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xl text-muted-foreground">-</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                {FREQUENCY_LABELS[alert.checkFrequency] ?? alert.checkFrequency}
              </div>

              {alert.maxFlightDuration && (
                <div className="text-sm text-muted-foreground">
                  Max duration: {alert.maxFlightDuration} min
                </div>
              )}
            </div>

            {alert.lastCheckedAt && (
              <p className="text-sm text-muted-foreground">
                Last checked: {format(new Date(alert.lastCheckedAt), 'MMM d, yyyy HH:mm')}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {alert.priceRecordCount} price records found
            </p>
          </CardContent>
        </Card>

        <PriceHistoryChart alertId={alert.id} threshold={alert.priceThreshold} />
      </div>
    </ScrollArea>
  );
}
