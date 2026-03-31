import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { AuthResponse, User } from '@/types/api';

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId: string;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include',
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: { data: User }) => response.data,
      providesTags: ['User'],
    }),
    login: builder.mutation<AuthResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<AuthResponse, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi;
