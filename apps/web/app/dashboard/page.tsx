import { Suspense } from 'react';
import { DashboardClient } from './dashboard-client';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0e141a]" />}>
      <DashboardClient />
    </Suspense>
  );
}
