'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

export function OwnerAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role?.name?.toLowerCase() !== 'owner')) {
      router.replace(paths.owner.login.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-on-surface-variant">Loading…</span>
      </div>
    );
  }

  if (!user || user.role?.name?.toLowerCase() !== 'owner') {
    return null;
  }

  return <>{children}</>;
}
