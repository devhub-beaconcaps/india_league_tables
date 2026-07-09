// app/(issuers)/summary/types.ts

export type FrequencyValue = 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly';
export type HalfYearlyPeriod = 'H1' | 'H2';
export type QuarterlyPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type SelectedPeriod = HalfYearlyPeriod | QuarterlyPeriod | number | null;
export type IssueType = 'size' | 'count';
export type ValueConvention = 'Crores' | 'Lakhs' | 'Billions';

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface FYOption {
    label: string;
    value: string;
    startYear: number;
}

export interface DropdownOption {
    label: string;
    value: string | number;
}

// Raw API shapes
export interface RawIssuerItem {
    id: number;
    name: string;
    currentSize: string | number;
    currentDeals: string | number;
    currentMarketShare: string | number;
    rank: string | number;
    previousSize: string | number;
    previousDeals: string | number;
    previousMarketShare: string | number;
    previousRank: string | number;
    yoyChange?: string | number;
}

export interface RawSectorItem {
    name: string;
    value: string | number;
    previousValue: string | number;
}

export interface RawOutstandingItem {
    month: string;
    issue: string | number;
    outstanding: string | number;
    redemption: string | number;
}

export interface RawDebtItem {
    label: string;
    isin_count: string | number;
    issue_size: string | number;
    year: number;
}

export interface RawRatingItem {
    name?: string;
    label?: string;
    rating_no: string | number;
}

// Formatted data shapes
export interface FormattedIssuerItem {
    id?: number;
    name: string;
    issueSize: number;
    deals: number;
    mktShare: number;
    rank: number;
    prevSize: number;
    prevDeals: number;
    prevMkt: number;
    prevRank: number;
    yoy: number;
}

export interface FormattedOutstandingItem {
    month: string;
    issue: number;
    outstanding: number;
    redemption: number;
    [key: string]: string | number;
}

export interface FormattedDebtItem {
    month: string;
    noOfIssues: number;
    issueSize: number;
    year: number;
}

export interface FormattedRatingItem {
    name: string;
    value: number;
    color: string;
}

export interface FormattedMarketShareItem {
    name: string;
    value: number;
    color: string;
}

export interface TotalsData {
    currentSize: number;
    currentDeals: number;
    previousSize: number;
    previousDeals: number;
}

export interface SectorItem {
    id: number;
    name: string;
    arr_rank: string;
    code: string;
    description: string;
    value: number;
}

export interface TableApiResponse {
    tableData: RawIssuerItem[];
    sectorData: SectorItem[];
    totals: TotalsData | null;
}

// Recharts tooltip props
export interface TooltipPayloadEntry {
    color: string;
    name: string;
    value: number | string;
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}

// Pie label props
export interface PieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
}

// Bar click data
export interface BarClickData {
    month: string;
    year: number;
}

export type BarClickHandler = (data: { payload?: BarClickData }, index: number) => void;

// SectionCard props
export interface SectionCardProps {
    children: React.ReactNode;
    className?: string;
}

export interface GetDateRangeParams {
    fy: string;
    frequency: FrequencyValue;
    period: SelectedPeriod;
}