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
    fetchIssueDetailsFilterInputsData,
} from '@/features/issuers/services';
import { useRedemptionMonthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import CustomDropdown from '@/components/CustomDropdown';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

// Import types
import {
    FormattedIssuerItem,
    FormattedSectorItem,
    FormattedOutstandingItem,
    FormattedDebtItem,
    FormattedRatingItem,
    FormattedMarketShareItem,
    TotalsData,
    TableApiResponse,
    RawSectorItem,
    RawOutstandingItem,
    RawDebtItem,
    RawRatingItem,
    FYOption,
    DateRange,
    FrequencyValue,
    HalfYearlyPeriod,
    QuarterlyPeriod,
    SelectedPeriod,
    IssueType,
    ValueConvention,
    CustomTooltipProps,
    TooltipPayloadEntry,
    PieLabelProps,
    BarClickData,
    BarClickHandler,
    SectionCardProps,
} from './types';

// Import constants
import {
    frequencyOptions,
    monthOptions,
    valueConventionOptions,
} from './constants';

// Import utils
import {
    formatData,
    formatSectorData,
    formatOutstandingData,
    formatDebtData,
    formatMarketShareData,
    getFinancialYears,
    getDateRange,
    getCurrYearMonthDates,
    formatRatingsData,
} from './utils';

// ─── Local Types for Filters ─────────────────────────────────────────────────

interface FilterOption {
    value: string;
    label: string;
}

interface SummaryFilterState {
    issuerOwnershipType: string;
    issuerNatureType: string;
    businessSector: string;
    securityType: string;
    modeOfIssue: string;
    creditRatingAgency: string;
    creditRating: string;
    seniority: string;
    servicedFlag: string;
    listingStatus: string;
}

interface FilterInputsResponse {
    ownershipType: string[];
    nature: string[];
    sector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    securedFlag: string[];
    listingStatus: string[];
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton height={40} />
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={50} />
            ))}
        </div>
    );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div style={{ height }} className="w-full">
            <Skeleton height="100%" width="100%" />
        </div>
    );
}

function PieChartSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4">
            <Skeleton circle width={180} height={180} />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <Skeleton circle width={10} height={10} />
                        <Skeleton width={80} height={10} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function BarChartSkeleton() {
    return (
        <div className="h-[200px] w-full">
            <Skeleton height="100%" width="100%" />
        </div>
    );
}

function FilterSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                    <Skeleton height={12} width={80} />
                    <Skeleton height={36} />
                </div>
            ))}
        </div>
    );
}

// ─── Empty State Component ───────────────────────────────────────────────────

function NoDataState({ message = "No data available", subMessage }: { message?: string; subMessage?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                {message}
            </h3>
            {subMessage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                    {subMessage}
                </p>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ children, className = '' }: SectionCardProps) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}>
        {children}
    </div>
);

const FilterGroup = ({
    label,
    children,
    className = ''
}: {
    label: string;
    children: React.ReactNode;
    className?: string
}) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
        </label>
        {children}
    </div>
);

// ─── Value Formatting Helpers ────────────────────────────────────────────────

const formatValueByConvention = (value: number, convention: ValueConvention): string => {
    if (convention === 'Billions') {
        return `${(value / 100).toFixed(2)}B`;
    }
    if (convention === 'Crores') {
        return `${value.toLocaleString()} Cr`;
    }
    // Lakhs
    return `${(value * 100).toLocaleString()} L`;
};

const formatYAxisTick = (value: number, convention: ValueConvention): string => {
    if (convention === 'Billions') {
        return value >= 100 ? `${(value / 100).toFixed(0)}B` : `${(value / 100).toFixed(1)}B`;
    }
    if (convention === 'Crores') {
        return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);
    }
    // Lakhs
    return value >= 100 ? `${(value / 100).toFixed(0)}k L` : `${value} L`;
};

const CustomTooltip = ({ active, payload, label, valueConvention = 'Crores' }: CustomTooltipProps & { valueConvention?: ValueConvention }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
                {payload.map((p: TooltipPayloadEntry, i: number) => (
                    <p key={i} style={{ color: p.color }} className="text-xs">
                        {p.name}: {typeof p.value === 'number' ? formatValueByConvention(p.value, valueConvention) : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const renderLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
}: PieLabelProps) => {

    // Hide labels for slices below 5%
    if (percent * 100 < 5) {
        return null;
    }

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
            {(percent * 100).toFixed(0)}%
        </text>
    );
};

// Custom X-axis tick that stacks words vertically
const VerticalXAxisTick = ({ x, y, payload }: any) => {
    const words = String(payload?.value ?? '').split(/[\s-]+/);
    return (
        <g transform={`translate(${x},${y})`}>
            <text textAnchor="middle" fill="#9ca3af" fontSize={9}>
                {words.map((word: string, index: number) => (
                    <tspan key={index} x={0} dy={index === 0 ? 0 : 11}>
                        {word}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

// ─── Active Filter Chip Component ─────────────────────────────────────────────

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium rounded-full border border-indigo-100 dark:border-indigo-800">
            {label}
            <button onClick={onRemove} className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IssuerSummary() {
    const fyOptions = useMemo<FYOption[]>(() => getFinancialYears(), []);

    const [selectedFY, setSelectedFY] = useState<string>(fyOptions[0]?.value);
    const [frequency, setFrequency] = useState<FrequencyValue>('Yearly');
    const [period, setPeriod] = useState<SelectedPeriod>(null);
    const [issueType, setIssueType] = useState<IssueType>('size');
    const router = useRouter();

    const [valueConvention, setValueConvention] = useState<ValueConvention>('Crores');

    // ── Collapsible Filters State ──
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    // ── New Filter States ──
    const [filters, setFilters] = useState<SummaryFilterState>({
        issuerOwnershipType: '',
        issuerNatureType: '',
        businessSector: '',
        securityType: '',
        modeOfIssue: '',
        creditRatingAgency: '',
        creditRating: '',
        seniority: '',
        servicedFlag: '',
        listingStatus: '',
    });

    const [filterOptions, setFilterOptions] = useState<FilterInputsResponse>({
        ownershipType: [],
        nature: [],
        sector: [],
        securityType: [],
        modeOfIssue: [],
        creditRatingAgency: [],
        creditRating: [],
        seniority: [],
        securedFlag: [],
        listingStatus: [],
    });

    const [issueTableData, setIssueTableData] = useState<FormattedIssuerItem[]>([]);
    const [topSectorsData, setTopSectorsData] = useState<FormattedSectorItem[]>([]);
    const [outstandingData, setOutstandingData] = useState<FormattedOutstandingItem[]>([]);
    const [marketShareData, setMarketShareData] = useState<FormattedMarketShareItem[]>([]);
    const [debtScheduleCurrentData, setDebtScheduleCurrentData] = useState<FormattedDebtItem[]>([]);
    const [debtScheduleNextData, setDebtScheduleNextData] = useState<FormattedDebtItem[]>([]);
    const [ratingData, setRatingData] = useState<FormattedRatingItem[]>([]);
    const [totalsData, setTotalsData] = useState<TotalsData | null>(null);

    // Loading states
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isSectorsLoading, setIsSectorsLoading] = useState(true);
    const [isOutstandingLoading, setIsOutstandingLoading] = useState(true);
    const [isMarketShareLoading, setIsMarketShareLoading] = useState(true);
    const [isDebtLoading, setIsDebtLoading] = useState(true);
    const [isRatingLoading, setIsRatingLoading] = useState(true);
    const [isFiltersLoading, setIsFiltersLoading] = useState(true);

    const { setRedemptionMonthDateRange } = useRedemptionMonthStore();

    const selectedYearsDateRange = useMemo<DateRange | null>(
        () => getDateRange({ fy: selectedFY, frequency, period }),
        [selectedFY, frequency, period]
    );

    // ── Helpers ──
    const toOptions = (items: string[]): FilterOption[] => {
        return items.map(item => ({
            value: item,
            label: item,
        }));
    };

    const updateFilter = useCallback((key: keyof SummaryFilterState, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: String(value) }));
    }, []);

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

    const handleSearch = (): void => {
        // Filters are already in state; fetchData will auto-trigger via useEffect
        // Explicit call kept for UX consistency with detailed page
        setIsFiltersExpanded(false);
    };

    const handleReset = (): void => {
        setSelectedFY(fyOptions[0]?.value);
        setFrequency('Yearly');
        setPeriod(null);
        setValueConvention('Crores');
        setFilters({
            issuerOwnershipType: '',
            issuerNatureType: '',
            businessSector: '',
            securityType: '',
            modeOfIssue: '',
            creditRatingAgency: '',
            creditRating: '',
            seniority: '',
            servicedFlag: '',
            listingStatus: '',
        });
    };

    const handleExportCSV = useCallback(() => {
        if (!issueTableData.length) return;

        const headers = Object.keys(issueTableData[0]);
        const rows = issueTableData.map((row) =>
            headers.map((header) => {
                const cell = (row as Record<string, any>)[header];
                const str = String(cell ?? '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `top_issuers_${selectedFY}_${issueType}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [issueTableData, selectedFY, issueType]);

    // ── Active Filters Count ──
    const activeFilterCount = useMemo(() => {
        return Object.values(filters).filter(v => v !== '').length;
    }, [filters]);

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof SummaryFilterState; label: string }[] = [];
        const labelMap: Record<keyof SummaryFilterState, string> = {
            issuerOwnershipType: 'Ownership',
            issuerNatureType: 'Nature',
            businessSector: 'Sector',
            securityType: 'Security',
            modeOfIssue: 'Mode',
            creditRatingAgency: 'Agency',
            creditRating: 'Rating',
            seniority: 'Seniority',
            servicedFlag: 'Secured',
            listingStatus: 'Listing',
        };
        (Object.keys(filters) as Array<keyof SummaryFilterState>).forEach((key) => {
            if (filters[key]) {
                chips.push({ key, label: `${labelMap[key]}: ${filters[key]}` });
            }
        });
        return chips;
    }, [filters]);

    // ── Fetch Filter Inputs ──
    const fetchFilterInputs = useCallback(async () => {
        if (!selectedYearsDateRange) return;
        setIsFiltersLoading(true);
        try {
            const query = {
                startDate: selectedYearsDateRange.startDate,
                endDate: selectedYearsDateRange.endDate,
            };
            const data: FilterInputsResponse = await fetchIssueDetailsFilterInputsData(query);
            setFilterOptions(data);
        } catch (err) {
            console.error('Error fetching filter inputs:', err);
        } finally {
            setIsFiltersLoading(false);
        }
    }, [selectedYearsDateRange]);

    useEffect(() => {
        fetchFilterInputs();
    }, [fetchFilterInputs]);

    // ── Fetch Main Data ──
    const fetchData = useCallback(async (): Promise<void> => {
        if (!selectedYearsDateRange) return;

        setIsTableLoading(true);
        setIsSectorsLoading(true);
        setIsOutstandingLoading(true);
        setIsMarketShareLoading(true);
        setIsDebtLoading(true);

        const query = {
            startDate: selectedYearsDateRange.startDate,
            endDate: selectedYearsDateRange.endDate,
            issueType,
            ownershipType: filters.issuerOwnershipType,
            nature: filters.issuerNatureType,
            sector: filters.businessSector,
            securityType: filters.securityType,
            modeOfIssue: filters.modeOfIssue,
            creditRatingAgency: filters.creditRatingAgency,
            rating: filters.creditRating,
            seniority: filters.seniority,
            securedFlag: filters.servicedFlag,
            listingStatus: filters.listingStatus,
        };

        try {
            console.log('Fetching summary data with query:', query);

            const table: TableApiResponse = await fetchissuePageTableData(query);
            const sectors: RawSectorItem[] = await fetchTopSectorsData(query);
            const outstandings: RawOutstandingItem[] = await fetchOutstandingData(query);
            const marketShare = formatMarketShareData(table?.data || [], issueType);
            const currentRedemptions: RawDebtItem[] = await fetchCurrentYearRedemptionData();
            const nextRedemptions: RawDebtItem[] = await fetchNextYearRedemptionData();

            console.log('table: ', table);
            console.log('sectors', sectors);
            console.log('currentRedemptions', currentRedemptions);
            console.log('nextRedemptions', nextRedemptions);

            setIssueTableData(formatData(table?.data || []));
            setTotalsData(table?.totals);
            setTopSectorsData(formatSectorData(sectors || []));
            setOutstandingData(formatOutstandingData(outstandings || []));
            setMarketShareData(marketShare);
            setDebtScheduleCurrentData(formatDebtData(currentRedemptions || []));
            setDebtScheduleNextData(formatDebtData(nextRedemptions || []));
        } catch (err) {
            console.error('API Error:', err);
            setIssueTableData([]);
            setTopSectorsData([]);
            setOutstandingData([]);
            setMarketShareData([]);
            setDebtScheduleCurrentData([]);
            setDebtScheduleNextData([]);
        } finally {
            setIsTableLoading(false);
            setIsSectorsLoading(false);
            setIsOutstandingLoading(false);
            setIsMarketShareLoading(false);
            setIsDebtLoading(false);
        }
    }, [selectedYearsDateRange, issueType, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Fetch Ratings Data ──
    const fetchRatingsData = useCallback(async (): Promise<void> => {
        if (!selectedYearsDateRange) return;

        setIsRatingLoading(true);
        const query = {
            startDate: selectedYearsDateRange.startDate,
            endDate: selectedYearsDateRange.endDate,
            creditRatingAgency: filters.creditRatingAgency,
            ownershipType: filters.issuerOwnershipType,
            nature: filters.issuerNatureType,
            sector: filters.businessSector,
            securityType: filters.securityType,
            modeOfIssue: filters.modeOfIssue,
            rating: filters.creditRating,
            seniority: filters.seniority,
            securedFlag: filters.servicedFlag,
            listingStatus: filters.listingStatus,
        };

        try {
            const Ratings: RawRatingItem[] = await fetchCreditRatingsData(query);
            console.log("rating data", Ratings, filters.creditRatingAgency);

            setRatingData(formatRatingsData(Ratings || [], filters.creditRatingAgency));
        } catch (err) {
            console.error('API Error:', err);
            setRatingData([]);
        } finally {
            setIsRatingLoading(false);
        }
    }, [selectedYearsDateRange, filters]);

    useEffect(() => {
        fetchRatingsData();
    }, [fetchRatingsData]);

    const handleBarClick: BarClickHandler = (data): void => {
        const item = data?.payload;
        if (!item) return;
        console.log('Bar data: ', item);
        const { startDate, endDate } = getCurrYearMonthDates(String(item.month), Number(item.year));
        setRedemptionMonthDateRange({ startDate, endDate });
        console.log('Redemption date range: ', { startDate, endDate });

        router.push('/redemption');
    };

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">



                {/* ── Sticky Financial Year Filter ── */}
                <div className="sticky top-0 z-[60] pb-2 bg-[#F0F7FF] dark:bg-[var(--color-background)]">
                    <SectionCard>
                        <div className="flex items-center justify-between flex-wrap gap-3">

                            {/* ── Page Title ── */}
                            <div className="">
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Summary</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">Issuer &gt; Summary</p>
                            </div>
                            <div>
                                <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100">
                                    Financial Year
                                </h2>
                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6 mt-1">{selectedFY}</p>
                            </div>
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
                </div>

                {/* ── Content Wrapper ── */}
                <div className="">

                    {/* ── Collapsible Detailed Filters Section ── */}
                    <SectionCard className="p-0">
                        {/* Collapsed Header Bar */}
                        <button
                            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                            className="w-full flex items-center justify-between px-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                                    <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                        Detailed Filters
                                    </span>
                                    {activeFilterCount > 0 && (
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                            {activeFilterCount} active
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Active Filter Chips (visible when collapsed) */}
                                {!isFiltersExpanded && activeFilterChips.length > 0 && (
                                    <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-md">
                                        {activeFilterChips.slice(0, 3).map((chip) => (
                                            <ActiveFilterChip
                                                key={chip.key}
                                                label={chip.label}
                                                onRemove={() => updateFilter(chip.key, '')}
                                            />
                                        ))}
                                        {activeFilterChips.length > 3 && (
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                +{activeFilterChips.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        {/* Expanded Filter Content */}
                        <div
                            className={`transition-all duration-300 ease-in-out ${isFiltersExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                {isFiltersLoading ? (
                                    <FilterSkeleton />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                            <FilterGroup label="Issuer Ownership Type">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.ownershipType)}
                                                    value={filters.issuerOwnershipType}
                                                    onChange={(val) => updateFilter('issuerOwnershipType', val)}
                                                    placeholder="Select Ownership"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Issuer Nature Type">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.nature)}
                                                    value={filters.issuerNatureType}
                                                    onChange={(val) => updateFilter('issuerNatureType', val)}
                                                    placeholder="Select Nature"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Business Sector">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.sector)}
                                                    value={filters.businessSector}
                                                    onChange={(val) => updateFilter('businessSector', val)}
                                                    placeholder="Select Sector"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Security Type">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.securityType)}
                                                    value={filters.securityType}
                                                    onChange={(val) => updateFilter('securityType', val)}
                                                    placeholder="Select Security"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Mode of Issue">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.modeOfIssue)}
                                                    value={filters.modeOfIssue}
                                                    onChange={(val) => updateFilter('modeOfIssue', val)}
                                                    placeholder="Select Mode"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Credit Rating Agency">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.creditRatingAgency)}
                                                    value={filters.creditRatingAgency}
                                                    onChange={(val) => updateFilter('creditRatingAgency', val)}
                                                    placeholder="Select Agency"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Credit Rating">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.creditRating)}
                                                    value={filters.creditRating}
                                                    onChange={(val) => updateFilter('creditRating', val)}
                                                    placeholder="Select Rating"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Seniority">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.seniority)}
                                                    value={filters.seniority}
                                                    onChange={(val) => updateFilter('seniority', val)}
                                                    placeholder="Select Seniority"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Serviced Flag">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.securedFlag)}
                                                    value={filters.servicedFlag}
                                                    onChange={(val) => updateFilter('servicedFlag', val)}
                                                    placeholder="Select Flag"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Listing Status">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.listingStatus)}
                                                    value={filters.listingStatus}
                                                    onChange={(val) => updateFilter('listingStatus', val)}
                                                    placeholder="Select Status"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>
                                        </div>

                                        {/* Active Filter Chips in expanded view */}
                                        {activeFilterChips.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Active:
                                                </span>
                                                {activeFilterChips.map((chip) => (
                                                    <ActiveFilterChip
                                                        key={chip.key}
                                                        label={chip.label}
                                                        onRemove={() => updateFilter(chip.key, '')}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => setFilters({
                                                        issuerOwnershipType: '',
                                                        issuerNatureType: '',
                                                        businessSector: '',
                                                        securityType: '',
                                                        modeOfIssue: '',
                                                        creditRatingAgency: '',
                                                        creditRating: '',
                                                        seniority: '',
                                                        servicedFlag: '',
                                                        listingStatus: '',
                                                    })}
                                                    className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                                >
                                                    Clear all
                                                </button>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <button
                                                onClick={handleSearch}
                                                className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-6 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                Search
                                            </button>

                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg px-5 h-6 text-xs font-medium transition-colors duration-150"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Clear
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── Top 10 Issuers Table ── */}
                    <SectionCard className='my-3'>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Top 10 Issuers by {issueType === 'size' ? 'Issue size' : 'No of Issues'} (Rupees in {valueConvention})
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={handleExportCSV}
                                    disabled={isTableLoading || issueTableData.length === 0}
                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export CSV
                                </button>
                                <div className="w-full sm:w-auto">
                                    <CustomDropdown
                                        label="Value Convention"
                                        options={valueConventionOptions}
                                        value={valueConvention}
                                        onChange={(val) => setValueConvention(val as ValueConvention)}
                                    />
                                </div>
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
                            {isTableLoading ? (
                                <TableSkeleton />
                            ) : issueTableData.length > 0 ? (
                                <FinanceTable
                                    totalsData={totalsData}
                                    data={issueTableData}
                                    selectedFY={selectedFY}
                                    valueConvention={valueConvention}
                                    type="Issuer"
                                />
                            ) : (
                                <NoDataState message="No issuer data available" subMessage="Try adjusting your filters or selecting a different financial year." />
                            )}
                        </div>
                    </SectionCard>

                    {/* ── Sector + Market Share Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                        <SectionCard className=' my-3'>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Top 10 Business Sectors by Issue Size
                            </h2>
                            {isSectorsLoading ? (
                                <ChartSkeleton height={300} />
                            ) : topSectorsData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={340}>
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
                                                tick={<VerticalXAxisTick />}
                                                tickMargin={12}
                                                interval={0}
                                                height={60}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                tickFormatter={(v: number) => formatYAxisTick(v, valueConvention)}
                                            />
                                            <Tooltip content={<CustomTooltip valueConvention={valueConvention} />} />
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
                                </>
                            ) : (
                                <NoDataState message="No sector data available" subMessage="Sector data will appear here once available." />
                            )}
                        </SectionCard>

                        <SectionCard className=' my-3'>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Market Share Among Top 10 Issuers<br />
                                <span className="font-normal text-gray-500 dark:text-gray-400">(By Size)</span>
                            </h2>
                            {isMarketShareLoading ? (
                                <PieChartSkeleton />
                            ) : marketShareData.length > 0 ? (
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
                                                <Tooltip content={<CustomTooltip valueConvention={valueConvention} />} wrapperStyle={{ fontSize: '10px' }} />
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
                            ) : (
                                <NoDataState message="No market share data available" />
                            )}
                        </SectionCard>
                    </div>

                    {/* ── Corporate Bond Trend ── */}
                    <SectionCard className='my-3'>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Corporate Bond Outstanding Trends Analysis : {selectedFY}
                        </h2>
                        {isOutstandingLoading ? (
                            <ChartSkeleton height={300} />
                        ) : outstandingData.length > 0 ? (
                            <DualAxisChart data={outstandingData} />
                        ) : (
                            <NoDataState message="No outstanding trend data available" />
                        )}
                    </SectionCard>

                    {/* ── Debt Redemption Schedules ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[
                            { title: 'Current Financial Year', data: debtScheduleCurrentData, loading: isDebtLoading },
                            { title: 'Next Financial Year', data: debtScheduleNextData, loading: isDebtLoading },
                        ].map(({ title, data, loading }) => (
                            <SectionCard className=' my-3' key={title}>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                    Debt Redemption Schedule - {title}
                                </h2>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">
                                    Note: Click any bar in the graph to view the redemption list for that particular period.
                                </p>
                                {loading ? (
                                    <BarChartSkeleton />
                                ) : data.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 60 }} barCategoryGap="10%">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                    angle={-60}
                                                    textAnchor="end"
                                                    height={70}
                                                    tickMargin={18}
                                                    interval={0}
                                                />
                                                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <Tooltip content={<CustomTooltip valueConvention={valueConvention} />} />
                                                <Bar yAxisId="left" dataKey="noOfIssues" name="No. of Issues" fill="#645cf5ff" radius={[2, 2, 0, 0]} onClick={handleBarClick} maxBarSize={36} />
                                                <Bar yAxisId="right" dataKey="issueSize" name="Issue Size" fill="#a5b4fc" radius={[2, 2, 0, 0]} onClick={handleBarClick} maxBarSize={36} />
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
                                    </>
                                ) : (
                                    <NoDataState message={`No redemption data available for ${title}`} />
                                )}
                            </SectionCard>
                        ))}
                    </div>

                    {/* ── Credit Ratings ── */}
                    <SectionCard className='my-3'>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Credit Ratings</h2>
                            {filters.creditRatingAgency && (
                                <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                    Agency: {filters.creditRatingAgency}
                                </span>
                            )}
                        </div>

                        {isRatingLoading ? (
                            <PieChartSkeleton />
                        ) : ratingData.length > 0 ? (
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
                                            <Tooltip content={<CustomTooltip valueConvention={valueConvention} />} wrapperStyle={{ fontSize: '10px' }} />
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
                        ) : (
                            <NoDataState message="No credit rating data available" subMessage="Try selecting a different credit rating agency." />
                        )}
                    </SectionCard>
                </div>
            </div>
        </SkeletonTheme>
    );
}