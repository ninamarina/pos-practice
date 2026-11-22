import type { ReactNode } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-slate-500">
      <Spinner label={label} />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 p-10 text-center text-slate-600">
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="p-10 text-center text-slate-500">{children}</div>;
}
