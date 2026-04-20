'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

interface RewardCardProps {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  canRedeem: boolean;
  ptsNeeded: number;
  onRedeem: (id: string) => void;
  isLoading?: boolean;
}

export function RewardCard({
  id,
  name,
  description,
  pointsCost,
  imageUrl,
  canRedeem,
  ptsNeeded,
  onRedeem,
  isLoading = false,
}: RewardCardProps) {
  const t = useTranslations('rewards');

  return (
    <div
      className={cn(
        'rounded-lg p-5 flex flex-col gap-4',
        canRedeem
          ? 'bg-surface-container-lowest shadow-sm border border-outline-variant/10'
          : 'bg-surface-container-low opacity-75 grayscale-[0.5]',
      )}
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                redeem
              </span>
            </div>
          )}
          {!canRedeem && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="material-symbols-outlined text-white">lock</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-background leading-tight">
              {name}
            </h3>
            {description && (
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex items-center gap-1 font-label text-xs font-bold',
              canRedeem ? 'text-primary' : 'text-outline',
            )}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
            {pointsCost.toLocaleString()} {t('ptsLabel')}
          </div>
        </div>
      </div>

      {canRedeem ? (
        <button
          onClick={() => onRedeem(id)}
          disabled={isLoading}
          className="w-full rounded-md py-3 font-headline font-bold text-white transition-transform active:scale-95 disabled:opacity-70 premium-gradient"
        >
          {isLoading ? t('processing') : t('redeem')}
        </button>
      ) : (
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md bg-surface-container-highest py-3 font-headline font-bold text-on-surface-variant"
        >
          {t('needMorePts', { count: ptsNeeded })}
        </button>
      )}
    </div>
  );
}
