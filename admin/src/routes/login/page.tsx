import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useLogin, loginInputSchema, LoginInput } from '@/lib/auth';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();

  useEffect(() => {
    if (role === 'owner') navigate('/dashboard', { replace: true });
    else if (role === 'superadmin') navigate('/businesses', { replace: true });
  }, [role, navigate]);

  const login = useLogin({
    onSuccess: (assignedRole) => {
      if (assignedRole === 'superadmin') navigate('/businesses', { replace: true });
      else navigate('/dashboard', { replace: true });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-headline text-2xl font-bold">Beer House Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {login.error && (
          <div className="rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container">
            {login.error.message}
          </div>
        )}

        <Form<typeof loginInputSchema>
          schema={loginInputSchema}
          onSubmit={(values) => login.mutate(values)}
        >
          {({ register, formState }) => (
            <>
              <Input
                label="Email"
                type="email"
                placeholder="owner@example.com"
                error={formState.errors.email}
                registration={register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={formState.errors.password}
                registration={register('password')}
              />
              <Button
                type="submit"
                className="w-full"
                isLoading={login.isPending}
                disabled={login.isPending}
              >
                Sign in
              </Button>
            </>
          )}
        </Form>
      </div>
    </div>
  );
};
