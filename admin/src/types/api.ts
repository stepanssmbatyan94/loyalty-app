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
