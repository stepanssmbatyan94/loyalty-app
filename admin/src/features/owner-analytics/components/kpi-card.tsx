import { cn } from '@/utils/cn';

interface KpiCardProps {
  label: string;
  value: number | string;
  className?: string;
}

export function KpiCard({ label, value, className }: KpiCardProps) {
  return (
    <div className={cn('rounded-xl border bg-surface-container-lowest p-6 shadow-sm', className)}>
      <p className="font-label text-sm text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-3xl font-bold text-on-background">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
