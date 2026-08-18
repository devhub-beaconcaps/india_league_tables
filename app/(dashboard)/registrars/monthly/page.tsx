'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';
import { fetchRegistrarMonthlySummaryData } from '@/features/registrars/services';

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

interface QuarterlyData {
    quarter: string;

    primaryIssueCount: number;
    compareIssueCount: number;

    primaryIssueSize: number;
    compareIssueSize: number;
}

type SizeUnit = 'Crores' | 'Lakhs' | 'Billions';

type FilterType = 'primary' | 'compare';

// ─────────────────────────────────────────────────────────────
// FINANCIAL YEAR OPTIONS
// ─────────────────────────────────────────────────────────────

function generateFinancialYearOptions(count: number = 5) {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentFYStart =
        currentMonth >= 3
            ? currentYear
            : currentYear - 1;

    const today = now.toISOString().split('T')[0];

    const options = [];

    for (let i = 0; i < count; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;

        const fyRange =
            `${startYear}-${String(endYear).slice(-2)}`;

        const fyEndDate =
            `${endYear}-03-31`;

        options.push({
            label: `FY ${fyRange}`,
            startDate: `${startYear}-04-01`,
            endDate:
                fyEndDate > today
                    ? today
                    : fyEndDate,
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
// PAGE CONSTANT
// ─────────────────────────────────────────────────────────────

const REGISTRARS_MONTHLY_PAGE =
    'registrars-monthly' as const;

// ─────────────────────────────────────────────────────────────
// DEFAULT FILTERS
// ─────────────────────────────────────────────────────────────

function createDefaultMonthlyFilters(): MonthlyFilters {
    return {
        ownershipType: [],
        sector: [],
        nature: [],
        securityType: [],
        creditRatingAgency: [],
        modeOfIssue: [],
        seniority: [],
        listingStatus: [],
        securedFlag: [],
        rating: [],
    };
}

// ─────────────────────────────────────────────────────────────
// DEFAULT PAGE STATE
// ─────────────────────────────────────────────────────────────

function createDefaultMonthlyState(): MonthlyPageState {
    return {
        primaryStartDate:
            FINANCIAL_YEAR_OPTIONS[0].startDate,

        primaryEndDate:
            FINANCIAL_YEAR_OPTIONS[0].endDate,

        compareStartDate:
            FINANCIAL_YEAR_OPTIONS[1].startDate,

        compareEndDate:
            FINANCIAL_YEAR_OPTIONS[1].endDate,

        primaryFilters:
            createDefaultMonthlyFilters(),

        compareFilters:
            createDefaultMonthlyFilters(),

        enableCompare: false,

        sizeUnit: 'Crores',
    };
}

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
            className={`bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 px-5 py-3 ${className}`}
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
                onClick={onRemove}
                className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
                type="button"
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
            onClick={onClick}
            type="button"
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
    const year =
        FINANCIAL_YEAR_OPTIONS.find(
            (item) =>
                item.startDate === startDate &&
                item.endDate === endDate,
        );

    return year?.label || 'Custom FY';
}

function formatSameMonthDayInYear(
    date: string,
    year: number,
) {
    const [, month, day] = date.split('-');

    const parsedMonth =
        parseInt(month, 10);

    const parsedDay =
        parseInt(day, 10);

    const targetDate =
        new Date(
            year,
            parsedMonth - 1,
            parsedDay,
        );

    if (
        targetDate.getFullYear() !== year ||
        targetDate.getMonth() + 1 !== parsedMonth ||
        targetDate.getDate() !== parsedDay
    ) {
        const maxDay =
            new Date(
                year,
                parsedMonth,
                0,
            ).getDate();

        return `${year}-${String(
            parsedMonth,
        ).padStart(2, '0')}-${String(
            Math.min(parsedDay, maxDay),
        ).padStart(2, '0')}`;
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

function getComparisonData(
    primaryData: MonthlyApiData[],
    compareData: MonthlyApiData[],
): ChartData[] {
    return primaryData.map((item) => {
        const compareMonth =
            compareData.find(
                (compare) =>
                    compare.issueMonthNo ===
                    item.issueMonthNo,
            );

        return {
            monthNumber: item.issueMonthNo,

            monthName:
                getMonthName(
                    item.issueMonthNo,
                ),

            primaryIssueCount:
                item.noOfIssue,

            compareIssueCount:
                compareMonth?.noOfIssue || 0,

            primaryIssueSize:
                item.issueSize,

            compareIssueSize:
                compareMonth?.issueSize || 0,
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
                monthlyData.filter(
                    (month) =>
                        quarter.months.includes(
                            Number(
                                month.monthNumber,
                            ),
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

function formatNumber(
    value: number,
): string {
    return value.toLocaleString(
        'en-IN',
        {
            maximumFractionDigits: 2,
        },
    );
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
            item.issueSize * factor,

        actualIssueSize:
            item.actualIssueSize * factor,
    }));
}

function filterZeroData(
    data: MonthlyApiData[],
): MonthlyApiData[] {
    return data.filter(
        (item) =>
            item.noOfIssue !== 0 ||
            item.issueSize !== 0,
    );
}

function formatNumberToFourChar(
    num: number,
) {
    if (num >= 1000) {
        if (num < 1000000) {
            return (
                (num / 1000)
                    .toFixed(1)
                    .replace('.0', '') +
                'k'
            );
        }

        if (num < 1000000000) {
            return (
                (num / 1000000)
                    .toFixed(1)
                    .replace('.0', '') +
                'm'
            );
        }

        return (
            (num / 1000000000)
                .toFixed(1)
                .replace('.0', '') +
            'b'
        );
    }

    return Math.round(num).toString();
}

function escapeCsvValue(
    value: string | number,
): string {
    const str = String(value);

    if (
        str.includes(',') ||
        str.includes('"') ||
        str.includes('\n')
    ) {
        return `"${str.replace(
            /"/g,
            '""',
        )}"`;
    }

    return str;
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function RegistrarsMonthWiseSummary() {
    // ─────────────────────────────────────────────────────────
    // ZUSTAND
    // ─────────────────────────────────────────────────────────

    const activeFilterPage =
        useSummaryFilterStore(
            (s) => s.activeFilterPage,
        );

    const storedMonthlyState =
        useSummaryFilterStore(
            (s) =>
                s.monthlyPageState[
                    REGISTRARS_MONTHLY_PAGE
                ],
        );

    const setMonthlyPageState =
        useSummaryFilterStore(
            (s) => s.setMonthlyPageState,
        );

    const updateMonthlyPageFilter =
        useSummaryFilterStore(
            (s) => s.updateMonthlyPageFilter,
        );

    const updateMonthlyPageField =
        useSummaryFilterStore(
            (s) => s.updateMonthlyPageField,
        );

    const clearMonthlyPageState =
        useSummaryFilterStore(
            (s) => s.clearMonthlyPageState,
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
    // PAGE / HYDRATION STATE
    // ─────────────────────────────────────────────────────────

    const isActivePage =
        activeFilterPage ===
        REGISTRARS_MONTHLY_PAGE;

    const [isInitialized, setIsInitialized] =
        useState(false);

    const hasInitializedRef =
        useRef(false);

    /*
     * Zustand persist can restore the state after the first
     * client render. Do not fetch using the fallback/default
     * state before the persisted state has been restored.
     */
    useEffect(() => {
        let cancelled = false;

        const initializePage = () => {
            if (cancelled) return;

            const store =
                useSummaryFilterStore.getState();

            const pageState =
                store.monthlyPageState[
                    REGISTRARS_MONTHLY_PAGE
                ];

            if (!pageState) {
                setMonthlyPageState(
                    REGISTRARS_MONTHLY_PAGE,
                    createDefaultMonthlyState(),
                );
            }

            hasInitializedRef.current = true;
            setIsInitialized(true);
        };

        /*
         * `persist.hasHydrated()` is available when the store
         * uses Zustand persist middleware.
         */
        const persistApi = (
            useSummaryFilterStore as typeof useSummaryFilterStore & {
                persist?: {
                    hasHydrated?: () => boolean;
                    onFinishHydration?: (
                        callback: () => void,
                    ) => () => void;
                };
            }
        ).persist;

        if (
            persistApi?.hasHydrated?.()
        ) {
            initializePage();
            return;
        }

        const unsubscribe =
            persistApi?.onFinishHydration?.(
                initializePage,
            );

        /*
         * Fallback for stores where persist hydration
         * is already complete but the helper is unavailable.
         */
        const timer = window.setTimeout(() => {
            if (!hasInitializedRef.current) {
                initializePage();
            }
        }, 0);

        return () => {
            cancelled = true;

            if (unsubscribe) {
                unsubscribe();
            }

            window.clearTimeout(timer);
        };
    }, [setMonthlyPageState]);

    // ─────────────────────────────────────────────────────────
    // EFFECTIVE STATE
    // ─────────────────────────────────────────────────────────

    const currentState =
        isActivePage &&
        storedMonthlyState
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

    const [
        isFiltersExpanded,
        setIsFiltersExpanded,
    ] = useState(false);

    const [hasSearched, setHasSearched] =
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
            REGISTRARS_MONTHLY_PAGE
        ) {
            store.setMonthlyPageState(
                REGISTRARS_MONTHLY_PAGE,
                createDefaultMonthlyState(),
            );
        }
    }, []);

    // ─────────────────────────────────────────────────────────
    // UPDATE FILTER
    // ─────────────────────────────────────────────────────────

    const updateFilter = useCallback(
        (
            type: FilterType,
            key: keyof MonthlyFilters,
            value: string[],
        ) => {
            ensureActive();

            updateMonthlyPageFilter(
                REGISTRARS_MONTHLY_PAGE,
                type,
                key,
                value,
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
        (
            items: string[],
        ): {
            value: string;
            label: string;
        }[] => {
            return items.map((item) => ({
                value: item,
                label: item,
            }));
        },
        [],
    );

    // ─────────────────────────────────────────────────────────
    // CONVERTED DATA
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
    // FETCH FILTER OPTIONS
    // ─────────────────────────────────────────────────────────

    const fetchFilterOptions =
        useCallback(
            async (
                startDate: string,
                endDate: string,
            ) => {
                try {
                    const res =
                        await fetchIssueDetailsFilterInputsData(
                            {
                                startDate,
                                endDate,
                            },
                        );

                    if (res) {
                        setFilterOptions(res);
                    }
                } catch (error) {
                    console.error(
                        'Failed to fetch registrar filter options:',
                        error,
                    );
                }
            },
            [],
        );

    /*
     * Filter options are loaded after the persisted page state
     * has been initialized.
     *
     * This does NOT fetch the actual summary data.
     */
    useEffect(() => {
        if (
            !isInitialized ||
            !isActivePage
        ) {
            return;
        }

        fetchFilterOptions(
            primaryStartDate,
            primaryEndDate,
        );
    }, [
        isInitialized,
        isActivePage,
        primaryStartDate,
        primaryEndDate,
        fetchFilterOptions,
    ]);

    // ─────────────────────────────────────────────────────────
    // PRIMARY API REQUEST
    // ─────────────────────────────────────────────────────────

    const fetchPrimaryData =
        useCallback(
            async (
                state: MonthlyPageState,
            ) => {
                try {
                    setIsLoading(true);

                    const filters =
                        state.primaryFilters;

                    const res =
                        await fetchRegistrarMonthlySummaryData(
                            {
                                startDate:
                                    state.primaryStartDate,

                                endDate:
                                    state.primaryEndDate,

                                ownershipType:
                                    filters.ownershipType,

                                sector:
                                    filters.sector,

                                nature:
                                    filters.nature,

                                securityType:
                                    filters.securityType,

                                creditRatingAgency:
                                    filters.creditRatingAgency,

                                modeOfIssue:
                                    filters.modeOfIssue,

                                seniority:
                                    filters.seniority,

                                listingStatus:
                                    filters.listingStatus,

                                securedFlag:
                                    filters.securedFlag,

                                rating:
                                    filters.rating,
                            },
                        );

                    setPrimaryData(
                        filterZeroData(
                            res?.data || [],
                        ),
                    );
                } catch (error) {
                    console.error(
                        'Failed to fetch registrar primary monthly data:',
                        error,
                    );

                    setPrimaryData([]);
                } finally {
                    setIsLoading(false);
                }
            },
            [],
        );

    // ─────────────────────────────────────────────────────────
    // COMPARE API REQUEST
    // ─────────────────────────────────────────────────────────

    const fetchCompareData =
        useCallback(
            async (
                state: MonthlyPageState,
            ) => {
                if (!state.enableCompare) {
                    setCompareData([]);
                    return;
                }

                try {
                    const filters =
                        state.compareFilters;

                    const res =
                        await fetchRegistrarMonthlySummaryData(
                            {
                                startDate:
                                    state.compareStartDate,

                                endDate:
                                    state.compareEndDate,

                                ownershipType:
                                    filters.ownershipType,

                                sector:
                                    filters.sector,

                                nature:
                                    filters.nature,

                                securityType:
                                    filters.securityType,

                                creditRatingAgency:
                                    filters.creditRatingAgency,

                                modeOfIssue:
                                    filters.modeOfIssue,

                                seniority:
                                    filters.seniority,

                                listingStatus:
                                    filters.listingStatus,

                                securedFlag:
                                    filters.securedFlag,

                                rating:
                                    filters.rating,
                            },
                        );

                    setCompareData(
                        filterZeroData(
                            res?.data || [],
                        ),
                    );
                } catch (error) {
                    console.error(
                        'Failed to fetch registrar compare monthly data:',
                        error,
                    );

                    setCompareData([]);
                }
            },
            [],
        );

    // ─────────────────────────────────────────────────────────
    // INITIAL DATA LOAD
    // ─────────────────────────────────────────────────────────

    const initialLoadRef =
        useRef(false);

    useEffect(() => {
        if (
            !isInitialized ||
            !isActivePage ||
            initialLoadRef.current
        ) {
            return;
        }

        const store =
            useSummaryFilterStore.getState();

        const state =
            store.monthlyPageState[
                REGISTRARS_MONTHLY_PAGE
            ] ||
            createDefaultMonthlyState();

        initialLoadRef.current = true;
        setHasSearched(true);

        void fetchPrimaryData(state);

        if (state.enableCompare) {
            void fetchCompareData(state);
        } else {
            setCompareData([]);
        }
    }, [
        isInitialized,
        isActivePage,
        fetchPrimaryData,
        fetchCompareData,
    ]);

    /*
     * Reset the initial-load guard if the user leaves this page.
     * When they return, the persisted registrar state is loaded
     * again and the page performs its initial fetch.
     */
    useEffect(() => {
        if (!isActivePage) {
            initialLoadRef.current = false;
        }
    }, [isActivePage]);

    // ─────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────

    const handleSearch =
        useCallback(async () => {
            ensureActive();

            /*
             * IMPORTANT:
             * Read directly from Zustand here.
             *
             * This guarantees Search uses the latest filter
             * values even if React has not rendered the latest
             * state yet.
             */
            const store =
                useSummaryFilterStore.getState();

            const latestState =
                store.monthlyPageState[
                    REGISTRARS_MONTHLY_PAGE
                ];

            if (!latestState) {
                return;
            }

            setHasSearched(true);

            setIsFiltersExpanded(false);

            await fetchPrimaryData(
                latestState,
            );

            if (
                latestState.enableCompare
            ) {
                await fetchCompareData(
                    latestState,
                );
            } else {
                setCompareData([]);
            }
        }, [
            ensureActive,
            fetchPrimaryData,
            fetchCompareData,
        ]);

    // ─────────────────────────────────────────────────────────
    // CHART DATA
    // ─────────────────────────────────────────────────────────

    const primaryChartData =
        useMemo(() => {
            return displayPrimaryData.map(
                (item) => ({
                    ...item,
                    monthName:
                        getMonthName(
                            item.issueMonthNo,
                        ),
                }),
            );
        }, [displayPrimaryData]);

    const comparisonData =
        useMemo(() => {
            return getComparisonData(
                displayPrimaryData,
                displayCompareData,
            );
        }, [
            displayPrimaryData,
            displayCompareData,
        ]);

    const quarterlyData =
        useMemo(() => {
            return getQuarterlyData(
                comparisonData,
            );
        }, [comparisonData]);

    // ─────────────────────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────────────────────

    const primaryTotalCount =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, row) =>
                        sum +
                        row.primaryIssueCount,
                    0,
                ),
            [comparisonData],
        );

    const compareTotalCount =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, row) =>
                        sum +
                        row.compareIssueCount,
                    0,
                ),
            [comparisonData],
        );

    const primaryTotalSize =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, row) =>
                        sum +
                        row.primaryIssueSize,
                    0,
                ),
            [comparisonData],
        );

    const compareTotalSize =
        useMemo(
            () =>
                comparisonData.reduce(
                    (sum, row) =>
                        sum +
                        row.compareIssueSize,
                    0,
                ),
            [comparisonData],
        );

    const totalCountGrowth =
        useMemo(() => {
            return compareTotalCount > 0
                ? (
                    (
                        primaryTotalCount -
                        compareTotalCount
                    ) /
                    compareTotalCount
                ) *
                100
                : 0;
        }, [
            primaryTotalCount,
            compareTotalCount,
        ]);

    const totalSizeGrowth =
        useMemo(() => {
            return compareTotalSize > 0
                ? (
                    (
                        primaryTotalSize -
                        compareTotalSize
                    ) /
                    compareTotalSize
                ) *
                100
                : 0;
        }, [
            primaryTotalSize,
            compareTotalSize,
        ]);

    const avgPrimarySize =
        displayPrimaryData.length
            ? primaryTotalSize /
            displayPrimaryData.length
            : 0;

    const avgCompareSize =
        displayCompareData.length
            ? compareTotalSize /
            displayCompareData.length
            : 0;

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
    // FILTER LABEL MAP
    // ─────────────────────────────────────────────────────────

    const filterLabelMap =
        useMemo<
            Record<
                keyof MonthlyFilters,
                string
            >
        >(
            () => ({
                ownershipType:
                    'Ownership',

                sector:
                    'Sector',

                nature:
                    'Nature',

                securityType:
                    'Security Type',

                creditRatingAgency:
                    'Credit Rating Agency',

                modeOfIssue:
                    'Mode Of Issue',

                seniority:
                    'Seniority',

                listingStatus:
                    'Listing Status',

                securedFlag:
                    'Secured Flag',

                rating:
                    'Rating',
            }),
            [],
        );

    // ─────────────────────────────────────────────────────────
    // ACTIVE FILTER COUNTS
    // ─────────────────────────────────────────────────────────

    const activeFilterCount =
        useMemo(() => {
            return Object.values(
                primaryFilters,
            ).reduce(
                (acc, arr) =>
                    acc + arr.length,
                0,
            );
        }, [primaryFilters]);

    const compareActiveFilterCount =
        useMemo(() => {
            return Object.values(
                compareFilters,
            ).reduce(
                (acc, arr) =>
                    acc + arr.length,
                0,
            );
        }, [compareFilters]);

    const totalActiveFilterCount =
        activeFilterCount +
        compareActiveFilterCount;

    // ─────────────────────────────────────────────────────────
    // ACTIVE FILTER CHIPS
    // ─────────────────────────────────────────────────────────

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
                            label: `${filterLabelMap[key]}: ${value}`,
                        });
                    },
                );
            });

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
                            label: `Compare ${filterLabelMap[key]}: ${value}`,
                        });
                    },
                );
            });

            return chips;
        }, [
            primaryFilters,
            compareFilters,
            filterLabelMap,
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

    // ─────────────────────────────────────────────────────────
    // CSV EXPORT
    // ─────────────────────────────────────────────────────────

    const handleExportMonthWiseCSV =
        useCallback(() => {
            if (!comparisonData.length) {
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

            const csvContent = [
                headers
                    .map(escapeCsvValue)
                    .join(','),

                ...rows.map(
                    (row) =>
                        row
                            .map(
                                escapeCsvValue,
                            )
                            .join(','),
                ),
            ].join('\n');

            const blob =
                new Blob(
                    [csvContent],
                    {
                        type: 'text/csv;charset=utf-8;',
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
                `month_wise_registrars_${primaryYearLabel}${enableCompare
                    ? `_vs_${compareYearLabel}`
                    : ''
                }.csv`;

            document.body.appendChild(
                link,
            );

            link.click();

            document.body.removeChild(
                link,
            );

            URL.revokeObjectURL(url);
        }, [
            comparisonData,
            enableCompare,
            primaryYearLabel,
            compareYearLabel,
            sizeUnit,
        ]);

    const handleExportQuarterWiseCSV =
        useCallback(() => {
            if (!quarterlyData.length) {
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

            const csvContent = [
                headers
                    .map(escapeCsvValue)
                    .join(','),

                ...rows.map(
                    (row) =>
                        row
                            .map(
                                escapeCsvValue,
                            )
                            .join(','),
                ),
            ].join('\n');

            const blob =
                new Blob(
                    [csvContent],
                    {
                        type: 'text/csv;charset=utf-8;',
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
                `quarter_wise_registrars_${primaryYearLabel}${enableCompare
                    ? `_vs_${compareYearLabel}`
                    : ''
                }.csv`;

            document.body.appendChild(
                link,
            );

            link.click();

            document.body.removeChild(
                link,
            );

            URL.revokeObjectURL(url);
        }, [
            quarterlyData,
            enableCompare,
            primaryYearLabel,
            compareYearLabel,
            sizeUnit,
        ]);

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
                                    key={index}
                                    style={{
                                        color:
                                            item.color,
                                    }}
                                    className="mb-1 text-gray-700 dark:text-gray-200"
                                >
                                    {item.name}:{' '}
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

    // ─────────────────────────────────────────────────────────
    // FINANCIAL YEAR CHANGE
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
                            item.label ===
                            value,
                    );

                if (!selectedYear) {
                    return;
                }

                ensureActive();

                if (
                    type === 'primary'
                ) {
                    updateMonthlyPageField(
                        REGISTRARS_MONTHLY_PAGE,
                        'primaryStartDate',
                        selectedYear.startDate,
                    );

                    updateMonthlyPageField(
                        REGISTRARS_MONTHLY_PAGE,
                        'primaryEndDate',
                        selectedYear.endDate,
                    );
                } else {
                    updateMonthlyPageField(
                        REGISTRARS_MONTHLY_PAGE,
                        'compareStartDate',
                        selectedYear.startDate,
                    );

                    const latestStore =
                        useSummaryFilterStore.getState();

                    const latestState =
                        latestStore
                            .monthlyPageState[
                            REGISTRARS_MONTHLY_PAGE
                        ];

                    const newCompareEnd =
                        latestState?.enableCompare
                            ? getCompareEndDate(
                                selectedYear.startDate,
                                latestState.primaryEndDate,
                            )
                            : selectedYear.endDate;

                    updateMonthlyPageField(
                        REGISTRARS_MONTHLY_PAGE,
                        'compareEndDate',
                        newCompareEnd,
                    );
                }
            },
            [
                ensureActive,
                updateMonthlyPageField,
            ],
        );

    // ─────────────────────────────────────────────────────────
    // KEEP COMPARE PERIOD ALIGNED
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (
            !isInitialized ||
            !enableCompare
        ) {
            return;
        }

        const expectedEndDate =
            getCompareEndDate(
                compareStartDate,
                primaryEndDate,
            );

        if (
            compareEndDate ===
            expectedEndDate
        ) {
            return;
        }

        updateMonthlyPageField(
            REGISTRARS_MONTHLY_PAGE,
            'compareEndDate',
            expectedEndDate,
        );
    }, [
        isInitialized,
        enableCompare,
        compareStartDate,
        primaryEndDate,
        compareEndDate,
        updateMonthlyPageField,
    ]);

    // ─────────────────────────────────────────────────────────
    // COMPARE TOGGLE
    // ─────────────────────────────────────────────────────────

    const handleToggleCompare =
        useCallback(() => {
            ensureActive();

            const store =
                useSummaryFilterStore.getState();

            const latestState =
                store.monthlyPageState[
                    REGISTRARS_MONTHLY_PAGE
                ];

            if (!latestState) {
                return;
            }

            const nextValue =
                !latestState.enableCompare;

            updateMonthlyPageField(
                REGISTRARS_MONTHLY_PAGE,
                'enableCompare',
                nextValue,
            );

            if (!nextValue) {
                setCompareData([]);
            }
        }, [
            ensureActive,
            updateMonthlyPageField,
        ]);

    // ─────────────────────────────────────────────────────────
    // RESET
    // ─────────────────────────────────────────────────────────

    const handleResetFilters =
        useCallback(() => {
            const freshState =
                createDefaultMonthlyState();

            clearMonthlyPageState(
                REGISTRARS_MONTHLY_PAGE,
                freshState,
            );

            setPrimaryData([]);
            setCompareData([]);

            setHasSearched(false);

            setIsFiltersExpanded(false);

            /*
             * Fetch the reset/default data immediately so the
             * page remains useful after Clear/Reset.
             */
            setTimeout(() => {
                const store =
                    useSummaryFilterStore.getState();

                const state =
                    store.monthlyPageState[
                        REGISTRARS_MONTHLY_PAGE
                    ] ||
                    freshState;

                setHasSearched(true);

                void fetchPrimaryData(
                    state,
                );
            }, 0);
        }, [
            clearMonthlyPageState,
            fetchPrimaryData,
        ]);

    // ─────────────────────────────────────────────────────────
    // CLEAR PRIMARY FILTERS
    // ─────────────────────────────────────────────────────────

    const clearAllPrimaryDropdowns =
        useCallback(() => {
            ensureActive();

            updateMonthlyPageField(
                REGISTRARS_MONTHLY_PAGE,
                'primaryFilters',
                createDefaultMonthlyFilters(),
            );
        }, [
            ensureActive,
            updateMonthlyPageField,
        ]);

    // ─────────────────────────────────────────────────────────
    // CLEAR COMPARE FILTERS
    // ─────────────────────────────────────────────────────────

    const clearAllCompareDropdowns =
        useCallback(() => {
            ensureActive();

            updateMonthlyPageField(
                REGISTRARS_MONTHLY_PAGE,
                'compareFilters',
                createDefaultMonthlyFilters(),
            );
        }, [
            ensureActive,
            updateMonthlyPageField,
        ]);

    // ─────────────────────────────────────────────────────────
    // REMOVE FILTER CHIP
    // ─────────────────────────────────────────────────────────

    const removeFilterChip =
        useCallback(
            (
                type: FilterType,
                key: keyof MonthlyFilters,
                index: number,
            ) => {
                const filters =
                    type === 'primary'
                        ? useSummaryFilterStore
                            .getState()
                            .monthlyPageState[
                            REGISTRARS_MONTHLY_PAGE
                        ]
                            ?.primaryFilters
                        : useSummaryFilterStore
                            .getState()
                            .monthlyPageState[
                            REGISTRARS_MONTHLY_PAGE
                        ]
                            ?.compareFilters;

                if (!filters) {
                    return;
                }

                const newValues =
                    filters[key].filter(
                        (_, i) =>
                            i !== index,
                    );

                updateFilter(
                    type,
                    key,
                    newValues,
                );
            },
            [updateFilter],
        );

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

                {/* PAGE HEADER */}

                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        Registrars Monthly Summary
                    </h1>

                    <p className="text-[9px] text-gray-400 mb-6 mt-1">
                        Registrars &gt; Monthly Summary
                    </p>
                </div>

                {/* FILTERS */}

                <SectionCard>
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
                                                        onRemove={() =>
                                                            removeFilterChip(
                                                                chip.type,
                                                                chip.key,
                                                                chip.index,
                                                            )
                                                        }
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
                                className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isFiltersExpanded
                                    ? 'rotate-180'
                                    : ''
                                    }`}
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

                                    {/* PRIMARY FILTERS */}

                                    <div>
                                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                                                Primary Filters
                                            </h2>

                                            <div className="flex items-center gap-3 flex-wrap">
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
                                                                REGISTRARS_MONTHLY_PAGE,
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
                                                    onClick={
                                                        handleToggleCompare
                                                    }
                                                    className={`cursor-pointer px-4 py-1.5 rounded-[12px] text-[9px] font-medium transition-all ${enableCompare
                                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    {enableCompare
                                                        ? 'Disable Compare'
                                                        : 'Enable Compare'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                            <FilterGroup label="Financial Year">
                                                <CustomDropdown
                                                    options={
                                                        fyDropdownOptions
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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

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
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>
                                        </div>
                                    </div>

                                    {/* COMPARE FILTERS */}

                                    {enableCompare && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-8">

                                            <h2 className="text-sm font-semibold mb-5 text-gray-700 dark:text-gray-200">
                                                Compare Filters
                                            </h2>

                                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                                <FilterGroup label="Compare Financial Year">
                                                    <CustomDropdown
                                                        options={
                                                            fyDropdownOptions
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
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
                                                                                removeFilterChip(
                                                                                    'compare',
                                                                                    key,
                                                                                    index,
                                                                                )
                                                                            }
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
                                                                        removeFilterChip(
                                                                            'primary',
                                                                            key,
                                                                            index,
                                                                        )
                                                                    }
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
                                            disabled={
                                                isLoading ||
                                                !isInitialized
                                            }
                                            className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-5 h-8 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
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

                {/* SUMMARY CARDS */}

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
                        primaryNumber={primaryTotalSize}
                        compareNumber={compareTotalSize}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        growth={totalSizeGrowth}
                        color="#059669"
                        enableCompare={enableCompare}
                    />

                    <SummaryDiagonalCard
                        title="Avg Monthly Issue Size"
                        primaryValue={`₹${formatNumberToFourChar(
                            avgPrimarySize,
                        )}`}
                        compareValue={`₹${formatNumberToFourChar(
                            avgCompareSize,
                        )}`}
                        primaryNumber={avgPrimarySize}
                        compareNumber={avgCompareSize}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        growth={
                            compareTotalSize > 0
                                ? (
                                    (
                                        avgPrimarySize -
                                        avgCompareSize
                                    ) /
                                    avgCompareSize
                                ) *
                                100
                                : 0
                        }
                        color="#D97706"
                        enableCompare={enableCompare}
                    />

                </div>

                {/* CHARTS */}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* AREA CHART */}

                    <SectionCard className="my-3">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Monthly Issue Size Trend
                                {' '}
                                (₹ {sizeUnit})
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
                                                id="registrarPrimaryGrad"
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
                                                id="registrarCompareGrad"
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
                                            tickFormatter={
                                                formatNumber
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

                                        <Legend
                                            wrapperStyle={{
                                                color: '#374151',
                                            }}
                                        />

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
                                            fill="url(#registrarPrimaryGrad)"
                                            strokeWidth={2}
                                        />

                                        {enableCompare && (
                                            <Area
                                                type="monotone"
                                                dataKey="compareIssueSize"
                                                name={
                                                    compareYearLabel
                                                }
                                                stroke="#06B6D4"
                                                fill="url(#registrarCompareGrad)"
                                                strokeWidth={
                                                    2
                                                }
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoDataState
                                message={
                                    hasSearched
                                        ? 'No data available'
                                        : 'Click Search to load data'
                                }
                            />
                        )}
                    </SectionCard>

                    {/* BAR CHART */}

                    <SectionCard className="my-3">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Quarterly Summary
                                {' '}
                                (₹ {sizeUnit})
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
                                            tickFormatter={
                                                formatNumber
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

                                        <Legend
                                            wrapperStyle={{
                                                color: '#374151',
                                            }}
                                        />

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

                {/* MONTH-WISE TABLE */}

                <SectionCard className="!p-0 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Month-Wise Data
                            {' '}
                            (Rupees in {sizeUnit})
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
                                    strokeWidth={2}
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
                                            REGISTRARS_MONTHLY_PAGE,
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
                            tableName="registrars"
                        />
                    </div>
                </SectionCard>

                {/* QUARTER-WISE TABLE */}

                <SectionCard className="!p-0 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Quarter-Wise Data
                            {' '}
                            (Rupees in {sizeUnit})
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
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
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
                                            REGISTRARS_MONTHLY_PAGE,
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
                            tableName="registrars"
                        />
                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}