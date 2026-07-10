import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";

interface ChartData {
    monthNumber: number;
    monthName: string;
    primaryIssueCount: number;
    compareIssueCount: number;
    primaryIssueSize: number;
    compareIssueSize: number;
}

export interface SummaryFilterState {
    ownershipType: string[];
    sector: string[];
    nature: string[];
    securityType: string[];
    creditRatingAgency: string[];
    modeOfIssue: string[];
    seniority: string[];
    listingStatus: string[];
    securedFlag: string[];
    rating: string[];
}

type SizeUnit = 'Crores' | 'Lakhs' | 'Billions';

function TableSkeleton({ rows = 12 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} height={40} />
            ))}
        </div>
    );
}

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

function formatNumber(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getGrowthColor(value: number): string {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-red-500 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
}

/**
 * Build query string from filters using URLSearchParams.append()
 * for multiple values per key support.
 */
function buildFilterQueryString(
    filters: SummaryFilterState,
    month?: number | null
): string {
    const params = new URLSearchParams();

    // Month filter (for monthly drill-down)
    if (month !== null && month !== undefined) {
        params.append('month', String(month));
    }

    // Filter mappings: frontend key -> API param key
    const filterMappings: { key: keyof SummaryFilterState; paramKey: string }[] = [
        { key: 'ownershipType', paramKey: 'ownershipType' },
        { key: 'sector', paramKey: 'sector' },
        { key: 'nature', paramKey: 'nature' },
        { key: 'securityType', paramKey: 'securityType' },
        { key: 'creditRatingAgency', paramKey: 'creditRatingAgency' },
        { key: 'modeOfIssue', paramKey: 'modeOfIssue' },
        { key: 'seniority', paramKey: 'seniority' },
        { key: 'listingStatus', paramKey: 'listingStatus' },
        { key: 'securedFlag', paramKey: 'securedFlag' },
        { key: 'rating', paramKey: 'rating' },
    ];

    filterMappings.forEach(({ key, paramKey }) => {
        const values = filters[key];
        if (values && values.length > 0) {
            values.forEach((val) => {
                params.append(paramKey, val);
            });
        }
    });

    return params.toString();
}


function getMonthNumber(monthName: string): number | null {
    const map: Record<string, number> = {
        january: 1, february: 2, march: 3, april: 4,
        may: 5, june: 6, july: 7, august: 8,
        september: 9, october: 10, november: 11, december: 12,
        jan: 1, feb: 2, mar: 3, apr: 4,
        jun: 6, jul: 7, aug: 8,
        sep: 9, oct: 10, nov: 11, dec: 12,
    };
    return map[monthName.toLowerCase().trim()] ?? null;
}

function getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function parseFY(fy: string): { startYear: number; endYear: number } | null {
    const parts = fy.split('-');
    if (parts.length !== 2) return null;
    const startYear = parseInt(parts[0], 10);
    const endYear = parseInt(parts[1], 10);
    if (isNaN(startYear) || isNaN(endYear)) return null;
    return { startYear, endYear };
}

function getDateRange(
    period: string,
    fy: string
): { startDate: string; endDate: string } | null {
    const fyData = parseFY(fy);
    if (!fyData) return null;

    const { startYear, endYear } = fyData;
    const p = period.toLowerCase().trim();

    let startDate: string;
    let endDate: string;

    // ---------- Full Financial Year ----------
    if (p === 'fy') {
        startDate = `${startYear}-04-01`;
        endDate = `${endYear}-03-31`;
    }

    // ---------- Quarters ----------
    else if (p === 'q1') {
        startDate = `${startYear}-04-01`;
        endDate = `${startYear}-06-30`;
    }
    else if (p === 'q2') {
        startDate = `${startYear}-07-01`;
        endDate = `${startYear}-09-30`;
    }
    else if (p === 'q3') {
        startDate = `${startYear}-10-01`;
        endDate = `${startYear}-12-31`;
    }
    else if (p === 'q4') {
        startDate = `${endYear}-01-01`;
        endDate = `${endYear}-03-31`;
    }

    // ---------- Month ----------
    else {
        const monthNum = getMonthNumber(p);

        if (monthNum === null) return null;

        const year =
            monthNum >= 4 && monthNum <= 12
                ? startYear
                : endYear;

        const lastDay = getLastDayOfMonth(year, monthNum);

        const mm = monthNum.toString().padStart(2, '0');

        startDate = `${year}-${mm}-01`;
        endDate = `${year}-${mm}-${lastDay}`;
    }

    // ---------- Clamp End Date To Today ----------
    const today = new Date();

    const todayStr =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, '0')}-${String(
            today.getDate()
        ).padStart(2, '0')}`;

    if (endDate > todayStr) {
        endDate = todayStr;
    }

    return {
        startDate,
        endDate,
    };
}

export default function MonthWiseTable({
    data,
    enableCompare,
    primaryLabel,
    compareLabel,
    isLoading,
    sizeUnit,
    primaryStartDate,
    compareStartDate,
    primaryFilters,
    compareFilters,
    tableName = 'issuers'
}: {
    data: ChartData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
    primaryStartDate: string;
    compareStartDate: string;
    primaryFilters: SummaryFilterState;
    compareFilters: SummaryFilterState;
    tableName: string;
}) {

    const router = useRouter();
    if (isLoading) {
        return <TableSkeleton rows={12} />;
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
        row: ChartData | null,
        type: 'primary' | 'compare',
        isTotal = false
    ) => {
        const period = isTotal
            ? 'FY'
            : getFullMonthName(row!.monthNumber);

        const primaryFY = getFYRange(primaryStartDate);
        const compareFY = getFYRange(compareStartDate);

        const month = isTotal ? null : row!.monthNumber;

        const filters = type === 'primary' ? primaryFilters : compareFilters;

        // Build query string with filters appended as multiple values per key
        const filterQuery = buildFilterQueryString(filters, month);

        let dateRange;

        if (type === 'primary') {
            dateRange = getDateRange(period, primaryFY);
        } else if (enableCompare) {
            // When comparing, ensure compare has the same duration as primary
            // by using primary's month/day with compare's year
            const primaryDateRange = getDateRange(period, primaryFY);
            const compareDateRange = getDateRange(period, compareFY);

            if (primaryDateRange && compareDateRange) {
                const [pYear, pMonth, pDay] = primaryDateRange.endDate.split('-').map(Number);
                const pStartYear = parseInt(primaryStartDate.split('-')[0], 10);
                const cStartYear = parseInt(compareStartDate.split('-')[0], 10);
                const yearDiff = pStartYear - cStartYear;

                let compareEndYear = pYear - yearDiff;
                let compareEndMonth = pMonth;
                let compareEndDay = pDay;

                // Handle leap year edge case (e.g., Feb 29 in non-leap year)
                const testDate = new Date(compareEndYear, compareEndMonth - 1, compareEndDay);
                if (testDate.getMonth() !== compareEndMonth - 1) {
                    compareEndDay = new Date(compareEndYear, compareEndMonth, 0).getDate();
                }

                dateRange = {
                    startDate: compareDateRange.startDate,
                    endDate: `${compareEndYear}-${String(compareEndMonth).padStart(2, '0')}-${String(compareEndDay).padStart(2, '0')}`,
                };
            } else {
                dateRange = compareDateRange;
            }
        } else {
            dateRange = getDateRange(period, compareFY);
        }

        router.push(
            `/${tableName}/list?startDate=${encodeURIComponent(dateRange?.startDate || '')}&endDate=${encodeURIComponent(dateRange?.endDate || '')}&${filterQuery}`
        );
    };

    const colCount = enableCompare ? 7 : 3;

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
                                key={row.monthName}
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