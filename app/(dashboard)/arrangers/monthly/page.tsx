'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';

import { useRouter } from 'next/navigation';
import { fetchArrangerMonthlySummaryData } from '@/features/arrangers/services';
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

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
    const currentMonth = now.getMonth(); // Jan = 0, Apr = 3

    // Current FY start year
    const currentFYStart =
        currentMonth >= 3 ? currentYear : currentYear - 1;

    const today = now.toISOString().split('T')[0];

    const options = [];

    for (let i = 0; i < count; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;

        const fyRange = `${startYear}-${String(endYear).slice(-2)}`;
        const fyEndDate = `${endYear}-03-31`;

        options.push({
            label: `FY ${fyRange}`,
            startDate: `${startYear}-04-01`,
            endDate: fyEndDate > today ? today : fyEndDate,
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
            className={`bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 px-5 py-3 ${className}`}
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
            <p className="text-[9px] text-gray-500 dark:text-gray-400">
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
            <label className="text-[9px] text-gray-400 block mb-1">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
            >
                <option value="" className="text-gray-700 dark:text-gray-200">All</option>

                {options?.map((item) => (
                    <option key={item} value={item} className="text-gray-700 dark:text-gray-200">
                        {item}
                    </option>
                ))}
            </select>
        </div>
    );
}

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

    return quarters
        .map((quarter) => {
            const quarterMonths = monthlyData.filter((month) =>
                quarter.months.includes(Number(month.monthNumber)),
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
        })
        .filter((q) => q.primaryIssueCount > 0 || q.primaryIssueSize > 0 || q.compareIssueCount > 0 || q.compareIssueSize > 0);
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

function filterZeroData(data: MonthlyApiData[]): MonthlyApiData[] {
    return data.filter((item) => item.noOfIssue !== 0 || item.issueSize !== 0);
}

// ─────────────────────────────────────────────────────────────
// TABLE COMPONENTS
// ─────────────────────────────────────────────────────────────

function getFullMonthName(monthNo: number): string {
    const months: Record<number, string> = {
        1: 'January', 2: 'February', 3: 'March', 4: 'April',
        5: 'May', 6: 'June', 7: 'July', 8: 'August',
        9: 'September', 10: 'October', 11: 'November', 12: 'December',
    };
    return months[monthNo] || '';
}

function getFYRange(startDate: string): string {
    const startYear = parseInt(startDate.split('-')[0], 10);
    return `${startYear}-${startYear + 1}`;
}

function MonthWiseTable({
    data,
    enableCompare,
    primaryLabel,
    compareLabel,
    isLoading,
    sizeUnit,
    primaryStartDate,
    compareStartDate,
}: {
    data: ChartData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
    primaryStartDate: string;
    compareStartDate: string;
}) {
    const router = useRouter();
    if (isLoading) {
        return <TableSkeleton rows={8} />;
    }
    const filteredData = data.filter((row) => {
        const primaryHasData =
            row.primaryIssueCount !== 0 || row.primaryIssueSize !== 0;

        const compareHasData =
            row.compareIssueCount !== 0 || row.compareIssueSize !== 0;

        return enableCompare
            ? primaryHasData || compareHasData
            : primaryHasData;
    });

    if (filteredData.length === 0) {
        return <NoDataState message="No monthly data available" />;
    }

    const handleClick = (
        row: ChartData | null,
        type: 'primary' | 'compare',
        isTotal = false
    ) => {
        const period = isTotal
            ? 'FY'
            : getFullMonthName(row!.monthNumber);

        const fy =
            type === 'primary'
                ? getFYRange(primaryStartDate)
                : getFYRange(compareStartDate);

        router.push(
            `/arrangers/list?period=${encodeURIComponent(period)}&fy=${fy}`
        );
    };

    const colCount = enableCompare ? 7 : 3;

    const primaryTotalCount = filteredData.reduce(
        (sum, r) => sum + r.primaryIssueCount,
        0
    );

    const compareTotalCount = filteredData.reduce(
        (sum, r) => sum + r.compareIssueCount,
        0
    );

    const primaryTotalSize = filteredData.reduce(
        (sum, r) => sum + r.primaryIssueSize,
        0
    );

    const compareTotalSize = filteredData.reduce(
        (sum, r) => sum + r.compareIssueSize,
        0
    );

    const totalCountGrowth =
        compareTotalCount > 0
            ? ((primaryTotalCount - compareTotalCount) /
                compareTotalCount) *
            100
            : 0;

    const totalSizeGrowth =
        compareTotalSize > 0
            ? ((primaryTotalSize - compareTotalSize) /
                compareTotalSize) *
            100
            : 0;

    return (
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-[12px] border border-gray-200 dark:border-gray-600">
            <table className="w-full text-[10px]">
                <thead>
                    {/* Row 1: Time Period */}
                    <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                        <th
                            colSpan={colCount}
                            className="text-left py-2 px-4 text-[10px] font-medium uppercase tracking-wide"
                        >
                            {enableCompare
                                ? `${primaryLabel} vs ${compareLabel}`
                                : primaryLabel}
                        </th>
                    </tr>

                    {/* Row 2: Year group labels (only when comparing) */}
                    {enableCompare && (
                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                            <th
                                rowSpan={2}
                                className="text-left py-3 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                Month
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                {primaryLabel}
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                {compareLabel}
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold"
                            >
                                Growth %
                            </th>
                        </tr>
                    )}

                    {/* Row 2/3: Field names */}
                    <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                        {!enableCompare && (
                            <th className="text-left py-3 px-4 text-[10px] font-semibold">
                                Month
                            </th>
                        )}
                        <th className="text-center py-3 px-4 text-[10px] font-semibold">
                            No. of Issues
                        </th>
                        <th className="text-center py-3 px-4 text-[10px] font-semibold">
                            Issue Size (₹ {sizeUnit})
                        </th>
                        {enableCompare && (
                            <>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    No. of Issues
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Issue Size (₹ {sizeUnit})
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Count
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Size
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {filteredData?.map((row, index) => {
                        const countGrowth =
                            enableCompare && row.compareIssueCount > 0
                                ? ((row.primaryIssueCount - row.compareIssueCount) /
                                    row.compareIssueCount) *
                                100
                                : 0;

                        const sizeGrowth =
                            enableCompare && row.compareIssueSize > 0
                                ? ((row.primaryIssueSize - row.compareIssueSize) /
                                    row.compareIssueSize) *
                                100
                                : 0;

                        return (
                            <tr
                                key={row.monthNumber}
                                className={`border-b border-gray-100 dark:border-gray-800 ${index % 2 === 0
                                    ? 'bg-white dark:bg-[#1a1a2e]'
                                    : 'bg-gray-50/50 dark:bg-[#151528]'
                                    }`}
                            >
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-200 font-medium">
                                    {row.monthName}
                                </td>

                                {/* Primary: No. of Issues — Clickable & Blue */}
                                <td className="py-3 px-4 text-center">
                                    <span
                                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                        onClick={() => handleClick(row, 'primary')}
                                    >
                                        {formatNumber(row.primaryIssueCount)}
                                    </span>
                                </td>

                                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                    {formatNumber(row.primaryIssueSize)}
                                </td>

                                {enableCompare && (
                                    <>
                                        {/* Compare: No. of Issues — Clickable & Blue */}
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                                onClick={() => handleClick(row, 'compare')}
                                            >
                                                {formatNumber(row.compareIssueCount)}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                            {formatNumber(row.compareIssueSize)}
                                        </td>
                                        <td
                                            className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                                countGrowth
                                            )}`}
                                        >
                                            {countGrowth > 0 ? '+' : ''}
                                            {countGrowth.toFixed(1)}%
                                        </td>
                                        <td
                                            className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                                sizeGrowth
                                            )}`}
                                        >
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
                    <tr className="bg-gray-100 dark:bg-[#121220] border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-200">
                            Total
                        </td>

                        {/* Total: Primary Issue Count — Clickable & Blue */}
                        <td className="py-3 px-4 text-center">
                            <span
                                className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                onClick={() => handleClick(null, 'primary', true)}
                            >
                                {formatNumber(
                                    filteredData.reduce((sum, r) => sum + r.primaryIssueCount, 0)
                                )}
                            </span>
                        </td>

                        <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                            {formatNumber(
                                filteredData.reduce((sum, r) => sum + r.primaryIssueSize, 0)
                            )}
                        </td>

                        {enableCompare && (
                            <>
                                {/* Total: Compare Issue Count — Clickable & Blue */}
                                <td className="py-3 px-4 text-center">
                                    <span
                                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                        onClick={() => handleClick(null, 'compare', true)}
                                    >
                                        {formatNumber(
                                            filteredData.reduce((sum, r) => sum + r.compareIssueCount, 0)
                                        )}
                                    </span>
                                </td>

                                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                    {formatNumber(
                                        filteredData.reduce((sum, r) => sum + r.compareIssueSize, 0)
                                    )}
                                </td>
                                <td
                                    className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                        totalCountGrowth
                                    )}`}
                                >
                                    {totalCountGrowth > 0 ? '+' : ''}
                                    {totalCountGrowth.toFixed(1)}%
                                </td>
                                <td
                                    className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                        totalSizeGrowth
                                    )}`}
                                >
                                    {totalSizeGrowth > 0 ? '+' : ''}
                                    {totalSizeGrowth.toFixed(1)}%
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
    primaryStartDate,
    compareStartDate,
}: {
    data: QuarterlyData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
    primaryStartDate: string;
    compareStartDate: string;
}) {

    const router = useRouter();
    if (isLoading) {
        return <TableSkeleton rows={6} />;
    }

    const filteredData = data.filter((row) => {
        const primaryHasData =
            row.primaryIssueCount !== 0 || row.primaryIssueSize !== 0;

        const compareHasData =
            row.compareIssueCount !== 0 || row.compareIssueSize !== 0;

        return enableCompare
            ? primaryHasData || compareHasData
            : primaryHasData;
    });

    const primaryTotalCount = filteredData.reduce(
        (sum, r) => sum + r.primaryIssueCount,
        0
    );

    const compareTotalCount = filteredData.reduce(
        (sum, r) => sum + r.compareIssueCount,
        0
    );

    const primaryTotalSize = filteredData.reduce(
        (sum, r) => sum + r.primaryIssueSize,
        0
    );

    const compareTotalSize = filteredData.reduce(
        (sum, r) => sum + r.compareIssueSize,
        0
    );

    const totalCountGrowth =
        compareTotalCount > 0
            ? ((primaryTotalCount - compareTotalCount) /
                compareTotalCount) *
            100
            : 0;

    const totalSizeGrowth =
        compareTotalSize > 0
            ? ((primaryTotalSize - compareTotalSize) /
                compareTotalSize) *
            100
            : 0;

    const handleClick = (
        row: QuarterlyData | null,
        type: 'primary' | 'compare',
        isTotal = false
    ) => {
        const period = isTotal
            ? 'FY'
            : row!.quarter.toLowerCase();

        const fy =
            type === 'primary'
                ? getFYRange(primaryStartDate)
                : getFYRange(compareStartDate);

        router.push(
            `/arrangers/list?period=${encodeURIComponent(period)}&fy=${fy}`
        );
    };

    const colCount = enableCompare ? 7 : 3;

    return (
        <div className="overflow-x-auto rounded-[12px] border border-gray-200 dark:border-gray-600">
            <table className="w-full text-[10px]">
                <thead>
                    {/* Row 1: Time Period */}
                    <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                        <th
                            colSpan={colCount}
                            className="text-left py-2 px-4 text-[10px] font-medium uppercase tracking-wide"
                        >
                            {enableCompare
                                ? `${primaryLabel} vs ${compareLabel}`
                                : primaryLabel}
                        </th>
                    </tr>

                    {/* Row 2: Year group labels (only when comparing) */}
                    {enableCompare && (
                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                            <th
                                rowSpan={2}
                                className="text-left py-3 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                Quarter
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                {primaryLabel}
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold border-r border-white/20"
                            >
                                {compareLabel}
                            </th>
                            <th
                                colSpan={2}
                                className="text-center py-2 px-4 text-[10px] font-semibold"
                            >
                                Growth %
                            </th>
                        </tr>
                    )}

                    {/* Row 2/3: Field names */}
                    <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                        {!enableCompare && (
                            <th className="text-left py-3 px-4 text-[10px] font-semibold">
                                Quarter
                            </th>
                        )}
                        <th className="text-center py-3 px-4 text-[10px] font-semibold">
                            No. of Issues
                        </th>
                        <th className="text-center py-3 px-4 text-[10px] font-semibold">
                            Issue Size (₹ {sizeUnit})
                        </th>
                        {enableCompare && (
                            <>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    No. of Issues
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Issue Size (₹ {sizeUnit})
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Count
                                </th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold">
                                    Size
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {filteredData?.map((row, index) => {
                        const countGrowth =
                            enableCompare && row.compareIssueCount > 0
                                ? ((row.primaryIssueCount - row.compareIssueCount) /
                                    row.compareIssueCount) *
                                100
                                : 0;

                        const sizeGrowth =
                            enableCompare && row.compareIssueSize > 0
                                ? ((row.primaryIssueSize - row.compareIssueSize) /
                                    row.compareIssueSize) *
                                100
                                : 0;

                        return (
                            <tr
                                key={row.quarter}
                                className={`border-b border-gray-100 dark:border-gray-800 ${index % 2 === 0
                                    ? 'bg-white dark:bg-[#1a1a2e]'
                                    : 'bg-gray-50/50 dark:bg-[#151528]'
                                    }`}
                            >
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-200 font-medium">
                                    {row.quarter}
                                </td>

                                {/* Primary: No. of Issues — Clickable & Blue */}
                                <td className="py-3 px-4 text-center">
                                    <span
                                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                        onClick={() => handleClick(row, 'primary')}
                                    >
                                        {formatNumber(row.primaryIssueCount)}
                                    </span>
                                </td>

                                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                    {formatNumber(row.primaryIssueSize)}
                                </td>

                                {enableCompare && (
                                    <>
                                        {/* Compare: No. of Issues — Clickable & Blue */}
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                                onClick={() => handleClick(row, 'compare')}
                                            >
                                                {formatNumber(row.compareIssueCount)}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                            {formatNumber(row.compareIssueSize)}
                                        </td>
                                        <td
                                            className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                                countGrowth
                                            )}`}
                                        >
                                            {countGrowth > 0 ? '+' : ''}
                                            {countGrowth.toFixed(1)}%
                                        </td>
                                        <td
                                            className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                                sizeGrowth
                                            )}`}
                                        >
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
                    <tr className="bg-gray-100 dark:bg-[#121220] border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-200">
                            Total
                        </td>

                        {/* Total: Primary Issue Count — Clickable & Blue */}
                        <td className="py-3 px-4 text-center">
                            <span
                                className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                onClick={() => handleClick(null, 'primary', true)}
                            >
                                {formatNumber(
                                    filteredData.reduce((sum, r) => sum + r.primaryIssueCount, 0)
                                )}
                            </span>
                        </td>

                        <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                            {formatNumber(
                                filteredData.reduce((sum, r) => sum + r.primaryIssueSize, 0)
                            )}
                        </td>

                        {enableCompare && (
                            <>
                                {/* Total: Compare Issue Count — Clickable & Blue */}
                                <td className="py-3 px-4 text-center">
                                    <span
                                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                                        onClick={() => handleClick(null, 'compare', true)}
                                    >
                                        {formatNumber(
                                            filteredData.reduce((sum, r) => sum + r.compareIssueCount, 0)
                                        )}
                                    </span>
                                </td>

                                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-200">
                                    {formatNumber(
                                        filteredData.reduce((sum, r) => sum + r.compareIssueSize, 0)
                                    )}
                                </td>
                                <td
                                    className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                        totalCountGrowth
                                    )}`}
                                >
                                    {totalCountGrowth > 0 ? '+' : ''}
                                    {totalCountGrowth.toFixed(1)}%
                                </td>

                                <td
                                    className={`py-3 px-4 text-center font-semibold ${getGrowthColor(
                                        totalSizeGrowth
                                    )}`}
                                >
                                    {totalSizeGrowth > 0 ? '+' : ''}
                                    {totalSizeGrowth.toFixed(1)}%
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

export default function ArrangerMonthWiseSummary() {
    const [isLoading, setIsLoading] = useState(false);
    const [enableCompare, setEnableCompare] = useState(false);
    const [sizeUnit, setSizeUnit] = useState<SizeUnit>('Crores');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

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

    const fetchFilterOptions = useCallback(async () => {
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
    }, [primaryFilters.startDate, primaryFilters.endDate]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // ─────────────────────────────────────────────────────────
    // FETCH PRIMARY DATA
    // ─────────────────────────────────────────────────────────

    const fetchPrimaryData = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await fetchArrangerMonthlySummaryData(primaryFilters);

            console.log('primary data', res?.data);

            setPrimaryData(filterZeroData(res?.data || []));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [primaryFilters]);

    useEffect(() => {
        fetchPrimaryData();
    }, [fetchPrimaryData]);

    // ─────────────────────────────────────────────────────────
    // FETCH COMPARE DATA
    // ─────────────────────────────────────────────────────────

    const fetchCompareData = useCallback(async () => {
        try {
            const res = await fetchArrangerMonthlySummaryData(compareFilters);

            console.log('compare data', res?.data);

            setCompareData(filterZeroData(res?.data || []));
        } catch (error) {
            console.error(error);
        }
    }, [compareFilters]);

    useEffect(() => {
        if (enableCompare) {
            fetchCompareData();
        }
    }, [compareFilters, enableCompare, fetchCompareData]);

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

    console.log('comparisonData',comparisonData);
    

    const quarterlyData = useMemo(() => {
        return getQuarterlyData(comparisonData);
    }, [comparisonData]);

    console.log('quarterlyData',quarterlyData);

    // ─────────────────────────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────────────────────────

    const primaryTotalCount = useMemo(() => {
        return comparisonData.reduce(
            (sum, r) => sum + r.primaryIssueCount,
            0,
        );
    }, [comparisonData]);

    const compareTotalCount = useMemo(() => {
        return comparisonData.reduce(
            (sum, r) => sum + r.compareIssueCount,
            0,
        );
    }, [comparisonData]);

    const primaryTotalSize = useMemo(() => {
        return comparisonData.reduce(
            (sum, r) => sum + r.primaryIssueSize,
            0,
        );
    }, [comparisonData]);

    const compareTotalSize = useMemo(() => {
        return comparisonData.reduce(
            (sum, r) => sum + r.compareIssueSize,
            0,
        );
    }, [comparisonData]);

    const totalCountGrowth = useMemo(() => {
        return compareTotalCount > 0
            ? ((primaryTotalCount - compareTotalCount) /
                compareTotalCount) *
            100
            : 0;
    }, [comparisonData]);

    const totalSizeGrowth = useMemo(() => {
        return compareTotalSize > 0
            ? ((primaryTotalSize - compareTotalSize) /
                compareTotalSize) *
            100
            : 0;
    }, [comparisonData]);

    // ─────────────────────────────────────────────────────────
    // ACTIVE FILTER CHIPS LOGIC
    // ─────────────────────────────────────────────────────────

    const activeFilterCount = useMemo(() => {
        return Object.entries(primaryFilters).filter(([key, value]) => {
            if (['startDate', 'endDate', 'dealSize'].includes(key)) return false;
            return value !== '';
        }).length;
    }, [primaryFilters]);

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof ApiFilters; label: string }[] = [];
        const labelMap: Record<string, string> = {
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
        (Object.keys(primaryFilters) as Array<keyof ApiFilters>).forEach((key) => {
            const value = primaryFilters[key];
            if (value && !['startDate', 'endDate', 'dealSize'].includes(key as string)) {
                chips.push({ key, label: `${labelMap[key as string]}: ${value}` });
            }
        });
        return chips;
    }, [primaryFilters]);

    // ─────────────────────────────────────────────────────────
    // TOOLTIP COMPONENT (unit-aware)
    // ─────────────────────────────────────────────────────────

    const CustomTooltipComponent = useMemo(() => {
        return function TooltipComponent({ active, payload, label }: any) {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-[12px] shadow-lg p-3 text-[9px]">
                        <p className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{label}</p>

                        {payload.map((item: any, index: number) => (
                            <p
                                key={index}
                                style={{ color: item.color }}
                                className="mb-1 text-gray-700 dark:text-gray-200"
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

    const handleSearch = () => {
        setIsFiltersExpanded(false);
    };

    const clearAllPrimaryDropdowns = () => {
        setPrimaryFilters((prev) => ({
            ...DEFAULT_FILTERS,
            startDate: prev.startDate,
            endDate: prev.endDate,
        }));
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
            enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem"
        >
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-700 dark:text-gray-200">

                {/* HEADER */}

                {/* ── Page Title ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Arrangers Monthly Summary</h1>
                    <p className="text-[9px] text-gray-400 mb-6 mt-1">Arrangers &gt; Monthly Summary</p>
                </div>

                {/* FILTERS */}

                <SectionCard className=" overflow-hidden">
                    {/* ── Collapsible Header ── */}
                    <button
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
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
                                {activeFilterCount > 0 && (
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                        {activeFilterCount} active
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isFiltersExpanded && activeFilterChips.length > 0 && (
                                <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-md">
                                    {activeFilterChips.slice(0, 3).map((chip) => (
                                        <ActiveFilterChip
                                            key={chip.key}
                                            label={chip.label}
                                            onRemove={() =>
                                                setPrimaryFilters((prev) => ({
                                                    ...prev,
                                                    [chip.key]: '',
                                                }))
                                            }
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

                    {/* ── Expanded Filter Content ── */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-8">

                            {/* PRIMARY FILTERS */}

                            <div>
                                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                    <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                                        Primary Filters
                                    </h2>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[9px] text-gray-400 block mb-1">
                                                Size Unit
                                            </label>
                                            <select
                                                value={sizeUnit}
                                                onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                                                className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                                            >
                                                <option value="Crores">Crores</option>
                                                <option value="Lakhs">Lakhs</option>
                                                <option value="Billions">Billions</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={handleResetFilters}
                                            className="cursor-pointer px-4 py-1.5 rounded-[12px] text-[9px] font-medium bg-white dark:bg-[#13131f] border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-100 dark:hover:bg-[#1b1b2d]"
                                        >
                                            Reset Filters
                                        </button>

                                        <button
                                            onClick={() =>
                                                setEnableCompare(
                                                    !enableCompare,
                                                )
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

                                    {/* FINANCIAL YEAR */}

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-gray-400 block mb-1">
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
                                            className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
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
                                                        className="text-gray-700 dark:text-gray-200"
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
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-8">

                                    <h2 className="text-sm font-semibold mb-5 text-gray-700 dark:text-gray-200">
                                        Compare Filters
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] text-gray-400 block mb-1">
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
                                                className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
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
                                                            className="text-gray-700 dark:text-gray-200"
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

                            {/* Active Filter Chips */}
                            {activeFilterChips.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Active:
                                    </span>
                                    {activeFilterChips.map((chip) => (
                                        <ActiveFilterChip
                                            key={chip.key}
                                            label={chip.label}
                                            onRemove={() =>
                                                setPrimaryFilters((prev) => ({
                                                    ...prev,
                                                    [chip.key]: '',
                                                }))
                                            }
                                        />
                                    ))}
                                    <button
                                        onClick={clearAllPrimaryDropdowns}
                                        className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-8 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    Search
                                </button>

                                <button
                                    onClick={handleResetFilters}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg px-5 h-8 text-xs font-medium transition-colors duration-150"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* SUMMARY */}

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${enableCompare ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>

                    {/* Total Issue Count */}
                    <SectionCard className="my-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#423CAB]/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-[#423CAB]/10" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                    Total Issue Count
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-[#423CAB]">
                                            {primaryTotalCount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            {primaryYearLabel}
                                        </span>
                                    </div>
                                    {enableCompare && (
                                        <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-xl font-bold text-[#06B6D4]">
                                                {compareTotalCount.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                {compareYearLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#423CAB]/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#423CAB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Total Issue Size */}
                    <SectionCard className="my-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-emerald-500/10" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                    Total Issue Size
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{formatNumber(primaryTotalSize)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            {sizeUnit}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block">
                                        {primaryYearLabel}
                                    </span>
                                    {enableCompare && (
                                        <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-[#06B6D4]">
                                                    ₹{formatNumber(compareTotalSize)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                    {sizeUnit}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block">
                                                {compareYearLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Avg Monthly Issue Size */}
                    <SectionCard className="my-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-amber-500/10" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                    Avg Monthly Issue Size
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                            ₹{displayPrimaryData.length > 0 ? formatNumber(primaryTotalSize / displayPrimaryData.length) : formatNumber(0)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            {sizeUnit}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block">
                                        {primaryYearLabel}
                                    </span>
                                    {enableCompare && (
                                        <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-[#06B6D4]">
                                                    ₹{displayPrimaryData.length > 0 ? formatNumber(compareTotalSize / displayPrimaryData.length) : formatNumber(0)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                    {sizeUnit}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block">
                                                {compareYearLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Compare Growth (only when comparing) */}
                    {enableCompare && (
                        <SectionCard className="my-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-violet-500/10" />
                            <div className="flex items-start justify-between">
                                <div className="w-full">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                        YoY Growth
                                    </p>
                                    <div className="space-y-3">
                                        {/* Count Growth */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalCountGrowth >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                    <svg className={`w-4 h-4 ${totalCountGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalCountGrowth >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                                                    </svg>
                                                </div>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Issue Count</span>
                                            </div>
                                            <span className={`text-lg font-bold ${totalCountGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {totalCountGrowth > 0 ? '+' : ''}{totalCountGrowth.toFixed(1)}%
                                            </span>
                                        </div>
                                        {/* Size Growth */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalSizeGrowth >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                    <svg className={`w-4 h-4 ${totalSizeGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalSizeGrowth >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                                                    </svg>
                                                </div>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Issue Size</span>
                                            </div>
                                            <span className={`text-lg font-bold ${totalSizeGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {totalSizeGrowth > 0 ? '+' : ''}{totalSizeGrowth.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                </div>

                {/* CHARTS */}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

                    {/* AREA CHART */}

                    <SectionCard className='my-3'>
                        <h2 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200">
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

                    <SectionCard className='my-3'>
                        <h2 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200">
                            Quarterly Summary (₹ {sizeUnit})
                        </h2>

                        {isLoading ? (
                            <ChartSkeleton />
                        ) : quarterlyData.length > 0 ? (
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
                        ) : (
                            <NoDataState message="No quarterly data available" />
                        )}
                    </SectionCard>
                </div>

                {/* MONTH-WISE TABLE */}

                <SectionCard className="!p-0 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Month-Wise Data (Rupees in {sizeUnit})
                        </h2>
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] text-gray-400 block mb-1">
                                Value Convention
                            </label>
                            <select
                                value={sizeUnit}
                                onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                                className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                            >
                                <option value="Crores">Crores</option>
                                <option value="Lakhs">Lakhs</option>
                                <option value="Billions">Billions</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-5 pt-0">
                        <MonthWiseTable
                            data={comparisonData}
                            enableCompare={enableCompare}
                            primaryLabel={primaryYearLabel}
                            compareLabel={compareYearLabel}
                            isLoading={isLoading}
                            sizeUnit={sizeUnit}
                            primaryStartDate={primaryFilters.startDate}
                            compareStartDate={compareFilters.startDate}
                        />
                    </div>
                </SectionCard>

                {/* QUARTER-WISE TABLE */}

                <SectionCard className="!p-0 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Quarter-Wise Data (Rupees in {sizeUnit})
                        </h2>
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] text-gray-400 block mb-1">
                                Value Convention
                            </label>
                            <select
                                value={sizeUnit}
                                onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                                className="h-6 border border-gray-200 dark:border-gray-600 rounded-[12px] bg-white dark:bg-[#1a1a2e] px-3 py-1.5 text-[9px] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]"
                            >
                                <option value="Crores">Crores</option>
                                <option value="Lakhs">Lakhs</option>
                                <option value="Billions">Billions</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-5 pt-0">
                        <QuarterWiseTable
                            data={quarterlyData}
                            enableCompare={enableCompare}
                            primaryLabel={primaryYearLabel}
                            compareLabel={compareYearLabel}
                            isLoading={isLoading}
                            sizeUnit={sizeUnit}
                            primaryStartDate={primaryFilters.startDate}
                            compareStartDate={compareFilters.startDate}
                        />
                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}