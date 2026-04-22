import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBusinesses } from '@/features/businesses/api/get-businesses';
import { updateBusiness } from '@/features/businesses/api/update-business';
import { BusinessTable } from '@/features/businesses/components/business-table';

const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-12 rounded-lg bg-surface-container animate-pulse" />
    ))}
  </div>
);

const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2 mt-4">
    <button
      onClick={() => onChange(page - 1)}
      disabled={page <= 1}
      className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40"
    >
      Previous
    </button>
    <span className="text-sm text-on-surface-variant">
      Page {page} of {totalPages}
    </span>
    <button
      onClick={() => onChange(page + 1)}
      disabled={page >= totalPages}
      className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm disabled:opacity-40"
    >
      Next
    </button>
  </div>
);

export const BusinessesPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBusinesses({ page });
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBusiness(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });

  const handleToggleActive = (id: string, currentlyActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !currentlyActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-on-background">Businesses</h1>
        <Link to="/businesses/new">
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm">
            + New Business
          </button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : data?.data && data.data.length > 0 ? (
        <>
          <BusinessTable
            businesses={data.data}
            onDeactivate={handleToggleActive}
          />
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        </>
      ) : (
        <p className="text-on-surface-variant text-sm">No businesses yet. Create the first one.</p>
      )}
    </div>
  );
};
