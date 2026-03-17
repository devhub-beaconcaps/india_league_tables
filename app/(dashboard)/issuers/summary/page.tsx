'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import FinanceTable from '@/components/Financetable';
import DualAxisChart from '@/components/charts/DualAxisChart';
import {
    fetchCreditRatingsData,
    fetchCurrentYearRedemptionData,
    fetchissuePageTableData,
    fetchNextYearRedemptionData,
    fetchOutstandingData,
    fetchTopSectorsData,
} from '@/features/issuers/services';
import { useRedemptionMonthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import CustomDropdown from '@/components/CustomDropdown';

// ─── Types ────────────────────────────────────────────────────────────────────

type FrequencyValue = 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly';
type HalfYearlyPeriod = 'H1' | 'H2';
type QuarterlyPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type SelectedPeriod = HalfYearlyPeriod | QuarterlyPeriod | number | null;
type IssueType = 'size' | 'count';
type ValueConvention = 'Crores' | 'Lakhs';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface FYOption {
    label: string;
    value: string;
    startYear: number;
}

interface DropdownOption {
    label: string;
    value: string | number;
}

// Raw API shapes
interface RawIssuerItem {
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

interface RawSectorItem {
    name: string;
    value: string | number;
    previousValue: string | number;
}

interface RawOutstandingItem {
    month: string;
    issue: string | number;
    outstanding: string | number;
    redemption: string | number;
}

interface RawDebtItem {
    label: string;
    isin_count: string | number;
    issue_size: string | number;
    year: number;
}

interface RawRatingItem {
    name?: string;
    label?: string;
    rating_no: string | number;
}

// Formatted data shapes
interface FormattedIssuerItem {
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

interface FormattedSectorItem {
    sector: string;
    cy: number;
    py: number;
}

interface FormattedOutstandingItem {
    month: string;
    issue: number;
    outstanding: number;
    redemption: number;
    [key: string]: string | number; // satisfies DualAxisChart's ChartDataPoint index signature
}

interface FormattedDebtItem {
    month: string;
    noOfIssues: number;
    issueSize: number;
    year: number;
}

interface FormattedRatingItem {
    name: string;
    value: number;
    color: string;
}

interface FormattedMarketShareItem {
    name: string;
    value: number;
    color: string;
}

interface TotalsData {
    currentSize: number;
    currentDeals: number;
    previousSize: number;
    previousDeals: number;
}

interface TableApiResponse {
    data: RawIssuerItem[];
    totals: TotalsData | null;
}

// Recharts tooltip props
interface TooltipPayloadEntry {
    color: string;
    name: string;
    value: number | string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}

// Pie label props — all fields optional to satisfy Recharts' PieLabelRenderProps
interface PieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
}

// Bar click data
interface BarClickData {
    month: string;
    year: number;
}

// Recharts passes the data item on `payload` inside BarRectangleItem
type BarClickHandler = (data: { payload?: BarClickData }, index: number) => void;

// SectionCard props
interface SectionCardProps {
    children: React.ReactNode;
    className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatData = (data: RawIssuerItem[]): FormattedIssuerItem[] => {
    return data?.map(item => ({
        name: item.name,
        issueSize: Number(item.currentSize) || 0,
        deals: Number(item.currentDeals) || 0,
        mktShare: Number(item.currentMarketShare) || 0,
        rank: Number(item.rank) || 0,
        prevSize: Number(item.previousSize) || 0,
        prevDeals: Number(item.previousDeals) || 0,
        prevMkt: Number(item.previousMarketShare) || 0,
        prevRank: Number(item.previousRank) || 0,
        yoy: item.yoyChange ? Number(item.yoyChange) : 0,
    }));
};

const formatSectorData = (data: RawSectorItem[]): FormattedSectorItem[] => {
    return data?.map(item => ({
        sector: item.name,
        cy: Number(item.value) || 0,
        py: Number(item.previousValue) || 0,
    }));
};

function getShortForm(text: string): string {
    if (!text) return '';

    const words = text.split(/[\s\-_/]+/);
    let result = '';

    words.forEach(word => {
        if (!word) return;
        result += word[0].toUpperCase();
        for (let i = 1; i < word.length; i++) {
            if (word[i] === word[i].toUpperCase() && /[A-Z]/.test(word[i])) {
                result += word[i];
            }
        }
    });

    return result;
}

const formatOutstandingData = (data: RawOutstandingItem[]): FormattedOutstandingItem[] => {
    return data?.map(item => ({
        month: item.month,
        issue: Number(item.issue) || 0,
        outstanding: Number(item.outstanding) || 0,
        redemption: Number(item.redemption) || 0,
    }));
};

const formatDebtData = (data: RawDebtItem[]): FormattedDebtItem[] => {
    return data?.map(item => ({
        month: item.label,
        noOfIssues: Number(item.isin_count) || 0,
        issueSize: Number(item.issue_size) || 0,
        year: item.year,
    }));
};

function formatMarketShareData(
    data: RawIssuerItem[],
    issueType: IssueType
): FormattedMarketShareItem[] {
    const key = issueType === 'size' ? 'currentSize' : 'currentDeals';

    const total = data.reduce((sum, item) => sum + Number(item[key] || 0), 0);

    const generateColor = (index: number, totalItems: number): string => {
        const hue = Math.round((360 / totalItems) * index);
        return `hsl(${hue}, 60%, 50%)`;
    };

    return data.map((item, index) => {
        const value = Number(item[key] || 0);
        const percent = total ? (value / total) * 100 : 0;

        return {
            name: item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name,
            value: Number(percent.toFixed(2)),
            color: generateColor(index, data.length),
        };
    });
}

const getFinancialYears = (): FYOption[] => {
    const today = new Date();
    const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();

    return Array.from({ length: 5 }, (_, i) => {
        const start = year - i;
        const end = start + 1;
        return {
            label: `FY ${start}-${String(end).slice(-2)}`,
            value: `${start}-${end}`,
            startYear: start,
        };
    });
};

const formatDate = (year: number, month: number, day: number, time = '00:00:00'): string => {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${time}`;
};

const getFinancialYearRange = (fy: string): DateRange => {
    const startYear = Number(fy.split('-')[0]);
    const endYear = startYear + 1;
    return {
        startDate: formatDate(startYear, 3, 1),
        endDate: formatDate(endYear, 2, 31, '23:59:59'),
    };
};

interface GetDateRangeParams {
    fy: string;
    frequency: FrequencyValue;
    period: SelectedPeriod;
}

const getDateRange = ({ fy, frequency, period }: GetDateRangeParams): DateRange | null => {
    const startYear = Number(fy.split('-')[0]);
    const endYear = startYear + 1;

    if (frequency === 'Yearly') return getFinancialYearRange(fy);

    if (frequency === 'Half-Yearly') {
        return period === 'H1'
            ? {
                startDate: formatDate(startYear, 3, 1),
                endDate: formatDate(startYear, 8, 30, '23:59:59'),
            }
            : {
                startDate: formatDate(startYear, 9, 1),
                endDate: formatDate(endYear, 2, 31, '23:59:59'),
            };
    }

    if (frequency === 'Quarterly') {
        const quarters: Record<string, [number, number]> = {
            Q1: [3, 5],
            Q2: [6, 8],
            Q3: [9, 11],
            Q4: [0, 2],
        };
        const [startMonth, endMonth] = quarters[period as string];
        const year = period === 'Q4' ? endYear : startYear;
        return {
            startDate: formatDate(year, startMonth, 1),
            endDate: formatDate(year, endMonth + 1, 0, '23:59:59'),
        };
    }

    if (frequency === 'Monthly' && period !== null) {
        const monthIndex = Number(period);
        const year = monthIndex <= 2 ? endYear : startYear;
        return {
            startDate: formatDate(year, monthIndex, 1),
            endDate: formatDate(year, monthIndex + 1, 0, '23:59:59'),
        };
    }

    return null;
};

function getMonthDates(month: string, year: number): DateRange {
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const today = new Date();

    let start = new Date(year, monthIndex, 1);
    if (today.getFullYear() === year && today.getMonth() === monthIndex) {
        start = today;
    }

    const end = new Date(year, monthIndex + 1, 0);

    const format = (d: Date): string =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { startDate: format(start), endDate: format(end) };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const creditRatingAgencyOptions = [
    { label: 'All', id: '0' },
    { label: 'INDIA RATING', id: '1' },
    { label: 'CRISIL', id: '2' },
    { label: 'ICRA', id: '3' },
    { label: 'Acuite Ratings', id: '4' },
    { label: 'CARE', id: '5' },
    { label: 'BRICKWORK RATINGS', id: '6' },
    { label: 'Infomerics Valuation and Rating', id: '7' },
];

const frequencyOptions: DropdownOption[] = [
    { label: 'Yearly', value: 'Yearly' },
    { label: 'Half-Yearly', value: 'Half-Yearly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Monthly', value: 'Monthly' },
];

const monthOptions: DropdownOption[] = [
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
];

const valueConventionOptions: DropdownOption[] = [
    { label: 'Crores', value: 'Crores' },
    { label: 'Lakhs', value: 'Lakhs' },
];

const creditAgencyDropdownOptions: DropdownOption[] = creditRatingAgencyOptions.map(item => ({
    label: item.label,
    value: item.id,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ children, className = '' }: SectionCardProps) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}>
        {children}
    </div>
);

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="text-xs">
                        {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const renderLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: PieLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight="600"
        >
            {(percent * 100).toFixed(2)}%
        </text>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IssuerSummary() {
    const fyOptions = useMemo<FYOption[]>(() => getFinancialYears(), []);

    const [selectedFY, setSelectedFY] = useState<string>(fyOptions[0]?.value);
    const [frequency, setFrequency] = useState<FrequencyValue>('Yearly');
    const [period, setPeriod] = useState<SelectedPeriod>(null);
    const [issueType, setIssueType] = useState<IssueType>('size');
    const router = useRouter();

    const [valueConvention, setValueConvention] = useState<ValueConvention>('Crores');
    const [creditRatingAgency, setCreditRatingAgency] = useState<string | number>(0);
    const [issueTableData, setIssueTableData] = useState<FormattedIssuerItem[]>([]);
    const [topSectorsData, setTopSectorsData] = useState<FormattedSectorItem[]>([]);
    const [outstandingData, setOutstandingData] = useState<FormattedOutstandingItem[]>([]);
    const [marketShareData, setMarketShareData] = useState<FormattedMarketShareItem[]>([]);
    const [debtScheduleCurrentData, setDebtScheduleCurrentData] = useState<FormattedDebtItem[]>([]);
    const [debtScheduleNextData, setDebtScheduleNextData] = useState<FormattedDebtItem[]>([]);
    const [ratingData, setRatingData] = useState<FormattedRatingItem[]>([]);
    const [totalsData, setTotalsData] = useState<TotalsData | null>(null);

    const { setRedemptionMonthDateRange } = useRedemptionMonthStore();

    const selectedYearsDateRange = useMemo<DateRange | null>(
        () => getDateRange({ fy: selectedFY, frequency, period }),
        [selectedFY, frequency, period]
    );

    const handleFYChange = (value: string | number): void => {
        setSelectedFY(String(value));
    };

    const handleFrequencyChange = (value: string | number): void => {
        const freq = value as FrequencyValue;
        setFrequency(freq);

        if (freq === 'Half-Yearly') setPeriod('H1');
        else if (freq === 'Quarterly') setPeriod('Q1');
        else if (freq === 'Monthly') setPeriod(3);
        else setPeriod(null);
    };

    const handleReset = (): void => {
        setSelectedFY(fyOptions[0]?.value);
        setFrequency('Yearly');
        setPeriod(null);
        setValueConvention('Crores');
    };

    const formatRatingsData = useCallback((data: RawRatingItem[]): FormattedRatingItem[] => {
        const generateColor = (index: number, totalItems: number): string => {
            const hue = Math.round((360 / totalItems) * index);
            return `hsl(${hue}, 60%, 50%)`;
        };

        return data?.map((item, index) => ({
            name: Number(creditRatingAgency) > 0 ? (item.name ?? '') : (item.label ?? ''),
            value: Number(item.rating_no) || 0,
            color: generateColor(index, data.length),
        }));
    }, [creditRatingAgency]);

    useEffect(() => {
        if (!selectedYearsDateRange) return;

        const fetchData = async (): Promise<void> => {
            const query = {
                startDate: selectedYearsDateRange.startDate,
                endDate: selectedYearsDateRange.endDate,
                issueType,
            };

            try {
                console.log('Fetching top sectors data with date range:', selectedYearsDateRange);

                const table: TableApiResponse = await fetchissuePageTableData(query);
                const sectors: RawSectorItem[] = await fetchTopSectorsData(query);
                const outstandings: RawOutstandingItem[] = await fetchOutstandingData(query);
                const marketShare = formatMarketShareData(table?.data, issueType);
                const currentRedemptions: RawDebtItem[] = await fetchCurrentYearRedemptionData();
                const nextRedemptions: RawDebtItem[] = await fetchNextYearRedemptionData();

                console.log('table: ', table);
                console.log('sectors', sectors);

                setIssueTableData(formatData(table?.data || []));
                setTotalsData(table?.totals);
                setTopSectorsData(formatSectorData(sectors));
                setOutstandingData(formatOutstandingData(outstandings));
                setMarketShareData(marketShare);
                setDebtScheduleCurrentData(formatDebtData(currentRedemptions));
                setDebtScheduleNextData(formatDebtData(nextRedemptions));
            } catch (err) {
                console.error('API Error:', err);
            }
        };

        fetchData();
    }, [selectedYearsDateRange, issueType]);

    useEffect(() => {
        if (!selectedYearsDateRange) return;

        const fetchData = async (): Promise<void> => {
            const query = {
                startDate: selectedYearsDateRange.startDate,
                endDate: selectedYearsDateRange.endDate,
                id: Number(creditRatingAgency) || 0,
            };

            try {
                const Ratings: RawRatingItem[] = await fetchCreditRatingsData(query);
                setRatingData(formatRatingsData(Ratings));
            } catch (err) {
                console.error('API Error:', err);
            }
        };

        fetchData();
    }, [selectedYearsDateRange, creditRatingAgency, formatRatingsData]);

    const handleBarClick: BarClickHandler = (data): void => {
        const item = data?.payload;
        if (!item) return;
        console.log('Bar data: ', item);
        const { startDate, endDate } = getMonthDates(item.month, item.year);
        setRedemptionMonthDateRange({ startDate, endDate });
        router.push('/redemption');
    };

    return (
        <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

            {/* ── Page Title ── */}
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Summary</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">Issuer &gt; Summary</p>
            </div>

            {/* ── Financial Year Filter ── */}
            <SectionCard>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100">
                        Financial Year: {selectedFY}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                        <div className="w-full sm:w-auto">
                            <CustomDropdown
                                label="Financial Year"
                                options={fyOptions}
                                value={selectedFY}
                                onChange={handleFYChange}
                            />
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <CustomDropdown
                                label="Frequency"
                                options={frequencyOptions}
                                value={frequency}
                                onChange={handleFrequencyChange}
                            />
                        </div>

                        {frequency === 'Half-Yearly' && (
                            <div className="flex gap-2 mt-2">
                                {(['H1', 'H2'] as HalfYearlyPeriod[]).map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setPeriod(h)}
                                        className={`px-3 py-1 rounded-full text-xs ${period === h
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                                            }`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        )}

                        {frequency === 'Quarterly' && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {(['Q1', 'Q2', 'Q3', 'Q4'] as QuarterlyPeriod[]).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setPeriod(q)}
                                        className={`px-3 py-1 rounded-full text-xs ${period === q
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                                            }`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {frequency === 'Monthly' && (
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <CustomDropdown
                                    label="Months"
                                    options={monthOptions}
                                    value={period as number}
                                    onChange={(val) => setPeriod(Number(val))}
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] text-transparent">.</label>
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-[12px] px-5 h-10 md:h-6 text-xs md:text-[9px] transition-colors duration-150 cursor-pointer w-full sm:w-auto"
                            >
                                <svg
                                    className="w-4 h-4 md:w-3.5 md:h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── Top 10 Issuers Table ── */}
            <SectionCard>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Top 10 Issuers by {issueType === 'size' ? 'Issue size' : 'No of Issues'} (Rupees in Crores)
                    </h2>
                    <div className="w-full sm:w-auto">
                        <CustomDropdown
                            label="Value Convention"
                            options={valueConventionOptions}
                            value={valueConvention}
                            onChange={(val) => setValueConvention(val as ValueConvention)}
                        />
                    </div>
                </div>

                <div className="flex flex-row justify-center items-center">
                    <div className="flex flex-row justify-center mb-4 rounded-full border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800 p-0.5 w-fit">
                        <button
                            onClick={() => setIssueType('size')}
                            className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${issueType === 'size'
                                ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            ISSUE SIZE
                        </button>
                        <button
                            onClick={() => setIssueType('count')}
                            className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${issueType === 'count'
                                ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            NO. OF ISSUES
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <FinanceTable
                        totalsData={totalsData}
                        data={issueTableData}
                        selectedFY={selectedFY}
                        valueConvention={valueConvention}
                    />
                </div>
            </SectionCard>

            {/* ── Sector + Market Share Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <SectionCard>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Top 10 Business Sectors by Issue Size
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={topSectorsData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                            <defs>
                                <linearGradient id="cyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#423CAB" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#423CAB" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="pyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
                            <XAxis
                                dataKey="sector"
                                tick={{ fontSize: 9, fill: '#9ca3af' }}
                                tickFormatter={getShortForm}
                                tickMargin={12}
                                interval={0}
                                angle={-30}
                                textAnchor="end"
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: '#9ca3af' }}
                                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="cy"
                                name={issueType === 'count' ? 'CY Issue Count' : 'CY Issue Size'}
                                stroke="#7c3aed"
                                strokeWidth={2}
                                fill="url(#cyGrad)"
                                dot={{ r: 3, fill: '#7c3aed' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="py"
                                name={issueType === 'count' ? 'PY Issue Count' : 'PY Issue Size'}
                                stroke="#ec4899"
                                strokeWidth={2}
                                fill="url(#pyGrad)"
                                dot={{ r: 3, fill: '#ec4899' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 justify-center mt-1">
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block" />
                            CY Issue Size
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <span className="w-3 h-3 rounded-full bg-[#ec4899] inline-block" />
                            PY Issue Size
                        </span>
                    </div>
                </SectionCard>

                <SectionCard>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Market Share Among Top 10 Issuers<br />
                        <span className="font-normal text-gray-500 dark:text-gray-400">(By Size)</span>
                    </h2>
                    <div className="flex flex-col items-center gap-4">
                        <div style={{ flex: '0 0 180px' }}>
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie
                                        data={marketShareData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={85}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        labelLine={false}
                                        label={renderLabel}
                                    >
                                        {marketShareData?.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
                            {marketShareData?.map((d, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                    <span
                                        className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: d.color }}
                                    />
                                    <span className="text-[9px] text-gray-600 dark:text-gray-400 leading-tight">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ── Corporate Bond Trend ── */}
            <SectionCard>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Corporate Bond Outstanding Trends Analysis : {selectedFY}
                </h2>
                <DualAxisChart data={outstandingData} />
            </SectionCard>

            {/* ── Debt Redemption Schedules ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                    { title: 'Current Financial Year', data: debtScheduleCurrentData },
                    { title: 'Next Financial Year', data: debtScheduleNextData },
                ].map(({ title, data }) => (
                    <SectionCard key={title}>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                            Debt Redemption Schedule - {title}
                        </h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">
                            Note: Click any bar in the graph to view the redemption list for that particular period.
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar yAxisId="left" dataKey="noOfIssues" name="No. of Issues" fill="#423CAB" radius={[2, 2, 0, 0]} onClick={handleBarClick} />
                                <Bar yAxisId="right" dataKey="issueSize" name="Issue Size" fill="#a5b4fc" radius={[2, 2, 0, 0]} onClick={handleBarClick} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-4 justify-center mt-1">
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block" />No. of Issues
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span className="w-3 h-3 rounded-full bg-[#a5b4fc] inline-block" />Issue Size
                            </span>
                        </div>
                    </SectionCard>
                ))}
            </div>

            {/* ── Credit Ratings ── */}
            <SectionCard>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Credit Ratings</h2>
                    <div className="flex flex-col gap-0.5">
                        <CustomDropdown
                            label="Credit Rating Agency"
                            options={creditAgencyDropdownOptions}
                            value={creditRatingAgency}
                            onChange={(val) => setCreditRatingAgency(val)}
                            width="min-w-[200px]"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-8 flex-wrap">
                    <div className="relative">
                        <ResponsiveContainer width={220} height={220}>
                            <PieChart>
                                <Pie
                                    data={ratingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={110}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderLabel}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {ratingData?.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {ratingData?.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-[10px] text-gray-600 dark:text-gray-400">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}