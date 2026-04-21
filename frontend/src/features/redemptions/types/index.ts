export interface RedemptionResponse {
  id: string;
  code: string;
  qrData: string;
  rewardName: string;
  pointsCost: number;
  expiresAt: string;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
}
