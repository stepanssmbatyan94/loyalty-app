'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { paths } from '@/config/paths';
import { OwnerLoginForm } from '@/features/owner-auth/components/owner-login-form';

const OwnerLoginPage = () => {
  const router = useRouter();
  const t = useTranslations('admin.login');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-2xl font-bold text-on-background">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {t('subtitle')}
          </p>
        </div>
        <div className="rounded-lg bg-white px-8 py-8 shadow">
          <OwnerLoginForm
            onSuccess={() => router.replace(paths.owner.dashboard.getHref())}
          />
        </div>
      </div>
    </div>
  );
};

export default OwnerLoginPage;
