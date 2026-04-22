export interface LoyaltyCardCreatedEvent {
  customerId: number;
  businessId: string;
}

export interface EarnConfirmedEvent {
  customerId: number;
  businessId: string;
  pointsAdded: number;
  newBalance: number;
}

export interface RedemptionConfirmedEvent {
  customerId: number;
  businessId: string;
  rewardName: string;
  pointsSpent: number;
  remainingBalance: number;
}

export interface RedemptionExpiredEvent {
  customerId: number;
  businessId: string;
  rewardName: string;
  pointsRefunded: number;
  newBalance: number;
}

export interface RedemptionRejectedEvent {
  customerId: number;
  businessId: string;
  rewardName: string;
  pointsRefunded: number;
  newBalance: number;
}
