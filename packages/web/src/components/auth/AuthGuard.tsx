'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  // Track hydration to prevent SSR/CSR mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after first client-side render
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only redirect after hydration to avoid SSR/CSR mismatch
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // During SSR and initial client render, always render a loading state
  // This ensures consistent HTML structure between server and client
  if (!isHydrated) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // After hydration, if not authenticated, show loading during redirect
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
