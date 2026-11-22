import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tiendita POS',
  description: 'Punto de venta para tiendas de barrio',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
