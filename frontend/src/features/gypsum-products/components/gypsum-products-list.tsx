'use client';

import { useGetGypsumProductsQuery } from '../api/gypsum-products-api';

type Props = {
  loadingText: string;
  emptyText: string;
  inStockText: string;
  outOfStockText: string;
};

export const GypsumProductsList = ({
  loadingText,
  emptyText,
  inStockText,
  outOfStockText,
}: Props) => {
  const { data, isLoading } = useGetGypsumProductsQuery({ page: 1 });

  if (isLoading) return <p className="text-gray-500">{loadingText}</p>;

  if (!data?.data.length) return <p className="text-gray-500">{emptyText}</p>;

  return (
    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
      {data.data.map((product) => (
        <li
          key={product.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">
              {product.sku} · {product.category}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">
              {product.pricePerUnit} / {product.unitLabel}
            </p>
            <p
              className={
                product.inStock
                  ? 'text-sm text-green-600'
                  : 'text-sm text-red-500'
              }
            >
              {product.inStock ? inStockText : outOfStockText}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
