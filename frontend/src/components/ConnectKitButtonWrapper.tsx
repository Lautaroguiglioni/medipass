'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ConnectKitButton to safely prevent SSR hydration mismatches in clientside-only components
const ConnectKitButton = dynamic(
  () => import('connectkit').then((mod) => mod.ConnectKitButton),
  { ssr: false }
);

export default function ConnectKitButtonWrapper() {
  return (
    <div className="relative group">
      <ConnectKitButton />
    </div>
  );
}
