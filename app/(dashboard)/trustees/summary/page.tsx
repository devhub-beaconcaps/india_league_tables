'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import FinanceTable from '@/components/Financetable';
import CustomDropdown from '@/components/CustomDropdown';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

// Import types
import {
    FormattedIssuerItem,
    FormattedRatingItem,
    FormattedMarketShareItem,
    TotalsData,
    TableApiResponse,
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
    SectionCardProps,
    SectorItem,
} from './types';

// Import constants
import {
    frequencyOptions,
    monthOptions,
    valueConventionOptions,
    creditAgencyDropdownOptions,
} from './constants';

// Import utils
import {
    formatData,
    formatMarketShareData,
    getFinancialYears,
    getDateRange,
    formatRatingsData,
} from './utils';
import StackedChart from '@/components/charts/StackedChart';
import ScrollableTable from '@/components/ScrollableTable';
import { fetchTrusteePageCreditRatingsData, fetchTrusteePageTrusteesData } from '@/features/trustees/services';
import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';

// ─── Types ─────────────────────────────────────────────────────────────────

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

interface FilterState {
    trustee: string;
    issuerOwnershipType: string;
    issuerNatureType: string;
    businessSector: string;
    securityType: string;
    modeOfIssue: string;
    creditRating: string;
    seniority: string;
    servicedFlag: string;
    listingStatus: string;
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
        className="w-full h-8 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
            text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
            placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
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
    const percentage = percent * 100;
    if (percentage <= 5) return null;

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
            {percentage.toFixed(2)}%
        </text>
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

// ─── Credit Ratings Section (Isolated Component) ─────────────────────────────

// ─── Credit Ratings Section (Isolated Component) ─────────────────────────────

interface CreditRatingsSectionProps {
    selectedYearsDateRange: DateRange | null;
    filters: FilterState;
    valueConvention: ValueConvention;
    creditRatingAgency: string | number;
    trusteeOptions: { value: string; label: string }[];
}

function CreditRatingsSection({ selectedYearsDateRange, filters, valueConvention, creditRatingAgency, trusteeOptions }: CreditRatingsSectionProps) {
    const [ratingData, setRatingData] = useState<FormattedRatingItem[]>([]);
    const [isRatingLoading, setIsRatingLoading] = useState(true);
    const [selectedRatingTrustee, setSelectedRatingTrustee] = useState<string>('');

    const prevQueryRef = useRef<string>('');

    useEffect(() => {
        if (!selectedYearsDateRange) return;

        const fetchData = async (): Promise<void> => {
            const query: Record<string, any> = {
                startDate: selectedYearsDateRange.startDate,
                endDate: selectedYearsDateRange.endDate,
                id: Number(creditRatingAgency) || 0,
            };

            const trusteeValue = selectedRatingTrustee || filters.trustee;
            if (trusteeValue) query.trustee = trusteeValue;
            if (filters.issuerOwnershipType) query.ownershipType = filters.issuerOwnershipType;
            if (filters.issuerNatureType) query.nature = filters.issuerNatureType;
            if (filters.businessSector) query.sector = filters.businessSector;
            if (filters.securityType) query.securityType = filters.securityType;
            if (filters.modeOfIssue) query.modeOfIssue = filters.modeOfIssue;
            if (filters.creditRating) query.rating = filters.creditRating;
            if (filters.seniority) query.seniority = filters.seniority;
            if (filters.servicedFlag) query.securedFlag = filters.servicedFlag;
            if (filters.listingStatus) query.listingStatus = filters.listingStatus;

            const queryKey = JSON.stringify(query);
            if (prevQueryRef.current === queryKey) return;
            prevQueryRef.current = queryKey;

            setIsRatingLoading(true);

            try {
                const Ratings: RawRatingItem[] = await fetchTrusteePageCreditRatingsData(query);
                setRatingData(formatRatingsData(Ratings || [], creditRatingAgency));
            } catch (err) {
                console.error('API Error:', err);
                setRatingData([]);
            } finally {
                setIsRatingLoading(false);
            }
        };

        fetchData();
    }, [selectedYearsDateRange, filters, selectedRatingTrustee, creditRatingAgency]);

    return (
        <SectionCard className='my-3'>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Credit Ratings</h2>
                <div className="w-48">
                    <CustomDropdown
                        label="Trustee"
                        options={[{ value: '', label: 'All Trustees' }, ...trusteeOptions]}
                        value={selectedRatingTrustee}
                        onChange={(val) => setSelectedRatingTrustee(String(val))}
                        placeholder="Select Trustee"
                    />
                </div>
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
                <NoDataState message="No credit rating data available" subMessage="Try selecting a different trustee or credit rating agency." />
            )}
        </SectionCard>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Summary() {
    const fyOptions = useMemo<FYOption[]>(() => getFinancialYears(), []);

    const [selectedFY, setSelectedFY] = useState<string>(fyOptions[0]?.value);
    const [frequency, setFrequency] = useState<FrequencyValue>('Yearly');
    const [period, setPeriod] = useState<SelectedPeriod>(null);
    const [issueType, setIssueType] = useState<IssueType>('size');
    const [valueConvention, setValueConvention] = useState<ValueConvention>('Crores');
    const [creditRatingAgency, setCreditRatingAgency] = useState<string | number>(0);

    // ── Collapsible Filters State ──
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    const [issueTableData, setIssueTableData] = useState<FormattedIssuerItem[]>([]);
    const [listTableData, setListTableData] = useState<FormattedIssuerItem[]>([]);
    const [topSectorsData, setTopSectorsData] = useState<SectorItem[]>([]);
    const [marketShareData, setMarketShareData] = useState<FormattedMarketShareItem[]>([]);
    const [totalsData, setTotalsData] = useState<TotalsData | null>(null);

    // Loading states
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isSectorsLoading, setIsSectorsLoading] = useState(true);
    const [isMarketShareLoading, setIsMarketShareLoading] = useState(true);
    const [isFiltersLoading, setIsFiltersLoading] = useState(true);

    // ─── New Filter States ───────────────────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>({
        trustee: '',
        issuerOwnershipType: '',
        issuerNatureType: '',
        businessSector: '',
        securityType: '',
        modeOfIssue: '',
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

    const selectedYearsDateRange = useMemo<DateRange | null>(
        () => getDateRange({ fy: selectedFY, frequency, period }),
        [selectedFY, frequency, period]
    );

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const updateFilter = useCallback((key: keyof FilterState, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: String(value) }));
    }, []);

    const toOptions = (items: string[]) => items.map(item => ({ value: item, label: item }));

    const handleFYChange = (value: string | number): void => setSelectedFY(String(value));

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
        setIsFiltersExpanded(false);
    };

    const handleReset = (): void => {
        setSelectedFY(fyOptions[0]?.value);
        setFrequency('Yearly');
        setPeriod(null);
        setValueConvention('Crores');
        setCreditRatingAgency(0);
        setFilters({
            trustee: '',
            issuerOwnershipType: '',
            issuerNatureType: '',
            businessSector: '',
            securityType: '',
            modeOfIssue: '',
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
        link.download = `top_trustees_${selectedFY}_${issueType}.csv`;
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
        const chips: { key: keyof FilterState; label: string }[] = [];
        const labelMap: Record<keyof FilterState, string> = {
            trustee: 'Trustee',
            issuerOwnershipType: 'Ownership',
            issuerNatureType: 'Nature',
            businessSector: 'Sector',
            securityType: 'Security',
            modeOfIssue: 'Mode',
            creditRating: 'Rating',
            seniority: 'Seniority',
            servicedFlag: 'Secured',
            listingStatus: 'Listing',
        };
        (Object.keys(filters) as Array<keyof FilterState>).forEach((key) => {
            if (filters[key]) {
                chips.push({ key, label: `${labelMap[key]}: ${filters[key]}` });
            }
        });
        return chips;
    }, [filters]);

    // ── Trustee Options for Ratings Dropdown ──
    const trusteeOptionsForRatings = useMemo(() => {
        const names = new Set<string>();
        listTableData.forEach((item) => {
            const name = (item as any).trustee || (item as any).name || (item as any).issuerName || '';
            if (name) names.add(name);
        });
        return Array.from(names).sort().map(name => ({ value: name, label: name }));
    }, [listTableData]);

    /**
     * Build query payload for the backend.
     * IMPORTANT: Only include properties that have real values.
     * Sending "" or "0" for creditRatingAgency causes the backend
     * to apply a filter on short_name = '0', which returns nothing.
     */
    const buildQuery = useCallback((extra: Record<string, any> = {}) => {
        if (!selectedYearsDateRange) return {};

        const query: Record<string, any> = {
            startDate: selectedYearsDateRange.startDate,
            endDate: selectedYearsDateRange.endDate,
            issueType,
            ...extra,
        };

        // Add filters only when they have non-empty values
        if (filters.trustee) query.trustee = filters.trustee;
        if (filters.issuerOwnershipType) query.ownershipType = filters.issuerOwnershipType;
        if (filters.issuerNatureType) query.nature = filters.issuerNatureType;
        if (filters.businessSector) query.sector = filters.businessSector;
        if (filters.securityType) query.securityType = filters.securityType;
        if (filters.modeOfIssue) query.modeOfIssue = filters.modeOfIssue;
        if (filters.creditRating) query.rating = filters.creditRating;
        if (filters.seniority) query.seniority = filters.seniority;
        if (filters.servicedFlag) query.securedFlag = filters.servicedFlag;
        if (filters.listingStatus) query.listingStatus = filters.listingStatus;

        // creditRatingAgency: dropdown values are numeric IDs.
        // The backend expects a string short_name for this particular endpoint.
        // Only send if a real agency is selected (not 0 / "0").
        if (creditRatingAgency && String(creditRatingAgency) !== '0') {
            // If your dropdown values are already agency short names, send as-is.
            // If they are numeric IDs, you must map id -> short_name here,
            // or change the backend to accept an ID.
            query.creditRatingAgency = String(creditRatingAgency);
        }

        return query;
    }, [selectedYearsDateRange, issueType, filters, creditRatingAgency]);

    // ─── Fetch Filter Inputs ─────────────────────────────────────────────────
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

    // Fetch main data (Top 10 + All List + Sectors + Market Share)
    useEffect(() => {
        if (!selectedYearsDateRange) return;

        const fetchData = async (): Promise<void> => {
            setIsTableLoading(true);
            setIsSectorsLoading(true);
            setIsMarketShareLoading(true);

            const top10Query = buildQuery({ limit: 10 });
            const listQuery = buildQuery();

            try {
                console.log('Fetching TOP 10 with query:', top10Query);
                console.log('Fetching LIST with query:', listQuery);

                const fetchedData: TableApiResponse = await fetchTrusteePageTrusteesData(top10Query);
                const lists: TableApiResponse = await fetchTrusteePageTrusteesData(listQuery);

                console.log('trustee table data', fetchedData?.tableData);
                console.log('trustee list data', lists?.tableData);

                const marketShare = formatMarketShareData(fetchedData?.tableData || [], issueType);

                setListTableData(formatData(lists?.tableData || []));
                setIssueTableData(formatData(fetchedData?.tableData || []));
                setTotalsData(fetchedData?.totals ?? null);
                setTopSectorsData(fetchedData?.sectorData || []);
                setMarketShareData(marketShare);
            } catch (err) {
                console.error('API Error:', err);
                setIssueTableData([]);
                setListTableData([]);
                setTopSectorsData([]);
                setMarketShareData([]);
            } finally {
                setIsTableLoading(false);
                setIsSectorsLoading(false);
                setIsMarketShareLoading(false);
            }
        };

        fetchData();
    }, [selectedYearsDateRange, issueType, filters, creditRatingAgency, buildQuery]);

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Sticky Financial Year Filter ── */}
                <div className="sticky top-0 z-[60] pb-2 bg-[#F0F7FF] dark:bg-[var(--color-background)]">
                    <SectionCard>
                        <div className="flex items-center justify-between flex-wrap gap-3">

                            {/* ── Page Title ── */}
                            <div className="">
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Trustee Summary</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">Trustee &gt; Summary</p>
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
                                            strokeWidth={2.2}
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
                    <SectionCard className="p-0 overflow-hidden my-3">
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
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                {isFiltersLoading ? (
                                    <FilterSkeleton />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                            <FilterGroup label="Trustee Name">
                                                <TextInput
                                                    value={filters.trustee}
                                                    onChange={(val) => updateFilter('trustee', val)}
                                                    placeholder="Enter Trustee Name"
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
                                                    value={filters.creditRating}
                                                    onChange={(val) => updateFilter('creditRating', val)}
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
                                                        trustee: '',
                                                        issuerOwnershipType: '',
                                                        issuerNatureType: '',
                                                        businessSector: '',
                                                        securityType: '',
                                                        modeOfIssue: '',
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

                    {/* ── Top 10 Trustees Table ── */}
                    <SectionCard className='my-3'>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Top 10 Trustees by {issueType === 'size' ? 'Issue size' : 'No of Issues'} (Rupees in {valueConvention})
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
                                    type="Trustee"
                                />
                            ) : (
                                <NoDataState message="No trustee data available" subMessage="Try adjusting your filters or selecting a different financial year." />
                            )}
                        </div>
                    </SectionCard>

                    {/* ── Sector + Market Share Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                        <SectionCard className='my-3'>
                            {isSectorsLoading ? (
                                <ChartSkeleton height={220} />
                            ) : topSectorsData?.length > 0 ? (
                                <>
                                    <StackedChart
                                        data={topSectorsData}
                                        height={300}
                                        title="Top Trustees by Sector"
                                        valueConvention={valueConvention}
                                    />
                                </>
                            ) : (
                                <NoDataState message="No sector data available" subMessage="Sector data will appear here once available." />
                            )}
                        </SectionCard>

                        <SectionCard className='my-3'>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Market Share Among Top 10 Trustees<br />
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

                    {/* ── All Trustees List ── */}
                    <SectionCard className='my-3'>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            All Trustees List : {selectedFY}
                        </h2>
                        <div className="h-[250px]">
                            <ScrollableTable data={listTableData} selectedFY={selectedFY} pageType='trustees' valueConvention={valueConvention} />
                        </div>
                    </SectionCard>

                    {/* ── Credit Ratings (Isolated Component) ── */}
                    <CreditRatingsSection
                        selectedYearsDateRange={selectedYearsDateRange}
                        filters={filters}
                        valueConvention={valueConvention}
                        creditRatingAgency={creditRatingAgency}
                        trusteeOptions={trusteeOptionsForRatings}
                    />
                </div>
            </div>
        </SkeletonTheme>
    );
}