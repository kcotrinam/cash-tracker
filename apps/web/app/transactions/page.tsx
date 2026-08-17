import { Suspense } from 'react'; import { TransactionList } from './transaction-ui';
export default function TransactionsPage() { return <Suspense fallback={<div />}> <TransactionList /> </Suspense>; }
