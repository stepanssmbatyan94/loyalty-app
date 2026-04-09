import { ReactNode } from 'react';

import { CustomerLayout } from './_components/customer-layout';

export const metadata = {
  title: 'Beer House',
  description: 'Your loyalty card',
};

const AppLayout = ({ children }: { children: ReactNode }) => {
  return <CustomerLayout>{children}</CustomerLayout>;
};

export default AppLayout;
