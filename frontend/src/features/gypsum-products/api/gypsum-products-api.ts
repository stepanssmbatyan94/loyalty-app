import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { GypsumProduct, GypsumProductsResponse } from '../types';

export const gypsumProductsApi = createApi({
  reducerPath: 'gypsumProductsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include',
  }),
  tagTypes: ['GypsumProduct'],
  endpoints: (builder) => ({
    getGypsumProducts: builder.query<GypsumProductsResponse, { page?: number }>(
      {
        query: ({ page = 1 }) => `/gypsum-products?page=${page}`,
        providesTags: ['GypsumProduct'],
      },
    ),
    getGypsumProduct: builder.query<GypsumProduct, string>({
      query: (id) => `/gypsum-products/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'GypsumProduct', id }],
    }),
  }),
});

export const { useGetGypsumProductsQuery, useGetGypsumProductQuery } =
  gypsumProductsApi;
