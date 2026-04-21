'use client';

import {
  BarChart3,
  Gift,
  LayoutDashboard,
  PanelLeft,
  Settings,
  Users,
  User2,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

function Fallback({ error }: { error: Error }) {
  return <p>Error: {error.message ?? 'Something went wrong!'}</p>;
}

function OwnerNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');

  const navItems = [
    {
      name: t('dashboard'),
      to: paths.owner.dashboard.getHref(),
      icon: LayoutDashboard,
    },
    { name: t('rewards'), to: paths.owner.rewards.getHref(), icon: Gift },
    {
      name: t('customers'),
      to: paths.owner.customers.getHref(),
      icon: BarChart3,
    },
    { name: t('team'), to: paths.owner.team.getHref(), icon: Users },
    { name: t('settings'), to: paths.owner.settings.getHref(), icon: Settings },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.to);
        return (
          <NextLink
            key={item.name}
            href={item.to}
            onClick={onNavigate}
            className={cn(
              'text-gray-300 hover:bg-gray-700 hover:text-white',
              'group flex w-full items-center rounded-md p-2 text-base font-medium',
              isActive && 'bg-gray-900 text-white',
            )}
          >
            <item.icon
              className={cn(
                'text-gray-400 group-hover:text-gray-300',
                'mr-3 size-5 shrink-0',
              )}
              aria-hidden="true"
            />
            {item.name}
          </NextLink>
        );
      })}
    </>
  );
}

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('admin.nav');
  const logout = useLogout({
    onSuccess: () => router.push(paths.owner.login.getHref()),
  });
  const { data: user } = useUser();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-gray-900 sm:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <span className="font-headline text-lg font-semibold text-white">
            Beer House Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <OwnerNav />
        </nav>
      </aside>

      <div className="flex flex-col sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:justify-end sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent
              side="left"
              className="bg-gray-900 pt-10 text-white sm:max-w-60"
            >
              <div className="flex h-16 shrink-0 items-center px-6">
                <span className="font-headline text-lg font-semibold text-white">
                  Beer House Admin
                </span>
              </div>
              <nav className="flex flex-col gap-1 px-3 py-2">
                <OwnerNav />
              </nav>
            </DrawerContent>
          </Drawer>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <span className="sr-only">Open user menu</span>
                <User2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm text-gray-700" disabled>
                {user?.firstName} {user?.lastName}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="w-full text-sm text-gray-700"
                onClick={() => logout.mutate()}
              >
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <ErrorBoundary key={pathname} FallbackComponent={Fallback}>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
