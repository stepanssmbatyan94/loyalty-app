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
  const { data = [], isLoading } = useOwnerRewards();
  const [dialog, setDialog] = useState<ActiveDialog>({ mode: null });

  const createMutation = useCreateReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });
  const updateMutation = useUpdateReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });
  const deleteMutation = useDeleteReward({ mutationConfig: { onSuccess: () => setDialog({ mode: null }) } });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ mode: 'create' })}>Add Reward</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[8px] bg-surface-container-low" />
          ))}
        </div>
      ) : !data.length ? (
        <p className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No rewards yet.
        </p>
      ) : (
        <div className="relative overflow-x-auto bg-surface-container-lowest shadow-sm rounded-[8px] border border-outline-variant">
          <table className="w-full text-sm text-left text-on-surface-variant">
            <thead className="text-sm text-on-surface-variant bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Name</th>
                <th scope="col" className="px-6 py-3 font-medium">Points Cost</th>
                <th scope="col" className="px-6 py-3 font-medium">Stock</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((reward) => (
                <tr
                  key={reward.id}
                  className="bg-surface-container-lowest border-b border-outline-variant last:border-0"
                >
                  <th scope="row" className="px-6 py-4 font-medium text-on-background whitespace-nowrap">
                    {reward.name}
                  </th>
                  <td className="px-6 py-4 font-medium text-primary">
                    {reward.pointsCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {reward.stock == null ? 'Unlimited' : reward.stock}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        reward.isActive
                          ? 'bg-tertiary/10 text-tertiary'
                          : 'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      {reward.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => setDialog({ mode: 'translations', reward })}
                        className="text-xs font-medium text-on-surface-variant hover:text-primary hover:underline"
                      >
                        Translations
                      </button>
                      <button
                        onClick={() => setDialog({ mode: 'edit', reward })}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDialog({ mode: 'delete', reward })}
                        className="text-xs font-medium text-error hover:underline"
                      >
                        Delete
                      </button>
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
