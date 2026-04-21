'use client';

import { QRCodeSVG } from 'qrcode.react';

import { useTranslations } from 'next-intl';

interface RedemptionScreenProps {
  rewardName: string;
  code: string;
  qrData: string;
  expiresAt: string;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  onDone: () => void;
  timer?: React.ReactNode;
}

export function RedemptionScreen({
  rewardName,
  code,
  qrData,
  status,
  onDone,
  timer,
}: RedemptionScreenProps) {
  const t = useTranslations('rewards');
  const isExpired = status === 'expired' || status === 'cancelled';

  return (
    <div className="flex w-full flex-col items-center">
      {/* Badge + title */}
      <div className="mb-10 w-full text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-4 py-1.5 font-label text-xs font-bold uppercase tracking-widest text-on-secondary-fixed">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            redeem
          </span>
          {t('activeVoucher')}
        </span>
        <h2 className="font-headline text-2xl font-bold tracking-tight text-on-background">
          {t('youAreRedeeming')}
        </h2>
        <p className="mt-1 font-headline text-4xl font-extrabold text-primary">
          {rewardName}
        </p>
      </div>

      {/* Card */}
      <div className="relative w-full">
        <div className="absolute inset-0 -z-10 scale-90 transform rounded-full bg-primary/5 blur-3xl" />
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-primary via-primary-container to-primary" />

          <div className="relative flex flex-col items-center">
            {isExpired ? (
              /* Expired state */
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-6xl text-error">
                  timer_off
                </span>
                <p className="mt-4 font-headline font-bold text-error">
                  {t('codeExpired')}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {t('pointsReturned')}
                </p>
              </div>
            ) : (
              /* QR code */
              <div className="relative mb-8 flex h-64 w-64 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
                <QRCodeSVG
                  value={qrData}
                  size={192}
                  bgColor="#ffffff"
                  fgColor="#1a1c1e"
                  level="M"
                />
                <div className="absolute left-4 top-4 h-4 w-4 border-l-4 border-t-4 border-primary" />
                <div className="absolute right-4 top-4 h-4 w-4 border-r-4 border-t-4 border-primary" />
                <div className="absolute bottom-4 left-4 h-4 w-4 border-b-4 border-l-4 border-primary" />
                <div className="absolute bottom-4 right-4 h-4 w-4 border-b-4 border-r-4 border-primary" />
              </div>
            )}

            {/* 6-digit code */}
            {!isExpired && (
              <div className="text-center">
                <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  {t('redemptionCode')}
                </span>
                <div className="font-headline text-5xl font-black tracking-[0.15em] text-on-background">
                  {code.slice(0, 3)} {code.slice(3)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timer + hint */}
      {!isExpired && (
        <div className="mt-8 flex flex-col items-center gap-2">
          {timer}
          <p className="mt-2 max-w-[240px] text-center font-label text-sm text-on-surface-variant">
            {t('showToStaff')}
          </p>
        </div>
      )}

      {/* Done button */}
      <div className="mt-auto w-full pt-12">
        <button
          onClick={onDone}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-primary to-primary-container py-5 font-headline text-lg font-bold text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {t('done')}
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
}
