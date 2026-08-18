'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import html2canvas from 'html2canvas-pro';
import { AnimatePresence, motion } from 'framer-motion';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from 'recharts';

import Skeleton, {
    SkeletonTheme,
} from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';

import {
    fetchIssueDetailsFilterInputsData,
} from '@/features/issuers/services';

import {
    fetchRatingAgencyMonthlySummaryData,
} from '@/features/ratingAgencies/services';

import {
    Search,
    X,
    ChevronDown,
    SlidersHorizontal,
} from 'lucide-react';

import { SummaryDiagonalCard } from '@/components/SummaryDiagonalCard';
import MonthWiseTable from '@/components/MonthWiseTable';
import QuarterWiseTable from '@/components/QuarterWiseTable';
import CustomDropdown from '@/components/CustomDropdown';

import {
    useSummaryFilterStore,
    MonthlyFilters,
    MonthlyPageState,
} from '@/lib/filtersState';

// ============================================================
// TYPES
// ============================================================

interface MonthlyApiData {
    issueMonthNo: number;
    issueMonth: string;
    noOfIssue: number;
    issueSize: number;
    actualIssueSize: number;
}

interface ChartData {
    monthNumber: number;
    monthName: string;

    primaryIssueCount: number;
    compareIssueCount: number;

    primaryIssueSize: number;
    compareIssueSize: number;
}

interface QuarterlyData {
    quarter: string;

    primaryIssueCount: number;
    compareIssueCount: number;

    primaryIssueSize: number;
    compareIssueSize: number;
}

interface FilterOptions {
    ownershipType: string[];
    sector: string[];
    nature: string[];
    securityType: string[];
    creditRatingAgency: string[];
    modeOfIssue: string[];
    seniority: string[];
    listingStatus: string[];
    securedFlag: string[];
    creditRating: string[];
}

type SizeUnit = 'Crores' | 'Lakhs' | 'Billions';

type FilterType = 'primary' | 'compare';

// ============================================================
// PAGE CONSTANTS
// ============================================================

const RATING_AGENCIES_MONTHLY_PAGE =
    'rating-agencies-monthly' as const;

const DEFAULT_MONTHLY_FILTERS: MonthlyFilters = {
    ownershipType: [],
    nature: [],
    sector: [],
    securityType: [],
    creditRatingAgency: [],
    modeOfIssue: [],
    seniority: [],
    listingStatus: [],
    securedFlag: [],
    rating: [],
};

// ============================================================
// FINANCIAL YEAR OPTIONS
// ============================================================

function generateFinancialYearOptions(count = 5) {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentFYStart =
        currentMonth >= 3
            ? currentYear
            : currentYear - 1;

    const today = now.toISOString().split('T')[0];

    return Array.from({ length: count }, (_, index) => {
        const startYear = currentFYStart - index;
        const endYear = startYear + 1;

        const startDate = `${startYear}-04-01`;
        const normalEndDate = `${endYear}-03-31`;

        return {
            label: `FY ${startYear}-${String(endYear).slice(-2)}`,
            startDate,
            endDate:
                normalEndDate > today
                    ? today
                    : normalEndDate,
        };
    });
}

const FINANCIAL_YEAR_OPTIONS =
    generateFinancialYearOptions(5);

const FY_DROPDOWN_OPTIONS =
    FINANCIAL_YEAR_OPTIONS.map((item) => ({
        value: item.label,
        label: item.label,
    }));

// ============================================================
// DEFAULT PAGE STATE
// ============================================================

const DEFAULT_PAGE_STATE: MonthlyPageState = {
    primaryStartDate:
        FINANCIAL_YEAR_OPTIONS[0].startDate,

    primaryEndDate:
        FINANCIAL_YEAR_OPTIONS[0].endDate,

    compareStartDate:
        FINANCIAL_YEAR_OPTIONS[1].startDate,

    compareEndDate:
        FINANCIAL_YEAR_OPTIONS[1].endDate,

    primaryFilters: DEFAULT_MONTHLY_FILTERS,
    compareFilters: DEFAULT_MONTHLY_FILTERS,

    enableCompare: false,

    sizeUnit: 'Crores',
};

// ============================================================
// UI COMPONENTS
// ============================================================

function SectionCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`
                bg-white dark:bg-[#1a1a2e]
                rounded-[12px]
                shadow-sm
                border border-gray-200 dark:border-gray-600
                px-5 py-3
                ${className}
            `}
        >
            {children}
        </div>
    );
}

function ChartSkeleton({
    height = 260,
}: {
    height?: number;
}) {
    return (
        <div
            style={{ height }}
            className="dark:bg-[#1a1a2e]"
        >
            <Skeleton height="100%" />
        </div>
    );
}

function NoDataState({
    message = 'No data available',
}: {
    message?: string;
}) {
    return (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1a1a2e]">
            <p className="text-[9px] text-gray-500 dark:text-gray-400">
                {message}
            </p>
        </div>
    );
}

function FilterGroup({
    label,
    children,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-col gap-1.5 ${className}`}
        >
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {label}
            </label>

            {children}
        </div>
    );
}

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
                type="button"
                onClick={onRemove}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}

function DownloadPngButton({
    onClick,
    label = 'Download PNG',
}: {
    onClick: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
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

// ============================================================
// UTILS
// ============================================================

function getMonthName(monthNo: number): string {
    const months: Record<number, string> = {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'Jul',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec',
    };

    return months[monthNo] || '';
}

function getFinancialYearLabel(
    startDate: string,
    endDate: string,
): string {
    const year = FINANCIAL_YEAR_OPTIONS.find(
        (item) =>
            item.startDate === startDate &&
            item.endDate === endDate,
    );

    return year?.label || 'Custom FY';
}

function formatSameMonthDayInYear(
    date: string,
    year: number,
): string {
    const [, month, day] = date.split('-');

    const parsedMonth = Number(month);
    const parsedDay = Number(day);

    const targetDate = new Date(
        year,
        parsedMonth - 1,
        parsedDay,
    );

    if (
        targetDate.getFullYear() !== year ||
        targetDate.getMonth() + 1 !== parsedMonth ||
        targetDate.getDate() !== parsedDay
    ) {
        const maxDay = new Date(
            year,
            parsedMonth,
            0,
        ).getDate();

        return `${year}-${String(parsedMonth).padStart(
            2,
            '0',
        )}-${String(
            Math.min(parsedDay, maxDay),
        ).padStart(2, '0')}`;
    }

    return `${year}-${month}-${day}`;
}

function getCompareEndDate(
    compareStartDate: string,
    primaryEndDate: string,
): string {
    const compareYear =
        new Date(compareStartDate).getFullYear();

    return formatSameMonthDayInYear(
        primaryEndDate,
        compareYear,
    );
}

function filterZeroData(
    data: MonthlyApiData[],
): MonthlyApiData[] {
    return data.filter(
        (item) =>
            Number(item.noOfIssue) !== 0 ||
            Number(item.issueSize) !== 0,
    );
}

function formatNumber(value: number): string {
    return Number(value || 0).toLocaleString(
        'en-IN',
        {
            maximumFractionDigits: 2,
        },
    );
}

function formatNumberToFourChar(
    num: number,
): string {
    const value = Number(num || 0);

    if (value >= 1000) {
        if (value < 1_000_000) {
            return (
                (value / 1000)
                    .toFixed(1)
                    .replace('.0', '') + 'k'
            );
        }

        if (value < 1_000_000_000) {
            return (
                (value / 1_000_000)
                    .toFixed(1)
                    .replace('.0', '') + 'm'
            );
        }

        return (
            (value / 1_000_000_000)
                .toFixed(1)
                .replace('.0', '') + 'b'
        );
    }

    return Math.round(value).toString();
}

function convertApiData(
    data: MonthlyApiData[],
    unit: SizeUnit,
): MonthlyApiData[] {
    const factor =
        unit === 'Lakhs'
            ? 100
            : unit === 'Billions'
                ? 0.01
                : 1;

    return data.map((item) => ({
        ...item,
        issueSize:
            Number(item.issueSize || 0) * factor,
        actualIssueSize:
            Number(item.actualIssueSize || 0) * factor,
    }));
}

function getComparisonData(
    primaryData: MonthlyApiData[],
    compareData: MonthlyApiData[],
): ChartData[] {
    const monthNumbers = Array.from(
        new Set([
            ...primaryData.map(
                (item) => item.issueMonthNo,
            ),
            ...compareData.map(
                (item) => item.issueMonthNo,
            ),
        ]),
    ).sort((a, b) => a - b);

    return monthNumbers.map((monthNumber) => {
        const primaryMonth =
            primaryData.find(
                (item) =>
                    item.issueMonthNo === monthNumber,
            );

        const compareMonth =
            compareData.find(
                (item) =>
                    item.issueMonthNo === monthNumber,
            );

        return {
            monthNumber,

            monthName:
                getMonthName(monthNumber),

            primaryIssueCount:
                Number(
                    primaryMonth?.noOfIssue || 0,
                ),

            compareIssueCount:
                Number(
                    compareMonth?.noOfIssue || 0,
                ),

            primaryIssueSize:
                Number(
                    primaryMonth?.issueSize || 0,
                ),

            compareIssueSize:
                Number(
                    compareMonth?.issueSize || 0,
                ),
        };
    });
}

function getQuarterlyData(
    monthlyData: ChartData[],
): QuarterlyData[] {
    const quarters = [
        {
            label: 'Q1',
            months: [4, 5, 6],
        },
        {
            label: 'Q2',
            months: [7, 8, 9],
        },
        {
            label: 'Q3',
            months: [10, 11, 12],
        },
        {
            label: 'Q4',
            months: [1, 2, 3],
        },
    ];

    return quarters
        .map((quarter) => {
            const quarterMonths =
                monthlyData.filter((month) =>
                    quarter.months.includes(
                        Number(month.monthNumber),
                    ),
                );

            return {
                quarter: quarter.label,

                primaryIssueCount:
                    quarterMonths.reduce(
                        (sum, item) =>
                            sum +
                            item.primaryIssueCount,
                        0,
                    ),

                compareIssueCount:
                    quarterMonths.reduce(
                        (sum, item) =>
                            sum +
                            item.compareIssueCount,
                        0,
                    ),

                primaryIssueSize:
                    quarterMonths.reduce(
                        (sum, item) =>
                            sum +
                            item.primaryIssueSize,
                        0,
                    ),

                compareIssueSize:
                    quarterMonths.reduce(
                        (sum, item) =>
                            sum +
                            item.compareIssueSize,
                        0,
                    ),
            };
        })
        .filter(
            (q) =>
                q.primaryIssueCount > 0 ||
                q.primaryIssueSize > 0 ||
                q.compareIssueCount > 0 ||
                q.compareIssueSize > 0,
        );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AgenciesMonthWiseSummary() {
    // ========================================================
    // UI STATE
    // ========================================================

    const [isLoading, setIsLoading] =
        useState(false);

    const [isFiltersExpanded, setIsFiltersExpanded] =
        useState(false);

    const [isSearching, setIsSearching] =
        useState(false);

    const areaChartRef =
        useRef<HTMLDivElement>(null);

    const barChartRef =
        useRef<HTMLDivElement>(null);

    // ========================================================
    // FILTER OPTIONS
    // ========================================================

    const [filterOptions, setFilterOptions] =
        useState<FilterOptions>({
            ownershipType: [],
            sector: [],
            nature: [],
            securityType: [],
            creditRatingAgency: [],
            modeOfIssue: [],
            seniority: [],
            listingStatus: [],
            securedFlag: [],
            creditRating: [],
        });

    // ========================================================
    // ZUSTAND STATE
    // ========================================================

    const storedMonthlyState =
        useSummaryFilterStore(
            (state) =>
                state.monthlyPageState[
                    RATING_AGENCIES_MONTHLY_PAGE
                ],
        );

    const activeFilterPage =
        useSummaryFilterStore(
            (state) => state.activeFilterPage,
        );

    const setMonthlyPageState =
        useSummaryFilterStore(
            (state) => state.setMonthlyPageState,
        );

    const updateMonthlyPageFilter =
        useSummaryFilterStore(
            (state) =>
                state.updateMonthlyPageFilter,
        );

    const updateMonthlyPageField =
        useSummaryFilterStore(
            (state) =>
                state.updateMonthlyPageField,
        );

    const clearMonthlyPageState =
        useSummaryFilterStore(
            (state) =>
                state.clearMonthlyPageState,
        );

    // ========================================================
    // ENSURE PAGE STATE EXISTS
    // ========================================================

    useEffect(() => {
        if (!storedMonthlyState) {
            setMonthlyPageState(
                RATING_AGENCIES_MONTHLY_PAGE,
                DEFAULT_PAGE_STATE,
            );

            return;
        }

        if (
            activeFilterPage !==
            RATING_AGENCIES_MONTHLY_PAGE
        ) {
            setMonthlyPageState(
                RATING_AGENCIES_MONTHLY_PAGE,
                storedMonthlyState,
            );
        }
    }, [
        storedMonthlyState,
        activeFilterPage,
        setMonthlyPageState,
    ]);

    const currentMonthlyState =
        storedMonthlyState ||
        DEFAULT_PAGE_STATE;

    const {
        primaryStartDate,
        primaryEndDate,
        compareStartDate,
        compareEndDate,
        primaryFilters,
        compareFilters,
        enableCompare,
        sizeUnit,
    } = currentMonthlyState;

    // ========================================================
    // DATA
    // ========================================================

    const [primaryData, setPrimaryData] =
        useState<MonthlyApiData[]>([]);

    const [compareData, setCompareData] =
        useState<MonthlyApiData[]>([]);

    // ========================================================
    // DISPLAY DATA
    // ========================================================

    const displayPrimaryData =
        useMemo(
            () =>
                convertApiData(
                    primaryData,
                    sizeUnit,
                ),
            [
                primaryData,
                sizeUnit,
            ],
        );

    const displayCompareData =
        useMemo(
            () =>
                convertApiData(
                    compareData,
                    sizeUnit,
                ),
            [
                compareData,
                sizeUnit,
            ],
        );

    // ========================================================
    // FETCH FILTER OPTIONS
    // ========================================================

    const fetchFilterOptions =
        useCallback(async () => {
            try {
                const response =
                    await fetchIssueDetailsFilterInputsData(
                        {
                            startDate:
                                primaryStartDate,
                            endDate:
                                primaryEndDate,
                        },
                    );

                setFilterOptions({
                    ownershipType:
                        response?.ownershipType ||
                        [],

                    sector:
                        response?.sector ||
                        [],

                    nature:
                        response?.nature ||
                        [],

                    securityType:
                        response?.securityType ||
                        [],

                    creditRatingAgency:
                        response?.creditRatingAgency ||
                        [],

                    modeOfIssue:
                        response?.modeOfIssue ||
                        [],

                    seniority:
                        response?.seniority ||
                        [],

                    listingStatus:
                        response?.listingStatus ||
                        [],

                    securedFlag:
                        response?.securedFlag ||
                        [],

                    creditRating:
                        response?.creditRating ||
                        [],
                });
            } catch (error) {
                console.error(
                    'Failed to fetch filter options:',
                    error,
                );
            }
        }, [
            primaryStartDate,
            primaryEndDate,
        ]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // ========================================================
    // PRIMARY API
    //
    // IMPORTANT:
    // This only runs when `isSearching` is triggered.
    // ========================================================

    const fetchPrimaryData =
        useCallback(async () => {
            try {
                setIsLoading(true);

                const response =
                    await fetchRatingAgencyMonthlySummaryData(
                        {
                            startDate:
                                primaryStartDate,

                            endDate:
                                primaryEndDate,

                            ownershipType:
                                primaryFilters.ownershipType,

                            sector:
                                primaryFilters.sector,

                            nature:
                                primaryFilters.nature,

                            securityType:
                                primaryFilters.securityType,

                            creditRatingAgency:
                                primaryFilters.creditRatingAgency,

                            modeOfIssue:
                                primaryFilters.modeOfIssue,

                            seniority:
                                primaryFilters.seniority,

                            listingStatus:
                                primaryFilters.listingStatus,

                            securedFlag:
                                primaryFilters.securedFlag,

                            rating:
                                primaryFilters.rating,
                        },
                    );

                setPrimaryData(
                    filterZeroData(
                        response?.data || [],
                    ),
                );
            } catch (error) {
                console.error(
                    'Failed to fetch primary monthly data:',
                    error,
                );

                setPrimaryData([]);
            } finally {
                setIsLoading(false);
            }
        }, [
            primaryStartDate,
            primaryEndDate,
            primaryFilters,
        ]);

    // ========================================================
    // COMPARE API
    // ========================================================

    const fetchCompareData =
        useCallback(async () => {
            if (!enableCompare) {
                setCompareData([]);
                return;
            }

            try {
                const response =
                    await fetchRatingAgencyMonthlySummaryData(
                        {
                            startDate:
                                compareStartDate,

                            endDate:
                                compareEndDate,

                            ownershipType:
                                compareFilters.ownershipType,

                            sector:
                                compareFilters.sector,

                            nature:
                                compareFilters.nature,

                            securityType:
                                compareFilters.securityType,

                            creditRatingAgency:
                                compareFilters.creditRatingAgency,

                            modeOfIssue:
                                compareFilters.modeOfIssue,

                            seniority:
                                compareFilters.seniority,

                            listingStatus:
                                compareFilters.listingStatus,

                            securedFlag:
                                compareFilters.securedFlag,

                            rating:
                                compareFilters.rating,
                        },
                    );

                setCompareData(
                    filterZeroData(
                        response?.data || [],
                    ),
                );
            } catch (error) {
                console.error(
                    'Failed to fetch compare monthly data:',
                    error,
                );

                setCompareData([]);
            }
        }, [
            enableCompare,
            compareStartDate,
            compareEndDate,
            compareFilters,
        ]);

    // ========================================================
    // SEARCH
    // ========================================================

    const handleSearch = useCallback(async () => {
        setIsSearching(true);

        try {
            await fetchPrimaryData();

            if (enableCompare) {
                await fetchCompareData();
            } else {
                setCompareData([]);
            }

            setIsFiltersExpanded(false);
        } finally {
            setIsSearching(false);
        }
    }, [
        fetchPrimaryData,
        fetchCompareData,
        enableCompare,
    ]);

    // ========================================================
    // INITIAL DATA LOAD
    //
    // Do not depend on every filter dropdown here.
    // ========================================================

    const initialLoadRef =
        useRef(false);

    useEffect(() => {
        if (initialLoadRef.current) {
            return;
        }

        initialLoadRef.current = true;

        void handleSearch();
    }, [handleSearch]);

    // ========================================================
    // CLEAR COMPARE DATA WHEN COMPARE DISABLED
    // ========================================================

    useEffect(() => {
        if (!enableCompare) {
            setCompareData([]);
        }
    }, [enableCompare]);

    // ========================================================
    // KEEP COMPARE END DATE IN SYNC
    // ========================================================

    useEffect(() => {
        if (!enableCompare) {
            return;
        }

        const expectedEndDate =
            getCompareEndDate(
                compareStartDate,
                primaryEndDate,
            );

        if (
            compareEndDate !==
            expectedEndDate
        ) {
            updateMonthlyPageField(
                RATING_AGENCIES_MONTHLY_PAGE,
                'compareEndDate',
                expectedEndDate,
            );
        }
    }, [
        enableCompare,
        compareStartDate,
        primaryEndDate,
        compareEndDate,
        updateMonthlyPageField,
    ]);

    // ========================================================
    // CHART DATA
    // ========================================================

    const primaryChartData =
        useMemo(
            () =>
                displayPrimaryData.map(
                    (item) => ({
                        ...item,
                        monthName:
                            getMonthName(
                                item.issueMonthNo,
                            ),
                    }),
                ),
            [displayPrimaryData],
        );

    const comparisonData =
        useMemo(
            () =>
                getComparisonData(
                    displayPrimaryData,
                    displayCompareData,
                ),
            [
                displayPrimaryData,
                displayCompareData,
            ],
        );

    const quarterlyData =
        useMemo(
            () =>
                getQuarterlyData(
                    comparisonData,
                ),
            [comparisonData],
        );

    // ========================================================
    // TOTALS
    // ========================================================

    const primaryTotalCount =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, item) =>
                        sum +
                        item.primaryIssueCount,
                    0,
                ),
            [comparisonData],
        );

    const compareTotalCount =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, item) =>
                        sum +
                        item.compareIssueCount,
                    0,
                ),
            [comparisonData],
        );

    const primaryTotalSize =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, item) =>
                        sum +
                        item.primaryIssueSize,
                    0,
                ),
            [comparisonData],
        );

    const compareTotalSize =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, item) =>
                        sum +
                        item.compareIssueSize,
                    0,
                ),
            [comparisonData],
        );

    const totalCountGrowth =
        useMemo(() => {
            if (
                !enableCompare ||
                compareTotalCount <= 0
            ) {
                return 0;
            }

            return (
                (
                    (primaryTotalCount -
                        compareTotalCount) /
                    compareTotalCount
                ) * 100
            );
        }, [
            enableCompare,
            primaryTotalCount,
            compareTotalCount,
        ]);

    const totalSizeGrowth =
        useMemo(() => {
            if (
                !enableCompare ||
                compareTotalSize <= 0
            ) {
                return 0;
            }

            return (
                (
                    (primaryTotalSize -
                        compareTotalSize) /
                    compareTotalSize
                ) * 100
            );
        }, [
            enableCompare,
            primaryTotalSize,
            compareTotalSize,
        ]);

    const avgPrimarySize =
        primaryData.length > 0
            ? primaryTotalSize /
            primaryData.length
            : 0;

    const avgCompareSize =
        compareData.length > 0
            ? compareTotalSize /
            compareData.length
            : 0;

    const avgSizeGrowth =
        enableCompare &&
            avgCompareSize > 0
            ? (
                (
                    avgPrimarySize -
                    avgCompareSize
                ) /
                avgCompareSize
            ) * 100
            : 0;

    // ========================================================
    // FY LABELS
    // ========================================================

    const primaryYearLabel =
        getFinancialYearLabel(
            primaryStartDate,
            primaryEndDate,
        );

    const compareYearLabel =
        getFinancialYearLabel(
            compareStartDate,
            compareEndDate,
        );

    // ========================================================
    // FILTER HELPERS
    // ========================================================

    const filterLabelMap:
        Record<
            keyof MonthlyFilters,
            string
        > = {
        ownershipType: 'Ownership',
        sector: 'Sector',
        nature: 'Nature',
        securityType: 'Security Type',
        creditRatingAgency:
            'Credit Rating Agency',
        modeOfIssue: 'Mode Of Issue',
        seniority: 'Seniority',
        listingStatus: 'Listing Status',
        securedFlag: 'Secured Flag',
        rating: 'Rating',
    };

    const activeFilterCount =
        useMemo(
            () =>
                Object.values(
                    primaryFilters,
                ).reduce(
                    (total, values) =>
                        total +
                        values.length,
                    0,
                ),
            [primaryFilters],
        );

    const compareActiveFilterCount =
        useMemo(
            () =>
                Object.values(
                    compareFilters,
                ).reduce(
                    (total, values) =>
                        total +
                        values.length,
                    0,
                ),
            [compareFilters],
        );

    const totalActiveFilterCount =
        activeFilterCount +
        compareActiveFilterCount;

    const activeFilterChips =
        useMemo(() => {
            const chips: {
                key: keyof MonthlyFilters;
                label: string;
                index: number;
                type: FilterType;
            }[] = [];

            (
                Object.keys(
                    primaryFilters,
                ) as Array<
                    keyof MonthlyFilters
                >
            ).forEach((key) => {
                primaryFilters[key].forEach(
                    (value, index) => {
                        chips.push({
                            key,
                            index,
                            type: 'primary',
                            label:
                                `${filterLabelMap[key]}: ${value}`,
                        });
                    },
                );
            });

            if (enableCompare) {
                (
                    Object.keys(
                        compareFilters,
                    ) as Array<
                        keyof MonthlyFilters
                    >
                ).forEach((key) => {
                    compareFilters[key].forEach(
                        (value, index) => {
                            chips.push({
                                key,
                                index,
                                type: 'compare',
                                label:
                                    `Compare ${filterLabelMap[key]}: ${value}`,
                            });
                        },
                    );
                });
            }

            return chips;
        }, [
            primaryFilters,
            compareFilters,
            enableCompare,
        ]);

    // ========================================================
    // FILTER UPDATE
    // ========================================================

    const updateFilter =
        useCallback(
            (
                type: FilterType,
                key: keyof MonthlyFilters,
                value: string[],
            ) => {
                updateMonthlyPageFilter(
                    RATING_AGENCIES_MONTHLY_PAGE,
                    type,
                    key,
                    value,
                );
            },
            [updateMonthlyPageFilter],
        );

    const toOptions = useCallback(
        (
            items: string[],
        ): {
            value: string;
            label: string;
        }[] =>
            (items || []).map(
                (item) => ({
                    value: item,
                    label: item,
                }),
            ),
        [],
    );

    // ========================================================
    // FY CHANGE
    // ========================================================

    const handleFinancialYearChange =
        useCallback(
            (
                value: string,
                type: FilterType,
            ) => {
                const selectedYear =
                    FINANCIAL_YEAR_OPTIONS.find(
                        (item) =>
                            item.label === value,
                    );

                if (!selectedYear) {
                    return;
                }

                if (type === 'primary') {
                    updateMonthlyPageField(
                        RATING_AGENCIES_MONTHLY_PAGE,
                        'primaryStartDate',
                        selectedYear.startDate,
                    );

                    updateMonthlyPageField(
                        RATING_AGENCIES_MONTHLY_PAGE,
                        'primaryEndDate',
                        selectedYear.endDate,
                    );

                    if (enableCompare) {
                        const newCompareEndDate =
                            getCompareEndDate(
                                compareStartDate,
                                selectedYear.endDate,
                            );

                        updateMonthlyPageField(
                            RATING_AGENCIES_MONTHLY_PAGE,
                            'compareEndDate',
                            newCompareEndDate,
                        );
                    }
                } else {
                    updateMonthlyPageField(
                        RATING_AGENCIES_MONTHLY_PAGE,
                        'compareStartDate',
                        selectedYear.startDate,
                    );

                    updateMonthlyPageField(
                        RATING_AGENCIES_MONTHLY_PAGE,
                        'compareEndDate',
                        enableCompare
                            ? getCompareEndDate(
                                selectedYear.startDate,
                                primaryEndDate,
                            )
                            : selectedYear.endDate,
                    );
                }
            },
            [
                enableCompare,
                compareStartDate,
                primaryEndDate,
                updateMonthlyPageField,
            ],
        );

    // ========================================================
    // RESET
    // ========================================================

    const handleResetFilters =
        useCallback(() => {
            clearMonthlyPageState(
                RATING_AGENCIES_MONTHLY_PAGE,
                DEFAULT_PAGE_STATE,
            );

            setPrimaryData([]);
            setCompareData([]);
        }, [
            clearMonthlyPageState,
        ]);

    const clearAllFilters =
        useCallback(
            (type: FilterType) => {
                (
                    Object.keys(
                        DEFAULT_MONTHLY_FILTERS,
                    ) as Array<
                        keyof MonthlyFilters
                    >
                ).forEach((key) => {
                    updateMonthlyPageFilter(
                        RATING_AGENCIES_MONTHLY_PAGE,
                        type,
                        key,
                        [],
                    );
                });
            },
            [updateMonthlyPageFilter],
        );

    // ========================================================
    // PNG DOWNLOAD
    // ========================================================

    const downloadChartAsPng =
        useCallback(
            async (
                chartRef:
                    | HTMLElement
                    | null,
                filename: string,
            ) => {
                if (!chartRef) {
                    return;
                }

                try {
                    const canvas =
                        await html2canvas(
                            chartRef,
                            {
                                backgroundColor:
                                    '#ffffff',
                                scale: 2,
                                useCORS: true,
                            },
                        );

                    const link =
                        document.createElement(
                            'a',
                        );

                    link.download =
                        `${filename}.png`;

                    link.href =
                        canvas.toDataURL(
                            'image/png',
                        );

                    link.click();
                } catch (error) {
                    console.error(
                        'Error downloading chart:',
                        error,
                    );
                }
            },
            [],
        );

    // ========================================================
    // CSV HELPER
    // ========================================================

    const createCsv = useCallback(
        (rows: string[][]) => {
            return rows
                .map((row) =>
                    row
                        .map((cell) => {
                            const value =
                                String(cell);

                            if (
                                value.includes(
                                    ',',
                                ) ||
                                value.includes(
                                    '"',
                                ) ||
                                value.includes(
                                    '\n',
                                )
                            ) {
                                return `"${value.replace(
                                    /"/g,
                                    '""',
                                )}"`;
                            }

                            return value;
                        })
                        .join(','),
                )
                .join('\n');
        },
        [],
    );

    const downloadCsv =
        useCallback(
            (
                content: string,
                filename: string,
            ) => {
                const blob =
                    new Blob(
                        [content],
                        {
                            type:
                                'text/csv;charset=utf-8;',
                        },
                    );

                const link =
                    document.createElement(
                        'a',
                    );

                const url =
                    URL.createObjectURL(
                        blob,
                    );

                link.href = url;
                link.download =
                    filename;

                document.body.appendChild(
                    link,
                );

                link.click();

                document.body.removeChild(
                    link,
                );

                URL.revokeObjectURL(
                    url,
                );
            },
            [],
        );

    // ========================================================
    // MONTH CSV
    // ========================================================

    const handleExportMonthWiseCSV =
        useCallback(() => {
            if (
                !comparisonData.length
            ) {
                return;
            }

            const headers =
                enableCompare
                    ? [
                        'Month',
                        `${primaryYearLabel} Issue Count`,
                        `${compareYearLabel} Issue Count`,
                        `${primaryYearLabel} Issue Size (${sizeUnit})`,
                        `${compareYearLabel} Issue Size (${sizeUnit})`,
                    ]
                    : [
                        'Month',
                        'Issue Count',
                        `Issue Size (${sizeUnit})`,
                    ];

            const rows =
                comparisonData.map(
                    (row) => {
                        if (
                            enableCompare
                        ) {
                            return [
                                row.monthName,
                                String(
                                    row.primaryIssueCount,
                                ),
                                String(
                                    row.compareIssueCount,
                                ),
                                formatNumber(
                                    row.primaryIssueSize,
                                ),
                                formatNumber(
                                    row.compareIssueSize,
                                ),
                            ];
                        }

                        return [
                            row.monthName,
                            String(
                                row.primaryIssueCount,
                            ),
                            formatNumber(
                                row.primaryIssueSize,
                            ),
                        ];
                    },
                );

            downloadCsv(
                createCsv([
                    headers,
                    ...rows,
                ]),
                `month_wise_rating_agencies_${primaryYearLabel}${enableCompare
                    ? `_vs_${compareYearLabel}`
                    : ''
                }.csv`,
            );
        }, [
            comparisonData,
            enableCompare,
            primaryYearLabel,
            compareYearLabel,
            sizeUnit,
            createCsv,
            downloadCsv,
        ]);

    // ========================================================
    // QUARTER CSV
    // ========================================================

    const handleExportQuarterWiseCSV =
        useCallback(() => {
            if (
                !quarterlyData.length
            ) {
                return;
            }

            const headers =
                enableCompare
                    ? [
                        'Quarter',
                        `${primaryYearLabel} Issue Count`,
                        `${compareYearLabel} Issue Count`,
                        `${primaryYearLabel} Issue Size (${sizeUnit})`,
                        `${compareYearLabel} Issue Size (${sizeUnit})`,
                    ]
                    : [
                        'Quarter',
                        'Issue Count',
                        `Issue Size (${sizeUnit})`,
                    ];

            const rows =
                quarterlyData.map(
                    (row) => {
                        if (
                            enableCompare
                        ) {
                            return [
                                row.quarter,
                                String(
                                    row.primaryIssueCount,
                                ),
                                String(
                                    row.compareIssueCount,
                                ),
                                formatNumber(
                                    row.primaryIssueSize,
                                ),
                                formatNumber(
                                    row.compareIssueSize,
                                ),
                            ];
                        }

                        return [
                            row.quarter,
                            String(
                                row.primaryIssueCount,
                            ),
                            formatNumber(
                                row.primaryIssueSize,
                            ),
                        ];
                    },
                );

            downloadCsv(
                createCsv([
                    headers,
                    ...rows,
                ]),
                `quarter_wise_rating_agencies_${primaryYearLabel}${enableCompare
                    ? `_vs_${compareYearLabel}`
                    : ''
                }.csv`,
            );
        }, [
            quarterlyData,
            enableCompare,
            primaryYearLabel,
            compareYearLabel,
            sizeUnit,
            createCsv,
            downloadCsv,
        ]);

    // ========================================================
    // TOOLTIP
    // ========================================================

    const CustomTooltipComponent =
        useMemo(() => {
            return function TooltipComponent({
                active,
                payload,
                label,
            }: any) {
                if (
                    !active ||
                    !payload ||
                    !payload.length
                ) {
                    return null;
                }

                return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-[12px] shadow-lg p-3 text-[9px]">
                        <p className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            {label}
                        </p>

                        {payload.map(
                            (
                                item: any,
                                index: number,
                            ) => (
                                <p
                                    key={
                                        index
                                    }
                                    className="mb-1 text-gray-700 dark:text-gray-200"
                                >
                                    <span
                                        style={{
                                            color:
                                                item.color,
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                    :{' '}
                                    {formatNumber(
                                        item.value,
                                    )}{' '}
                                    {sizeUnit}
                                </p>
                            ),
                        )}
                    </div>
                );
            };
        }, [sizeUnit]);

    // ========================================================
    // COMMON DROPDOWN PROPS
    // ========================================================

    const dropdownMenuClassName =
        'w-48 max-h-56 overflow-y-auto overflow-x-hidden';

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <SkeletonTheme
            enableAnimation
            baseColor="#1F2937"
            highlightColor="#90969bff"
            borderRadius="0.5rem"
        >
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-700 dark:text-gray-200">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        Rating Agencies Monthly Summary
                    </h1>

                    <p className="text-[9px] text-gray-400 mb-6 mt-1">
                        Rating Agencies &gt; Monthly Summary
                    </p>
                </div>

                {/* ==================================================
                    FILTER CARD
                ================================================== */}

                <SectionCard className="overflow-hidden">

                    <button
                        type="button"
                        onClick={() =>
                            setIsFiltersExpanded(
                                (previous) =>
                                    !previous,
                            )
                        }
                        className="w-full flex items-center justify-between px-5 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">

                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <div className="flex flex-col items-start">

                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Filters
                                </span>

                                {totalActiveFilterCount >
                                    0 && (
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                            {
                                                totalActiveFilterCount
                                            }{' '}
                                            active
                                        </span>
                                    )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">

                            {!isFiltersExpanded &&
                                activeFilterChips.length >
                                0 && (
                                    <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-md">

                                        {activeFilterChips
                                            .slice(
                                                0,
                                                3,
                                            )
                                            .map(
                                                (
                                                    chip,
                                                ) => (
                                                    <ActiveFilterChip
                                                        key={`${chip.type}-${chip.key}-${chip.index}`}
                                                        label={
                                                            chip.label
                                                        }
                                                        onRemove={() => {
                                                            const source =
                                                                chip.type ===
                                                                    'primary'
                                                                    ? primaryFilters
                                                                    : compareFilters;

                                                            const values =
                                                                source[
                                                                    chip.key
                                                                ];

                                                            updateFilter(
                                                                chip.type,
                                                                chip.key,
                                                                values.filter(
                                                                    (
                                                                        _,
                                                                        index,
                                                                    ) =>
                                                                        index !==
                                                                        chip.index,
                                                                ),
                                                            );
                                                        }}
                                                    />
                                                ),
                                            )}

                                        {activeFilterChips.length >
                                            3 && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    +
                                                    {activeFilterChips.length -
                                                        3}{' '}
                                                    more
                                                </span>
                                            )}
                                    </div>
                                )}

                            <ChevronDown
                                className={`
                                    w-5 h-5
                                    text-gray-400
                                    dark:text-gray-500
                                    transition-transform
                                    duration-200
                                    ${isFiltersExpanded
                                        ? 'rotate-180'
                                        : ''
                                    }
                                `}
                            />
                        </div>
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
                                transition={{
                                    duration: 0.25,
                                }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-8">

                                    {/* ==================================================
                                        PRIMARY FILTERS
                                    ================================================== */}

                                    <div>

                                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">

                                            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                                                Primary Filters
                                            </h2>

                                            <div className="flex items-center gap-3">

                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] text-gray-400">
                                                        Size Unit
                                                    </label>

                                                    <select
                                                        value={
                                                            sizeUnit
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateMonthlyPageField(
                                                                RATING_AGENCIES_MONTHLY_PAGE,
                                                                'sizeUnit',
                                                                event
                                                                    .target
                                                                    .value as SizeUnit,
                                                            )
                                                        }
                                                        className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                                                    >
                                                        <option value="Crores">
                                                            Crores
                                                        </option>

                                                        <option value="Lakhs">
                                                            Lakhs
                                                        </option>

                                                        <option value="Billions">
                                                            Billions
                                                        </option>
                                                    </select>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleResetFilters
                                                    }
                                                    className="cursor-pointer px-4 py-1.5 rounded-[12px] text-[9px] font-medium bg-white dark:bg-[#13131f] border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-100 dark:hover:bg-[#1b1b2d]"
                                                >
                                                    Reset Filters
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateMonthlyPageField(
                                                            RATING_AGENCIES_MONTHLY_PAGE,
                                                            'enableCompare',
                                                            !enableCompare,
                                                        )
                                                    }
                                                    className={`
                                                        cursor-pointer
                                                        px-4 py-1.5
                                                        rounded-[12px]
                                                        text-[9px]
                                                        font-medium
                                                        transition-all
                                                        ${enableCompare
                                                            ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                                        }
                                                    `}
                                                >
                                                    {enableCompare
                                                        ? 'Disable Compare'
                                                        : 'Enable Compare'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                            {/* PRIMARY FY */}

                                            <FilterGroup label="Financial Year">
                                                <CustomDropdown
                                                    options={
                                                        FY_DROPDOWN_OPTIONS
                                                    }
                                                    value={getFinancialYearLabel(
                                                        primaryStartDate,
                                                        primaryEndDate,
                                                    )}
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        handleFinancialYearChange(
                                                            String(
                                                                value[0] ||
                                                                '',
                                                            ),
                                                            'primary',
                                                        )
                                                    }
                                                    placeholder="Select FY"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                    multiSelect={
                                                        false
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* OWNERSHIP */}

                                            <FilterGroup label="Ownership Type">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.ownershipType,
                                                    )}
                                                    value={
                                                        primaryFilters.ownershipType
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'ownershipType',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Ownership"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* SECTOR */}

                                            <FilterGroup label="Sector">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.sector,
                                                    )}
                                                    value={
                                                        primaryFilters.sector
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'sector',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Sector"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* NATURE */}

                                            <FilterGroup label="Nature">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.nature,
                                                    )}
                                                    value={
                                                        primaryFilters.nature
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'nature',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Nature"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* SECURITY TYPE */}

                                            <FilterGroup label="Security Type">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.securityType,
                                                    )}
                                                    value={
                                                        primaryFilters.securityType
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'securityType',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Security"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* CREDIT RATING AGENCY */}

                                            <FilterGroup label="Credit Rating Agency">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.creditRatingAgency,
                                                    )}
                                                    value={
                                                        primaryFilters.creditRatingAgency
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'creditRatingAgency',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Agency"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* MODE OF ISSUE */}

                                            <FilterGroup label="Mode Of Issue">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.modeOfIssue,
                                                    )}
                                                    value={
                                                        primaryFilters.modeOfIssue
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'modeOfIssue',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Mode"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* SENIORITY */}

                                            <FilterGroup label="Seniority">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.seniority,
                                                    )}
                                                    value={
                                                        primaryFilters.seniority
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'seniority',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Seniority"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* LISTING STATUS */}

                                            <FilterGroup label="Listing Status">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.listingStatus,
                                                    )}
                                                    value={
                                                        primaryFilters.listingStatus
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'listingStatus',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Status"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* SECURED FLAG */}

                                            <FilterGroup label="Secured Flag">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.securedFlag,
                                                    )}
                                                    value={
                                                        primaryFilters.securedFlag
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'securedFlag',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Flag"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>

                                            {/* RATING */}

                                            <FilterGroup label="Rating">
                                                <CustomDropdown
                                                    options={toOptions(
                                                        filterOptions.creditRating,
                                                    )}
                                                    value={
                                                        primaryFilters.rating
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        updateFilter(
                                                            'primary',
                                                            'rating',
                                                            value as string[],
                                                        )
                                                    }
                                                    placeholder="Select Rating"
                                                    menuClassName={
                                                        dropdownMenuClassName
                                                    }
                                                />
                                            </FilterGroup>
                                        </div>
                                    </div>

                                    {/* ==================================================
                                        COMPARE FILTERS
                                    ================================================== */}

                                    {enableCompare && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-8">

                                            <h2 className="text-sm font-semibold mb-5 text-gray-700 dark:text-gray-200">
                                                Compare Filters
                                            </h2>

                                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                                <FilterGroup label="Compare Financial Year">
                                                    <CustomDropdown
                                                        options={
                                                            FY_DROPDOWN_OPTIONS
                                                        }
                                                        value={getFinancialYearLabel(
                                                            compareStartDate,
                                                            compareEndDate,
                                                        )}
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            handleFinancialYearChange(
                                                                String(
                                                                    value[0] ||
                                                                    '',
                                                                ),
                                                                'compare',
                                                            )
                                                        }
                                                        placeholder="Select FY"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                        multiSelect={
                                                            false
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Ownership Type">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.ownershipType,
                                                        )}
                                                        value={
                                                            compareFilters.ownershipType
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'ownershipType',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Ownership"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Sector">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.sector,
                                                        )}
                                                        value={
                                                            compareFilters.sector
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'sector',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Sector"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Nature">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.nature,
                                                        )}
                                                        value={
                                                            compareFilters.nature
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'nature',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Nature"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Security Type">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.securityType,
                                                        )}
                                                        value={
                                                            compareFilters.securityType
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'securityType',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Security"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Credit Rating Agency">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.creditRatingAgency,
                                                        )}
                                                        value={
                                                            compareFilters.creditRatingAgency
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'creditRatingAgency',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Agency"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Mode Of Issue">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.modeOfIssue,
                                                        )}
                                                        value={
                                                            compareFilters.modeOfIssue
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'modeOfIssue',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Mode"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Seniority">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.seniority,
                                                        )}
                                                        value={
                                                            compareFilters.seniority
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'seniority',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Seniority"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Listing Status">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.listingStatus,
                                                        )}
                                                        value={
                                                            compareFilters.listingStatus
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'listingStatus',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Status"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Secured Flag">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.securedFlag,
                                                        )}
                                                        value={
                                                            compareFilters.securedFlag
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'securedFlag',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Flag"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Rating">
                                                    <CustomDropdown
                                                        options={toOptions(
                                                            filterOptions.creditRating,
                                                        )}
                                                        value={
                                                            compareFilters.rating
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateFilter(
                                                                'compare',
                                                                'rating',
                                                                value as string[],
                                                            )
                                                        }
                                                        placeholder="Select Rating"
                                                        menuClassName={
                                                            dropdownMenuClassName
                                                        }
                                                    />
                                                </FilterGroup>
                                            </div>

                                            {compareActiveFilterCount >
                                                0 && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">

                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Compare Active:
                                                        </span>

                                                        {(
                                                            Object.keys(
                                                                compareFilters,
                                                            ) as Array<
                                                                keyof MonthlyFilters
                                                            >
                                                        ).map(
                                                            (
                                                                key,
                                                            ) =>
                                                                compareFilters[
                                                                    key
                                                                ].map(
                                                                    (
                                                                        value,
                                                                        index,
                                                                    ) => (
                                                                        <ActiveFilterChip
                                                                            key={`compare-${key}-${index}`}
                                                                            label={`${filterLabelMap[key]}: ${value}`}
                                                                            onRemove={() =>
                                                                                updateFilter(
                                                                                    'compare',
                                                                                    key,
                                                                                    compareFilters[
                                                                                        key
                                                                                    ].filter(
                                                                                        (
                                                                                            _,
                                                                                            itemIndex,
                                                                                        ) =>
                                                                                            itemIndex !==
                                                                                            index,
                                                                                    ),
                                                                                )
                                                                            }
                                                                        />
                                                                    ),
                                                                ),
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                clearAllFilters(
                                                                    'compare',
                                                                )
                                                            }
                                                            className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1"
                                                        >
                                                            Clear all compare
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* ==================================================
                                        PRIMARY ACTIVE CHIPS
                                    ================================================== */}

                                    {activeFilterCount >
                                        0 && (
                                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">

                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Primary Active:
                                                </span>

                                                {(
                                                    Object.keys(
                                                        primaryFilters,
                                                    ) as Array<
                                                        keyof MonthlyFilters
                                                    >
                                                ).map(
                                                    (
                                                        key,
                                                    ) =>
                                                        primaryFilters[
                                                            key
                                                        ].map(
                                                            (
                                                                value,
                                                                index,
                                                            ) => (
                                                                <ActiveFilterChip
                                                                    key={`primary-${key}-${index}`}
                                                                    label={`${filterLabelMap[key]}: ${value}`}
                                                                    onRemove={() =>
                                                                        updateFilter(
                                                                            'primary',
                                                                            key,
                                                                            primaryFilters[
                                                                                key
                                                                            ].filter(
                                                                                (
                                                                                    _,
                                                                                    itemIndex,
                                                                                ) =>
                                                                                    itemIndex !==
                                                                                    index,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            ),
                                                        ),
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        clearAllFilters(
                                                            'primary',
                                                        )
                                                    }
                                                    className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1"
                                                >
                                                    Clear all primary
                                                </button>
                                            </div>
                                        )}

                                    {/* ==================================================
                                        ACTIONS
                                    ================================================== */}

                                    <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">

                                        <button
                                            type="button"
                                            onClick={
                                                handleSearch
                                            }
                                            disabled={
                                                isSearching
                                            }
                                            className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] disabled:opacity-60 text-white rounded-lg px-5 h-8 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                        >
                                            <Search className="w-3.5 h-3.5" />

                                            {isSearching
                                                ? 'Searching...'
                                                : 'Search'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleResetFilters
                                            }
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg px-5 h-8 text-xs font-medium transition-colors duration-150"
                                        >
                                            <X className="w-3.5 h-3.5" />

                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SectionCard>

                {/* ==================================================
                    SUMMARY CARDS
                ================================================== */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    <SummaryDiagonalCard
                        title="Total Issue Count"
                        primaryValue={primaryTotalCount.toLocaleString()}
                        compareValue={compareTotalCount.toLocaleString()}
                        primaryNumber={primaryTotalCount}
                        compareNumber={compareTotalCount}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        growth={totalCountGrowth}
                        color="#423CAB"
                        enableCompare={enableCompare}
                    />

                    <SummaryDiagonalCard
                        title="Total Issue Size"
                        primaryValue={`₹${formatNumberToFourChar(
                            primaryTotalSize,
                        )}`}
                        compareValue={`₹${formatNumberToFourChar(
                            compareTotalSize,
                        )}`}
                        primaryNumber={
                            primaryTotalSize
                        }
                        compareNumber={
                            compareTotalSize
                        }
                        primaryLabel={
                            primaryYearLabel
                        }
                        compareLabel={
                            compareYearLabel
                        }
                        growth={
                            totalSizeGrowth
                        }
                        color="#059669"
                        enableCompare={
                            enableCompare
                        }
                    />

                    <SummaryDiagonalCard
                        title="Avg Monthly Issue Size"
                        primaryValue={`₹${formatNumberToFourChar(
                            avgPrimarySize,
                        )}`}
                        compareValue={`₹${formatNumberToFourChar(
                            avgCompareSize,
                        )}`}
                        primaryNumber={
                            avgPrimarySize
                        }
                        compareNumber={
                            avgCompareSize
                        }
                        primaryLabel={
                            primaryYearLabel
                        }
                        compareLabel={
                            compareYearLabel
                        }
                        growth={
                            avgSizeGrowth
                        }
                        color="#D97706"
                        enableCompare={
                            enableCompare
                        }
                    />
                </div>

                {/* ==================================================
                    CHARTS
                ================================================== */}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* MONTHLY AREA CHART */}

                    <SectionCard className="my-3">

                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Monthly Issue Size Trend (₹{' '}
                                {sizeUnit})
                            </h2>

                            <DownloadPngButton
                                onClick={() =>
                                    downloadChartAsPng(
                                        areaChartRef.current,
                                        `monthly_issue_size_trend_${primaryYearLabel}`,
                                    )
                                }
                            />
                        </div>

                        {isLoading ? (
                            <ChartSkeleton />
                        ) : primaryData.length >
                            0 ? (
                            <div
                                ref={
                                    areaChartRef
                                }
                                className="bg-white dark:bg-[#1a1a2e]"
                            >
                                <ResponsiveContainer
                                    width="100%"
                                    height={
                                        300
                                    }
                                >
                                    <AreaChart
                                        data={
                                            enableCompare
                                                ? comparisonData
                                                : primaryChartData
                                        }
                                    >
                                        <defs>
                                            <linearGradient
                                                id="primaryGrad"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#423CAB"
                                                    stopOpacity={
                                                        0.3
                                                    }
                                                />

                                                <stop
                                                    offset="95%"
                                                    stopColor="#423CAB"
                                                    stopOpacity={
                                                        0.02
                                                    }
                                                />
                                            </linearGradient>

                                            <linearGradient
                                                id="compareGrad"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#06B6D4"
                                                    stopOpacity={
                                                        0.25
                                                    }
                                                />

                                                <stop
                                                    offset="95%"
                                                    stopColor="#06B6D4"
                                                    stopOpacity={
                                                        0.02
                                                    }
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={
                                                false
                                            }
                                            stroke="#e5e7eb"
                                        />

                                        <XAxis
                                            dataKey="monthName"
                                            tick={{
                                                fill: '#6b7280',
                                                fontSize: 12,
                                            }}
                                            axisLine={{
                                                stroke: '#e5e7eb',
                                            }}
                                        />

                                        <YAxis
                                            tickFormatter={(
                                                value,
                                            ) =>
                                                formatNumber(
                                                    value,
                                                )
                                            }
                                            tick={{
                                                fill: '#6b7280',
                                                fontSize: 12,
                                            }}
                                            axisLine={{
                                                stroke: '#e5e7eb',
                                            }}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltipComponent />
                                            }
                                        />

                                        <Legend />

                                        <Area
                                            type="monotone"
                                            dataKey={
                                                enableCompare
                                                    ? 'primaryIssueSize'
                                                    : 'issueSize'
                                            }
                                            name={
                                                primaryYearLabel
                                            }
                                            stroke="#423CAB"
                                            fill="url(#primaryGrad)"
                                            strokeWidth={
                                                2
                                            }
                                        />

                                        {enableCompare && (
                                            <Area
                                                type="monotone"
                                                dataKey="compareIssueSize"
                                                name={
                                                    compareYearLabel
                                                }
                                                stroke="#06B6D4"
                                                fill="url(#compareGrad)"
                                                strokeWidth={
                                                    2
                                                }
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoDataState />
                        )}
                    </SectionCard>

                    {/* QUARTERLY BAR CHART */}

                    <SectionCard className="my-3">

                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Quarterly Summary (₹{' '}
                                {sizeUnit})
                            </h2>

                            <DownloadPngButton
                                onClick={() =>
                                    downloadChartAsPng(
                                        barChartRef.current,
                                        `quarterly_summary_${primaryYearLabel}`,
                                    )
                                }
                            />
                        </div>

                        {isLoading ? (
                            <ChartSkeleton />
                        ) : quarterlyData.length >
                            0 ? (
                            <div
                                ref={
                                    barChartRef
                                }
                                className="bg-white dark:bg-[#1a1a2e]"
                            >
                                <ResponsiveContainer
                                    width="100%"
                                    height={
                                        300
                                    }
                                >
                                    <BarChart
                                        data={
                                            quarterlyData
                                        }
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={
                                                false
                                            }
                                            stroke="#e5e7eb"
                                        />

                                        <XAxis
                                            dataKey="quarter"
                                            tick={{
                                                fill: '#6b7280',
                                                fontSize: 12,
                                            }}
                                            axisLine={{
                                                stroke: '#e5e7eb',
                                            }}
                                        />

                                        <YAxis
                                            tickFormatter={(
                                                value,
                                            ) =>
                                                formatNumber(
                                                    value,
                                                )
                                            }
                                            tick={{
                                                fill: '#6b7280',
                                                fontSize: 12,
                                            }}
                                            axisLine={{
                                                stroke: '#e5e7eb',
                                            }}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltipComponent />
                                            }
                                        />

                                        <Legend />

                                        <Bar
                                            dataKey="primaryIssueSize"
                                            name={
                                                primaryYearLabel
                                            }
                                            fill="#423CAB"
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0,
                                            ]}
                                        />

                                        {enableCompare && (
                                            <Bar
                                                dataKey="compareIssueSize"
                                                name={
                                                    compareYearLabel
                                                }
                                                fill="#06B6D4"
                                                radius={[
                                                    4,
                                                    4,
                                                    0,
                                                    0,
                                                ]}
                                            />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoDataState message="No quarterly data available" />
                        )}
                    </SectionCard>
                </div>

                {/* ==================================================
                    MONTH-WISE TABLE
                ================================================== */}

                <SectionCard className="!p-0 overflow-hidden my-3">

                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">

                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Month-Wise Data (Rupees in{' '}
                            {sizeUnit})
                        </h2>

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={
                                    handleExportMonthWiseCSV
                                }
                                disabled={
                                    isLoading ||
                                    comparisonData.length ===
                                    0
                                }
                                className="flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={
                                        2
                                    }
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>

                                Export CSV
                            </button>

                            <div className="flex items-center gap-2">

                                <label className="text-[9px] text-gray-400">
                                    Value Convention
                                </label>

                                <select
                                    value={
                                        sizeUnit
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateMonthlyPageField(
                                            RATING_AGENCIES_MONTHLY_PAGE,
                                            'sizeUnit',
                                            event
                                                .target
                                                .value as SizeUnit,
                                        )
                                    }
                                    className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                                >
                                    <option value="Crores">
                                        Crores
                                    </option>

                                    <option value="Lakhs">
                                        Lakhs
                                    </option>

                                    <option value="Billions">
                                        Billions
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-0">

                        <MonthWiseTable
                            data={
                                comparisonData
                            }
                            enableCompare={
                                enableCompare
                            }
                            primaryLabel={
                                primaryYearLabel
                            }
                            compareLabel={
                                compareYearLabel
                            }
                            isLoading={
                                isLoading
                            }
                            sizeUnit={
                                sizeUnit
                            }
                            primaryStartDate={
                                primaryStartDate
                            }
                            compareStartDate={
                                compareStartDate
                            }
                            primaryFilters={
                                primaryFilters
                            }
                            compareFilters={
                                compareFilters
                            }
                            tableName="agencies"
                        />

                    </div>
                </SectionCard>

                {/* ==================================================
                    QUARTER-WISE TABLE
                ================================================== */}

                <SectionCard className="!p-0 overflow-hidden my-3">

                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">

                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Quarter-Wise Data (Rupees in{' '}
                            {sizeUnit})
                        </h2>

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={
                                    handleExportQuarterWiseCSV
                                }
                                disabled={
                                    isLoading ||
                                    quarterlyData.length ===
                                    0
                                }
                                className="flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={
                                        2
                                    }
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>

                                Export CSV
                            </button>

                            <div className="flex items-center gap-2">

                                <label className="text-[9px] text-gray-400">
                                    Value Convention
                                </label>

                                <select
                                    value={
                                        sizeUnit
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateMonthlyPageField(
                                            RATING_AGENCIES_MONTHLY_PAGE,
                                            'sizeUnit',
                                            event
                                                .target
                                                .value as SizeUnit,
                                        )
                                    }
                                    className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                                >
                                    <option value="Crores">
                                        Crores
                                    </option>

                                    <option value="Lakhs">
                                        Lakhs
                                    </option>

                                    <option value="Billions">
                                        Billions
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-0">

                        <QuarterWiseTable
                            data={
                                quarterlyData
                            }
                            enableCompare={
                                enableCompare
                            }
                            primaryLabel={
                                primaryYearLabel
                            }
                            compareLabel={
                                compareYearLabel
                            }
                            isLoading={
                                isLoading
                            }
                            sizeUnit={
                                sizeUnit
                            }
                            primaryStartDate={
                                primaryStartDate
                            }
                            compareStartDate={
                                compareStartDate
                            }
                            primaryFilters={
                                primaryFilters
                            }
                            compareFilters={
                                compareFilters
                            }
                            tableName="agencies"
                        />

                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}