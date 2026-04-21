import * as React from 'react';
import { type FieldError } from 'react-hook-form';

import { FormError } from './form-error';
import { Label } from './label';

type FieldWrapperProps = {
  label?: string;
  className?: string;
  children: React.ReactNode;
  error?: FieldError | undefined;
};

export type FieldWrapperPassThroughProps = Omit<FieldWrapperProps, 'className' | 'children'>;

export const FieldWrapper = ({ label, error, children }: FieldWrapperProps) => (
  <div>
    <Label>
      {label}
      <div className="mt-1">{children}</div>
    </Label>
    <FormError errorMessage={error?.message} />
  </div>
);
