import { Building2, User2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useLogout, useUser } from '@/lib/auth';

function Fallback({ error }: { error: Error }) {
  return <p className="p-4 text-destructive">Error: {error.message ?? 'Something went wrong!'}</p>;
}

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const logout = useLogout({ onSuccess: () => navigate('/login', { replace: true }) });
  const { data: user } = useUser();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-gray-900 sm:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <span className="font-headline text-lg font-semibold text-white">Super Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <Link
            to="/businesses"
            className="group flex w-full items-center rounded-md p-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Building2 className="mr-3 size-5 shrink-0 text-gray-400 group-hover:text-gray-300" />
            Businesses
          </Link>
        </nav>
      </aside>

      <div className="flex flex-col sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
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
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
