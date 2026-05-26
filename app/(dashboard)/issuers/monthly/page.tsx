'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

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
import { fetchIssueDetailsFilterInputsData, fetchIssuerMonthlySummaryData } from '@/features/issuers/services';

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
    taxFree: string[];
    listingStatus: string[];
    securedFlag: string[];
    creditRating: string[];
}

interface ApiFilters {
    startDate: string;
    endDate: string;

    ownershipType: string;
    sector: string;
    nature: string;
    securityType: string;
    creditRatingAgency: string;
    modeOfIssue: string;
    seniority: string;
    taxFree: string;
    listingStatus: string;
    securedFlag: string;
    rating: string;
    dealSize: string;
}

type SizeUnit = 'Crores' | 'Lakhs' | 'Billions';

// ─────────────────────────────────────────────────────────────
// FINANCIAL YEAR OPTIONS (DYNAMIC)
// ─────────────────────────────────────────────────────────────

function generateFinancialYearOptions(count: number = 3) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    // FY starts April 1. If month >= 3 (April), current FY started this year.
    const currentFYStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    // Use the most recently completed/primary FY as the top option
    const primaryFYStart = currentFYStart - 1;

    const options = [];
    for (let i = 0; i < count; i++) {
        const startYear = primaryFYStart - i;
        const endYear = startYear + 1;
        const fyEndShort = endYear.toString().slice(-2);
        options.push({
            label: `FY${fyEndShort} (${startYear}-${fyEndShort})`,
            startDate: `${startYear}-04-01`,
            endDate: `${endYear}-03-31`,
        });
    }
    return options;
}

const FINANCIAL_YEAR_OPTIONS = generateFinancialYearOptions(3);

// ─────────────────────────────────────────────────────────────
// DEFAULT FILTERS
// ─────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ApiFilters = {
    startDate: FINANCIAL_YEAR_OPTIONS[0].startDate,
    endDate: FINANCIAL_YEAR_OPTIONS[0].endDate,

    ownershipType: '',
    sector: '',
    nature: '',
    securityType: '',
    creditRatingAgency: '',
    modeOfIssue: '',
    seniority: '',
    taxFree: '',
    listingStatus: '',
    securedFlag: '',
    rating: '',
    dealSize: '',
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
            className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 ${className}`}
        >
            {children}
        </div>
    );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
    return (
        <div style={{ height }} className="dark:bg-[#1a1a2e]">
            <Skeleton height="100%" />
        </div>
    );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} height={40} />
            ))}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
            </p>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121220] px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#423CAB] dark:focus:ring-[#5a53d0]"
            >
                <option value="" className="text-gray-900 dark:text-gray-100">All</option>

                {options?.map((item) => (
                    <option key={item} value={item} className="text-gray-900 dark:text-gray-100">
                        {item}
                    </option>
                ))}
            </select>
        </div>
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
    const year = FINANCIAL_YEAR_OPTIONS.find(
        (item) =>
            item.startDate === startDate &&
            item.endDate === endDate,
    );

    return year?.label || 'Custom FY';
}

function getComparisonData(
    primaryData: MonthlyApiData[],
    compareData: MonthlyApiData[],
): ChartData[] {
    return primaryData?.map((item) => {
        const compareMonth = compareData?.find(
            (compare) =>
                compare.issueMonthNo === item.issueMonthNo,
        );

        return {
            monthNumber: item.issueMonthNo,
            monthName: getMonthName(item.issueMonthNo),

            primaryIssueCount: item.noOfIssue,
            compareIssueCount: compareMonth?.noOfIssue || 0,

            primaryIssueSize: item.issueSize,
            compareIssueSize: compareMonth?.issueSize || 0,
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

    return quarters.map((quarter) => {
        const quarterMonths = monthlyData.filter((month) =>
            quarter.months.includes(month.monthNumber),
        );

        return {
            quarter: quarter.label,

            primaryIssueCount: quarterMonths.reduce(
                (sum, item) => sum + item.primaryIssueCount,
                0,
            ),

            compareIssueCount: quarterMonths.reduce(
                (sum, item) => sum + item.compareIssueCount,
                0,
            ),

            primaryIssueSize: quarterMonths.reduce(
                (sum, item) => sum + item.primaryIssueSize,
                0,
            ),

            compareIssueSize: quarterMonths.reduce(
                (sum, item) => sum + item.compareIssueSize,
                0,
            ),
        };
    });
}

function formatNumber(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getGrowthColor(value: number): string {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-red-500 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
}

function convertApiData(data: MonthlyApiData[], unit: SizeUnit): MonthlyApiData[] {
    const factor = unit === 'Lakhs' ? 100 : unit === 'Billions' ? 0.01 : 1;
    return data.map((item) => ({
        ...item,
        issueSize: item.issueSize * factor,
        actualIssueSize: item.actualIssueSize * factor,
    }));
}

// ─────────────────────────────────────────────────────────────
// TABLE COMPONENTS
// ─────────────────────────────────────────────────────────────

function MonthWiseTable({
    data,
    enableCompare,
    primaryLabel,
    compareLabel,
    isLoading,
    sizeUnit,
}: {
    data: ChartData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
}) {
    if (isLoading) {
        return <TableSkeleton rows={8} />;
    }

    if (data.length === 0) {
        return <NoDataState message="No monthly data available" />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            Month
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            {primaryLabel} — Issues
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            {primaryLabel} — Size (₹ {sizeUnit})
                        </th>
                        {enableCompare && (
                            <>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    {compareLabel} — Issues
                                </th>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    {compareLabel} — Size (₹ {sizeUnit})
                                </th>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    Growth %
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        const sizeGrowth =
                            enableCompare && row.compareIssueSize > 0
                                ? ((row.primaryIssueSize - row.compareIssueSize) / row.compareIssueSize) * 100
                                : 0;

                        return (
                            <tr
                                key={row.monthNumber}
                                className={`border-b border-gray-100 dark:border-gray-800 ${
                                    index % 2 === 0
                                        ? 'bg-white dark:bg-[#1a1a2e]'
                                        : 'bg-gray-50 dark:bg-[#151528]'
                                }`}
                            >
                                <td className="py-3 px-2 text-gray-900 dark:text-gray-100 font-medium">
                                    {row.monthName}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                    {formatNumber(row.primaryIssueCount)}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                    {formatNumber(row.primaryIssueSize)}
                                </td>
                                {enableCompare && (
                                    <>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatNumber(row.compareIssueCount)}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatNumber(row.compareIssueSize)}
                                        </td>
                                        <td className={`py-3 px-2 text-right font-semibold ${getGrowthColor(sizeGrowth)}`}>
                                            {sizeGrowth > 0 ? '+' : ''}
                                            {sizeGrowth.toFixed(1)}%
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold bg-gray-100 dark:bg-[#121220]">
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                            Total
                        </td>
                        <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(
                                data.reduce((sum, r) => sum + r.primaryIssueCount, 0)
                            )}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(
                                data.reduce((sum, r) => sum + r.primaryIssueSize, 0)
                            )}
                        </td>
                        {enableCompare && (
                            <>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    {formatNumber(
                                        data.reduce((sum, r) => sum + r.compareIssueCount, 0)
                                    )}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    {formatNumber(
                                        data.reduce((sum, r) => sum + r.compareIssueSize, 0)
                                    )}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    —
                                </td>
                            </>
                        )}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function QuarterWiseTable({
    data,
    enableCompare,
    primaryLabel,
    compareLabel,
    isLoading,
    sizeUnit,
}: {
    data: QuarterlyData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
}) {
    if (isLoading) {
        return <TableSkeleton rows={6} />;
    }

    if (data.length === 0) {
        return <NoDataState message="No quarterly data available" />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            Quarter
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            {primaryLabel} — Issues
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            {primaryLabel} — Size (₹ {sizeUnit})
                        </th>
                        {enableCompare && (
                            <>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    {compareLabel} — Issues
                                </th>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    {compareLabel} — Size (₹ {sizeUnit})
                                </th>
                                <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                    Growth %
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        const sizeGrowth =
                            enableCompare && row.compareIssueSize > 0
                                ? ((row.primaryIssueSize - row.compareIssueSize) / row.compareIssueSize) * 100
                                : 0;

                        return (
                            <tr
                                key={row.quarter}
                                className={`border-b border-gray-100 dark:border-gray-800 ${
                                    index % 2 === 0
                                        ? 'bg-white dark:bg-[#1a1a2e]'
                                        : 'bg-gray-50 dark:bg-[#151528]'
                                }`}
                            >
                                <td className="py-3 px-2 text-gray-900 dark:text-gray-100 font-medium">
                                    {row.quarter}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                    {formatNumber(row.primaryIssueCount)}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                    {formatNumber(row.primaryIssueSize)}
                                </td>
                                {enableCompare && (
                                    <>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatNumber(row.compareIssueCount)}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatNumber(row.compareIssueSize)}
                                        </td>
                                        <td className={`py-3 px-2 text-right font-semibold ${getGrowthColor(sizeGrowth)}`}>
                                            {sizeGrowth > 0 ? '+' : ''}
                                            {sizeGrowth.toFixed(1)}%
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold bg-gray-100 dark:bg-[#121220]">
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                            Total
                        </td>
                        <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(
                                data.reduce((sum, r) => sum + r.primaryIssueCount, 0)
                            )}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(
                                data.reduce((sum, r) => sum + r.primaryIssueSize, 0)
                            )}
                        </td>
                        {enableCompare && (
                            <>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    {formatNumber(
                                        data.reduce((sum, r) => sum + r.compareIssueCount, 0)
                                    )}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    {formatNumber(
                                        data.reduce((sum, r) => sum + r.compareIssueSize, 0)
                                    )}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                    —
                                </td>
                            </>
                        )}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function IssuerMonthWiseSummary() {
    const [isLoading, setIsLoading] = useState(false);
    const [enableCompare, setEnableCompare] = useState(false);
    const [sizeUnit, setSizeUnit] = useState<SizeUnit>('Crores');

    const [filterOptions, setFilterOptions] =
        useState<FilterOptions>({
            ownershipType: [],
            sector: [],
            nature: [],
            securityType: [],
            creditRatingAgency: [],
            modeOfIssue: [],
            seniority: [],
            taxFree: [],
            listingStatus: [],
            securedFlag: [],
            creditRating: [],
        });

    // ─────────────────────────────────────────────────────────
    // PRIMARY FILTERS
    // ─────────────────────────────────────────────────────────

    const [primaryFilters, setPrimaryFilters] =
        useState<ApiFilters>(DEFAULT_FILTERS);

    // ─────────────────────────────────────────────────────────
    // COMPARE FILTERS (defaults to previous FY)
    // ─────────────────────────────────────────────────────────

    const [compareFilters, setCompareFilters] =
        useState<ApiFilters>({
            ...DEFAULT_FILTERS,
            startDate: FINANCIAL_YEAR_OPTIONS[1].startDate,
            endDate: FINANCIAL_YEAR_OPTIONS[1].endDate,
        });

    // ─────────────────────────────────────────────────────────
    // DATA STATES
    // ─────────────────────────────────────────────────────────

    const [primaryData, setPrimaryData] = useState<
        MonthlyApiData[]
    >([]);

    const [compareData, setCompareData] = useState<
        MonthlyApiData[]
    >([]);

    // ─────────────────────────────────────────────────────────
    // CONVERTED DISPLAY DATA
    // ─────────────────────────────────────────────────────────

    const displayPrimaryData = useMemo(() => {
        return convertApiData(primaryData, sizeUnit);
    }, [primaryData, sizeUnit]);

    const displayCompareData = useMemo(() => {
        return convertApiData(compareData, sizeUnit);
    }, [compareData, sizeUnit]);

    // ─────────────────────────────────────────────────────────
    // FETCH FILTER OPTIONS
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const query = {
                startDate: primaryFilters.startDate,
                endDate: primaryFilters.endDate,
            };

            const res = await fetchIssueDetailsFilterInputsData(query);

            console.log('filters data', res);


            setFilterOptions(res);
        } catch (error) {
            console.error(error);
        }
    };

    // ─────────────────────────────────────────────────────────
    // FETCH PRIMARY DATA
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetchPrimaryData();
    }, [primaryFilters]);

    const fetchPrimaryData = async () => {
        try {
            setIsLoading(true);

            const res = await fetchIssuerMonthlySummaryData(primaryFilters);

            console.log('primary data', res?.data);

            setPrimaryData(res?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // FETCH COMPARE DATA
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (enableCompare) {
            fetchCompareData();
        }
    }, [compareFilters, enableCompare]);

    const fetchCompareData = async () => {
        try {

            const res = await fetchIssuerMonthlySummaryData(compareFilters);

            console.log('compare data', res?.data);

            setCompareData(res?.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    // ─────────────────────────────────────────────────────────
    // CHART DATA
    // ─────────────────────────────────────────────────────────

    const primaryChartData = useMemo(() => {
        return displayPrimaryData.map((item) => ({
            ...item,
            monthName: getMonthName(item.issueMonthNo),
        }));
    }, [displayPrimaryData]);

    const comparisonData = useMemo(() => {
        return getComparisonData(
            displayPrimaryData,
            displayCompareData,
        );
    }, [displayPrimaryData, displayCompareData]);

    const quarterlyData = useMemo(() => {
        return getQuarterlyData(comparisonData);
    }, [comparisonData]);
    

    // ─────────────────────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────────────────────

    const totalIssueCount = useMemo(() => {
        return primaryData.reduce(
            (sum, item) => sum + item.noOfIssue,
            0,
        );
    }, [primaryData]);

    const totalIssueSize = useMemo(() => {
        return displayPrimaryData.reduce(
            (sum, item) => sum + item.issueSize,
            0,
        );
    }, [displayPrimaryData]);

    const compareTotalIssueSize = useMemo(() => {
        return displayCompareData.reduce(
            (sum, item) => sum + item.issueSize,
            0,
        );
    }, [displayCompareData]);

    const growthPercentage = useMemo(() => {
        if (
            !enableCompare ||
            compareTotalIssueSize === 0
        ) {
            return 0;
        }

        return (
            ((totalIssueSize -
                compareTotalIssueSize) /
                compareTotalIssueSize) *
            100
        );
    }, [
        enableCompare,
        totalIssueSize,
        compareTotalIssueSize,
    ]);

    // ─────────────────────────────────────────────────────────
    // TOOLTIP COMPONENT (unit-aware)
    // ─────────────────────────────────────────────────────────

    const CustomTooltipComponent = useMemo(() => {
        return function TooltipComponent({ active, payload, label }: any) {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                        <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{label}</p>

                        {payload.map((item: any, index: number) => (
                            <p
                                key={index}
                                style={{ color: item.color }}
                                className="mb-1 text-gray-700 dark:text-gray-300"
                            >
                                {item.name}: {formatNumber(item.value)} {sizeUnit}
                            </p>
                        ))}
                    </div>
                );
            }
            return null;
        };
    }, [sizeUnit]);

    // ─────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────

    const handleFinancialYearChange = (
        value: string,
        type: 'primary' | 'compare',
    ) => {
        const selectedYear =
            FINANCIAL_YEAR_OPTIONS.find(
                (item) => item.label === value,
            );

        if (!selectedYear) return;

        if (type === 'primary') {
            setPrimaryFilters((prev) => ({
                ...prev,
                startDate: selectedYear.startDate,
                endDate: selectedYear.endDate,
            }));
        } else {
            setCompareFilters((prev) => ({
                ...prev,
                startDate: selectedYear.startDate,
                endDate: selectedYear.endDate,
            }));
        }
    };

    const handleResetFilters = () => {
        setPrimaryFilters(DEFAULT_FILTERS);

        setCompareFilters({
            ...DEFAULT_FILTERS,
            startDate: FINANCIAL_YEAR_OPTIONS[1].startDate,
            endDate: FINANCIAL_YEAR_OPTIONS[1].endDate,
        });
    };

    const primaryYearLabel = getFinancialYearLabel(
        primaryFilters.startDate,
        primaryFilters.endDate,
    );

    const compareYearLabel = getFinancialYearLabel(
        compareFilters.startDate,
        compareFilters.endDate,
    );

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <SkeletonTheme
            enableAnimation
            baseColor="#1F2937"
            highlightColor="#374151"
        >
            <div className="space-y-4 bg-gray-50 dark:bg-[#0f0f1a] min-h-screen p-4">

                {/* HEADER */}

                <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        Issuer Month-Wise Summary
                    </h1>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Issuer &gt; Monthly Summary
                    </p>
                </div>

                {/* FILTERS */}

                <SectionCard>
                    <div className="space-y-8">

                        {/* PRIMARY FILTERS */}

                        <div>
                            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Primary Filters
                                </h2>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Size Unit
                                        </label>
                                        <select
                                            value={sizeUnit}
                                            onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                                            className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121220] px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#423CAB] dark:focus:ring-[#5a53d0]"
                                        >
                                            <option value="Crores">Crores</option>
                                            <option value="Lakhs">Lakhs</option>
                                            <option value="Billions">Billions</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleResetFilters}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-[#13131f] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-100 dark:hover:bg-[#1b1b2d]"
                                    >
                                        Reset Filters
                                    </button>

                                    <button
                                        onClick={() =>
                                            setEnableCompare(
                                                !enableCompare,
                                            )
                                        }
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${enableCompare
                                            ? 'bg-[#423CAB] text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {enableCompare
                                            ? 'Disable Compare'
                                            : 'Enable Compare'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                {/* FINANCIAL YEAR */}

                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        Financial Year
                                    </label>

                                    <select
                                        value={getFinancialYearLabel(
                                            primaryFilters.startDate,
                                            primaryFilters.endDate,
                                        )}
                                        onChange={(e) =>
                                            handleFinancialYearChange(
                                                e.target.value,
                                                'primary',
                                            )
                                        }
                                        className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121220] px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#423CAB] dark:focus:ring-[#5a53d0]"
                                    >
                                        {FINANCIAL_YEAR_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.label
                                                    }
                                                    value={
                                                        item.label
                                                    }
                                                    className="text-gray-900 dark:text-gray-100"
                                                >
                                                    {item.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <FilterSelect
                                    label="Ownership Type"
                                    value={
                                        primaryFilters.ownershipType
                                    }
                                    options={
                                        filterOptions.ownershipType
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                ownershipType:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Sector"
                                    value={
                                        primaryFilters.sector
                                    }
                                    options={
                                        filterOptions.sector
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                sector: value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Nature"
                                    value={
                                        primaryFilters.nature
                                    }
                                    options={
                                        filterOptions.nature
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                nature: value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Security Type"
                                    value={
                                        primaryFilters.securityType
                                    }
                                    options={
                                        filterOptions.securityType
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                securityType:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Credit Rating Agency"
                                    value={
                                        primaryFilters.creditRatingAgency
                                    }
                                    options={
                                        filterOptions.creditRatingAgency
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                creditRatingAgency:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Mode Of Issue"
                                    value={
                                        primaryFilters.modeOfIssue
                                    }
                                    options={
                                        filterOptions.modeOfIssue
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                modeOfIssue:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Seniority"
                                    value={
                                        primaryFilters.seniority
                                    }
                                    options={
                                        filterOptions.seniority
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                seniority:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Tax Free"
                                    value={
                                        primaryFilters.taxFree
                                    }
                                    options={
                                        filterOptions.taxFree
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                taxFree: value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Listing Status"
                                    value={
                                        primaryFilters.listingStatus
                                    }
                                    options={
                                        filterOptions.listingStatus
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                listingStatus:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Secured Flag"
                                    value={
                                        primaryFilters.securedFlag
                                    }
                                    options={
                                        filterOptions.securedFlag
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                securedFlag:
                                                    value,
                                            }),
                                        )
                                    }
                                />

                                <FilterSelect
                                    label="Rating"
                                    value={
                                        primaryFilters.rating
                                    }
                                    options={
                                        filterOptions.creditRating
                                    }
                                    onChange={(value) =>
                                        setPrimaryFilters(
                                            (prev) => ({
                                                ...prev,
                                                rating: value,
                                            }),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {/* COMPARE FILTERS */}

                        {enableCompare && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">

                                <h2 className="text-sm font-semibold mb-5 text-gray-800 dark:text-gray-100">
                                    Compare Filters
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                            Compare Financial Year
                                        </label>

                                        <select
                                            value={getFinancialYearLabel(
                                                compareFilters.startDate,
                                                compareFilters.endDate,
                                            )}
                                            onChange={(e) =>
                                                handleFinancialYearChange(
                                                    e.target.value,
                                                    'compare',
                                                )
                                            }
                                            className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121220] px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#423CAB] dark:focus:ring-[#5a53d0]"
                                        >
                                            {FINANCIAL_YEAR_OPTIONS.map(
                                                (
                                                    item,
                                                ) => (
                                                    <option
                                                        key={
                                                            item.label
                                                        }
                                                        value={
                                                            item.label
                                                        }
                                                        className="text-gray-900 dark:text-gray-100"
                                                    >
                                                        {
                                                            item.label
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <FilterSelect
                                        label="Ownership Type"
                                        value={
                                            compareFilters.ownershipType
                                        }
                                        options={
                                            filterOptions.ownershipType
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    ownershipType:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Sector"
                                        value={
                                            compareFilters.sector
                                        }
                                        options={
                                            filterOptions.sector
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    sector:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Nature"
                                        value={
                                            compareFilters.nature
                                        }
                                        options={
                                            filterOptions.nature
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    nature:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Security Type"
                                        value={
                                            compareFilters.securityType
                                        }
                                        options={
                                            filterOptions.securityType
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    securityType:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Credit Rating Agency"
                                        value={
                                            compareFilters.creditRatingAgency
                                        }
                                        options={
                                            filterOptions.creditRatingAgency
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    creditRatingAgency:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Mode Of Issue"
                                        value={
                                            compareFilters.modeOfIssue
                                        }
                                        options={
                                            filterOptions.modeOfIssue
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    modeOfIssue:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Seniority"
                                        value={
                                            compareFilters.seniority
                                        }
                                        options={
                                            filterOptions.seniority
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    seniority:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Tax Free"
                                        value={
                                            compareFilters.taxFree
                                        }
                                        options={
                                            filterOptions.taxFree
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    taxFree:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Listing Status"
                                        value={
                                            compareFilters.listingStatus
                                        }
                                        options={
                                            filterOptions.listingStatus
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    listingStatus:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Secured Flag"
                                        value={
                                            compareFilters.securedFlag
                                        }
                                        options={
                                            filterOptions.securedFlag
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    securedFlag:
                                                        value,
                                                }),
                                            )
                                        }
                                    />

                                    <FilterSelect
                                        label="Rating"
                                        value={
                                            compareFilters.rating
                                        }
                                        options={
                                            filterOptions.creditRating
                                        }
                                        onChange={(value) =>
                                            setCompareFilters(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    rating:
                                                        value,
                                                }),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* SUMMARY */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    <SectionCard>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Total Issue Count
                        </p>

                        <p className="text-2xl font-bold text-[#423CAB] dark:text-[#6b64d6]">
                            {totalIssueCount.toLocaleString()}
                        </p>
                    </SectionCard>

                    <SectionCard>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Total Issue Size
                        </p>

                        <p className="text-2xl font-bold text-[#423CAB] dark:text-[#6b64d6]">
                            ₹ {formatNumber(totalIssueSize)} {sizeUnit}
                        </p>
                    </SectionCard>

                    <SectionCard>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Avg Monthly Issue Size
                        </p>

                        <p className="text-2xl font-bold text-[#423CAB] dark:text-[#6b64d6]">
                            ₹{' '}
                            {displayPrimaryData.length > 0
                                ? formatNumber(
                                    totalIssueSize /
                                    displayPrimaryData.length,
                                )
                                : formatNumber(0)}{' '}
                            {sizeUnit}
                        </p>
                    </SectionCard>

                    <SectionCard>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Compare Growth
                        </p>

                        <p
                            className={`text-2xl font-bold ${growthPercentage >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                                }`}
                        >
                            {enableCompare
                                ? `${growthPercentage.toFixed(
                                    1,
                                )}%`
                                : '--'}
                        </p>
                    </SectionCard>
                </div>

                {/* CHARTS */}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* AREA CHART */}

                    <SectionCard>
                        <h2 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Monthly Issue Size Trend (₹ {sizeUnit})
                        </h2>

                        {isLoading ? (
                            <ChartSkeleton />
                        ) : primaryData.length > 0 ? (
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
                                                stopOpacity={0.3}
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#423CAB"
                                                stopOpacity={0.02}
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
                                                stopOpacity={0.25}
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#06B6D4"
                                                stopOpacity={0.02}
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
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />

                                    <YAxis
                                        tickFormatter={(value) => formatNumber(value)}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />

                                    <Tooltip
                                        content={
                                            <CustomTooltipComponent />
                                        }
                                    />

                                    <Legend 
                                        wrapperStyle={{ color: '#374151' }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey={
                                            enableCompare
                                                ? 'primaryIssueSize'
                                                : 'issueSize'
                                        }
                                        name={getFinancialYearLabel(
                                            primaryFilters.startDate,
                                            primaryFilters.endDate,
                                        )}
                                        stroke="#423CAB"
                                        fill="url(#primaryGrad)"
                                        strokeWidth={2}
                                    />

                                    {enableCompare && (
                                        <Area
                                            type="monotone"
                                            dataKey="compareIssueSize"
                                            name={getFinancialYearLabel(
                                                compareFilters.startDate,
                                                compareFilters.endDate,
                                            )}
                                            stroke="#06B6D4"
                                            fill="url(#compareGrad)"
                                            strokeWidth={2}
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <NoDataState />
                        )}
                    </SectionCard>

                    {/* BAR CHART */}

                    <SectionCard>
                        <h2 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Quarterly Summary (₹ {sizeUnit})
                        </h2>

                        {isLoading ? (
                            <ChartSkeleton />
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                            >
                                <BarChart
                                    data={quarterlyData}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />

                                    <XAxis 
                                        dataKey="quarter" 
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />

                                    <YAxis
                                        tickFormatter={(value) => formatNumber(value)}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />

                                    <Tooltip
                                        content={
                                            <CustomTooltipComponent />
                                        }
                                    />

                                    <Legend 
                                        wrapperStyle={{ color: '#374151' }}
                                    />

                                    <Bar
                                        dataKey="primaryIssueSize"
                                        name={getFinancialYearLabel(
                                            primaryFilters.startDate,
                                            primaryFilters.endDate,
                                        )}
                                        fill="#423CAB"
                                        radius={[
                                            4, 4, 0, 0,
                                        ]}
                                    />

                                    {enableCompare && (
                                        <Bar
                                            dataKey="compareIssueSize"
                                            name={getFinancialYearLabel(
                                                compareFilters.startDate,
                                                compareFilters.endDate,
                                            )}
                                            fill="#06B6D4"
                                            radius={[
                                                4, 4, 0, 0,
                                            ]}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </SectionCard>
                </div>

                {/* MONTH-WISE TABLE */}

                <SectionCard>
                    <h2 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Month-Wise Issue Details
                    </h2>
                    <MonthWiseTable
                        data={comparisonData}
                        enableCompare={enableCompare}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        isLoading={isLoading}
                        sizeUnit={sizeUnit}
                    />
                </SectionCard>

                {/* QUARTER-WISE TABLE */}

                <SectionCard>
                    <h2 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Quarter-Wise Issue Details
                    </h2>
                    <QuarterWiseTable
                        data={quarterlyData}
                        enableCompare={enableCompare}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        isLoading={isLoading}
                        sizeUnit={sizeUnit}
                    />
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}