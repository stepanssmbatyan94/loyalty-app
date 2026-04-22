import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CreateBusinessForm } from '@/features/businesses/components/create-business-form';

export const BusinessesNewPage = () => (
  <div className="space-y-6 max-w-3xl">
    <div className="flex items-center gap-3">
      <Link
        to="/businesses"
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
      >
        <ChevronLeft size={16} />
        Back to Businesses
      </Link>
    </div>

    <h1 className="font-headline text-2xl font-bold text-on-background">New Business</h1>
    <p className="text-sm text-on-surface-variant">
      Provisioning a business will create the owner account, register the Telegram bot webhook,
      and email credentials to the owner.
    </p>

    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
      <CreateBusinessForm />
    </div>
  </div>
);
