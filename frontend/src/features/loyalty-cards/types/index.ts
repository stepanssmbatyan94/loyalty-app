export interface NextReward {
  id: string;
  name: string;
  pointsCost: number;
  ptsRemaining: number;
}

export interface LoyaltyCardData {
  id: string;
  businessId: string;
  customerId: string;
  points: number;
  totalPointsEarned: number;
  qrCodeUrl: string;
  nextReward: NextReward | null;
  progressPercent: number;
  memberSince: string;
}

export interface ActivityTransaction {
  id: string;
  type: 'earn' | 'redeem';
  label: string;
  points: number;
  createdAt: string;
}
