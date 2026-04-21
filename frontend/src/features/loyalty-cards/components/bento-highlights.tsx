'use client';

import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface BentoHighlightsProps {
  qrCodeUrl: string;
}

export function BentoHighlights({ qrCodeUrl }: BentoHighlightsProps) {
  const t = useTranslations('loyaltyCards');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleShareClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  return (
    <section className="grid grid-cols-2 gap-4">
      <div className="group flex aspect-square flex-col justify-between rounded-lg bg-surface-container-low p-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-primary transition-transform duration-200 group-hover:scale-110">
            event_repeat
          </span>
        </div>
        <div>
          <h3 className="whitespace-pre-line font-headline text-base font-bold leading-tight">
            {t('dailyCheckin')}
          </h3>
          <p className="mt-1 text-xs font-medium text-on-surface-variant">
            {t('dailyCheckinPts')}
          </p>
        </div>
      </div>

      <div className="group flex aspect-square flex-col justify-between rounded-lg bg-surface-container-low p-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary/10">
          <span
            className="material-symbols-outlined text-secondary transition-transform duration-200 group-hover:scale-110"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            celebration
          </span>
        </div>
        <div>
          <h3 className="whitespace-pre-line font-headline text-base font-bold leading-tight">
            {t('happyHour')}
          </h3>
          <p className="mt-1 text-xs font-medium text-on-surface-variant">
            {t('happyHourMultiplier')}
          </p>
        </div>
      </div>

      <div className="col-span-2 flex items-center gap-6 rounded-lg bg-surface-container-highest p-6">
        <div className="flex-1">
          <h3 className="font-headline text-base font-bold">
            {t('inviteFriends')}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t('inviteFriendsDesc')}
          </p>
          <button
            onClick={handleShareClick}
            className="mt-3 text-sm font-bold text-primary"
          >
            {t('shareInviteLink')} →
          </button>
        </div>
        <button
          onClick={() => setShowQr(true)}
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white"
          aria-label={t('scanMyQr')}
        >
          <QRCodeSVG
            value={qrCodeUrl}
            size={56}
            bgColor="#ffffff"
            fgColor="#1a1c1e"
            level="M"
          />
        </button>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <h2 className="mb-6 font-headline text-xl font-bold text-on-background">
            {t('scanMyQr')}
          </h2>
          <div className="rounded-xl bg-white p-6 shadow-xl">
            <QRCodeSVG
              value={qrCodeUrl}
              size={240}
              bgColor="#ffffff"
              fgColor="#1a1c1e"
              level="M"
            />
          </div>
          <p className="mt-4 max-w-[240px] text-center text-sm text-on-surface-variant">
            {t('scanQrHint')}
          </p>
          <button
            onClick={() => setShowQr(false)}
            className="mt-8 font-bold text-primary"
          >
            {t('close')}
          </button>
        </div>
      )}

      {showComingSoon && (
        <div
          role="status"
          className="col-span-2 rounded-lg bg-secondary-container px-4 py-3 text-center text-sm font-medium text-on-secondary-container"
        >
          {t('comingSoon')}
        </div>
      )}
    </section>
  );
}
