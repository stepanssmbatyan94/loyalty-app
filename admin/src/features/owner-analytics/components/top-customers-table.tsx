import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTopCustomers } from '../api/get-top-customers';

export function TopCustomersTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTopCustomers({ params: { page, limit: 20 } });

  return (
    <div className="rounded-xl border bg-surface-container-lowest shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-label text-base font-semibold text-on-background">Top Customers</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-surface-container-low" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <p className="p-6 text-sm text-on-surface-variant">No customers yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-on-surface-variant">
                  <th className="px-6 py-3 font-label">Rank</th>
                  <th className="px-6 py-3 font-label">Customer</th>
                  <th className="px-6 py-3 font-label">Lifetime Points</th>
                  <th className="px-6 py-3 font-label">Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((customer) => (
                  <tr key={customer.customerId} className="border-b last:border-0">
                    <td className="px-6 py-3 font-medium text-on-surface-variant">
                      #{customer.rank}
                    </td>
                    <td className="px-6 py-3 font-medium text-on-background">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="px-6 py-3 text-tertiary-container">
                      {customer.totalPointsEarned.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-primary">
                      {customer.currentBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 border-t px-6 py-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ←
              </Button>
              <span className="text-xs text-on-surface-variant">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
