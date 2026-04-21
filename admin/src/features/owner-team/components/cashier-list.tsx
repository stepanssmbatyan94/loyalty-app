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
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : !cashiers.length ? (
        <p className="rounded-xl border bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No cashiers yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-surface-container-lowest shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-on-surface-variant">
                <th className="px-6 py-3 font-label">Name</th>
                <th className="px-6 py-3 font-label">Email</th>
                <th className="px-6 py-3 font-label">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {cashiers.map((cashier) => {
                const isActive = cashier.status?.name === 'active';
                return (
                  <tr key={cashier.id} className="border-b last:border-0">
                    <td className="px-6 py-3 font-medium text-on-background">
                      {cashier.firstName} {cashier.lastName}
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">{cashier.email}</td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-label',
                          isActive
                            ? 'bg-tertiary-container/20 text-tertiary-container'
                            : 'bg-surface-container-high text-on-surface-variant',
                        )}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {isActive && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDeactivate(cashier)}
                          >
                            Deactivate
                          </Button>
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
