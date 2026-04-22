import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { useDeactivateCashier } from '../api/deactivate-cashier';
import { Cashier, useCashiers } from '../api/get-cashiers';
import { CreateCashierForm } from './create-cashier-form';

export function CashierList() {
  const { data, isLoading } = useCashiers();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Cashier | null>(null);

  const deactivateMutation = useDeactivateCashier({
    mutationConfig: { onSuccess: () => setConfirmDeactivate(null) },
  });

  const cashiers = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>Add Cashier</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[8px] bg-surface-container-low" />
          ))}
        </div>
      ) : !cashiers.length ? (
        <p className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No cashiers yet.
        </p>
      ) : (
        <div className="relative overflow-x-auto bg-surface-container-lowest shadow-sm rounded-[8px] border border-outline-variant">
          <table className="w-full text-sm text-left text-on-surface-variant">
            <thead className="text-sm text-on-surface-variant bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Name</th>
                <th scope="col" className="px-6 py-3 font-medium">Email</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cashiers.map((cashier) => {
                const isActive = cashier.status?.name === 'active';
                return (
                  <tr
                    key={cashier.id}
                    className="bg-surface-container-lowest border-b border-outline-variant last:border-0"
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-on-background whitespace-nowrap">
                      {cashier.firstName} {cashier.lastName}
                    </th>
                    <td className="px-6 py-4">{cashier.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          isActive
                            ? 'bg-tertiary/10 text-tertiary'
                            : 'bg-surface-container text-on-surface-variant',
                        )}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setConfirmDeactivate(cashier)}
                            className="text-xs font-medium text-error hover:underline"
                          >
                            Deactivate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cashier</DialogTitle>
          </DialogHeader>
          <CreateCashierForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeactivate}
        onOpenChange={(open) => !open && setConfirmDeactivate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Cashier</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this cashier? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deactivateMutation.isPending}
              onClick={() => confirmDeactivate && deactivateMutation.mutate(confirmDeactivate.id)}
            >
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
