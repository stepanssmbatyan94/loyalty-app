export type OwnerReward = {
  id: string;
  name: string;
  description?: string | null;
  pointsCost: number;
  imageUrl?: string | null;
  isActive: boolean;
  stock?: number | null;
  businessId: string;
  createdAt: string;
  deletedAt?: string | null;
};

export type RewardTranslation = {
  id: string;
  rewardId: string;
  locale: string;
  field: 'name' | 'description';
  value: string;
};
