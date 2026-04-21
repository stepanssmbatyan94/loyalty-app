import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateCashier } from '../api/create-cashier';

const createCashierSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  telegramUserId: z.string().optional(),
});

type CreateCashierValues = z.infer<typeof createCashierSchema>;

interface CreateCashierFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateCashierForm({ onSuccess, onCancel }: CreateCashierFormProps) {
  const createMutation = useCreateCashier({ mutationConfig: { onSuccess } });

  return (
    <Form<typeof createCashierSchema>
      onSubmit={(values) =>
        createMutation.mutate({
          ...values,
          telegramUserId: values.telegramUserId || undefined,
        })
      }
      schema={createCashierSchema}
    >
      {({ register, formState }) => (
        <div className="space-y-4">
          <Input
            label="First Name"
            error={formState.errors['firstName']}
            registration={register('firstName')}
          />
          <Input
            label="Last Name"
            error={formState.errors['lastName']}
            registration={register('lastName')}
          />
          <Input
            type="email"
            label="Email"
            error={formState.errors['email']}
            registration={register('email')}
          />
          <Input
            label="Telegram User ID"
            error={formState.errors['telegramUserId']}
            registration={register('telegramUserId')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
