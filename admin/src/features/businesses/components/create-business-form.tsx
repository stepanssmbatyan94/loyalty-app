import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateBusinessDto, useCreateBusiness } from '../api/create-business';

const schema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().or(z.literal('')),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().optional(),
  botToken: z
    .string()
    .regex(/^\d+:[A-Za-z0-9_-]{35}$/, 'Invalid bot token format (expected: 123456789:AABBcc…)'),
  telegramGroupChatId: z.string().regex(/^-?\d+$/, 'Must be a numeric chat ID'),
  botUsername: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{4,}$/, 'Must be a valid Telegram username without @'),
});

type FormValues = z.infer<typeof schema>;

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-on-surface">{label}</label>
    {children}
    {error && <p className="text-xs text-error">{error}</p>}
  </div>
);

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export const CreateBusinessForm = () => {
  const { mutate, isPending, error } = useCreateBusiness();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    const dto: CreateBusinessDto = {
      name: data.name,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      botToken: data.botToken,
      telegramGroupChatId: data.telegramGroupChatId,
      botUsername: data.botUsername,
    };
    if (data.logoUrl) dto.logoUrl = data.logoUrl;
    if (data.ownerPhone) dto.ownerPhone = data.ownerPhone;
    mutate(dto);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
          {error.message}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-headline text-base font-semibold text-on-surface border-b border-outline-variant pb-2">
          Business Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business Name *" error={errors.name?.message}>
            <input {...register('name')} className={inputCls} placeholder="Beer House Yerevan" />
          </Field>
          <Field label="Logo URL" error={errors.logoUrl?.message}>
            <input {...register('logoUrl')} className={inputCls} placeholder="https://…" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-base font-semibold text-on-surface border-b border-outline-variant pb-2">
          Owner Account
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Owner Full Name *" error={errors.ownerName?.message}>
            <input {...register('ownerName')} className={inputCls} placeholder="John Doe" />
          </Field>
          <Field label="Owner Email *" error={errors.ownerEmail?.message}>
            <input
              {...register('ownerEmail')}
              type="email"
              className={inputCls}
              placeholder="owner@business.com"
            />
          </Field>
          <Field label="Owner Phone" error={errors.ownerPhone?.message}>
            <input {...register('ownerPhone')} className={inputCls} placeholder="+37400000000" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-base font-semibold text-on-surface border-b border-outline-variant pb-2">
          Telegram Bot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Bot Token *" error={errors.botToken?.message}>
            <input
              {...register('botToken')}
              className={inputCls}
              placeholder="123456789:AABBcc…"
            />
          </Field>
          <Field label="Bot Username *" error={errors.botUsername?.message}>
            <input
              {...register('botUsername')}
              className={inputCls}
              placeholder="beer_house_bot"
            />
          </Field>
          <Field label="Staff Group Chat ID *" error={errors.telegramGroupChatId?.message}>
            <input
              {...register('telegramGroupChatId')}
              className={inputCls}
              placeholder="-1001234567890"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-60"
        >
          {isPending ? 'Creating…' : 'Create Business'}
        </button>
      </div>
    </form>
  );
};
