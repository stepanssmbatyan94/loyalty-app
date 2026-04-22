export type BaseEntity = {
  id: string;
  createdAt: number;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

export type UserRole = {
  id: number;
  name: 'superadmin' | 'owner' | 'cashier' | 'customer';
};

export type UserStatus = {
  id: number;
  name: 'active' | 'inactive';
};

export type User = Entity<{
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  businessId?: string | null;
  photo?: { path: string } | null;
}>;

export type AuthResponse = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
};

export type Business = Entity<{
  name: string;
  logoUrl: string | null;
  ownerId: number | null;
  botUsername: string | null;
  telegramGroupChatId: string | null;
  botToken: string | null;
  isActive: boolean;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
  earnRateValue: number;
  supportedLocales: string[];
  defaultLocale: string;
}>;

export type PaginationMeta = {
  page: number;
  total: number;
  totalPages: number;
};
