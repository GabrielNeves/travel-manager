import { createBrowserRouter, Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { AuthLayout } from '@/pages/auth/layout';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { CallbackPage } from '@/pages/auth/callback';
import { DashboardPage } from '@/pages/dashboard';
import { AlertsPage } from '@/pages/alerts/index';
import { NotificationsPage } from '@/pages/notifications';
import { SettingsPage } from '@/pages/settings';
import { ProfilePage } from '@/pages/profile';
import { NotFoundPage } from '@/pages/not-found';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'callback', element: <CallbackPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { title: 'Dashboard' },
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
        handle: { title: 'Flight Alerts' },
      },
      {
        path: 'alerts/:id',
        element: <Navigate to="/alerts" replace />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
        handle: { title: 'Notifications' },
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        handle: { title: 'Settings' },
      },
      {
        path: 'profile',
        element: <ProfilePage />,
        handle: { title: 'Profile' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: { title: 'Not Found' },
      },
    ],
  },
]);
