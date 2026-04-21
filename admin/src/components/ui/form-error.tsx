type ErrorProps = {
  errorMessage?: string;
};

export const FormError = ({ errorMessage }: ErrorProps) => {
  if (!errorMessage) return null;
  return (
    <div
      role="alert"
      aria-label={errorMessage}
      className="text-sm font-semibold text-destructive"
    >
      {errorMessage}
    </div>
  );
};
