import { Suspense } from 'react';
import { RecurringList } from './recurring-ui';
export default function RecurringPage() {
  return (
    <Suspense fallback={<div />}>
      {' '}
      <RecurringList />{' '}
    </Suspense>
  );
}
