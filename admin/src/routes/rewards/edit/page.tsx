import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOwnerRewards } from '@/features/owner-rewards/api/get-owner-rewards';
import { useUpdateReward } from '@/features/owner-rewards/api/update-reward';
import { RewardForm } from '@/features/owner-rewards/components/reward-form';

export const RewardsEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useOwnerRewards();
  const reward = data?.data.find((r) => r.id === id);

  const updateMutation = useUpdateReward({
    mutationConfig: { onSuccess: () => navigate('/rewards') },
  });

  if (!reward) {
    return <p className="p-4 text-on-surface-variant">Reward not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/rewards')}>← Back</Button>
        <h1 className="font-headline text-2xl font-bold text-on-background">Edit Reward</h1>
      </div>
      <div className="max-w-lg">
        <RewardForm
          defaultValues={reward}
          isLoading={updateMutation.isPending}
          onCancel={() => navigate('/rewards')}
          onSubmit={(values) =>
            updateMutation.mutate({
              id: reward.id,
              ...values,
              imageUrl: values.imageUrl || undefined,
              description: values.description || undefined,
            })
          }
        />
      </div>
    </div>
  );
};
