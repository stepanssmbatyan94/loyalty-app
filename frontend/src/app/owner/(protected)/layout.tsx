import { ReactNode } from 'react';

import { OwnerAuthGuard } from '../_components/owner-auth-guard';
import { OwnerLayout } from '../_components/owner-layout';

export const metadata = {
  title: 'Beer House Admin',
  description: 'Manage your loyalty program',
};

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <OwnerAuthGuard>
      <OwnerLayout>{children}</OwnerLayout>
    </OwnerAuthGuard>
  );
};

export default Layout;
