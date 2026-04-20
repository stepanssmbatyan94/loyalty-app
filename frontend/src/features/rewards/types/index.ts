export interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  isActive: boolean;
  canRedeem: boolean;
  ptsNeeded: number;
}
