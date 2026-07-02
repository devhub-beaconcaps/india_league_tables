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

type SizeUnit = 'Crores' | 'Lakhs' | 'Billions';

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

export default function MonthWiseTable({
    data,
    enableCompare,
    primaryLabel,
    compareLabel,
    isLoading,
    sizeUnit,
    primaryStartDate,
    compareStartDate,
    tableName='issuers'
}: {
    data: ChartData[];
    enableCompare: boolean;
    primaryLabel: string;
    compareLabel: string;
    isLoading: boolean;
    sizeUnit: SizeUnit;
    primaryStartDate: string;
    compareStartDate: string;
    tableName:string;
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
            `/${tableName}/list?period=${encodeURIComponent(period)}&fy=${fy}`
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