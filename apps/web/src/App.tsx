import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { initAuth } from '@/hooks/use-auth';
import { router } from '@/routes';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAuth();
  }, []);
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
