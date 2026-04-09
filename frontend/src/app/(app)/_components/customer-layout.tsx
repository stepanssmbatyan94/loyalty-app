'use client';

import { usePathname } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';

import { BottomNavBar } from '@/components/ui/bottom-nav-bar';
import { TopAppBar } from '@/components/ui/top-app-bar';

// Redemption pages have their own close button — no bottom nav
const ROUTES_WITHOUT_BOTTOM_NAV = ['/redemption'];

function Fallback({ error }: { error: Error }) {
  return <p>Error: {error.message ?? 'Something went wrong!'}</p>;
}

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBottomNav = !ROUTES_WITHOUT_BOTTOM_NAV.some((route) =>
    pathname.startsWith(route),
  );
  const variant = pathname.startsWith('/redemption')
    ? 'redemption'
    : pathname.startsWith('/rewards')
      ? 'catalog'
      : 'home';

  return (
    <div className="relative min-h-screen bg-background">
      <TopAppBar variant={variant} />
      <main className="mx-auto w-full max-w-md px-6 pb-32 pt-24">
        <ErrorBoundary key={pathname} FallbackComponent={Fallback}>
          {children}
        </ErrorBoundary>
      </main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
