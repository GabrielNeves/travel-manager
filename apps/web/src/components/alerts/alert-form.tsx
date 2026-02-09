import { useState, useMemo } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AirportCombobox } from './airport-combobox';
import { DatePicker } from './date-picker';
import { DayShiftSelect } from './day-shift-select';
import {
  useCreateAlert,
  useUpdateAlert,
  type FlightAlertResponse,
} from '@/hooks/use-alerts';

const FREQUENCY_OPTIONS = [
  { value: 'HOURS_1', label: 'Every 1 hour' },
  { value: 'HOURS_3', label: 'Every 3 hours' },
  { value: 'HOURS_6', label: 'Every 6 hours' },
  { value: 'HOURS_12', label: 'Every 12 hours' },
  { value: 'HOURS_24', label: 'Every 24 hours' },
];

const WARNING_FIELDS = [
  'departureCity',
  'departureAirportCode',
  'destinationCity',
  'destinationAirportCode',
  'tripType',
  'departureDate',
  'returnDate',
];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');
const dayShiftEnum = z.enum(['MORNING', 'AFTERNOON', 'NIGHT']);

const alertFormSchema = z
  .object({
    departureCity: z.string().min(1, 'Departure city is required'),
    departureAirportCode: z
      .string()
      .length(3, 'Airport code must be 3 characters')
      .toUpperCase(),
    destinationCity: z.string().min(1, 'Destination city is required'),
    destinationAirportCode: z
      .string()
      .length(3, 'Airport code must be 3 characters')
      .toUpperCase(),
    tripType: z.enum(['ONE_WAY', 'ROUND_TRIP']),
    departureDate: dateString,
    departureDateEnd: dateString.optional(),
    departureDayShift: z
      .array(dayShiftEnum)
      .min(1, 'At least one departure time preference is required'),
    returnDate: dateString.optional(),
    returnDateEnd: dateString.optional(),
    returnDayShift: z.array(dayShiftEnum).default([]),
    priceThreshold: z.number().positive('Price must be positive').max(99999999),
    airlines: z.array(z.string()).default([]),
    maxFlightDuration: z.number().int().positive().optional(),
    checkFrequency: z.enum(['HOURS_1', 'HOURS_3', 'HOURS_6', 'HOURS_12', 'HOURS_24']).default('HOURS_6'),
  })
  .superRefine((data, ctx) => {
    if (data.tripType === 'ROUND_TRIP' && !data.returnDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Return date is required for round-trip flights',
        path: ['returnDate'],
      });
    }
  });

function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseDateString(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  return new Date(datePart + 'T00:00:00');
}

interface AlertFormProps {
  mode: 'create' | 'edit';
  initialData?: FlightAlertResponse;
  onSuccess: (alert: FlightAlertResponse) => void;
  onCancel: () => void;
}

export function AlertForm({ mode, initialData, onSuccess, onCancel }: AlertFormProps) {
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const mutation = mode === 'create' ? createAlert : updateAlert;

  // Route
  const [departure, setDeparture] = useState<{ city: string; code: string } | null>(
    initialData
      ? { city: initialData.departureCity, code: initialData.departureAirportCode ?? '' }
      : null,
  );
  const [destination, setDestination] = useState<{ city: string; code: string } | null>(
    initialData
      ? { city: initialData.destinationCity, code: initialData.destinationAirportCode ?? '' }
      : null,
  );
  const [tripType, setTripType] = useState(initialData?.tripType ?? 'ONE_WAY');

  // Dates
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    initialData ? parseDateString(initialData.departureDate) : undefined,
  );
  const [flexibleDeparture, setFlexibleDeparture] = useState(!!initialData?.departureDateEnd);
  const [departureDateEnd, setDepartureDateEnd] = useState<Date | undefined>(
    initialData?.departureDateEnd ? parseDateString(initialData.departureDateEnd) : undefined,
  );
  const [departureDayShift, setDepartureDayShift] = useState<string[]>(
    initialData?.departureDayShift ?? ['MORNING'],
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    initialData?.returnDate ? parseDateString(initialData.returnDate) : undefined,
  );
  const [flexibleReturn, setFlexibleReturn] = useState(!!initialData?.returnDateEnd);
  const [returnDateEnd, setReturnDateEnd] = useState<Date | undefined>(
    initialData?.returnDateEnd ? parseDateString(initialData.returnDateEnd) : undefined,
  );
  const [returnDayShift, setReturnDayShift] = useState<string[]>(
    initialData?.returnDayShift ?? [],
  );

  // Filters
  const [priceThreshold, setPriceThreshold] = useState(
    initialData ? String(initialData.priceThreshold) : '',
  );
  const [airlines, setAirlines] = useState(
    initialData?.airlines.join(', ') ?? '',
  );
  const [maxFlightDuration, setMaxFlightDuration] = useState(
    initialData?.maxFlightDuration ? String(initialData.maxFlightDuration) : '',
  );
  const [checkFrequency, setCheckFrequency] = useState(
    initialData?.checkFrequency ?? 'HOURS_6',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Two-tier warning: detect changes to route/date/tripType fields in edit mode
  const hasWarningChanges = useMemo(() => {
    if (mode !== 'edit' || !initialData) return false;

    const currentDepartureDate = departureDate ? formatDateForApi(departureDate) : '';
    const currentReturnDate = returnDate ? formatDateForApi(returnDate) : '';

    const changes: Record<string, boolean> = {
      departureCity: departure?.city !== initialData.departureCity,
      departureAirportCode: departure?.code !== (initialData.departureAirportCode ?? ''),
      destinationCity: destination?.city !== initialData.destinationCity,
      destinationAirportCode: destination?.code !== (initialData.destinationAirportCode ?? ''),
      tripType: tripType !== initialData.tripType,
      departureDate: currentDepartureDate !== initialData.departureDate.split('T')[0],
      returnDate: currentReturnDate !== (initialData.returnDate?.split('T')[0] ?? ''),
    };

    return WARNING_FIELDS.some((field) => changes[field]);
  }, [mode, initialData, departure, destination, tripType, departureDate, returnDate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const data = {
      departureCity: departure?.city ?? '',
      departureAirportCode: departure?.code ?? '',
      destinationCity: destination?.city ?? '',
      destinationAirportCode: destination?.code ?? '',
      tripType,
      departureDate: departureDate ? formatDateForApi(departureDate) : '',
      ...(flexibleDeparture && departureDateEnd
        ? { departureDateEnd: formatDateForApi(departureDateEnd) }
        : {}),
      departureDayShift,
      ...(tripType === 'ROUND_TRIP' && returnDate
        ? { returnDate: formatDateForApi(returnDate) }
        : {}),
      ...(tripType === 'ROUND_TRIP' && flexibleReturn && returnDateEnd
        ? { returnDateEnd: formatDateForApi(returnDateEnd) }
        : {}),
      returnDayShift: tripType === 'ROUND_TRIP' ? returnDayShift : [],
      priceThreshold: priceThreshold ? parseFloat(priceThreshold) : 0,
      airlines: airlines
        ? airlines.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      ...(maxFlightDuration ? { maxFlightDuration: parseInt(maxFlightDuration, 10) } : {}),
      checkFrequency,
    };

    const result = alertFormSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      let response: FlightAlertResponse;
      if (mode === 'create') {
        response = await createAlert.mutateAsync(result.data);
      } else {
        response = await updateAlert.mutateAsync({
          id: initialData!.id,
          data: result.data,
        });
      }
      onSuccess(response);
    } catch {
      // Error handled by mutation's onError
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Two-tier warning banner for edit mode */}
      {hasWarningChanges && (
        <Alert className="border-yellow-500/50 text-yellow-700 [&>svg]:text-yellow-600">
          <AlertTriangle className="size-4" />
          <AlertTitle>Route or date change detected</AlertTitle>
          <AlertDescription>
            Changing the route, trip type, or travel dates means existing price
            history may no longer be relevant.
          </AlertDescription>
        </Alert>
      )}

      {/* Card 1 — Route */}
      <Card>
        <CardHeader>
          <CardTitle>Route</CardTitle>
          <CardDescription>
            Select your departure and destination airports
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Departure Airport</Label>
            <AirportCombobox
              value={departure}
              onSelect={(city, code) => setDeparture({ city, code })}
              placeholder="Search departure airport..."
            />
            {errors.departureCity && (
              <p className="text-sm text-destructive">{errors.departureCity}</p>
            )}
            {errors.departureAirportCode && (
              <p className="text-sm text-destructive">{errors.departureAirportCode}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Destination Airport</Label>
            <AirportCombobox
              value={destination}
              onSelect={(city, code) => setDestination({ city, code })}
              placeholder="Search destination airport..."
            />
            {errors.destinationCity && (
              <p className="text-sm text-destructive">{errors.destinationCity}</p>
            )}
            {errors.destinationAirportCode && (
              <p className="text-sm text-destructive">{errors.destinationAirportCode}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Trip Type</Label>
            <Select value={tripType} onValueChange={setTripType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONE_WAY">One Way</SelectItem>
                <SelectItem value="ROUND_TRIP">Round Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 — Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
          <CardDescription>
            Choose your travel dates and time preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Departure Date</Label>
            <DatePicker
              value={departureDate}
              onChange={setDepartureDate}
              placeholder="Select departure date"
              fromDate={new Date()}
            />
            {errors.departureDate && (
              <p className="text-sm text-destructive">{errors.departureDate}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="flexible-departure"
              checked={flexibleDeparture}
              onCheckedChange={setFlexibleDeparture}
            />
            <Label htmlFor="flexible-departure" className="text-sm font-normal">
              Flexible departure dates
            </Label>
          </div>

          {flexibleDeparture && (
            <div className="grid gap-2">
              <Label>Departure Date End</Label>
              <DatePicker
                value={departureDateEnd}
                onChange={setDepartureDateEnd}
                placeholder="Select end date range"
                fromDate={departureDate}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Departure Time Preference</Label>
            <DayShiftSelect
              value={departureDayShift}
              onChange={setDepartureDayShift}
            />
            {errors.departureDayShift && (
              <p className="text-sm text-destructive">{errors.departureDayShift}</p>
            )}
          </div>

          {tripType === 'ROUND_TRIP' && (
            <>
              <div className="border-t pt-4 grid gap-2">
                <Label>Return Date</Label>
                <DatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  placeholder="Select return date"
                  fromDate={departureDate}
                />
                {errors.returnDate && (
                  <p className="text-sm text-destructive">{errors.returnDate}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="flexible-return"
                  checked={flexibleReturn}
                  onCheckedChange={setFlexibleReturn}
                />
                <Label htmlFor="flexible-return" className="text-sm font-normal">
                  Flexible return dates
                </Label>
              </div>

              {flexibleReturn && (
                <div className="grid gap-2">
                  <Label>Return Date End</Label>
                  <DatePicker
                    value={returnDateEnd}
                    onChange={setReturnDateEnd}
                    placeholder="Select end date range"
                    fromDate={returnDate}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Return Time Preference</Label>
                <DayShiftSelect
                  value={returnDayShift}
                  onChange={setReturnDayShift}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 3 — Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Set your price threshold and optional filters
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price-threshold">Price Threshold (BRL)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="price-threshold"
                type="number"
                step="0.01"
                min="0"
                placeholder="350.00"
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(e.target.value)}
                className="pl-9"
              />
            </div>
            {errors.priceThreshold && (
              <p className="text-sm text-destructive">{errors.priceThreshold}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="airlines">Airlines (optional)</Label>
            <Input
              id="airlines"
              placeholder="LATAM, GOL, Azul (leave empty for any)"
              value={airlines}
              onChange={(e) => setAirlines(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max-duration">Max Flight Duration (optional)</Label>
            <div className="relative">
              <Input
                id="max-duration"
                type="number"
                min="1"
                placeholder="180"
                value={maxFlightDuration}
                onChange={(e) => setMaxFlightDuration(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                min
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Check Frequency</Label>
            <Select value={checkFrequency} onValueChange={setCheckFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending
            ? (mode === 'create' ? 'Creating...' : 'Saving...')
            : (mode === 'create' ? 'Create Alert' : 'Save Changes')}
        </Button>
      </div>
    </form>
  );
}
