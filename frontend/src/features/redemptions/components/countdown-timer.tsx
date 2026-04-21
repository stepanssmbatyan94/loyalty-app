'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

interface CountdownTimerProps {
  expiresAt: string;
  onExpired: () => void;
}

function getSecondsLeft(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const t = useTranslations('rewards');
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(expiresAt));

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          onExpired();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');
  const isWarning = secondsLeft <= 60 && secondsLeft > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border px-6 py-3',
        isWarning
          ? 'border-error-container bg-error-container/40'
          : 'border-outline-variant/20 bg-surface-container-low',
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined text-xl',
          isWarning ? 'text-error' : 'text-on-surface-variant',
        )}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        timer
      </span>
      <span
        className={cn(
          'font-headline text-lg font-bold tabular-nums',
          isWarning ? 'text-error' : 'text-on-surface-variant',
        )}
      >
        {secondsLeft > 0
          ? `${t('expiresIn')} ${minutes}:${seconds}`
          : t('expired')}
      </span>
    </div>
  );
}
