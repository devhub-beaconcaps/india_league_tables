'use client';

import MonthlySummaryPage from '@/components/MonthlySummaryPage';
import { fetchIssuerMonthlySummaryData } from '@/features/issuers/services';

export default function IssuerMonthWiseSummary() {
  return (
    <MonthlySummaryPage
      pageKey="issuers-monthly"
      title="Issuer Monthly Summary"
      breadcrumb="Issuer > Monthly Summary"
      fetchMonthlyData={fetchIssuerMonthlySummaryData}
      tableName="issuers"
    />
  );
}