import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAlerts, useAlert, type FlightAlertResponse } from '@/hooks/use-alerts';
import { AlertListItem } from '@/components/alerts/alert-list-item';
import { AlertDetailPanel } from '@/components/alerts/alert-detail-panel';
import { AlertForm } from '@/components/alerts/alert-form';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
];

export function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const { data: alerts, isLoading } = useAlerts(statusFilter || undefined);

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Fetch the selected alert data for the edit form
  const { data: selectedAlertData } = useAlert(selectedAlertId ?? '');

  const handleCreateSuccess = (newAlert: FlightAlertResponse) => {
    setCreateSheetOpen(false);
    setSelectedAlertId(newAlert.id);
    // Switch to the filter that matches the new alert's status
    if (statusFilter && statusFilter !== newAlert.status) {
      setStatusFilter('');
    }
  };

  const handleEditSuccess = () => {
    setEditSheetOpen(false);
  };

  const handleDelete = () => {
    setSelectedAlertId(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left panel — 1/3 */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] flex flex-col gap-3">
        <div className="flex items-center justify-between pr-2">
          <div>
            <h2 className="text-lg font-semibold">Flight Alerts</h2>
            <p className="text-sm text-muted-foreground">
              Manage your alerts
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateSheetOpen(true)}>
            <Plus className="mr-1 size-4" />
            New
          </Button>
        </div>

        <div className="flex gap-1">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isLoading && (
          <div className="grid gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && alerts && alerts.length === 0 && (
          <Card>
            <CardHeader className="text-center py-6">
              <CardTitle className="text-sm">
                {statusFilter ? `No ${statusFilter.toLowerCase()} alerts` : 'No alerts yet'}
              </CardTitle>
              <CardDescription className="text-xs">
                {statusFilter
                  ? 'Try switching the filter to see other alerts.'
                  : 'Create your first flight alert to start tracking prices.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && alerts && alerts.length > 0 && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid gap-2 pr-2">
              {alerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  isSelected={alert.id === selectedAlertId}
                  onClick={() => setSelectedAlertId(alert.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right panel — 2/3 */}
      <div className="flex-1 min-w-0 min-h-0">
        {selectedAlertId ? (
          <AlertDetailPanel
            alertId={selectedAlertId}
            onDelete={handleDelete}
            onEdit={() => setEditSheetOpen(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              Select an alert to view details
            </p>
          </div>
        )}
      </div>

      {/* Create alert Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>New Flight Alert</SheetTitle>
            <SheetDescription>
              Set up a new price alert to track flight prices
            </SheetDescription>
          </SheetHeader>
          <div className="px-1 pb-4">
            <AlertForm
              mode="create"
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit alert Sheet */}
      <Sheet
        open={editSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open);
        }}
      >
        <SheetContent className="sm:max-w-[600px] overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Edit Flight Alert</SheetTitle>
            <SheetDescription>
              Update your alert settings
            </SheetDescription>
          </SheetHeader>
          <div className="px-1 pb-4">
            {editSheetOpen && selectedAlertData && (
              <AlertForm
                mode="edit"
                initialData={selectedAlertData}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditSheetOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
