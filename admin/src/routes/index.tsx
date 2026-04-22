import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/protected-route';
import { OwnerLayout } from '@/components/layouts/owner-layout';
import { SuperAdminLayout } from '@/components/layouts/super-admin-layout';
import { LoginPage } from './login/page';
import { DashboardPage } from './dashboard/page';
import { CustomersPage } from './customers/page';
import { RewardsPage } from './rewards/page';
import { RewardsNewPage } from './rewards/new/page';
import { RewardsEditPage } from './rewards/edit/page';
import { SettingsPage } from './settings/page';
import { TeamPage } from './team/page';
import { BusinessesPage } from './businesses/page';
import { BusinessesNewPage } from './businesses/new/page';
import { BusinessDetailPage } from './businesses/detail/page';

function RootRedirect() {
  const { role } = useAuthStore();
  if (role === 'superadmin') return <Navigate to="/businesses" replace />;
  if (role === 'owner') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RootRedirect />} />

    <Route
      path="/businesses"
      element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout>
            <BusinessesPage />
          </SuperAdminLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/businesses/new"
      element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout>
            <BusinessesNewPage />
          </SuperAdminLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/businesses/:id"
      element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminLayout>
            <BusinessDetailPage />
          </SuperAdminLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <DashboardPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/rewards"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <RewardsPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/rewards/new"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <RewardsNewPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/rewards/:id/edit"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <RewardsEditPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/customers"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <CustomersPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/team"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <TeamPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/settings"
      element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerLayout>
            <SettingsPage />
          </OwnerLayout>
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
