export type DashboardData = {
  totalCustomers: number;
  transactionsToday: number;
  totalPointsIssuedAllTime: number;
  activeRewards: number;
};

export type TopCustomer = {
  rank: number;
  customerId: string;
  firstName: string;
  lastName: string;
  totalPointsEarned: number;
  currentBalance: number;
};

export type TopCustomersResponse = {
  data: TopCustomer[];
  meta: {
    page: number;
    total: number;
    totalPages: number;
  };
};
