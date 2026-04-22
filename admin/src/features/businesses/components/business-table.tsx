import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Business } from '@/types/api';
import { cn } from '@/utils/cn';

type Props = {
  businesses: Business[];
  onDeactivate: (id: string, isActive: boolean) => void;
};

export const BusinessTable = ({ businesses, onDeactivate }: Props) => (
  <div className="overflow-x-auto rounded-xl border border-outline-variant">
    <table className="w-full text-sm">
      <thead className="bg-surface-container text-on-surface-variant">
        <tr>
          {['Name', 'Owner ID', 'Earn Rate', 'Status', 'Bot Connected', 'Created', 'Actions'].map(
            (h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                {h}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant">
        {businesses.map((b) => (
          <tr key={b.id} className="hover:bg-surface-container-lowest transition-colors">
            <td className="px-4 py-3 font-medium text-on-surface">{b.name}</td>
            <td className="px-4 py-3 text-on-surface-variant">{b.ownerId ?? '—'}</td>
            <td className="px-4 py-3 text-on-surface-variant">
              {b.earnRateMode === 'per_amd_spent'
                ? `${b.earnRateValue} AMD / pt`
                : `${b.earnRateValue} pt / visit`}
            </td>
            <td className="px-4 py-3">
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-bold',
                  b.isActive
                    ? 'bg-tertiary/10 text-tertiary'
                    : 'bg-error/10 text-error',
                )}
              >
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3">
              {b.botToken ? (
                <CheckCircle size={16} className="text-tertiary" />
              ) : (
                <AlertTriangle size={16} className="text-secondary" />
              )}
            </td>
            <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
              {new Date(b.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Link
                  to={`/businesses/${b.id}`}
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  View
                </Link>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        b.isActive
                          ? 'Deactivate this business? Owner and cashiers will lose access.'
                          : 'Reactivate this business?',
                      )
                    ) {
                      onDeactivate(b.id, b.isActive);
                    }
                  }}
                  className={cn(
                    'text-xs font-semibold',
                    b.isActive ? 'text-error hover:underline' : 'text-tertiary hover:underline',
                  )}
                >
                  {b.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
