import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Business } from '@/types/api';
import { cn } from '@/utils/cn';

type Props = {
  businesses: Business[];
  onDeactivate: (id: string, isActive: boolean) => void;
};

export const BusinessTable = ({ businesses, onDeactivate }: Props) => (
  <div className="relative overflow-x-auto bg-surface-container-lowest shadow-sm rounded-[8px] border border-outline-variant">
    <table className="w-full text-sm text-left text-on-surface-variant">
      <thead className="text-sm text-on-surface-variant bg-surface-container-low border-b border-outline-variant">
        <tr>
          {['Name', 'Owner ID', 'Earn Rate', 'Status', 'Bot Connected', 'Created', 'Actions'].map(
            (h) => (
              <th key={h} scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {businesses.map((b) => (
          <tr key={b.id} className="bg-surface-container-lowest border-b border-outline-variant last:border-0">
            <th scope="row" className="px-6 py-4 font-medium text-on-background whitespace-nowrap">
              {b.name}
            </th>
            <td className="px-6 py-4">{b.ownerId ?? '—'}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {b.earnRateMode === 'per_amd_spent'
                ? `${b.earnRateValue} AMD / pt`
                : `${b.earnRateValue} pt / visit`}
            </td>
            <td className="px-6 py-4">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  b.isActive
                    ? 'bg-tertiary/10 text-tertiary'
                    : 'bg-error/10 text-error',
                )}
              >
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4">
              {b.botToken ? (
                <CheckCircle size={16} className="text-tertiary" />
              ) : (
                <AlertTriangle size={16} className="text-secondary" />
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {new Date(b.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-4">
                <Link
                  to={`/businesses/${b.id}`}
                  className="font-medium text-primary hover:underline text-xs"
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
                    'text-xs font-medium hover:underline',
                    b.isActive ? 'text-error' : 'text-tertiary',
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
