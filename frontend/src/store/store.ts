import { configureStore } from '@reduxjs/toolkit';

import { authApi } from '@/features/auth/api/auth-api';
import { gypsumProductsApi } from '@/features/gypsum-products/api/gypsum-products-api';

export const makeStore = () =>
  configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [gypsumProductsApi.reducerPath]: gypsumProductsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(gypsumProductsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
