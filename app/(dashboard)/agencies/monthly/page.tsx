'use client';

import MonthlySummaryPage from '@/components/MonthlySummaryPage';
import { fetchRatingAgencyMonthlySummaryData } from '@/features/ratingAgencies/services';

export default function AgenciesMonthWiseSummary() {
  return (
    <MonthlySummaryPage
      pageKey="rating-agencies-monthly"
      title="Rating Agencies Monthly Summary"
      breadcrumb="Rating Agencies > Monthly Summary"
      fetchMonthlyData={fetchRatingAgencyMonthlySummaryData}
      tableName="agencies"
    />
  );
}