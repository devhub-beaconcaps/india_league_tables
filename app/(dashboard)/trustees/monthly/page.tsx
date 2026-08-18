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

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';
import { fetchTrusteeMonthlySummaryData } from '@/features/trustees/services';

import {
    Search,
    X,
    ChevronDown,
    SlidersHorizontal,
} from 'lucide-react';

import {
    AnimatePresence,
    motion,
} from 'framer-motion';

import { SummaryDiagonalCard } from '@/components/SummaryDiagonalCard';
import MonthWiseTable from '@/components/MonthWiseTable';
import QuarterWiseTable from '@/components/QuarterWiseTable';
import CustomDropdown from '@/components/CustomDropdown';

import {
    useSummaryFilterStore,
    MonthlyFilters,
    MonthlyPageState,
} from '@/lib/filtersState';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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

type FilterKey = keyof MonthlyFilters;

type FilterType = 'primary' | 'compare';

// ─────────────────────────────────────────────────────────────
// PAGE CONSTANTS
// ─────────────────────────────────────────────────────────────

const TRUSTEES_MONTHLY_PAGE = 'trustees-monthly' as const;

// ─────────────────────────────────────────────────────────────
// DEFAULT FILTERS
// ─────────────────────────────────────────────────────────────

const createDefaultMonthlyFilters = (): MonthlyFilters => ({
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
});

const createDefaultMonthlyState = (): MonthlyPageState => ({
    primaryStartDate: FINANCIAL_YEAR_OPTIONS[0].startDate,
    primaryEndDate: FINANCIAL_YEAR_OPTIONS[0].endDate,

    compareStartDate: FINANCIAL_YEAR_OPTIONS[1].startDate,
    compareEndDate: FINANCIAL_YEAR_OPTIONS[1].endDate,

    primaryFilters: createDefaultMonthlyFilters(),
    compareFilters: createDefaultMonthlyFilters(),

    enableCompare: false,

    sizeUnit: 'Crores',
});

// ─────────────────────────────────────────────────────────────
// FINANCIAL YEAR OPTIONS
// ─────────────────────────────────────────────────────────────

function generateFinancialYearOptions(count = 5) {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentFYStart =
        currentMonth >= 3
            ? currentYear
            : currentYear - 1;

    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const options: {
        label: string;
        startDate: string;
        endDate: string;
    }[] = [];

    for (let i = 0; i < count; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;

        const startDate = `${startYear}-04-01`;
        const normalEndDate = `${endYear}-03-31`;

        options.push({
            label: `FY-${startYear}-${endYear}`,
            startDate,
            endDate:
                normalEndDate > today
                    ? today
                    : normalEndDate,
        });
    }

    return options;
}

const FINANCIAL_YEAR_OPTIONS =
    generateFinancialYearOptions(5);

const fyDropdownOptions =
    FINANCIAL_YEAR_OPTIONS.map((item) => ({
        value: item.label,
        label: item.label,
    }));

// ─────────────────────────────────────────────────────────────
// FILTER LABELS
// ─────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<FilterKey, string> = {
    ownershipType: 'Ownership',
    sector: 'Sector',
    nature: 'Nature',
    securityType: 'Security Type',
    creditRatingAgency: 'Credit Rating Agency',
    modeOfIssue: 'Mode Of Issue',
    seniority: 'Seniority',
    listingStatus: 'Listing Status',
    securedFlag: 'Secured Flag',
    rating: 'Rating',
};

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

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
                bg-white
                dark:bg-[#1a1a2e]
                rounded-[12px]
                shadow-sm
                border
                border-gray-200
                dark:border-gray-600
                px-5
                py-3
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
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
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
        <span
            className="
                inline-flex
                items-center
                gap-1
                px-2
                py-0.5
                bg-indigo-50
                dark:bg-indigo-900/30
                text-indigo-700
                dark:text-indigo-300
                text-[10px]
                font-medium
                rounded-full
                border
                border-indigo-100
                dark:border-indigo-800
            "
        >
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
            className="
                flex
                items-center
                cursor-pointer
                gap-1.5
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-lg
                px-3
                h-7
                text-[10px]
                font-medium
                transition-colors
            "
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
// UTILS
// ─────────────────────────────────────────────────────────────

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
) {
    const found = FINANCIAL_YEAR_OPTIONS.find(
        (item) =>
            item.startDate === startDate &&
            item.endDate === endDate,
    );

    return found?.label || 'Custom FY';
}

function formatSameMonthDayInYear(
    date: string,
    year: number,
) {
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
        )}-${String(Math.min(parsedDay, maxDay)).padStart(
            2,
            '0',
        )}`;
    }

    return `${year}-${month}-${day}`;
}

function getCompareEndDate(
    compareStartDate: string,
    primaryEndDate: string,
) {
    const compareYear =
        new Date(compareStartDate).getFullYear();

    return formatSameMonthDayInYear(
        primaryEndDate,
        compareYear,
    );
}

function formatNumber(value: number): string {
    return value.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    });
}

function formatNumberToFourChar(num: number) {
    if (num >= 1000) {
        if (num < 1000000) {
            return (
                (num / 1000)
                    .toFixed(1)
                    .replace('.0', '') + 'k'
            );
        }

        if (num < 1000000000) {
            return (
                (num / 1000000)
                    .toFixed(1)
                    .replace('.0', '') + 'm'
            );
        }

        return (
            (num / 1000000000)
                .toFixed(1)
                .replace('.0', '') + 'b'
        );
    }

    return Math.round(num).toString();
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
        issueSize: item.issueSize * factor,
        actualIssueSize:
            item.actualIssueSize * factor,
    }));
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

// ─────────────────────────────────────────────────────────────
// COMPARISON DATA
// ─────────────────────────────────────────────────────────────

function getComparisonData(
    primaryData: MonthlyApiData[],
    compareData: MonthlyApiData[],
): ChartData[] {
    const monthNumbers = Array.from(
        new Set([
            ...primaryData.map(
                (item) => Number(item.issueMonthNo),
            ),
            ...compareData.map(
                (item) => Number(item.issueMonthNo),
            ),
        ]),
    ).sort((a, b) => a - b);

    return monthNumbers.map((monthNumber) => {
        const primaryMonth = primaryData.find(
            (item) =>
                Number(item.issueMonthNo) === monthNumber,
        );

        const compareMonth = compareData.find(
            (item) =>
                Number(item.issueMonthNo) === monthNumber,
        );

        return {
            monthNumber,

            monthName: getMonthName(monthNumber),

            primaryIssueCount:
                Number(primaryMonth?.noOfIssue) || 0,

            compareIssueCount:
                Number(compareMonth?.noOfIssue) || 0,

            primaryIssueSize:
                Number(primaryMonth?.issueSize) || 0,

            compareIssueSize:
                Number(compareMonth?.issueSize) || 0,
        };
    });
}

// ─────────────────────────────────────────────────────────────
// QUARTERLY DATA
// ─────────────────────────────────────────────────────────────

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
            (quarter) =>
                quarter.primaryIssueCount > 0 ||
                quarter.primaryIssueSize > 0 ||
                quarter.compareIssueCount > 0 ||
                quarter.compareIssueSize > 0,
        );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function TrusteesMonthWiseSummary() {
    // ─────────────────────────────────────────────────────────
    // ZUSTAND
    // ─────────────────────────────────────────────────────────

    const activeFilterPage =
        useSummaryFilterStore(
            (state) => state.activeFilterPage,
        );

    const storedMonthlyState =
        useSummaryFilterStore(
            (state) =>
                state.monthlyPageState[
                    TRUSTEES_MONTHLY_PAGE
                ],
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

    // ─────────────────────────────────────────────────────────
    // DEFAULT STATE
    // ─────────────────────────────────────────────────────────

    const defaultMonthlyState =
        useMemo(
            () => createDefaultMonthlyState(),
            [],
        );

    // ─────────────────────────────────────────────────────────
    // PAGE ACTIVATION
    // ─────────────────────────────────────────────────────────

    const isActivePage =
        activeFilterPage ===
        TRUSTEES_MONTHLY_PAGE;

    /*
     * Important:
     *
     * Do not overwrite persisted Zustand state merely because
     * the component initially renders before the page becomes
     * active.
     *
     * Once this page becomes active, initialize it only if there
     * is no existing state.
     */
    useEffect(() => {
        const store =
            useSummaryFilterStore.getState();

        if (
            store.activeFilterPage !==
            TRUSTEES_MONTHLY_PAGE
        ) {
            store.setMonthlyPageState(
                TRUSTEES_MONTHLY_PAGE,
                defaultMonthlyState,
            );
        }

        setHasInitialized(true);
    }, [defaultMonthlyState]);

    /*
     * Until the page is active, use defaults only for rendering.
     *
     * Once active, use the Zustand state.
     */
    const currentState =
        isActivePage && storedMonthlyState
            ? storedMonthlyState
            : defaultMonthlyState;

    const {
        primaryStartDate,
        primaryEndDate,

        compareStartDate,
        compareEndDate,

        primaryFilters,
        compareFilters,

        enableCompare,
        sizeUnit,
    } = currentState;

    // ─────────────────────────────────────────────────────────
    // LOCAL UI STATE
    // ─────────────────────────────────────────────────────────

    const [isLoading, setIsLoading] =
        useState(false);

    const [hasInitialized, setHasInitialized] =
        useState(false);

    const [isFiltersExpanded, setIsFiltersExpanded] =
        useState(false);

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

    // ─────────────────────────────────────────────────────────
    // DATA
    // ─────────────────────────────────────────────────────────

    const [primaryData, setPrimaryData] =
        useState<MonthlyApiData[]>([]);

    const [compareData, setCompareData] =
        useState<MonthlyApiData[]>([]);

    // ─────────────────────────────────────────────────────────
    // CHART REFS
    // ─────────────────────────────────────────────────────────

    const areaChartRef =
        useRef<HTMLDivElement>(null);

    const barChartRef =
        useRef<HTMLDivElement>(null);

    // ─────────────────────────────────────────────────────────
    // ENSURE ACTIVE PAGE
    // ─────────────────────────────────────────────────────────

    const ensureActive = useCallback(() => {
        const store =
            useSummaryFilterStore.getState();

        if (
            store.activeFilterPage !==
            TRUSTEES_MONTHLY_PAGE
        ) {
            setMonthlyPageState(
                TRUSTEES_MONTHLY_PAGE,
                defaultMonthlyState,
            );
        }
    }, [
        setMonthlyPageState,
        defaultMonthlyState,
    ]);

    // ─────────────────────────────────────────────────────────
    // UPDATE FILTER
    // ─────────────────────────────────────────────────────────

    const updateFilter = useCallback(
        (
            type: FilterType,
            key: FilterKey,
            value: string[],
        ) => {
            ensureActive();

            updateMonthlyPageFilter(
                TRUSTEES_MONTHLY_PAGE,
                type,
                key,
                [...value],
            );
        },
        [
            ensureActive,
            updateMonthlyPageFilter,
        ],
    );

    // ─────────────────────────────────────────────────────────
    // OPTIONS
    // ─────────────────────────────────────────────────────────

    const toOptions = useCallback(
        (items: string[]) =>
            items.map((item) => ({
                value: item,
                label: item,
            })),
        [],
    );

    // ─────────────────────────────────────────────────────────
    // FILTER OPTIONS API
    // ─────────────────────────────────────────────────────────

    const fetchFilterOptions =
        useCallback(async () => {
            if (!primaryStartDate || !primaryEndDate) {
                return;
            }

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

                if (!response) {
                    return;
                }

                setFilterOptions({
                    ownershipType:
                        response.ownershipType ||
                        [],
                    sector:
                        response.sector || [],
                    nature:
                        response.nature || [],
                    securityType:
                        response.securityType ||
                        [],
                    creditRatingAgency:
                        response.creditRatingAgency ||
                        [],
                    modeOfIssue:
                        response.modeOfIssue ||
                        [],
                    seniority:
                        response.seniority || [],
                    listingStatus:
                        response.listingStatus ||
                        [],
                    securedFlag:
                        response.securedFlag ||
                        [],
                    creditRating:
                        response.creditRating ||
                        [],
                });
            } catch (error) {
                console.error(
                    'Failed to fetch trustee monthly filter options:',
                    error,
                );
            }
        }, [
            primaryStartDate,
            primaryEndDate,
        ]);

    useEffect(() => {
        if (!hasInitialized || !isActivePage) return;

        fetchFilterOptions();
    }, [
        hasInitialized,
        isActivePage,
        fetchFilterOptions,
    ]);

    // ─────────────────────────────────────────────────────────
    // API PAYLOAD
    // ─────────────────────────────────────────────────────────

    const buildPayload = useCallback(
        (
            startDate: string,
            endDate: string,
            filters: MonthlyFilters,
        ) => ({
            startDate,
            endDate,
            ownershipType: filters.ownershipType,
            sector: filters.sector,
            nature: filters.nature,
            securityType: filters.securityType,
            creditRatingAgency: filters.creditRatingAgency,
            modeOfIssue: filters.modeOfIssue,
            seniority: filters.seniority,
            listingStatus: filters.listingStatus,
            securedFlag: filters.securedFlag,
            rating: filters.rating,
        }),
        [],
    );

    // ─────────────────────────────────────────────────────────
    // PRIMARY DATA API
    // ─────────────────────────────────────────────────────────

    const fetchPrimaryData = useCallback(
        async (stateOverride?: MonthlyPageState) => {
            try {
                setIsLoading(true);

                const state =
                    stateOverride ||
                    useSummaryFilterStore
                        .getState()
                        .monthlyPageState[TRUSTEES_MONTHLY_PAGE] ||
                    defaultMonthlyState;

                const response =
                    await fetchTrusteeMonthlySummaryData(
                        buildPayload(
                            state.primaryStartDate,
                            state.primaryEndDate,
                            state.primaryFilters,
                        ),
                    );

                setPrimaryData(
                    filterZeroData(
                        Array.isArray(response?.data)
                            ? response.data
                            : [],
                    ),
                );
            } catch (error) {
                console.error(
                    'Failed to fetch trustee primary monthly data:',
                    error,
                );

                setPrimaryData([]);
            } finally {
                setIsLoading(false);
            }
        },
        [buildPayload, defaultMonthlyState],
    );

    // ─────────────────────────────────────────────────────────
    // INITIAL DATA LOAD
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!hasInitialized) return;

        const store =
            useSummaryFilterStore.getState();

        const state =
            store.monthlyPageState[TRUSTEES_MONTHLY_PAGE] ||
            defaultMonthlyState;

        fetchPrimaryData(state);

        if (state.enableCompare) {
            fetchCompareData(state);
        } else {
            setCompareData([]);
        }

        // Intentionally only run after initialization.
        // Filter changes do NOT automatically trigger API.
        // Search explicitly triggers the API.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasInitialized]);

    // ─────────────────────────────────────────────────────────
    // COMPARE END DATE
    // ─────────────────────────────────────────────────────────

    const expectedCompareEndDate =
        useMemo(
            () =>
                getCompareEndDate(
                    compareStartDate,
                    primaryEndDate,
                ),
            [
                compareStartDate,
                primaryEndDate,
            ],
        );

    // ─────────────────────────────────────────────────────────
    // AUTO UPDATE COMPARE END DATE
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isActivePage || !enableCompare) {
            return;
        }

        const store =
            useSummaryFilterStore.getState();

        const currentState =
            store.monthlyPageState[
                TRUSTEES_MONTHLY_PAGE
            ];

        if (!currentState) {
            return;
        }

        if (
            currentState.compareEndDate !==
            expectedCompareEndDate
        ) {
            updateMonthlyPageField(
                TRUSTEES_MONTHLY_PAGE,
                'compareEndDate',
                expectedCompareEndDate,
            );
        }
    }, [
        isActivePage,
        enableCompare,
        expectedCompareEndDate,
        updateMonthlyPageField,
    ]);

    // ─────────────────────────────────────────────────────────
    // COMPARE DATA API
    // ─────────────────────────────────────────────────────────

    const fetchCompareData = useCallback(
        async (stateOverride?: MonthlyPageState) => {
            try {
                const state =
                    stateOverride ||
                    useSummaryFilterStore
                        .getState()
                        .monthlyPageState[TRUSTEES_MONTHLY_PAGE] ||
                    defaultMonthlyState;

                if (!state.enableCompare) {
                    setCompareData([]);
                    return;
                }

                const expectedEndDate =
                    getCompareEndDate(
                        state.compareStartDate,
                        state.primaryEndDate,
                    );

                const response =
                    await fetchTrusteeMonthlySummaryData(
                        buildPayload(
                            state.compareStartDate,
                            expectedEndDate,
                            state.compareFilters,
                        ),
                    );

                setCompareData(
                    filterZeroData(
                        Array.isArray(response?.data)
                            ? response.data
                            : [],
                    ),
                );
            } catch (error) {
                console.error(
                    'Failed to fetch trustee comparison monthly data:',
                    error,
                );

                setCompareData([]);
            }
        },
        [buildPayload, defaultMonthlyState],
    );

    // ─────────────────────────────────────────────────────────
    // DISPLAY DATA
    // ─────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────
    // CHART DATA
    // ─────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────────────────────

    const primaryTotalCount =
        useMemo(
            () =>
                displayPrimaryData.reduce(
                    (sum, row) =>
                        sum +
                        Number(
                            row.noOfIssue,
                        ),
                    0,
                ),
            [displayPrimaryData],
        );

    const compareTotalCount =
        useMemo(
            () =>
                displayCompareData.reduce(
                    (sum, row) =>
                        sum +
                        Number(
                            row.noOfIssue,
                        ),
                    0,
                ),
            [displayCompareData],
        );

    const primaryTotalSize =
        useMemo(
            () =>
                displayPrimaryData.reduce(
                    (sum, row) =>
                        sum +
                        Number(
                            row.issueSize,
                        ),
                    0,
                ),
            [displayPrimaryData],
        );

    const compareTotalSize =
        useMemo(
            () =>
                displayCompareData.reduce(
                    (sum, row) =>
                        sum +
                        Number(
                            row.issueSize,
                        ),
                    0,
                ),
            [displayCompareData],
        );

    const totalCountGrowth =
        useMemo(
            () =>
                compareTotalCount > 0
                    ? (
                        (
                            primaryTotalCount -
                            compareTotalCount
                        ) /
                        compareTotalCount
                    ) *
                    100
                    : 0,
            [
                primaryTotalCount,
                compareTotalCount,
            ],
        );

    const totalSizeGrowth =
        useMemo(
            () =>
                compareTotalSize > 0
                    ? (
                        (
                            primaryTotalSize -
                            compareTotalSize
                        ) /
                        compareTotalSize
                    ) *
                    100
                    : 0,
            [
                primaryTotalSize,
                compareTotalSize,
            ],
        );

    const avgPrimarySize =
        displayPrimaryData.length > 0
            ? primaryTotalSize /
            displayPrimaryData.length
            : 0;

    const avgCompareSize =
        displayCompareData.length > 0
            ? compareTotalSize /
            displayCompareData.length
            : 0;

    const avgSizeGrowth =
        avgCompareSize > 0
            ? (
                (
                    avgPrimarySize -
                    avgCompareSize
                ) /
                avgCompareSize
            ) *
            100
            : 0;

    // ─────────────────────────────────────────────────────────
    // FY LABELS
    // ─────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────
    // ACTIVE FILTER COUNTS
    // ─────────────────────────────────────────────────────────

    const activeFilterCount =
        useMemo(
            () =>
                Object.values(
                    primaryFilters,
                ).reduce(
                    (total, values) =>
                        total + values.length,
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
                        total + values.length,
                    0,
                ),
            [compareFilters],
        );

    const totalActiveFilterCount =
        activeFilterCount +
        compareActiveFilterCount;

    // ─────────────────────────────────────────────────────────
    // FILTER CHIPS
    // ─────────────────────────────────────────────────────────

    const activeFilterChips =
        useMemo(() => {
            const chips: {
                key: FilterKey;
                label: string;
                index: number;
                type: FilterType;
            }[] = [];

            (
                Object.keys(
                    primaryFilters,
                ) as FilterKey[]
            ).forEach((key) => {
                primaryFilters[key].forEach(
                    (value, index) => {
                        chips.push({
                            key,
                            index,
                            type: 'primary',
                            label: `${FILTER_LABELS[key]}: ${value}`,
                        });
                    },
                );
            });

            (
                Object.keys(
                    compareFilters,
                ) as FilterKey[]
            ).forEach((key) => {
                compareFilters[key].forEach(
                    (value, index) => {
                        chips.push({
                            key,
                            index,
                            type: 'compare',
                            label: `Compare ${FILTER_LABELS[key]}: ${value}`,
                        });
                    },
                );
            });

            return chips;
        }, [
            primaryFilters,
            compareFilters,
        ]);

    // ─────────────────────────────────────────────────────────
    // DOWNLOAD PNG
    // ─────────────────────────────────────────────────────────

    const downloadChartAsPng =
        useCallback(
            async (
                chartRef: HTMLElement | null,
                filename: string,
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

    // ─────────────────────────────────────────────────────────
    // CSV HELPER
    // ─────────────────────────────────────────────────────────

    const createCsvContent =
        useCallback(
            (
                headers: string[],
                rows: string[][],
            ) => {
                return [
                    headers.join(','),
                    ...rows.map((row) =>
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
                    ),
                ].join('\n');
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
                            type: 'text/csv;charset=utf-8;',
                        },
                    );

                const url =
                    URL.createObjectURL(
                        blob,
                    );

                const link =
                    document.createElement(
                        'a',
                    );

                link.href = url;
                link.download = filename;

                document.body.appendChild(
                    link,
                );

                link.click();

                document.body.removeChild(
                    link,
                );

                URL.revokeObjectURL(url);
            },
            [],
        );

    // ─────────────────────────────────────────────────────────
    // MONTH CSV
    // ─────────────────────────────────────────────────────────

    const handleExportMonthWiseCSV =
        useCallback(() => {
            if (
                comparisonData.length === 0
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
                        if (enableCompare) {
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

            const csvContent =
                createCsvContent(
                    headers,
                    rows,
                );

            downloadCsv(
                csvContent,
                `month_wise_trustees_${primaryYearLabel}${enableCompare
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
            createCsvContent,
            downloadCsv,
        ]);

    // ─────────────────────────────────────────────────────────
    // QUARTER CSV
    // ─────────────────────────────────────────────────────────

    const handleExportQuarterWiseCSV =
        useCallback(() => {
            if (
                quarterlyData.length === 0
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
                        if (enableCompare) {
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

            const csvContent =
                createCsvContent(
                    headers,
                    rows,
                );

            downloadCsv(
                csvContent,
                `quarter_wise_trustees_${primaryYearLabel}${enableCompare
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
            createCsvContent,
            downloadCsv,
        ]);

    // ─────────────────────────────────────────────────────────
    // FY CHANGE
    // ─────────────────────────────────────────────────────────

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

                ensureActive();

                if (
                    type === 'primary'
                ) {
                    updateMonthlyPageField(
                        TRUSTEES_MONTHLY_PAGE,
                        'primaryStartDate',
                        selectedYear.startDate,
                    );

                    updateMonthlyPageField(
                        TRUSTEES_MONTHLY_PAGE,
                        'primaryEndDate',
                        selectedYear.endDate,
                    );

                    /*
                     * If compare is enabled, the compare end date
                     * is automatically aligned with the new primary
                     * end date by the synchronization effect.
                     */
                    return;
                }

                updateMonthlyPageField(
                    TRUSTEES_MONTHLY_PAGE,
                    'compareStartDate',
                    selectedYear.startDate,
                );

                const newCompareEnd =
                    enableCompare
                        ? getCompareEndDate(
                            selectedYear.startDate,
                            primaryEndDate,
                        )
                        : selectedYear.endDate;

                updateMonthlyPageField(
                    TRUSTEES_MONTHLY_PAGE,
                    'compareEndDate',
                    newCompareEnd,
                );
            },
            [
                ensureActive,
                updateMonthlyPageField,
                enableCompare,
                primaryEndDate,
            ],
        );

    // ─────────────────────────────────────────────────────────
    // RESET
    // ─────────────────────────────────────────────────────────

    const handleResetFilters =
        useCallback(() => {
            clearMonthlyPageState(
                TRUSTEES_MONTHLY_PAGE,
                createDefaultMonthlyState(),
            );

            setIsFiltersExpanded(false);
        }, [
            clearMonthlyPageState,
        ]);

    // ─────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────

    const handleSearch =
        useCallback(async () => {
            ensureActive();

            const store =
                useSummaryFilterStore.getState();

            const state =
                store.monthlyPageState[TRUSTEES_MONTHLY_PAGE] ||
                defaultMonthlyState;

            await fetchPrimaryData(state);

            if (state.enableCompare) {
                await fetchCompareData(state);
            } else {
                setCompareData([]);
            }

            setIsFiltersExpanded(false);
        }, [
            ensureActive,
            defaultMonthlyState,
            fetchPrimaryData,
            fetchCompareData,
        ]);

    // ─────────────────────────────────────────────────────────
    // CLEAR PRIMARY
    // ─────────────────────────────────────────────────────────

    const clearAllPrimaryDropdowns =
        useCallback(() => {
            ensureActive();

            updateMonthlyPageField(
                TRUSTEES_MONTHLY_PAGE,
                'primaryFilters',
                createDefaultMonthlyFilters(),
            );
        }, [
            ensureActive,
            updateMonthlyPageField,
        ]);

    // ─────────────────────────────────────────────────────────
    // CLEAR COMPARE
    // ─────────────────────────────────────────────────────────

    const clearAllCompareDropdowns =
        useCallback(() => {
            ensureActive();

            updateMonthlyPageField(
                TRUSTEES_MONTHLY_PAGE,
                'compareFilters',
                createDefaultMonthlyFilters(),
            );
        }, [
            ensureActive,
            updateMonthlyPageField,
        ]);

    // ─────────────────────────────────────────────────────────
    // RENDER FILTERS
    // ─────────────────────────────────────────────────────────

    const renderFilterDropdown =
        useCallback(
            (
                type: FilterType,
                key: FilterKey,
                options: string[],
                placeholder: string,
            ) => {
                const filters =
                    type === 'primary'
                        ? primaryFilters
                        : compareFilters;

                return (
                    <FilterGroup
                        label={
                            FILTER_LABELS[key]
                        }
                    >
                        <CustomDropdown
                            options={toOptions(
                                options,
                            )}
                            value={
                                filters[key]
                            }
                            onChange={(value) =>
                                updateFilter(
                                    type,
                                    key,
                                    value as string[],
                                )
                            }
                            placeholder={
                                placeholder
                            }
                            menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                        />
                    </FilterGroup>
                );
            },
            [
                primaryFilters,
                compareFilters,
                toOptions,
                updateFilter,
            ],
        );

    // ─────────────────────────────────────────────────────────
    // TOOLTIP
    // ─────────────────────────────────────────────────────────

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
                    payload.length === 0
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
                                    key={index}
                                    style={{
                                        color:
                                            item.color,
                                    }}
                                    className="mb-1 text-gray-700 dark:text-gray-200"
                                >
                                    {item.name}:{' '}
                                    {formatNumber(
                                        Number(
                                            item.value,
                                        ),
                                    )}{' '}
                                    {sizeUnit}
                                </p>
                            ),
                        )}
                    </div>
                );
            };
        }, [sizeUnit]);

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <SkeletonTheme
            enableAnimation
            baseColor="#1F2937"
            highlightColor="#90969bff"
            borderRadius="0.5rem"
        >
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-700 dark:text-gray-200">

                {/* ───────────────── HEADER ───────────────── */}

                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        Trustees Monthly Summary
                    </h1>

                    <p className="text-[9px] text-gray-400 mb-6 mt-1">
                        Trustees &gt; Monthly Summary
                    </p>
                </div>

                {/* ───────────────── FILTERS ───────────────── */}

                <SectionCard>
                    <button
                        type="button"
                        onClick={() =>
                            setIsFiltersExpanded(
                                (value) =>
                                    !value,
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
                                                            const filters =
                                                                chip.type ===
                                                                    'primary'
                                                                    ? primaryFilters
                                                                    : compareFilters;

                                                            const newValues =
                                                                filters[
                                                                    chip
                                                                        .key
                                                                ].filter(
                                                                    (
                                                                        _,
                                                                        index,
                                                                    ) =>
                                                                        index !==
                                                                        chip.index,
                                                                );

                                                            updateFilter(
                                                                chip.type,
                                                                chip.key,
                                                                newValues,
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
                                    w-5
                                    h-5
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

                                    {/* ───────── PRIMARY ───────── */}

                                    <div>
                                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                                                Primary Filters
                                            </h2>

                                            <div className="flex items-center gap-3 flex-wrap">

                                                {/* SIZE UNIT */}

                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] text-gray-400 block mb-1">
                                                        Size Unit
                                                    </label>

                                                    <select
                                                        value={
                                                            sizeUnit
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            ensureActive();

                                                            updateMonthlyPageField(
                                                                TRUSTEES_MONTHLY_PAGE,
                                                                'sizeUnit',
                                                                event
                                                                    .target
                                                                    .value as SizeUnit,
                                                            );
                                                        }}
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

                                                {/* RESET */}

                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleResetFilters
                                                    }
                                                    className="cursor-pointer px-4 py-1.5 rounded-[12px] text-[9px] font-medium bg-white dark:bg-[#13131f] border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-100 dark:hover:bg-[#1b1b2d]"
                                                >
                                                    Reset Filters
                                                </button>

                                                {/* COMPARE */}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        ensureActive();

                                                        updateMonthlyPageField(
                                                            TRUSTEES_MONTHLY_PAGE,
                                                            'enableCompare',
                                                            !enableCompare,
                                                        );
                                                    }}
                                                    className={`
                                                        cursor-pointer
                                                        px-4
                                                        py-1.5
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

                                            {/* FY */}

                                            <FilterGroup label="Financial Year">
                                                <CustomDropdown
                                                    options={
                                                        fyDropdownOptions
                                                    }
                                                    value={
                                                        primaryYearLabel
                                                    }
                                                    onChange={(
                                                        value,
                                                    ) =>
                                                        handleFinancialYearChange(
                                                            String(
                                                                value?.[0] ||
                                                                '',
                                                            ),
                                                            'primary',
                                                        )
                                                    }
                                                    placeholder="Select FY"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    multiSelect={
                                                        false
                                                    }
                                                />
                                            </FilterGroup>

                                            {renderFilterDropdown(
                                                'primary',
                                                'ownershipType',
                                                filterOptions.ownershipType,
                                                'Select Ownership',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'sector',
                                                filterOptions.sector,
                                                'Select Sector',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'nature',
                                                filterOptions.nature,
                                                'Select Nature',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'securityType',
                                                filterOptions.securityType,
                                                'Select Security',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'creditRatingAgency',
                                                filterOptions.creditRatingAgency,
                                                'Select Agency',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'modeOfIssue',
                                                filterOptions.modeOfIssue,
                                                'Select Mode',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'seniority',
                                                filterOptions.seniority,
                                                'Select Seniority',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'listingStatus',
                                                filterOptions.listingStatus,
                                                'Select Status',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'securedFlag',
                                                filterOptions.securedFlag,
                                                'Select Flag',
                                            )}

                                            {renderFilterDropdown(
                                                'primary',
                                                'rating',
                                                filterOptions.creditRating,
                                                'Select Rating',
                                            )}
                                        </div>
                                    </div>

                                    {/* ───────── COMPARE ───────── */}

                                    {enableCompare && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-8">

                                            <div className="flex items-center justify-between mb-5">
                                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    Compare Filters
                                                </h2>

                                                <span className="text-[9px] text-gray-400">
                                                    Comparison filters are independent from primary filters
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                                {/* COMPARE FY */}

                                                <FilterGroup label="Compare Financial Year">
                                                    <CustomDropdown
                                                        options={
                                                            fyDropdownOptions
                                                        }
                                                        value={
                                                            compareYearLabel
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            handleFinancialYearChange(
                                                                String(
                                                                    value?.[0] ||
                                                                    '',
                                                                ),
                                                                'compare',
                                                            )
                                                        }
                                                        placeholder="Select FY"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                        multiSelect={
                                                            false
                                                        }
                                                    />
                                                </FilterGroup>

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'ownershipType',
                                                    filterOptions.ownershipType,
                                                    'Select Ownership',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'sector',
                                                    filterOptions.sector,
                                                    'Select Sector',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'nature',
                                                    filterOptions.nature,
                                                    'Select Nature',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'securityType',
                                                    filterOptions.securityType,
                                                    'Select Security',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'creditRatingAgency',
                                                    filterOptions.creditRatingAgency,
                                                    'Select Agency',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'modeOfIssue',
                                                    filterOptions.modeOfIssue,
                                                    'Select Mode',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'seniority',
                                                    filterOptions.seniority,
                                                    'Select Seniority',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'listingStatus',
                                                    filterOptions.listingStatus,
                                                    'Select Status',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'securedFlag',
                                                    filterOptions.securedFlag,
                                                    'Select Flag',
                                                )}

                                                {renderFilterDropdown(
                                                    'compare',
                                                    'rating',
                                                    filterOptions.creditRating,
                                                    'Select Rating',
                                                )}
                                            </div>

                                            {/* COMPARE CHIPS */}

                                            {compareActiveFilterCount >
                                                0 && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Compare Active:
                                                        </span>

                                                        {(
                                                            Object.keys(
                                                                compareFilters,
                                                            ) as FilterKey[]
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
                                                                            label={`${FILTER_LABELS[key]}: ${value}`}
                                                                            onRemove={() => {
                                                                                const newValues =
                                                                                    compareFilters[
                                                                                        key
                                                                                    ].filter(
                                                                                        (
                                                                                            _,
                                                                                            i,
                                                                                        ) =>
                                                                                            i !==
                                                                                            index,
                                                                                    );

                                                                                updateFilter(
                                                                                    'compare',
                                                                                    key,
                                                                                    newValues,
                                                                                );
                                                                            }}
                                                                        />
                                                                    ),
                                                                ),
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                clearAllCompareDropdowns
                                                            }
                                                            className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                                        >
                                                            Clear all compare
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* PRIMARY CHIPS */}

                                    {activeFilterCount >
                                        0 && (
                                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Primary Active:
                                                </span>

                                                {(
                                                    Object.keys(
                                                        primaryFilters,
                                                    ) as FilterKey[]
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
                                                                    label={`${FILTER_LABELS[key]}: ${value}`}
                                                                    onRemove={() => {
                                                                        const newValues =
                                                                            primaryFilters[
                                                                                key
                                                                            ].filter(
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    i !==
                                                                                    index,
                                                                            );

                                                                        updateFilter(
                                                                            'primary',
                                                                            key,
                                                                            newValues,
                                                                        );
                                                                    }}
                                                                />
                                                            ),
                                                        ),
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={
                                                        clearAllPrimaryDropdowns
                                                    }
                                                    className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                                >
                                                    Clear all primary
                                                </button>
                                            </div>
                                        )}

                                    {/* ACTION BUTTONS */}

                                    <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">

                                        <button
                                            type="button"
                                            onClick={
                                                handleSearch
                                            }
                                            className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-8 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                        >
                                            <Search className="w-3.5 h-3.5" />
                                            Search
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

                {/* ───────────────── SUMMARY CARDS ───────────────── */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    <SummaryDiagonalCard
                        title="Total Issue Count"
                        primaryValue={primaryTotalCount.toLocaleString()}
                        compareValue={compareTotalCount.toLocaleString()}
                        primaryNumber={
                            primaryTotalCount
                        }
                        compareNumber={
                            compareTotalCount
                        }
                        primaryLabel={
                            primaryYearLabel
                        }
                        compareLabel={
                            compareYearLabel
                        }
                        growth={
                            totalCountGrowth
                        }
                        color="#423CAB"
                        enableCompare={
                            enableCompare
                        }
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

                {/* ───────────────── CHARTS ───────────────── */}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* AREA */}

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
                                    height={300}
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
                                            vertical={false}
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
                                                    Number(
                                                        value,
                                                    ),
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

                    {/* BAR */}

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
                                    height={300}
                                >
                                    <BarChart
                                        data={
                                            quarterlyData
                                        }
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
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
                                                    Number(
                                                        value,
                                                    ),
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

                {/* ───────────────── MONTH TABLE ───────────────── */}

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
                                <label className="text-[9px] text-gray-400 block mb-1">
                                    Value Convention
                                </label>

                                <select
                                    value={
                                        sizeUnit
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        ensureActive();

                                        updateMonthlyPageField(
                                            TRUSTEES_MONTHLY_PAGE,
                                            'sizeUnit',
                                            event
                                                .target
                                                .value as SizeUnit,
                                        );
                                    }}
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
                            tableName="trustees"
                        />
                    </div>
                </SectionCard>

                {/* ───────────────── QUARTER TABLE ───────────────── */}

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
                                <label className="text-[9px] text-gray-400 block mb-1">
                                    Value Convention
                                </label>

                                <select
                                    value={
                                        sizeUnit
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        ensureActive();

                                        updateMonthlyPageField(
                                            TRUSTEES_MONTHLY_PAGE,
                                            'sizeUnit',
                                            event
                                                .target
                                                .value as SizeUnit,
                                        );
                                    }}
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
                            tableName="trustees"
                        />
                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}