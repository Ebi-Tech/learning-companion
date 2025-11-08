// src/app/ServiceWorkerScript.tsx
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerScript() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
        })
        .catch((err) => {
          console.error('Service Worker failed:', err);
        });
    }
  }, []);

  return null;
}