'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import html2canvas from 'html2canvas-pro';

import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import Skeleton, {
    SkeletonTheme,
} from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';

import FinanceTable from '@/components/Financetable';
import CustomDropdown from '@/components/CustomDropdown';
import ScrollableTable from '@/components/ScrollableTable';
import StackedChart from '@/components/charts/StackedChart';
import { TextInput } from '@/components/TextInput';

import {
    fetchIssueDetailsFilterInputsData,
} from '@/features/issuers/services';

import {
    fetchArrangerPageArrangersData,
    fetchArrangerPageCreditRatingsData,
} from '@/features/arrangers/services';

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

import {
    frequencyOptions,
    monthOptions,
    valueConventionOptions,
} from './constants';

import {
    formatData,
    formatMarketShareData,
    getFinancialYears,
    getDateRange,
    formatRatingsData,
} from './utils';

import {
    useSummaryFilterStore,
    ArrangerFilters,
    PageState,
} from '@/lib/filtersState';


// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ARRANGERS_PAGE = 'arrangers-summary' as const;

const DEFAULT_ARRANGER_FILTERS: ArrangerFilters = {
    arranger: [],
    issuerOwnershipType: [],
    issuerNatureType: [],
    businessSector: [],
    securityType: [],
    modeOfIssue: [],
    creditRatingAgency: [],
    creditRating: [],
    seniority: [],
    servicedFlag: [],
    listingStatus: [],
};


// ─────────────────────────────────────────────────────────────
// Local Types
// ─────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton height={40} />

            {[...Array(5)].map((_, i) => (
                <Skeleton
                    key={i}
                    height={50}
                />
            ))}
        </div>
    );
}

function ChartSkeleton({
    height = 220,
}: {
    height?: number;
}) {
    return (
        <div
            style={{ height }}
            className="w-full"
        >
            <Skeleton
                height="100%"
                width="100%"
            />
        </div>
    );
}

function PieChartSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4">
            <Skeleton
                circle
                width={180}
                height={180}
            />

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-1.5"
                    >
                        <Skeleton
                            circle
                            width={10}
                            height={10}
                        />

                        <Skeleton
                            width={80}
                            height={10}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function FilterSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(11)].map((_, i) => (
                <div
                    key={i}
                    className="space-y-1.5"
                >
                    <Skeleton
                        height={12}
                        width={80}
                    />

                    <Skeleton height={36} />
                </div>
            ))}
        </div>
    );
}


// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

function NoDataState({
    message = 'No data available',
    subMessage,
}: {
    message?: string;
    subMessage?: string;
}) {
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
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-.293.707l-5.414 5.414A1 1 0 0112.586 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"
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


// ─────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────

const SectionCard = ({
    children,
    className = '',
}: SectionCardProps) => (
    <div
        className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}
    >
        {children}
    </div>
);


// ─────────────────────────────────────────────────────────────
// Filter Group
// ─────────────────────────────────────────────────────────────

const FilterGroup = ({
    label,
    children,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`flex flex-col gap-1.5 ${className}`}
    >
        <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
        </label>

        {children}
    </div>
);


// ─────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────

const formatValueByConvention = (
    value: number,
    convention: ValueConvention
): string => {
    if (convention === 'Billions') {
        return `${(value / 100).toFixed(2)}B`;
    }

    if (convention === 'Crores') {
        return `${value.toLocaleString()} Cr`;
    }

    return `${(value * 100).toLocaleString()} L`;
};

const CustomTooltip = ({
    active,
    payload,
    label,
    valueConvention = 'Crores',
}: CustomTooltipProps & {
    valueConvention?: ValueConvention;
}) => {
    if (
        active &&
        payload &&
        payload.length
    ) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {label}
                </p>

                {payload.map(
                    (
                        p: TooltipPayloadEntry,
                        i: number
                    ) => (
                        <p
                            key={i}
                            style={{ color: p.color }}
                            className="text-xs"
                        >
                            {p.name}:{' '}
                            {typeof p.value === 'number'
                                ? formatValueByConvention(
                                    p.value,
                                    valueConvention
                                )
                                : p.value}
                        </p>
                    )
                )}
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

    if (percentage <= 5) {
        return null;
    }

    const RADIAN = Math.PI / 180;

    const radius =
        innerRadius +
        (outerRadius - innerRadius) * 0.5;

    const x =
        cx +
        radius *
        Math.cos(-midAngle * RADIAN);

    const y =
        cy +
        radius *
        Math.sin(-midAngle * RADIAN);

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


// ─────────────────────────────────────────────────────────────
// Active Filter Chip
// ─────────────────────────────────────────────────────────────

function ActiveFilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium rounded-full border border-indigo-100 dark:border-indigo-800">
            {label}

            <button
                onClick={onRemove}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}


// ─────────────────────────────────────────────────────────────
// PNG Button
// ─────────────────────────────────────────────────────────────

function DownloadPngButton({
    onClick,
    label = 'Download PNG',
}: {
    onClick: () => void;
    label?: string;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center cursor-pointer gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 h-7 text-[10px] font-medium transition-colors"
            title={label}
        >
            <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
            </svg>

            PNG
        </button>
    );
}


// ─────────────────────────────────────────────────────────────
// Credit Ratings Section
// ─────────────────────────────────────────────────────────────

interface CreditRatingsSectionProps {
    selectedYearsDateRange: DateRange | null;
    filters: ArrangerFilters;
    valueConvention: ValueConvention;
    arrangerOptions: {
        value: string;
        label: string;
    }[];
    selectedFY: string;
}

function CreditRatingsSection({
    selectedYearsDateRange,
    filters,
    valueConvention,
    arrangerOptions,
    selectedFY,
}: CreditRatingsSectionProps) {
    const [ratingData, setRatingData] =
        useState<FormattedRatingItem[]>([]);

    const [isRatingLoading, setIsRatingLoading] =
        useState(true);

    const [selectedRatingArranger, setSelectedRatingArranger] =
        useState<string>('');

    const ratingChartRef =
        useRef<HTMLDivElement>(null);

    const prevQueryRef =
        useRef<string>('');

    const downloadRatingChartAsPng =
        useCallback(
            async (
                chartRef: HTMLElement | null,
                filename: string
            ) => {
                if (!chartRef) return;

                try {
                    const canvas =
                        await html2canvas(
                            chartRef,
                            {
                                backgroundColor:
                                    '#ffffff',
                                scale: 2,
                                useCORS: true,
                            }
                        );

                    const link =
                        document.createElement('a');

                    link.download =
                        `${filename}.png`;

                    link.href =
                        canvas.toDataURL(
                            'image/png'
                        );

                    link.click();
                } catch (err) {
                    console.error(
                        'Error downloading credit rating chart:',
                        err
                    );
                }
            },
            []
        );

    useEffect(() => {
        if (!selectedYearsDateRange) return;

        const fetchData = async () => {
            const query = {
                startDate:
                    selectedYearsDateRange.startDate,

                endDate:
                    selectedYearsDateRange.endDate,

                creditRatingAgency:
                    filters.creditRatingAgency,

                arranger:
                    selectedRatingArranger
                        ? [selectedRatingArranger]
                        : filters.arranger,

                ownershipType:
                    filters.issuerOwnershipType,

                nature:
                    filters.issuerNatureType,

                sector:
                    filters.businessSector,

                securityType:
                    filters.securityType,

                modeOfIssue:
                    filters.modeOfIssue,

                rating:
                    filters.creditRating,

                seniority:
                    filters.seniority,

                securedFlag:
                    filters.servicedFlag,

                listingStatus:
                    filters.listingStatus,
            };

            const queryKey =
                JSON.stringify(query);

            if (
                prevQueryRef.current ===
                queryKey
            ) {
                return;
            }

            prevQueryRef.current =
                queryKey;

            setIsRatingLoading(true);

            try {
                const ratings: RawRatingItem[] =
                    await fetchArrangerPageCreditRatingsData(
                        query
                    );

                setRatingData(
                    formatRatingsData(
                        ratings || [],
                        filters.creditRatingAgency[0] ||
                        ''
                    )
                );
            } catch (err) {
                console.error(
                    'API Error:',
                    err
                );

                setRatingData([]);
            } finally {
                setIsRatingLoading(false);
            }
        };

        fetchData();
    }, [
        selectedYearsDateRange,
        filters,
        selectedRatingArranger,
    ]);

    return (
        <SectionCard className="my-3">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Credit Ratings
                </h2>

                <div className="flex items-center gap-3 flex-wrap">
                    {filters.creditRatingAgency.length > 0 && (
                        <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                            Agency:{' '}
                            {filters.creditRatingAgency.join(
                                ', '
                            )}
                        </span>
                    )}

                    <div className="w-48">
                        <CustomDropdown
                            label="Arranger"
                            options={[
                                {
                                    value: '',
                                    label: 'All Arrangers',
                                },
                                ...arrangerOptions,
                            ]}
                            value={
                                selectedRatingArranger
                            }
                            onChange={(val) =>
                                setSelectedRatingArranger(
                                    String(
                                        val[0] || ''
                                    )
                                )
                            }
                            placeholder="Select Arranger"
                            menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                            multiSelect={false}
                        />
                    </div>

                    <DownloadPngButton
                        onClick={() =>
                            downloadRatingChartAsPng(
                                ratingChartRef.current,
                                `credit_ratings_arrangers_${selectedFY}`
                            )
                        }
                    />
                </div>
            </div>

            {isRatingLoading ? (
                <PieChartSkeleton />
            ) : ratingData.length > 0 ? (
                <div
                    ref={ratingChartRef}
                    className="flex flex-col items-center justify-center gap-8 flex-wrap bg-white dark:bg-[#1a1a2e] p-4 rounded-xl"
                >
                    <div className="relative">
                        <ResponsiveContainer
                            width={220}
                            height={220}
                        >
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
                                    {ratingData.map(
                                        (
                                            entry,
                                            i
                                        ) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    entry.color
                                                }
                                                stroke="white"
                                                strokeWidth={
                                                    2
                                                }
                                            />
                                        )
                                    )}
                                </Pie>

                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            valueConvention={
                                                valueConvention
                                            }
                                        />
                                    }
                                    wrapperStyle={{
                                        fontSize:
                                            '10px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {ratingData.map(
                            (d, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor:
                                                d.color,
                                        }}
                                    />

                                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                        {d.name}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            ) : (
                <NoDataState
                    message="No credit rating data available"
                    subMessage="Try selecting a different credit rating agency or arranger."
                />
            )}
        </SectionCard>
    );
}


// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function Summary() {

    // ─────────────────────────────────────────────────────────
    // Zustand
    // ─────────────────────────────────────────────────────────

    const activeFilterPage =
        useSummaryFilterStore(
            (s) => s.activeFilterPage
        );

    const storedPageState =
        useSummaryFilterStore(
            (s) => s.pageState[ARRANGERS_PAGE]
        );

    const setPageState =
        useSummaryFilterStore(
            (s) => s.setPageState
        );

    const updatePageFilter =
        useSummaryFilterStore(
            (s) => s.updatePageFilter
        );

    const updatePageField =
        useSummaryFilterStore(
            (s) => s.updatePageField
        );

    const clearPageState =
        useSummaryFilterStore(
            (s) => s.clearPageState
        );

    // ─────────────────────────────────────────────────────────
    // FY options
    // ─────────────────────────────────────────────────────────

    const fyOptions =
        useMemo<FYOption[]>(
            () => getFinancialYears(),
            []
        );

    // ─────────────────────────────────────────────────────────
    // Defaults
    // ─────────────────────────────────────────────────────────

    const defaultPageState =
        useMemo<PageState<typeof ARRANGERS_PAGE>>(
            () => ({
                selectedFY: fyOptions[0]?.value ?? '',
                frequency: 'Yearly',
                period: null,
                issueType: 'size',
                valueConvention: 'Crores',
                filters: DEFAULT_ARRANGER_FILTERS,
            }),
            [fyOptions]
        );

    // ─────────────────────────────────────────────────────────
    // Effective state (only use persisted if this page is active)
    // ─────────────────────────────────────────────────────────

    const isActivePage =
        activeFilterPage === ARRANGERS_PAGE;

    const currentState =
        isActivePage && storedPageState
            ? storedPageState
            : defaultPageState;

    const {
        selectedFY,
        frequency,
        period,
        issueType,
        valueConvention,
        filters,
    } = currentState;

    // ─────────────────────────────────────────────────────────
    // Local UI state (not persisted)
    // ─────────────────────────────────────────────────────────

    const [
        isFiltersExpanded,
        setIsFiltersExpanded,
    ] = useState(false);


    // ─────────────────────────────────────────────────────────
    // Data State
    // ─────────────────────────────────────────────────────────

    const [
        filterOptions,
        setFilterOptions,
    ] = useState<FilterInputsResponse>({
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

    const [
        issueTableData,
        setIssueTableData,
    ] = useState<FormattedIssuerItem[]>([]);

    const [
        listTableData,
        setListTableData,
    ] = useState<FormattedIssuerItem[]>([]);

    const [
        topSectorsData,
        setTopSectorsData,
    ] = useState<SectorItem[]>([]);

    const [
        marketShareData,
        setMarketShareData,
    ] = useState<FormattedMarketShareItem[]>([]);

    const [
        totalsData,
        setTotalsData,
    ] = useState<TotalsData | null>(null);


    // ─────────────────────────────────────────────────────────
    // Loading
    // ─────────────────────────────────────────────────────────

    const [
        isTableLoading,
        setIsTableLoading,
    ] = useState(true);

    const [
        isSectorsLoading,
        setIsSectorsLoading,
    ] = useState(true);

    const [
        isMarketShareLoading,
        setIsMarketShareLoading,
    ] = useState(true);

    const [
        isFiltersLoading,
        setIsFiltersLoading,
    ] = useState(true);


    // ─────────────────────────────────────────────────────────
    // Refs
    // ─────────────────────────────────────────────────────────

    const sectorChartRef =
        useRef<HTMLDivElement>(null);

    const marketShareChartRef =
        useRef<HTMLDivElement>(null);


    // ─────────────────────────────────────────────────────────
    // Date Range
    // ─────────────────────────────────────────────────────────

    const selectedYearsDateRange =
        useMemo<DateRange | null>(
            () =>
                getDateRange({
                    fy: selectedFY,
                    frequency,
                    period,
                }),
            [
                selectedFY,
                frequency,
                period,
            ]
        );


    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────

    const toOptions = (
        items: string[]
    ) =>
        items.map((item) => ({
            value: item,
            label: item,
        }));

    const ensureActive = useCallback(() => {
        if (
            useSummaryFilterStore.getState().activeFilterPage !==
            ARRANGERS_PAGE
        ) {
            setPageState(ARRANGERS_PAGE, defaultPageState);
        }
    }, [setPageState, defaultPageState]);

    const updateFilter = useCallback(
        <K extends keyof ArrangerFilters>(
            key: K,
            value: ArrangerFilters[K]
        ) => {
            ensureActive();
            updatePageFilter(
                ARRANGERS_PAGE,
                key,
                value as string[]
            );
        },
        [ensureActive, updatePageFilter]
    );


    // ─────────────────────────────────────────────────────────
    // FY
    // ─────────────────────────────────────────────────────────

    const handleFYChange = (
        value: string | number
    ) => {
        ensureActive();
        updatePageField(
            ARRANGERS_PAGE,
            'selectedFY',
            String(value)
        );
    };


    // ─────────────────────────────────────────────────────────
    // Frequency
    // ─────────────────────────────────────────────────────────

    const handleFrequencyChange = (
        value: string | number
    ) => {
        const freq =
            value as FrequencyValue;

        ensureActive();
        updatePageField(
            ARRANGERS_PAGE,
            'frequency',
            freq
        );

        if (freq === 'Half-Yearly') {
            updatePageField(ARRANGERS_PAGE, 'period', 'H1');
        } else if (
            freq === 'Quarterly'
        ) {
            updatePageField(ARRANGERS_PAGE, 'period', 'Q1');
        } else if (
            freq === 'Monthly'
        ) {
            updatePageField(ARRANGERS_PAGE, 'period', 3);
        } else {
            updatePageField(ARRANGERS_PAGE, 'period', null);
        }
    };


    // ─────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────

    const handleSearch = () => {
        setIsFiltersExpanded(false);
    };


    // ─────────────────────────────────────────────────────────
    // Reset
    // ─────────────────────────────────────────────────────────

    const handleReset = () => {
        clearPageState(
            ARRANGERS_PAGE,
            defaultPageState
        );
    };


    // ─────────────────────────────────────────────────────────
    // PNG Export
    // ─────────────────────────────────────────────────────────

    const downloadChartAsPng =
        useCallback(
            async (
                chartRef: HTMLElement | null,
                filename: string
            ) => {
                if (!chartRef) return;

                try {
                    const canvas =
                        await html2canvas(
                            chartRef,
                            {
                                backgroundColor:
                                    '#ffffff',
                                scale: 2,
                                useCORS: true,
                            }
                        );

                    const link =
                        document.createElement('a');

                    link.download =
                        `${filename}.png`;

                    link.href =
                        canvas.toDataURL(
                            'image/png'
                        );

                    link.click();
                } catch (err) {
                    console.error(
                        'Error downloading chart:',
                        err
                    );
                }
            },
            []
        );


    // ─────────────────────────────────────────────────────────
    // Financial Year CSV Helper
    // ─────────────────────────────────────────────────────────

    function getFinancialYearRanges(
        rangeStr: string
    ) {
        const [
            start,
            end,
        ] =
            rangeStr
                .split('-')
                .map(Number);

        return {
            currentYearRange:
                `${start}-${String(end).slice(-2)}`,

            previousYearRange:
                `${start - 1}-${String(end - 1).slice(-2)}`,
        };
    }


    // ─────────────────────────────────────────────────────────
    // CSV Export
    // ─────────────────────────────────────────────────────────

    const handleExportCSV =
        useCallback(() => {

            if (
                !issueTableData.length
            ) {
                return;
            }

            const {
                currentYearRange,
                previousYearRange,
            } =
                getFinancialYearRanges(
                    selectedFY
                );

            const exportData =
                issueTableData.map(
                    (row) => ({
                        Arranger:
                            row.name,

                        [`${currentYearRange}\r\nIssue Size`]:
                            row.issueSize,

                        [`${currentYearRange}\r\nDeals`]:
                            row.deals,

                        [`${currentYearRange}\r\nMarket Share (%)`]:
                            row.mktShare,

                        [`${currentYearRange}\r\nRank`]:
                            row.rank,

                        [`${previousYearRange}\r\nIssue Size`]:
                            row.prevSize,

                        [`${previousYearRange}\r\nDeals`]:
                            row.prevDeals,

                        [`${previousYearRange}\r\nMarket Share (%)`]:
                            row.prevMkt,

                        [`${previousYearRange}\r\nRank`]:
                            row.prevRank,

                        'YoY (%)':
                            row.yoy,
                    })
                );

            const headers =
                Object.keys(
                    exportData[0]
                );

            const escapeCSV = (
                value: unknown
            ) => {
                const str =
                    String(
                        value ?? ''
                    );

                if (
                    str.includes(',') ||
                    str.includes('"') ||
                    str.includes('\n') ||
                    str.includes('\r')
                ) {
                    return `"${str.replace(
                        /"/g,
                        '""'
                    )}"`;
                }

                return str;
            };

            const rows =
                exportData.map(
                    (row) =>
                        headers
                            .map(
                                (header) =>
                                    escapeCSV(
                                        row[
                                            header as keyof typeof row
                                        ]
                                    )
                            )
                            .join(',')
                );

            const csv =
                [
                    headers
                        .map(escapeCSV)
                        .join(','),
                    ...rows,
                ].join('\n');

            const blob =
                new Blob(
                    [csv],
                    {
                        type: 'text/csv;charset=utf-8;',
                    }
                );

            const link =
                document.createElement('a');

            const url =
                URL.createObjectURL(
                    blob
                );

            link.href = url;

            link.download =
                `top_arrangers_${selectedFY}_${issueType}.csv`;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            URL.revokeObjectURL(
                url
            );
        }, [
            issueTableData,
            selectedFY,
            issueType,
        ]);


    // ─────────────────────────────────────────────────────────
    // All List CSV
    // ─────────────────────────────────────────────────────────

    const handleExportListCSV =
        useCallback(() => {

            if (
                !listTableData.length
            ) {
                return;
            }

            const {
                currentYearRange,
                previousYearRange,
            } =
                getFinancialYearRanges(
                    selectedFY
                );

            const exportData =
                listTableData.map(
                    (row) => ({
                        Arranger:
                            row.name,

                        [`${currentYearRange}\r\nIssue Size`]:
                            row.issueSize,

                        [`${currentYearRange}\r\nDeals`]:
                            row.deals,

                        [`${currentYearRange}\r\nMarket Share (%)`]:
                            row.mktShare,

                        [`${currentYearRange}\r\nRank`]:
                            row.rank,

                        [`${previousYearRange}\r\nIssue Size`]:
                            row.prevSize,

                        [`${previousYearRange}\r\nDeals`]:
                            row.prevDeals,

                        [`${previousYearRange}\r\nMarket Share (%)`]:
                            row.prevMkt,

                        [`${previousYearRange}\r\nRank`]:
                            row.prevRank,

                        'YoY (%)':
                            row.yoy,
                    })
                );

            const headers =
                Object.keys(
                    exportData[0]
                );

            const escapeCSV = (
                value: unknown
            ) => {
                const str =
                    String(
                        value ?? ''
                    );

                if (
                    str.includes(',') ||
                    str.includes('"') ||
                    str.includes('\n') ||
                    str.includes('\r')
                ) {
                    return `"${str.replace(
                        /"/g,
                        '""'
                    )}"`;
                }

                return str;
            };

            const rows =
                exportData.map(
                    (row) =>
                        headers
                            .map(
                                (header) =>
                                    escapeCSV(
                                        row[
                                            header as keyof typeof row
                                        ]
                                    )
                            )
                            .join(',')
                );

            const csv =
                [
                    headers
                        .map(escapeCSV)
                        .join(','),
                    ...rows,
                ].join('\n');

            const blob =
                new Blob(
                    [csv],
                    {
                        type: 'text/csv;charset=utf-8;',
                    }
                );

            const link =
                document.createElement('a');

            const url =
                URL.createObjectURL(
                    blob
                );

            link.href = url;

            link.download =
                `all_arrangers_list_${selectedFY}.csv`;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            URL.revokeObjectURL(
                url
            );
        }, [
            listTableData,
            selectedFY,
        ]);


    // ─────────────────────────────────────────────────────────
    // Active Filter Count
    // ─────────────────────────────────────────────────────────

    const activeFilterCount =
        useMemo(() => {
            return Object.values(
                filters
            ).reduce(
                (acc, arr) =>
                    acc +
                    arr.length,
                0
            );
        }, [filters]);


    // ─────────────────────────────────────────────────────────
    // Active Filter Chips
    // ─────────────────────────────────────────────────────────

    const activeFilterChips =
        useMemo(() => {

            const labelMap: Record<
                keyof ArrangerFilters,
                string
            > = {
                arranger:
                    'Arranger',

                issuerOwnershipType:
                    'Ownership',

                issuerNatureType:
                    'Nature',

                businessSector:
                    'Sector',

                securityType:
                    'Security',

                modeOfIssue:
                    'Mode',

                creditRatingAgency:
                    'Agency',

                creditRating:
                    'Rating',

                seniority:
                    'Seniority',

                servicedFlag:
                    'Serviced',

                listingStatus:
                    'Listing',
            };

            const chips: {
                key: keyof ArrangerFilters;
                label: string;
                index: number;
            }[] = [];

            (
                Object.keys(
                    filters
                ) as Array<
                    keyof ArrangerFilters
                >
            ).forEach(
                (key) => {
                    filters[key].forEach(
                        (
                            val,
                            idx
                        ) => {
                            chips.push({
                                key,
                                index: idx,
                                label: `${labelMap[key]}: ${val}`,
                            });
                        }
                    );
                }
            );

            return chips;
        }, [filters]);


    // ─────────────────────────────────────────────────────────
    // Arranger Options for Rating Chart
    // ─────────────────────────────────────────────────────────

    const arrangerOptionsForRatings =
        useMemo(() => {

            const names =
                new Set<string>();

            listTableData.forEach(
                (item) => {

                    const name =
                        (item as any)
                            .arranger ||
                        (item as any)
                            .name ||
                        (item as any)
                            .issuerName ||
                        '';

                    if (name) {
                        names.add(name);
                    }
                }
            );

            return Array.from(
                names
            )
                .sort()
                .map(
                    (name) => ({
                        value: name,
                        label: name,
                    })
                );
        }, [
            listTableData,
        ]);


    // ─────────────────────────────────────────────────────────
    // Filter Inputs API
    // ─────────────────────────────────────────────────────────

    const fetchFilterInputs =
        useCallback(
            async () => {

                if (
                    !selectedYearsDateRange
                ) {
                    return;
                }

                setIsFiltersLoading(
                    true
                );

                try {

                    const query = {
                        startDate:
                            selectedYearsDateRange.startDate,

                        endDate:
                            selectedYearsDateRange.endDate,
                    };

                    const data:
                        FilterInputsResponse =
                        await fetchIssueDetailsFilterInputsData(
                            query
                        );

                    setFilterOptions(
                        data
                    );

                } catch (err) {

                    console.error(
                        'Error fetching filter inputs:',
                        err
                    );

                } finally {

                    setIsFiltersLoading(
                        false
                    );
                }
            },
            [
                selectedYearsDateRange,
            ]
        );


    useEffect(() => {
        fetchFilterInputs();
    }, [
        fetchFilterInputs,
    ]);


    // ─────────────────────────────────────────────────────────
    // Main Data API
    // ─────────────────────────────────────────────────────────

    useEffect(() => {

        if (
            !selectedYearsDateRange
        ) {
            return;
        }

        const fetchData =
            async () => {

                setIsTableLoading(
                    true
                );

                setIsSectorsLoading(
                    true
                );

                setIsMarketShareLoading(
                    true
                );

                const query = {
                    startDate:
                        selectedYearsDateRange.startDate,

                    endDate:
                        selectedYearsDateRange.endDate,

                    issueType,

                    limit: 10,

                    arranger:
                        filters.arranger,

                    ownershipType:
                        filters.issuerOwnershipType,

                    nature:
                        filters.issuerNatureType,

                    sector:
                        filters.businessSector,

                    securityType:
                        filters.securityType,

                    modeOfIssue:
                        filters.modeOfIssue,

                    creditRatingAgency:
                        filters.creditRatingAgency,

                    rating:
                        filters.creditRating,

                    seniority:
                        filters.seniority,

                    securedFlag:
                        filters.servicedFlag,

                    listingStatus:
                        filters.listingStatus,
                };

                const listQuery = {
                    ...query,
                };

                try {

                    const [
                        fetchedData,
                        lists,
                    ] = await Promise.all([
                        fetchArrangerPageArrangersData(
                            query
                        ),

                        fetchArrangerPageArrangersData(
                            listQuery
                        ),
                    ]);

                    const marketShare =
                        formatMarketShareData(
                            fetchedData?.tableData ||
                            [],
                            issueType
                        );

                    setListTableData(
                        formatData(
                            lists?.tableData ||
                            []
                        )
                    );

                    setIssueTableData(
                        formatData(
                            fetchedData?.tableData ||
                            []
                        )
                    );

                    setTotalsData(
                        fetchedData?.totals
                    );

                    setTopSectorsData(
                        fetchedData?.sectorData ||
                        []
                    );

                    setMarketShareData(
                        marketShare
                    );

                } catch (err) {

                    console.error(
                        'API Error:',
                        err
                    );

                    setIssueTableData(
                        []
                    );

                    setListTableData(
                        []
                    );

                    setTopSectorsData(
                        []
                    );

                    setMarketShareData(
                        []
                    );

                    setTotalsData(
                        null
                    );

                } finally {

                    setIsTableLoading(
                        false
                    );

                    setIsSectorsLoading(
                        false
                    );

                    setIsMarketShareLoading(
                        false
                    );
                }
            };

        fetchData();

    }, [
        selectedYearsDateRange,
        issueType,
        filters,
    ]);


    // ─────────────────────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────────────────────

    return (
        <SkeletonTheme
            enableAnimation
            baseColor="#1F2937"
            highlightColor="#90969bff"
            borderRadius="0.5rem"
        >
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* Financial Year */}
                <div className="sticky top-0 z-[60] pb-2 bg-[#F0F7FF] dark:bg-[var(--color-background)]">
                    <SectionCard>

                        <div className="flex items-center justify-between flex-wrap gap-3">

                            <div>
                                <h1 className="text-xl font-bold">
                                    Arrangers Summary
                                </h1>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                                    Arranger &gt; Summary
                                </p>
                            </div>

                            <div>
                                <h2 className="text-md font-semibold">
                                    Financial Year
                                </h2>

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6 mt-1">
                                    {selectedFY}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">

                                <CustomDropdown
                                    label="Financial Year"
                                    options={fyOptions}
                                    value={selectedFY}
                                    onChange={(val) =>
                                        handleFYChange(
                                            val[0] ||
                                            fyOptions[0]?.value
                                        )
                                    }
                                    multiSelect={false}
                                />

                                <CustomDropdown
                                    label="Frequency"
                                    options={frequencyOptions}
                                    value={frequency}
                                    onChange={(val) =>
                                        handleFrequencyChange(
                                            val[0] ||
                                            'Yearly'
                                        )
                                    }
                                    multiSelect={false}
                                />

                                {frequency ===
                                    'Half-Yearly' && (
                                        <div className="flex gap-2 mt-2">
                                            {(
                                                [
                                                    'H1',
                                                    'H2',
                                                ] as HalfYearlyPeriod[]
                                            ).map(
                                                (h) => (
                                                    <button
                                                        key={h}
                                                        onClick={() => {
                                                            ensureActive();
                                                            updatePageField(ARRANGERS_PAGE, 'period', h);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs ${
                                                            period ===
                                                            h
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        {h}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                {frequency ===
                                    'Quarterly' && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {(
                                                [
                                                    'Q1',
                                                    'Q2',
                                                    'Q3',
                                                    'Q4',
                                                ] as QuarterlyPeriod[]
                                            ).map(
                                                (q) => (
                                                    <button
                                                        key={q}
                                                        onClick={() => {
                                                            ensureActive();
                                                            updatePageField(ARRANGERS_PAGE, 'period', q);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs ${
                                                            period ===
                                                            q
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        {q}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                {frequency ===
                                    'Monthly' && (
                                        <CustomDropdown
                                            label="Months"
                                            options={monthOptions}
                                            value={
                                                period as number
                                            }
                                            onChange={(val) => {
                                                ensureActive();
                                                updatePageField(ARRANGERS_PAGE, 'period', Number(val[0]) || 3);
                                            }}
                                            multiSelect={
                                                false
                                            }
                                        />
                                    )}

                                <button
                                    onClick={
                                        handleReset
                                    }
                                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-[12px] px-5 h-10 md:h-6 text-xs md:text-[9px] cursor-pointer"
                                >
                                    Reset
                                </button>

                            </div>
                        </div>
                    </SectionCard>
                </div>


                {/* Detailed Filters */}
                <SectionCard className="p-0">

                    <button
                        onClick={() =>
                            setIsFiltersExpanded(
                                (prev) =>
                                    !prev
                            )
                        }
                        className="w-full flex items-center justify-between px-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">

                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <div className="flex flex-col items-start">

                                <span className="text-sm font-semibold">
                                    Detailed Filters
                                </span>

                                {activeFilterCount >
                                    0 && (
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                            {
                                                activeFilterCount
                                            }{' '}
                                            active
                                        </span>
                                    )}

                            </div>
                        </div>

                        <ChevronDown
                            className={`w-5 h-5 transition-transform ${
                                isFiltersExpanded
                                    ? 'rotate-180'
                                    : ''
                            }`}
                        />
                    </button>


                    <AnimatePresence>
                        {isFiltersExpanded && (
                            <motion.div
                                initial={{
                                    height: 0,
                                    opacity: 0,
                                }}
                                animate={{
                                    height: 'auto',
                                    opacity: 1,
                                }}
                                exit={{
                                    height: 0,
                                    opacity: 0,
                                }}
                            >
                                <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">

                                    {isFiltersLoading ? (
                                        <FilterSkeleton />
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

                                                <FilterGroup label="Arranger Name">
                                                    <TextInput
                                                        value={
                                                            filters.arranger[0] ||
                                                            ''
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'arranger',
                                                                val
                                                                    ? [
                                                                          val,
                                                                      ]
                                                                    : []
                                                            )
                                                        }
                                                        placeholder="Enter Arranger Name"
                                                        type="text"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Issuer Ownership Type">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.ownershipType
                                                        )}
                                                        value={
                                                            filters.issuerOwnershipType
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'issuerOwnershipType',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Ownership"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Issuer Nature Type">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.nature
                                                        )}
                                                        value={
                                                            filters.issuerNatureType
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'issuerNatureType',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Nature"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Business Sector">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.sector
                                                        )}
                                                        value={
                                                            filters.businessSector
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'businessSector',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Sector"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Security Type">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.securityType
                                                        )}
                                                        value={
                                                            filters.securityType
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'securityType',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Security"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Mode of Issue">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.modeOfIssue
                                                        )}
                                                        value={
                                                            filters.modeOfIssue
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'modeOfIssue',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Mode"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Credit Rating Agency">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.creditRatingAgency
                                                        )}
                                                        value={
                                                            filters.creditRatingAgency
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'creditRatingAgency',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Agency"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Credit Rating">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.creditRating
                                                        )}
                                                        value={
                                                            filters.creditRating
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'creditRating',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Rating"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Seniority">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.seniority
                                                        )}
                                                        value={
                                                            filters.seniority
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'seniority',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Seniority"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Serviced Flag">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.securedFlag
                                                        )}
                                                        value={
                                                            filters.servicedFlag
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'servicedFlag',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Flag"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>


                                                <FilterGroup label="Listing Status">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.listingStatus
                                                        )}
                                                        value={
                                                            filters.listingStatus
                                                        }
                                                        onChange={(
                                                            val
                                                        ) =>
                                                            updateFilter(
                                                                'listingStatus',
                                                                val as string[]
                                                            )
                                                        }
                                                        placeholder="Select Status"
                                                        menuClassName="w-48"
                                                    />
                                                </FilterGroup>

                                            </div>


                                            {/* Active Chips */}
                                            {activeFilterChips.length >
                                                0 && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">

                                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                                            Active:
                                                        </span>

                                                        {activeFilterChips.map(
                                                            (
                                                                chip
                                                            ) => (
                                                                <ActiveFilterChip
                                                                    key={`${chip.key}-${chip.index}`}
                                                                    label={
                                                                        chip.label
                                                                    }
                                                                    onRemove={() => {
                                                                        const newValues =
                                                                            filters[
                                                                                chip.key
                                                                            ].filter(
                                                                                (
                                                                                    _,
                                                                                    i
                                                                                ) =>
                                                                                    i !==
                                                                                    chip.index
                                                                            );

                                                                        updateFilter(
                                                                            chip.key,
                                                                            newValues
                                                                        );
                                                                    }}
                                                                />
                                                            )
                                                        )}

                                                        <button
                                                            onClick={() =>
                                                                clearPageState(
                                                                    ARRANGERS_PAGE,
                                                                    defaultPageState
                                                                )
                                                            }
                                                            className="text-[10px] text-red-500 font-medium ml-1"
                                                        >
                                                            Clear all
                                                        </button>
                                                    </div>
                                                )}


                                            <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">

                                                <button
                                                    onClick={
                                                        handleSearch
                                                    }
                                                    className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white rounded-lg px-5 h-6 text-xs font-medium"
                                                >
                                                    <Search className="w-3.5 h-3.5" />
                                                    Search
                                                </button>

                                                <button
                                                    onClick={
                                                        handleReset
                                                    }
                                                    className="flex items-center gap-2 bg-red-500 text-white rounded-lg px-5 h-6 text-xs font-medium"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Clear
                                                </button>

                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SectionCard>


                {/* Top 10 Arrangers */}
                <SectionCard className="my-3">

                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                        <h2 className="text-sm font-semibold">
                            Top 10 Arrangers by{' '}
                            {issueType === 'size'
                                ? 'Issue size'
                                : 'No of Issues'}{' '}
                            (Rupees in{' '}
                            {valueConvention})
                        </h2>

                        <div className="flex items-center gap-3 flex-wrap">

                            <button
                                onClick={
                                    handleExportCSV
                                }
                                disabled={
                                    isTableLoading ||
                                    issueTableData.length ===
                                        0
                                }
                                className="flex items-center gap-1.5 bg-green-600 disabled:opacity-50 text-white rounded-lg px-4 h-8 text-xs font-medium"
                            >
                                Export CSV
                            </button>

                            <CustomDropdown
                                label="Value Convention"
                                options={
                                    valueConventionOptions
                                }
                                value={
                                    valueConvention
                                }
                                onChange={(val) => {
                                    ensureActive();
                                    updatePageField(
                                        ARRANGERS_PAGE,
                                        'valueConvention',
                                        val[0] as ValueConvention || 'Crores'
                                    );
                                }}
                                multiSelect={
                                    false
                                }
                            />

                        </div>
                    </div>


                    <div className="flex justify-center mb-4">

                        <div className="rounded-full border border-gray-300 dark:border-gray-600 p-0.5 bg-gray-100 dark:bg-gray-800">

                            <button
                                onClick={() => {
                                    ensureActive();
                                    updatePageField(ARRANGERS_PAGE, 'issueType', 'size');
                                }}
                                className={`px-5 py-1.5 text-xs font-medium rounded-full ${
                                    issueType ===
                                    'size'
                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                        : 'text-gray-500'
                                }`}
                            >
                                ISSUE SIZE
                            </button>

                            <button
                                onClick={() => {
                                    ensureActive();
                                    updatePageField(ARRANGERS_PAGE, 'issueType', 'count');
                                }}
                                className={`px-5 py-1.5 text-xs font-medium rounded-full ${
                                    issueType ===
                                    'count'
                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                        : 'text-gray-500'
                                }`}
                            >
                                NO. OF ISSUES
                            </button>

                        </div>
                    </div>


                    <div className="overflow-x-auto">

                        {isTableLoading ? (
                            <TableSkeleton />
                        ) : issueTableData.length >
                          0 ? (
                            <FinanceTable
                                totalsData={
                                    totalsData
                                }
                                data={
                                    issueTableData
                                }
                                selectedFY={
                                    selectedFY
                                }
                                valueConvention={
                                    valueConvention
                                }
                                type="Arranger"
                            />
                        ) : (
                            <NoDataState
                                message="No arranger data available"
                                subMessage="Try adjusting your filters or selecting a different financial year."
                            />
                        )}

                    </div>
                </SectionCard>


                {/* Sector + Market Share */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    <SectionCard className="my-3">

                        <div className="flex items-center justify-between mb-4 gap-4">

                            <h2 className="text-sm font-semibold">
                                Top Arrangers by Sector
                            </h2>

                            <DownloadPngButton
                                onClick={() =>
                                    downloadChartAsPng(
                                        sectorChartRef.current,
                                        `top_arrangers_sector_${selectedFY}`
                                    )
                                }
                            />

                        </div>

                        {isSectorsLoading ? (
                            <ChartSkeleton height={220} />
                        ) : topSectorsData.length >
                          0 ? (
                            <div
                                ref={
                                    sectorChartRef
                                }
                                className="bg-white dark:bg-[#1a1a2e] p-4 rounded-xl"
                            >
                                <StackedChart
                                    data={
                                        topSectorsData
                                    }
                                    height={
                                        300
                                    }
                                    title="Top Arrangers by Sector"
                                    valueConvention={
                                        valueConvention
                                    }
                                />
                            </div>
                        ) : (
                            <NoDataState
                                message="No sector data available"
                            />
                        )}

                    </SectionCard>


                    <SectionCard className="my-3">

                        <div className="flex items-center justify-between mb-4 gap-4">

                            <div>
                                <h2 className="text-sm font-semibold">
                                    Market Share Among Top 10 Arrangers
                                </h2>

                                <p className="text-[10px] text-gray-500">
                                    (By Size)
                                </p>
                            </div>

                            <DownloadPngButton
                                onClick={() =>
                                    downloadChartAsPng(
                                        marketShareChartRef.current,
                                        `market_share_arrangers_${selectedFY}`
                                    )
                                }
                            />

                        </div>

                        {isMarketShareLoading ? (
                            <PieChartSkeleton />
                        ) : marketShareData.length >
                          0 ? (
                            <div
                                ref={
                                    marketShareChartRef
                                }
                                className="flex flex-col items-center gap-4 bg-white dark:bg-[#1a1a2e] p-4 rounded-xl"
                            >
                                <ResponsiveContainer
                                    width={180}
                                    height={180}
                                >
                                    <PieChart>

                                        <Pie
                                            data={
                                                marketShareData
                                            }
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={
                                                35
                                            }
                                            outerRadius={
                                                85
                                            }
                                            dataKey="value"
                                            startAngle={
                                                90
                                            }
                                            endAngle={
                                                -270
                                            }
                                            labelLine={
                                                false
                                            }
                                            label={
                                                renderLabel
                                            }
                                        >
                                            {marketShareData.map(
                                                (
                                                    entry,
                                                    i
                                                ) => (
                                                    <Cell
                                                        key={
                                                            i
                                                        }
                                                        fill={
                                                            entry.color
                                                        }
                                                        stroke="white"
                                                        strokeWidth={
                                                            2
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            content={
                                                <CustomTooltip
                                                    valueConvention={
                                                        valueConvention
                                                    }
                                                />
                                            }
                                        />

                                    </PieChart>
                                </ResponsiveContainer>


                                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">

                                    {marketShareData.map(
                                        (
                                            d,
                                            i
                                        ) => (
                                            <div
                                                key={
                                                    i
                                                }
                                                className="flex items-start gap-1.5"
                                            >
                                                <span
                                                    className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            d.color,
                                                    }}
                                                />

                                                <span className="text-[9px] text-gray-600 dark:text-gray-400">
                                                    {
                                                        d.name
                                                    }
                                                </span>
                                            </div>
                                        )
                                    )}

                                </div>
                            </div>
                        ) : (
                            <NoDataState
                                message="No market share data available"
                            />
                        )}

                    </SectionCard>
                </div>


                {/* All Arrangers */}
                <SectionCard className="my-3">

                    <div className="flex items-center justify-between mb-4">

                        <h2 className="text-sm font-semibold">
                            All Arrangers List :{' '}
                            {selectedFY}
                        </h2>

                        <button
                            onClick={
                                handleExportListCSV
                            }
                            disabled={
                                isTableLoading ||
                                listTableData.length ===
                                    0
                            }
                            className="flex items-center gap-1.5 bg-green-600 disabled:opacity-50 text-white rounded-lg px-4 h-8 text-xs font-medium"
                        >
                            Export CSV
                        </button>

                    </div>

                    <div className="h-[250px]">

                        <ScrollableTable
                            data={
                                listTableData
                            }
                            selectedFY={
                                selectedFY
                            }
                            pageType="arrangers"
                            valueConvention={
                                valueConvention
                            }
                            filters={filters}
                            startDate={
                                selectedYearsDateRange?.startDate
                            }
                            endDate={
                                selectedYearsDateRange?.endDate
                            }
                        />

                    </div>

                </SectionCard>


                {/* Credit Ratings */}
                <CreditRatingsSection
                    selectedYearsDateRange={
                        selectedYearsDateRange
                    }
                    filters={filters}
                    valueConvention={
                        valueConvention
                    }
                    arrangerOptions={
                        arrangerOptionsForRatings
                    }
                    selectedFY={
                        selectedFY
                    }
                />

            </div>
        </SkeletonTheme>
    );
}