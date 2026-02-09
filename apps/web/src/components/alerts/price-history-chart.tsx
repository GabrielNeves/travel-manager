import { format } from 'date-fns';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyPrices } from '@/hooks/use-prices';
import { formatCurrency } from '@/lib/utils';

function formatAxisPrice(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return `R$ ${Math.round(value)}`;
}

function formatTickDate(dateStr: string): string {
  return format(new Date(dateStr + 'T12:00:00'), 'MMM d');
}

interface PriceHistoryChartProps {
  alertId: string;
  threshold: number;
}

export function PriceHistoryChart({
  alertId,
  threshold,
}: PriceHistoryChartProps) {
  const { data, isLoading } = useDailyPrices(alertId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Trend</CardTitle>
          <CardDescription>
            No price data yet. Prices will appear after the first check.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Price Trend</CardTitle>
        <CardDescription>Lowest price found per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart
            data={data.points}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatTickDate}
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={formatAxisPrice}
              className="text-xs"
              tick={{ fontSize: 11 }}
              width={65}
            />
            <Tooltip
              formatter={(value) => [
                formatCurrency(Number(value)),
                'Lowest Price',
              ]}
              labelFormatter={(label) =>
                format(new Date(String(label) + 'T12:00:00'), 'MMM d, yyyy')
              }
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                fontSize: '13px',
              }}
            />
            <ReferenceLine
              y={threshold}
              stroke="hsl(var(--destructive))"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold ${formatCurrency(threshold)}`,
                position: 'insideTopRight',
                fontSize: 11,
                fill: 'hsl(var(--destructive))',
              }}
            />
            <Area
              type="monotone"
              dataKey="lowestPrice"
              fill="hsl(var(--primary))"
              fillOpacity={0.08}
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="lowestPrice"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
