import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { Plane } from 'lucide-react';

export function AuthLayout() {
  const { user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
            <Plane className="size-4" />
          </div>
          Travel Manager
        </a>
        <Outlet />
      </div>
    </div>
  );
}
