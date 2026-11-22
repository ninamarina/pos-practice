import type { ComponentProps } from 'react';

// Shared look of form controls, including the disabled state.
// Width is left to the caller (e.g. className="w-full" in a form).
// Text stays at 16px: smaller text makes Safari on iPad/iPhone zoom in when the control gets focus.
export const controlClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

// A native <select>: options go as children, so groups, an "all" option or any value work without extra props
export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${controlClass} ${className}`} {...props} />;
}
