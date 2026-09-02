'use client';

import MonthlySummaryPage from '@/components/MonthlySummaryPage';
import { fetchTrusteeMonthlySummaryData } from '@/features/trustees/services';

export default function TrusteesMonthWiseSummary() {
  return (
    <MonthlySummaryPage
      pageKey="trustees-monthly"
      title="Trustees Monthly Summary"
      breadcrumb="Trustees > Monthly Summary"
      fetchMonthlyData={fetchTrusteeMonthlySummaryData}
      tableName="trustees"
    />
  );
}