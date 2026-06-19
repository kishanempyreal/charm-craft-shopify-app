'use client';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import './polaris.css';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  return (
    <AppProvider i18n={en}>
      <div style={{ minHeight: '100vh', background: '#f6f6f7' }}>
        {children}
      </div>
    </AppProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
