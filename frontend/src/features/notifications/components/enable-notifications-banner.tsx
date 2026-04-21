'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { notificationPrompt } from '../hooks/use-notification-prompt';

interface EnableNotificationsBannerProps {
  botUsername: string;
}

export function EnableNotificationsBanner({
  botUsername,
}: EnableNotificationsBannerProps) {
  const t = useTranslations('notifications');
  const [dismissed, setDismissed] = useState(() => notificationPrompt.get());

  if (dismissed || !botUsername) return null;

  const handleEnable = async () => {
    notificationPrompt.set();
    setDismissed(true);
    const { default: WebApp } = await import('@twa-dev/sdk');
    WebApp.openTelegramLink(`https://t.me/${botUsername}`);
  };

  const handleLater = () => {
    notificationPrompt.set();
    setDismissed(true);
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
      <span
        className="material-symbols-outlined mt-0.5 text-primary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        notifications
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="font-label text-sm font-semibold text-on-background">
            {t('enableNotifications')}
          </p>
          <p className="font-body text-xs text-on-surface-variant">
            {t('enableNotificationsDesc')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            className="rounded-full bg-primary px-4 py-1.5 font-label text-xs font-semibold text-white"
          >
            {t('enable')}
          </button>
          <button
            onClick={handleLater}
            className="rounded-full px-4 py-1.5 font-label text-xs font-semibold text-on-surface-variant"
          >
            {t('later')}
          </button>
        </div>
      </div>
    </div>
  );
}
