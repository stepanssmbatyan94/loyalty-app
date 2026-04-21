import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { useCreateReward } from '../api/create-reward';
import { useDeleteReward } from '../api/delete-reward';
import { useOwnerRewards } from '../api/get-owner-rewards';
import { useUpdateReward } from '../api/update-reward';
import { OwnerReward } from '../types';
import { RewardForm } from './reward-form';
import { RewardTranslationsForm } from './reward-translations-form';

type DialogMode = 'create' | 'edit' | 'translations' | 'delete' | null;
interface ActiveDialog { mode: DialogMode; reward?: OwnerReward; }

export function RewardManagementList() {
  const { data, isLoading } = useOwnerRewards();
  const [dialog, setDialog] = useState<ActiveDialog>({ mode: null });

  const createMutation = useCreateReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });
  const updateMutation = useUpdateReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });
  const deleteMutation = useDeleteReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });

  const rewards = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ mode: 'create' })}>Add Reward</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : !rewards.length ? (
        <p className="rounded-xl border bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No rewards yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-surface-container-lowest shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-on-surface-variant">
                <th className="px-6 py-3 font-label">Name</th>
                <th className="px-6 py-3 font-label">Points Cost</th>
                <th className="px-6 py-3 font-label">Stock</th>
                <th className="px-6 py-3 font-label">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward.id} className="border-b last:border-0">
                  <td className="px-6 py-3 font-medium text-on-background">{reward.name}</td>
                  <td className="px-6 py-3 text-primary">{reward.pointsCost.toLocaleString()}</td>
                  <td className="px-6 py-3 text-on-surface-variant">
                    {reward.stock == null ? 'Unlimited' : reward.stock}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-label text-xs',
                        reward.isActive
                          ? 'bg-tertiary-container/20 text-tertiary-container'
                          : 'bg-surface-container-high text-on-surface-variant',
                      )}
                    >
                      {reward.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDialog({ mode: 'translations', reward })}>
                        Translations
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ mode: 'edit', reward })}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDialog({ mode: 'delete', reward })}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialog.mode === 'create'} onOpenChange={(open) => !open && setDialog({ mode: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Reward</DialogTitle></DialogHeader>
          <RewardForm
            isLoading={createMutation.isPending}
            onCancel={() => setDialog({ mode: null })}
            onSubmit={(values) =>
              createMutation.mutate({
                ...values,
                imageUrl: values.imageUrl || undefined,
                description: values.description || undefined,
              })
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.mode === 'edit'} onOpenChange={(open) => !open && setDialog({ mode: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reward</DialogTitle></DialogHeader>
          {dialog.reward && (
            <RewardForm
              defaultValues={dialog.reward}
              isLoading={updateMutation.isPending}
              onCancel={() => setDialog({ mode: null })}
              onSubmit={(values) =>
                updateMutation.mutate({
                  id: dialog.reward!.id,
                  ...values,
                  imageUrl: values.imageUrl || undefined,
                  description: values.description || undefined,
                })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.mode === 'translations'} onOpenChange={(open) => !open && setDialog({ mode: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Translations</DialogTitle></DialogHeader>
          {dialog.reward && (
            <RewardTranslationsForm rewardId={dialog.reward.id} onDone={() => setDialog({ mode: null })} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.mode === 'delete'} onOpenChange={(open) => !open && setDialog({ mode: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reward</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialog({ mode: null })}>Cancel</Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(dialog.reward!.id)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
