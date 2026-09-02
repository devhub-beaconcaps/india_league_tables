'use client';

import MonthlySummaryPage from '@/components/MonthlySummaryPage';
import { fetchArrangerMonthlySummaryData } from '@/features/arrangers/services';

export default function ArrangerMonthWiseSummary() {
  return (
    <MonthlySummaryPage
      pageKey="arrangers-monthly"
      title="Arrangers Monthly Summary"
      breadcrumb="Arrangers > Monthly Summary"
      fetchMonthlyData={fetchArrangerMonthlySummaryData}
      tableName="arrangers"
    />
  );
}