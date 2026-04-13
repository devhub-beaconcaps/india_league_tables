// app/(dashboard)/dashboard/types.ts

export interface FinancialYear {
  label: string;
  value: string;
  startYear: number;
}

export interface StatCardData {
  label: string;
  value: string;
  change: string;
  color: string;
  icon: string;
}

export interface TableRow {
  name: string;
  noIssuer: string | number;
  issueSize: string | number;
  active?: boolean;
}

export interface SectorData {
  business_name: string;
  issue_size: number;
  no_of_issue: number;
  color: string;
}

export interface AgencyData {
  label: string;
  rating_no: number;
  percentage: number;
  color: string;
}

export interface MonthlyVolumeData {
  month_name: string;
  current_year_issue_count: number | string;
  current_year_issue_size: number | string;
  previous_year_issue_count: number | string;
  previous_year_issue_size: number | string;
}

export interface IssueTrendData {
  years: string;
  total_issue_size_cr: number | string;
  total_no_of_issues: number | string;
}

export interface StatsApiResponse {
  largest_issue_size: number;
  total_issues: number;
  avg_issue_size_in_cr: number;
  total_volume_in_cr: number;
  total_issue_size_in_cr: number;
  top_sector_by_volume: string;
}

export interface SectorsApiResponse {
  issuers?: SectorData[];
  arrangers?: SectorData[];
  trustees?: SectorData[];
  registrars?: SectorData[];
  ratingAgencies?: SectorData[];
}

export interface AgencyApiResponse {
  issuers?: AgencyData[];
  arrangers?: AgencyData[];
  trustees?: AgencyData[];
  registrars?: AgencyData[];
  ratingAgencies?: AgencyData[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface StatCardProps {
  label: string;
  value: string;
  change: string;
  color: string;
  icon: string;
}

export interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export type TabType = 'issuers' | 'arrangers' | 'trustees' | 'registrars' | 'rating agency';