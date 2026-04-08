import { getTranslations } from 'next-intl/server';

import { GypsumProductsList } from '@/features/gypsum-products/components/gypsum-products-list';

export const metadata = { title: 'Gypsum Products' };

const GypsumProductsPage = async () => {
  const t = await getTranslations('gypsumProducts');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>
      <GypsumProductsList
        loadingText={t('loading')}
        emptyText={t('empty')}
        inStockText={t('inStock')}
        outOfStockText={t('outOfStock')}
      />
    </div>
  );
};

export default GypsumProductsPage;
