'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

interface TopAppBarProps {
  variant?: 'home' | 'catalog' | 'redemption';
  avatarUrl?: string | null;
  onNotificationClick?: () => void;
  onCloseClick?: () => void;
  onMenuClick?: () => void;
}

export function TopAppBar({
  variant = 'home',
  avatarUrl,
  onNotificationClick,
  onCloseClick,
  onMenuClick,
}: TopAppBarProps) {
  const t = useTranslations('common');

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-white/80 px-6 py-4 backdrop-blur-xl">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {variant === 'redemption' ? (
          <button
            onClick={onCloseClick}
            className="material-symbols-outlined text-on-surface-variant transition-opacity duration-200 hover:opacity-80 active:scale-95"
          >
            close
          </button>
        ) : variant === 'catalog' ? (
          <button
            onClick={onMenuClick}
            className="material-symbols-outlined text-on-surface-variant transition-opacity duration-200 hover:opacity-80 active:scale-95"
          >
            menu
          </button>
        ) : (
          <div className="rounded-lg bg-primary-container/10 p-2">
            <span className="material-symbols-outlined text-xl text-primary">
              sports_bar
            </span>
          </div>
        )}
        <span className="font-headline text-lg font-extrabold tracking-widest text-on-surface">
          {t('appName')}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {variant === 'home' && (
          <button
            onClick={onNotificationClick}
            className="material-symbols-outlined text-on-surface-variant transition-opacity duration-200 hover:opacity-80 active:scale-95"
          >
            notifications
          </button>
        )}
        <Avatar url={avatarUrl} />
      </div>
    </nav>
  );
}

function Avatar({ url }: { url?: string | null }) {
  if (url) {
    return (
      <div className="size-10 overflow-hidden rounded-full border-2 border-primary-container/20">
        <img src={url} alt="" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full border-2 border-primary-container/20',
        'flex items-center justify-center bg-surface-container-high',
      )}
    >
      <span className="material-symbols-outlined text-xl text-on-surface-variant">
        person
      </span>
    </div>
  );
}
