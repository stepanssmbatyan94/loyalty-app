import { BaseEntity, Meta } from '@/types/api';

export type GypsumProduct = BaseEntity & {
  name: string;
  sku: string;
  category: string;
  pricePerUnit: number;
  unitLabel: string;
  inStock: boolean;
};

export type GypsumProductsResponse = {
  data: GypsumProduct[];
  meta: Meta;
};
