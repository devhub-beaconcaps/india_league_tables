// app/(analysis)/heatmap/types.ts

export interface LegendItem {
    label: string;
    className: string;
}

export interface TourStep {
    id: number;
    title: string;
    description: string;
    targetRef: keyof TourRefs;
}

export interface DropdownOption {
    label: string;
    value: string | number;
}

export type MonthOption = DropdownOption;

export interface FinancialYear {
    startYear: number;
    endYear: number;
}

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface RawEntityItem {
    yoy: string | number;
    issuer_name: string;
    cy_issue_size: string | number;
}

export interface FormattedEntityItem {
    name: string;
    change: string;
    amount: string | number;
    color: string;
}

export interface HeatmapApiResponse {
    data: RawEntityItem[];
}

export type FrequencyValue = "Yearly" | "Half-Yearly" | "Quarterly" | "Monthly";
export type HalfYearlyPeriod = "H1" | "H2";
export type QuarterlyPeriod = "Q1" | "Q2" | "Q3" | "Q4";
export type SelectedPeriod = HalfYearlyPeriod | QuarterlyPeriod | number | null;

export interface TourRefs {
    participantsRef: React.RefObject<HTMLDivElement | null>;
    ranksRef: React.RefObject<HTMLDivElement | null>;
    frequencyRef: React.RefObject<HTMLDivElement | null>;
    legendRef: React.RefObject<HTMLDivElement | null>;
    searchRef: React.RefObject<HTMLDivElement | null>;
}

export interface HowToUseContent {
    description: string;
    points: string[];
}