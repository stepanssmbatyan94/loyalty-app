import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useBusiness } from '@/features/businesses/api/get-business';
import { useUpdateBusiness, reregisterWebhook } from '@/features/businesses/api/update-business';
import { cn } from '@/utils/cn';

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export const BusinessDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: business, isLoading } = useBusiness({ id: id! });
  const updateMutation = useUpdateBusiness(id!);
  const [showToken, setShowToken] = useState(false);
  const [name, setName] = useState('');

  const webhookMutation = useMutation({
    mutationFn: () => reregisterWebhook(id!),
    onSuccess: () => toast.success('Webhook re-registered.'),
    onError: () => toast.error('Failed to re-register webhook.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-on-surface-variant text-sm">
        Business not found.{' '}
        <Link to="/businesses" className="text-primary underline">
          Back to list
        </Link>
      </div>
    );
  }

  const maskedToken = business.botToken
    ? `${'•'.repeat(Math.max(0, business.botToken.length - 6))}${business.botToken.slice(-6)}`
    : '—';

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) updateMutation.mutate({ name: name.trim() });
  };

  const handleToggleActive = () => {
    if (
      !confirm(
        business.isActive
          ? 'Deactivate this business? Owner and cashiers will lose access.'
          : 'Reactivate this business?',
      )
    )
      return;
    updateMutation.mutate({ isActive: !business.isActive });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          to="/businesses"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft size={16} />
          Back to Businesses
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="font-headline text-2xl font-bold text-on-background">{business.name}</h1>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-bold',
            business.isActive ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error',
          )}
        >
          {business.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Business Info */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-4">
        <h2 className="font-semibold text-on-surface">Business Info</h2>
        <form onSubmit={handleSaveInfo} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Name</label>
            <input
              className={inputCls}
              defaultValue={business.name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Logo URL</label>
            <input
              className={inputCls}
              defaultValue={business.logoUrl ?? ''}
              onChange={(e) =>
                e.target.value && updateMutation.mutate({ logoUrl: e.target.value })
              }
              onBlur={(e) => e.target.value && updateMutation.mutate({ logoUrl: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
          {updateMutation.isSuccess && (
            <p className="text-xs text-tertiary">Saved.</p>
          )}
        </form>
      </section>

      {/* Telegram Config */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-3">
        <h2 className="font-semibold text-on-surface">Telegram Config</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant w-32">Bot Token</span>
            <code className="text-on-surface font-mono">
              {showToken ? business.botToken ?? '—' : maskedToken}
            </code>
            <button
              onClick={() => setShowToken((v) => !v)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant w-32">Group Chat ID</span>
            <code className="text-on-surface font-mono">
              {business.telegramGroupChatId ?? '—'}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant w-32">Bot Username</span>
            <code className="text-on-surface font-mono">
              {business.botUsername ? `@${business.botUsername}` : '—'}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => webhookMutation.mutate()}
            disabled={webhookMutation.isPending || !business.botToken}
            className="px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-40"
          >
            {webhookMutation.isPending ? 'Registering…' : 'Re-register Webhook'}
          </button>
        </div>
      </section>

      {/* Owner Info */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-2">
        <h2 className="font-semibold text-on-surface">Owner</h2>
        <p className="text-sm text-on-surface-variant">
          Owner ID: <span className="text-on-surface">{business.ownerId ?? '—'}</span>
        </p>
        <p className="text-sm text-on-surface-variant">
          Created:{' '}
          <span className="text-on-surface">
            {new Date(business.createdAt).toLocaleDateString()}
          </span>
        </p>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-error/30 p-5 space-y-3">
        <h2 className="font-semibold text-error">Danger Zone</h2>
        <p className="text-sm text-on-surface-variant">
          {business.isActive
            ? 'Deactivating will prevent the owner and all cashiers from accessing the system.'
            : 'Reactivating will restore access for the owner and cashiers.'}
        </p>
        <button
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60',
            business.isActive
              ? 'bg-error text-white'
              : 'bg-tertiary text-on-tertiary',
          )}
        >
          {business.isActive ? 'Deactivate Business' : 'Reactivate Business'}
        </button>
      </section>
    </div>
  );
};
