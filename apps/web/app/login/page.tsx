import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '../auth-shell';
import { LoginForm } from './login-form';
export const metadata: Metadata = { title: 'Sign in | CashTracker' };
export default function LoginPage() { return <AuthShell description="Tus ingresos, gastos y compromisos mensuales en un solo lugar." heading="Claridad financiera sin ruido."><Suspense><LoginForm /></Suspense></AuthShell>; }
