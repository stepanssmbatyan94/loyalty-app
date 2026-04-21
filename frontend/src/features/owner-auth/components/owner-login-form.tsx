'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useLogin, loginInputSchema } from '@/lib/auth';

type OwnerLoginFormProps = {
  onSuccess: () => void;
};

export function OwnerLoginForm({ onSuccess }: OwnerLoginFormProps) {
  const t = useTranslations('admin');
  const tAuth = useTranslations('auth');
  const login = useLogin({ onSuccess });

  return (
    <Form onSubmit={(values) => login.mutate(values)} schema={loginInputSchema}>
      {({ register, formState }) => (
        <>
          <Input
            type="email"
            label={tAuth('email')}
            error={formState.errors['email']}
            registration={register('email')}
          />
          <Input
            type="password"
            label={tAuth('password')}
            error={formState.errors['password']}
            registration={register('password')}
          />
          <Button
            isLoading={login.isPending}
            type="submit"
            className="mt-2 w-full"
          >
            {t('login.submit')}
          </Button>
        </>
      )}
    </Form>
  );
}
