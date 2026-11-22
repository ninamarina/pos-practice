import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/States';
import { SalesView } from '@/features/sales/components/SalesView';

// SalesView reads the filters from the URL with useSearchParams, so it needs a Suspense boundary:
// without it, `next build` fails when prerendering this route.
export default function SalesPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando ventas…" />}>
      <SalesView />
    </Suspense>
  );
}
