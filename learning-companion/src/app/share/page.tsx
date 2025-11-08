// src/app/share/page.tsx
import { Suspense } from 'react';
import ShareView from '@/components/ShareView';

export default function SharePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShareView />
    </Suspense>
  );
}