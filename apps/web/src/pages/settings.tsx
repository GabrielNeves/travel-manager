import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/hooks/use-settings';

const FREQUENCY_OPTIONS = [
  { value: 'HOURS_1', label: 'Every 1 hour' },
  { value: 'HOURS_3', label: 'Every 3 hours' },
  { value: 'HOURS_6', label: 'Every 6 hours' },
  { value: 'HOURS_12', label: 'Every 12 hours' },
  { value: 'HOURS_24', label: 'Every 24 hours' },
];

export function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();

  if (isLoading || !settings) {
    return (
      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleFrequencyChange = (value: string) => {
    updateSettings({ defaultCheckFrequency: value });
  };

  return (
    <div className="grid gap-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about price changes
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-in-app" className="flex flex-col gap-1">
              <span>In-App Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receive notifications within the application
              </span>
            </Label>
            <Switch
              id="notify-in-app"
              checked={settings.notifyInApp}
              onCheckedChange={(v) => handleToggle('notifyInApp', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-whatsapp" className="flex flex-col gap-1">
              <span>WhatsApp Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Get alerts via WhatsApp messages
              </span>
            </Label>
            <Switch
              id="notify-whatsapp"
              checked={settings.notifyWhatsApp}
              onCheckedChange={(v) => handleToggle('notifyWhatsApp', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-push" className="flex flex-col gap-1">
              <span>Push Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Browser push notifications for price drops
              </span>
            </Label>
            <Switch
              id="notify-push"
              checked={settings.notifyPush}
              onCheckedChange={(v) => handleToggle('notifyPush', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="notify-historical-low"
              className="flex flex-col gap-1"
            >
              <span>Historical Low Alerts</span>
              <span className="text-sm font-normal text-muted-foreground">
                Notify when a price hits its historical low
              </span>
            </Label>
            <Switch
              id="notify-historical-low"
              checked={settings.notifyOnHistoricalLow}
              onCheckedChange={(v) =>
                handleToggle('notifyOnHistoricalLow', v)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Alert Settings</CardTitle>
          <CardDescription>
            Default preferences for new flight alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="check-frequency"
              className="flex flex-col gap-1"
            >
              <span>Check Frequency</span>
              <span className="text-sm font-normal text-muted-foreground">
                How often to check prices for new alerts
              </span>
            </Label>
            <Select
              value={settings.defaultCheckFrequency}
              onValueChange={handleFrequencyChange}
            >
              <SelectTrigger id="check-frequency" className="w-48">
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
    </div>
  );
}
