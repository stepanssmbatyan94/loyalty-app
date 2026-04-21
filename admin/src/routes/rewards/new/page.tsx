import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCreateReward } from '@/features/owner-rewards/api/create-reward';
import { RewardForm } from '@/features/owner-rewards/components/reward-form';

export const RewardsNewPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateReward({
    mutationConfig: { onSuccess: () => navigate('/rewards') },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/rewards')}>← Back</Button>
        <h1 className="font-headline text-2xl font-bold text-on-background">New Reward</h1>
      </div>
      <div className="max-w-lg">
        <RewardForm
          isLoading={createMutation.isPending}
          onCancel={() => navigate('/rewards')}
          onSubmit={(values) =>
            createMutation.mutate({
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
