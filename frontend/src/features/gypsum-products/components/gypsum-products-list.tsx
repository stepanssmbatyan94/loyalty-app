'use client';

import { useGetGypsumProductsQuery } from '../api/gypsum-products-api';

export const GypsumProductsList = () => {
  const { data, isLoading } = useGetGypsumProductsQuery({ page: 1 });

  if (isLoading) return <p>Loading…</p>;

  return (
    <ul>
      {data?.data.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
};
