import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '../auth-shell';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Crear cuenta | CashTracker' };

export default function RegisterPage() {
  return <AuthShell description="Registra tus ingresos, gastos y compromisos mensuales en un solo lugar." heading={<>Empieza a entender<br />mejor tus finanzas.</>}><Suspense><RegisterForm /></Suspense></AuthShell>;
}
