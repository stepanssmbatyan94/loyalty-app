import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTopCustomers } from '../api/get-top-customers';

export function TopCustomersTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTopCustomers({ params: { page, limit: 20 } });

  return (
    <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant px-6 py-4">
        <h2 className="text-base font-semibold text-on-background">Top Customers</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-[8px] bg-surface-container-low" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <p className="p-6 text-sm text-on-surface-variant">No customers yet.</p>
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-on-surface-variant">
              <thead className="text-sm text-on-surface-variant bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Rank</th>
                  <th scope="col" className="px-6 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-6 py-3 font-medium">Lifetime Points</th>
                  <th scope="col" className="px-6 py-3 font-medium">Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="bg-surface-container-lowest border-b border-outline-variant last:border-0"
                  >
                    <td className="px-6 py-4 text-on-surface-variant">
                      #{customer.rank}
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-on-background whitespace-nowrap">
                      {customer.firstName} {customer.lastName}
                    </th>
                    <td className="px-6 py-4 text-tertiary font-medium">
                      {customer.totalPointsEarned.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-primary font-medium">
                      {customer.currentBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-6 py-3">
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
