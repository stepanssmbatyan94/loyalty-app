'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

const TABS = [
  { key: 'home', icon: 'home', href: '/' },
  { key: 'rewards', icon: 'redeem', href: '/rewards' },
  { key: 'history', icon: 'history', href: '/history' },
] as const;

export function BottomNavBar() {
  const t = useTranslations('common');
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/90 backdrop-blur-2xl rounded-t-[3rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {TABS.map(({ key, icon, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90',
              isActive
                ? 'bg-blue-50 text-blue-700 rounded-full scale-110'
                : 'text-slate-400 hover:text-blue-500',
            )}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {icon}
            </span>
            <span className="font-headline text-[10px] font-semibold uppercase tracking-wider mt-1">
              {t(`nav.${key}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
