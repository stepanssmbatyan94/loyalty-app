'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';

interface LoyaltyCardQrProps {
  qrCodeUrl: string;
}

export function LoyaltyCardQr({ qrCodeUrl }: LoyaltyCardQrProps) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('loyaltyCards');

  return (
    <div className="text-center">
      <button
        onClick={() => setVisible((v) => !v)}
        className="font-label text-sm font-bold uppercase tracking-widest text-primary"
      >
        {visible ? t('hideQr') : t('showQr')}
      </button>
      {visible && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <QRCodeSVG value={qrCodeUrl} size={160} level="M" />
          </div>
          <p className="text-xs text-on-surface-variant">{t('showToCashier')}</p>
        </div>
      )}
    </div>
  );
}
