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
import { Search, X } from 'lucide-react';

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
    getShortForm,
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
    issuerName: string;
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
    taxFree: string;
    dealSizeInCr: string;
}

interface FilterInputsResponse {
    taxFree: string[];
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

function ChartSkeleton({ height = 220 }: { height?: number }) {
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
            {[...Array(13)].map((_, i) => (
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

const TextInput = ({
    value,
    onChange,
    placeholder,
    type = 'text'
}: {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-6 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
            text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
            placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
);

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
                {payload.map((p: TooltipPayloadEntry, i: number) => (
                    <p key={i} style={{ color: p.color }} className="text-xs">
                        {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IssuerSummary() {
    const fyOptions = useMemo<FYOption[]>(() => getFinancialYears(), []);

    const [selectedFY, setSelectedFY] = useState<string>(fyOptions[0]?.value);
    const [frequency, setFrequency] = useState<FrequencyValue>('Yearly');
    const [period, setPeriod] = useState<SelectedPeriod>(null);
    const [issueType, setIssueType] = useState<IssueType>('size');
    const router = useRouter();

    const [valueConvention, setValueConvention] = useState<ValueConvention>('Crores');
    
    // ── New Filter States ──
    const [filters, setFilters] = useState<SummaryFilterState>({
        issuerName: '',
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
        taxFree: '',
        dealSizeInCr: '',
    });

    const [filterOptions, setFilterOptions] = useState<FilterInputsResponse>({
        taxFree: [],
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
    };

    const handleReset = (): void => {
        setSelectedFY(fyOptions[0]?.value);
        setFrequency('Yearly');
        setPeriod(null);
        setValueConvention('Crores');
        setFilters({
            issuerName: '',
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
            taxFree: '',
            dealSizeInCr: '',
        });
    };

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
            issuerName: filters.issuerName,
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
            taxFree: filters.taxFree,
            dealSize: filters.dealSizeInCr,
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
            console.log('currentRedemptions',currentRedemptions);
            console.log('nextRedemptions',nextRedemptions);

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
            issuerName: filters.issuerName,
            ownershipType: filters.issuerOwnershipType,
            nature: filters.issuerNatureType,
            sector: filters.businessSector,
            securityType: filters.securityType,
            modeOfIssue: filters.modeOfIssue,
            rating: filters.creditRating,
            seniority: filters.seniority,
            securedFlag: filters.servicedFlag,
            listingStatus: filters.listingStatus,
            taxFree: filters.taxFree,
            dealSize: filters.dealSizeInCr,
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

                {/* ── Detailed Filters Section ── */}
                <SectionCard className="p-5">
                    {isFiltersLoading ? (
                        <FilterSkeleton />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                <FilterGroup label="Issuer Name">
                                    <TextInput
                                        value={filters.issuerName}
                                        onChange={(val) => updateFilter('issuerName', val)}
                                        placeholder="Enter Issuer Name"
                                        type="text"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Issuer Ownership Type">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.ownershipType)}
                                        value={filters.issuerOwnershipType}
                                        onChange={(val) => updateFilter('issuerOwnershipType', val)}
                                        placeholder="Select Ownership"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Issuer Nature Type">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.nature)}
                                        value={filters.issuerNatureType}
                                        onChange={(val) => updateFilter('issuerNatureType', val)}
                                        placeholder="Select Nature"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Business Sector">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.sector)}
                                        value={filters.businessSector}
                                        onChange={(val) => updateFilter('businessSector', val)}
                                        placeholder="Select Sector"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Security Type">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.securityType)}
                                        value={filters.securityType}
                                        onChange={(val) => updateFilter('securityType', val)}
                                        placeholder="Select Security"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Mode of Issue">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.modeOfIssue)}
                                        value={filters.modeOfIssue}
                                        onChange={(val) => updateFilter('modeOfIssue', val)}
                                        placeholder="Select Mode"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Credit Rating Agency">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.creditRatingAgency)}
                                        value={filters.creditRatingAgency}
                                        onChange={(val) => updateFilter('creditRatingAgency', val)}
                                        placeholder="Select Agency"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Credit Rating">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.creditRating)}
                                        value={filters.creditRating}
                                        onChange={(val) => updateFilter('creditRating', val)}
                                        placeholder="Select Rating"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Seniority">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.seniority)}
                                        value={filters.seniority}
                                        onChange={(val) => updateFilter('seniority', val)}
                                        placeholder="Select Seniority"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Serviced Flag">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.securedFlag)}
                                        value={filters.servicedFlag}
                                        onChange={(val) => updateFilter('servicedFlag', val)}
                                        placeholder="Select Flag"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Listing Status">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.listingStatus)}
                                        value={filters.listingStatus}
                                        onChange={(val) => updateFilter('listingStatus', val)}
                                        placeholder="Select Status"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Tax Free">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.taxFree)}
                                        value={filters.taxFree}
                                        onChange={(val) => updateFilter('taxFree', val)}
                                        placeholder="Select Tax Status"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Deal Size (in Cr)">
                                    <TextInput
                                        value={filters.dealSizeInCr}
                                        onChange={(val) => updateFilter('dealSizeInCr', val)}
                                        placeholder="Enter Size"
                                        type="number"
                                    />
                                </FilterGroup>
                            </div>

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
                    <SectionCard>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Top 10 Business Sectors by Issue Size
                        </h2>
                        {isSectorsLoading ? (
                            <ChartSkeleton height={220} />
                        ) : topSectorsData.length > 0 ? (
                            <>
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
                            </>
                        ) : (
                            <NoDataState message="No sector data available" subMessage="Sector data will appear here once available." />
                        )}
                    </SectionCard>

                    <SectionCard>
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
                        ) : (
                            <NoDataState message="No market share data available" />
                        )}
                    </SectionCard>
                </div>

                {/* ── Corporate Bond Trend ── */}
                <SectionCard>
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
                        <SectionCard key={title}>
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
                                            <Tooltip content={<CustomTooltip />} />
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
                <SectionCard>
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
                    ) : (
                        <NoDataState message="No credit rating data available" subMessage="Try selecting a different credit rating agency." />
                    )}
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}