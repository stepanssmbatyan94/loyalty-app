import { ReactNode } from 'react';

import { CustomerLayout } from './_components/customer-layout';
import { TelegramAuthInitializer } from './_components/telegram-auth-initializer';

export const metadata = {
  title: 'Beer House',
  description: 'Your loyalty card',
};

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <TelegramAuthInitializer />
      <CustomerLayout>{children}</CustomerLayout>
    </>
  );
};

export default AppLayout;
