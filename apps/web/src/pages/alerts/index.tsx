import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AlertsPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Alerts</CardTitle>
          <CardDescription>
            Manage your flight price monitoring alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
