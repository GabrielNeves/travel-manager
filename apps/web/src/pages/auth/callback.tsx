import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import type { MeResponse } from '@/lib/api-client';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    if (!accessToken) {
      navigate('/auth/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          navigate('/auth/login', { replace: true });
          return;
        }

        const user = (await res.json()) as MeResponse;
        useAuthStore.getState().setAuth(accessToken, {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        });
        navigate('/', { replace: true });
      } catch {
        navigate('/auth/login', { replace: true });
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Completing sign in...
      </div>
    </div>
  );
}
