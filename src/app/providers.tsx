'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { CartProvider } from '@/features/cart/CartProvider';
import { SessionProvider } from '@/features/session/SessionProvider';

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser tab; created lazily so it isn't shared between server requests.
  // A default staleTime avoids refetching on every mount and window focus. Each query can ask for more or less.
  // Fresh data still comes from our own mutations (setQueryData); changes made elsewhere would need polling or push
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CartProvider>{children}</CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
