import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  htmlFor: string; // the id of the control inside, so clicking the label focuses it and screen readers announce it
  size?: 'md' | 'sm'; // sm: compact label for filter bars
  children: ReactNode;
};

const LABEL_SIZES = {
  md: 'text-sm font-medium text-slate-700',
  sm: 'text-xs font-medium text-slate-500',
};

// Label + control. It only handles the label and the layout: the control is passed as children
// (a native <select>/<input> or the Select/Input below), so it never needs a prop per special case.
export function Field({ label, htmlFor, size = 'md', children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className={LABEL_SIZES[size]}>
        {label}
      </label>
      {children}
    </div>
  );
}
