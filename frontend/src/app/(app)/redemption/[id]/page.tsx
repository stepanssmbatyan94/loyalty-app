'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useQueryClient } from '@tanstack/react-query';

import { useCancelRedemption } from '@/features/redemptions/api/cancel-redemption';
import { useRedemption } from '@/features/redemptions/api/get-redemption';
import { CountdownTimer } from '@/features/redemptions/components/countdown-timer';
import { RedemptionScreen } from '@/features/redemptions/components/redemption-screen';

type PageProps = {
  params: { id: string };
};

export default function RedemptionPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const t = useTranslations('rewards');
  const queryClient = useQueryClient();

  const { data: redemption } = useRedemption(id);
  const cancelMutation = useCancelRedemption();

  const handleDone = () => {
    if (redemption?.status === 'pending') {
      const confirmed = window.confirm(
        `${t('cancelRedemptionTitle')}\n${t('cancelRedemptionMessage')}`,
      );
      if (!confirmed) return;
      cancelMutation.mutate(redemption.code, {
        onSettled: () => router.replace('/'),
      });
    } else {
      router.replace('/');
    }
  };

  const handleExpired = () => {
    queryClient.invalidateQueries({ queryKey: ['loyalty-card'] });
    queryClient.invalidateQueries({ queryKey: ['redemption', id] });
  };

  if (!redemption) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <RedemptionScreen
      rewardName={redemption.rewardName}
      code={redemption.code}
      qrData={redemption.qrData}
      expiresAt={redemption.expiresAt}
      status={redemption.status}
      onDone={handleDone}
      timer={
        redemption.status === 'pending' ? (
          <CountdownTimer
            expiresAt={redemption.expiresAt}
            onExpired={handleExpired}
          />
        ) : undefined
      }
    />
  );
}
