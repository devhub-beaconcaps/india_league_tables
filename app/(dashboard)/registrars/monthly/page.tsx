'use client';

import MonthlySummaryPage from '@/components/MonthlySummaryPage';
import { fetchRegistrarMonthlySummaryData } from '@/features/registrars/services';

export default function RegistrarsMonthWiseSummary() {
  return (
    <MonthlySummaryPage
      pageKey="registrars-monthly"
      title="Registrars Monthly Summary"
      breadcrumb="Registrars > Monthly Summary"
      fetchMonthlyData={fetchRegistrarMonthlySummaryData}
      tableName="registrars"
    />
  );
}