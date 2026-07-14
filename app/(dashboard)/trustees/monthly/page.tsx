'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SummaryDiagonalCard } from '@/components/SummaryDiagonalCard';
import MonthWiseTable from '@/components/MonthWiseTable';
import QuarterWiseTable from '@/components/QuarterWiseTable';
import CustomDropdown from '@/components/CustomDropdown';

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

interface SummaryFilterState {
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

// ─────────────────────────────────────────────────────────────
// FINANCIAL YEAR OPTIONS (DYNAMIC)
// ─────────────────────────────────────────────────────────────

function generateFinancialYearOptions(count: number = 3) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentFYStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    const today = now.toISOString().split('T')[0];
    const options = [];

    for (let i = 0; i < count; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;
        const fyEndDate = `${endYear}-03-31`;

        options.push({
            label: `FY-${startYear}-${endYear}`,
            startDate: `${startYear}-04-01`,
            endDate: fyEndDate > today ? today : fyEndDate,
        });
    }

    return options;
}

const FINANCIAL_YEAR_OPTIONS = generateFinancialYearOptions(5);

const fyDropdownOptions = FINANCIAL_YEAR_OPTIONS.map(item => ({
    value: item.label,
    label: item.label,
}));

// ─────────────────────────────────────────────────────────────
// DEFAULT FILTERS
// ─────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: SummaryFilterState = {
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

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 px-5 py-3 ${className}`}>
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

function NoDataState({ message = 'No data available' }: { message?: string }) {
    return (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1a1a2e]">
            <p className="text-[9px] text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}

function FilterGroup({
    label,
    children,
    className = ''
}: {
    label: string;
    children: React.ReactNode;
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {label}
            </label>
            {children}
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

function DownloadPngButton({ onClick, label = 'Download PNG' }: { onClick: () => void; label?: string }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center cursor-pointer gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 h-7 text-[10px] font-medium transition-colors"
            title={label}
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
        1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
        7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
    };
    return months[monthNo] || '';
}

function getFinancialYearLabel(startDate: string, endDate: string) {
    const year = FINANCIAL_YEAR_OPTIONS.find(
        (item) => item.startDate === startDate && item.endDate === endDate,
    );
    return year?.label || 'Custom FY';
}

function formatSameMonthDayInYear(date: string, year: number) {
    const [, month, day] = date.split('-');
    const parsedMonth = parseInt(month, 10);
    const parsedDay = parseInt(day, 10);
    const targetDate = new Date(year, parsedMonth - 1, parsedDay);

    if (
        targetDate.getFullYear() !== year ||
        targetDate.getMonth() + 1 !== parsedMonth ||
        targetDate.getDate() !== parsedDay
    ) {
        const maxDay = new Date(year, parsedMonth, 0).getDate();
        return `${year}-${String(parsedMonth).padStart(2, '0')}-${String(Math.min(parsedDay, maxDay)).padStart(2, '0')}`;
    }

    return `${year}-${month}-${day}`;
}

function getCompareEndDate(compareStartDate: string, primaryEndDate: string) {
    const compareYear = new Date(compareStartDate).getFullYear();
    return formatSameMonthDayInYear(primaryEndDate, compareYear);
}

function getComparisonData(primaryData: MonthlyApiData[], compareData: MonthlyApiData[]): ChartData[] {
    return primaryData?.map((item) => {
        const compareMonth = compareData?.find(
            (compare) => compare.issueMonthNo === item.issueMonthNo,
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

function getQuarterlyData(monthlyData: ChartData[]): QuarterlyData[] {
    const quarters = [
        { label: 'Q1', months: [4, 5, 6] },
        { label: 'Q2', months: [7, 8, 9] },
        { label: 'Q3', months: [10, 11, 12] },
        { label: 'Q4', months: [1, 2, 3] },
    ];

    return quarters
        .map((quarter) => {
            const quarterMonths = monthlyData.filter((month) =>
                quarter.months.includes(Number(month.monthNumber)),
            );
            return {
                quarter: quarter.label,
                primaryIssueCount: quarterMonths.reduce((sum, item) => sum + item.primaryIssueCount, 0),
                compareIssueCount: quarterMonths.reduce((sum, item) => sum + item.compareIssueCount, 0),
                primaryIssueSize: quarterMonths.reduce((sum, item) => sum + item.primaryIssueSize, 0),
                compareIssueSize: quarterMonths.reduce((sum, item) => sum + item.compareIssueSize, 0),
            };
        })
        .filter((q) => q.primaryIssueCount > 0 || q.primaryIssueSize > 0 || q.compareIssueCount > 0 || q.compareIssueSize > 0);
}

function formatNumber(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
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

function formatNumberToFourChar(num: number) {
    if (num >= 1000) {
        if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'm';
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'b';
    }
    return Math.round(num).toString();
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function TrusteesMonthWiseSummary() {
    const [isLoading, setIsLoading] = useState(false);
    const [enableCompare, setEnableCompare] = useState(false);
    const [sizeUnit, setSizeUnit] = useState<SizeUnit>('Crores');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    // ── Chart Refs for PNG Download ──
    const areaChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        ownershipType: [], sector: [], nature: [], securityType: [],
        creditRatingAgency: [], modeOfIssue: [], seniority: [],
        listingStatus: [], securedFlag: [], creditRating: [],
    });

    // ─────────────────────────────────────────────────────────
    // PRIMARY FILTERS
    // ─────────────────────────────────────────────────────────

    const [primaryFilters, setPrimaryFilters] = useState<SummaryFilterState>(DEFAULT_FILTERS);

    const [primaryStartDate, setPrimaryStartDate] = useState<string>(FINANCIAL_YEAR_OPTIONS[0].startDate);
    const [primaryEndDate, setPrimaryEndDate] = useState<string>(FINANCIAL_YEAR_OPTIONS[0].endDate);

    // ─────────────────────────────────────────────────────────
    // COMPARE FILTERS (defaults to previous FY)
    // ─────────────────────────────────────────────────────────

    const [compareFilters, setCompareFilters] = useState<SummaryFilterState>(DEFAULT_FILTERS);

    const [compareStartDate, setCompareStartDate] = useState<string>(FINANCIAL_YEAR_OPTIONS[1].startDate);
    const [compareEndDate, setCompareEndDate] = useState<string>(FINANCIAL_YEAR_OPTIONS[1].endDate);

    const [primaryData, setPrimaryData] = useState<MonthlyApiData[]>([]);
    const [compareData, setCompareData] = useState<MonthlyApiData[]>([]);

    const displayPrimaryData = useMemo(() => convertApiData(primaryData, sizeUnit), [primaryData, sizeUnit]);
    const displayCompareData = useMemo(() => convertApiData(compareData, sizeUnit), [compareData, sizeUnit]);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const query = { startDate: primaryStartDate, endDate: primaryEndDate };
            const res = await fetchIssueDetailsFilterInputsData(query);
            console.log('filters data', res);
            setFilterOptions(res);
        } catch (error) { console.error(error); }
    }, [primaryStartDate, primaryEndDate]);

    useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);

    const fetchPrimaryData = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetchTrusteeMonthlySummaryData({
                startDate: primaryStartDate,
                endDate: primaryEndDate,
                ownershipType: primaryFilters.ownershipType,
                sector: primaryFilters.sector,
                nature: primaryFilters.nature,
                securityType: primaryFilters.securityType,
                creditRatingAgency: primaryFilters.creditRatingAgency,
                modeOfIssue: primaryFilters.modeOfIssue,
                seniority: primaryFilters.seniority,
                listingStatus: primaryFilters.listingStatus,
                securedFlag: primaryFilters.securedFlag,
                rating: primaryFilters.rating,
            });
            console.log('primary data', res?.data);
            setPrimaryData(filterZeroData(res?.data || []));
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    }, [primaryStartDate, primaryEndDate, primaryFilters]);

    useEffect(() => { fetchPrimaryData(); }, [fetchPrimaryData]);

    const fetchCompareData = useCallback(async () => {
        try {
            const res = await fetchTrusteeMonthlySummaryData({
                startDate: compareStartDate,
                endDate: compareEndDate,
                ownershipType: compareFilters.ownershipType,
                sector: compareFilters.sector,
                nature: compareFilters.nature,
                securityType: compareFilters.securityType,
                creditRatingAgency: compareFilters.creditRatingAgency,
                modeOfIssue: compareFilters.modeOfIssue,
                seniority: compareFilters.seniority,
                listingStatus: compareFilters.listingStatus,
                securedFlag: compareFilters.securedFlag,
                rating: compareFilters.rating,
            });
            console.log('compare data', res?.data);
            setCompareData(filterZeroData(res?.data || []));
        } catch (error) { console.error(error); }
    }, [compareStartDate, compareEndDate, compareFilters]);

    useEffect(() => {
        if (!enableCompare) return;

        const expectedEndDate = getCompareEndDate(compareStartDate, primaryEndDate);
        if (compareEndDate !== expectedEndDate) return;

        fetchCompareData();
    }, [compareStartDate, compareEndDate, compareFilters, enableCompare, fetchCompareData, primaryEndDate]);

    const primaryChartData = useMemo(() => {
        return displayPrimaryData.map((item) => ({ ...item, monthName: getMonthName(item.issueMonthNo) }));
    }, [displayPrimaryData]);

    const comparisonData = useMemo(() => getComparisonData(displayPrimaryData, displayCompareData), [displayPrimaryData, displayCompareData]);
    const quarterlyData = useMemo(() => getQuarterlyData(comparisonData), [comparisonData]);

    const primaryTotalCount = useMemo(() => comparisonData.reduce((sum, r) => sum + r.primaryIssueCount, 0), [comparisonData]);
    const compareTotalCount = useMemo(() => comparisonData.reduce((sum, r) => sum + r.compareIssueCount, 0), [comparisonData]);
    const primaryTotalSize = useMemo(() => comparisonData.reduce((sum, r) => sum + r.primaryIssueSize, 0), [comparisonData]);
    const compareTotalSize = useMemo(() => comparisonData.reduce((sum, r) => sum + r.compareIssueSize, 0), [comparisonData]);

    const totalCountGrowth = useMemo(() => {
        return compareTotalCount > 0 ? ((primaryTotalCount - compareTotalCount) / compareTotalCount) * 100 : 0;
    }, [primaryTotalCount, compareTotalCount]);

    const totalSizeGrowth = useMemo(() => {
        return compareTotalSize > 0 ? ((primaryTotalSize - compareTotalSize) / compareTotalSize) * 100 : 0;
    }, [primaryTotalSize, compareTotalSize]);

    const avgPrimarySize = displayPrimaryData.length
        ? primaryTotalSize / displayPrimaryData.length
        : 0;

    const avgCompareSize = displayCompareData.length
        ? compareTotalSize / displayCompareData.length
        : 0;

    const primaryYearLabel = getFinancialYearLabel(primaryStartDate, primaryEndDate);
    const compareYearLabel = getFinancialYearLabel(compareStartDate, compareEndDate);

    // ─────────────────────────────────────────────────────────
    // ACTIVE FILTER CHIPS LOGIC
    // ─────────────────────────────────────────────────────────

    const activeFilterCount = useMemo(() => {
        return Object.values(primaryFilters).reduce((acc, arr) => acc + arr.length, 0);
    }, [primaryFilters]);

    const compareActiveFilterCount = useMemo(() => {
        return Object.values(compareFilters).reduce((acc, arr) => acc + arr.length, 0);
    }, [compareFilters]);

    const totalActiveFilterCount = activeFilterCount + compareActiveFilterCount;

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof SummaryFilterState; label: string; index: number; type: 'primary' | 'compare' }[] = [];
        const labelMap: Record<keyof SummaryFilterState, string> = {
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

        (Object.keys(primaryFilters) as Array<keyof SummaryFilterState>).forEach((key) => {
            primaryFilters[key].forEach((val, idx) => {
                chips.push({ key, index: idx, type: 'primary', label: `${labelMap[key]}: ${val}` });
            });
        });

        (Object.keys(compareFilters) as Array<keyof SummaryFilterState>).forEach((key) => {
            compareFilters[key].forEach((val, idx) => {
                chips.push({ key, index: idx, type: 'compare', label: `Compare ${labelMap[key]}: ${val}` });
            });
        });

        return chips;
    }, [primaryFilters, compareFilters]);

    const updateFilter = useCallback((type: 'primary' | 'compare', key: keyof SummaryFilterState, value: string[]) => {
        if (type === 'primary') {
            setPrimaryFilters(prev => ({ ...prev, [key]: value }));
        } else {
            setCompareFilters(prev => ({ ...prev, [key]: value }));
        }
    }, []);

    const toOptions = (items: string[]): { value: string; label: string }[] => {
        return items.map(item => ({ value: item, label: item }));
    };

    // ─────────────────────────────────────────────────────────
    // DOWNLOAD HELPERS
    // ─────────────────────────────────────────────────────────

    const downloadChartAsPng = useCallback(async (chartRef: HTMLElement | null, filename: string) => {
        if (!chartRef) return;
        try {
            const canvas = await html2canvas(chartRef, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error downloading chart:', err);
        }
    }, []);

    const handleExportMonthWiseCSV = useCallback(() => {
        if (!comparisonData.length) return;

        const headers = enableCompare
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

        const rows = comparisonData.map((row) => {
            if (enableCompare) {
                return [
                    row.monthName,
                    String(row.primaryIssueCount),
                    String(row.compareIssueCount),
                    formatNumber(row.primaryIssueSize),
                    formatNumber(row.compareIssueSize),
                ];
            }
            return [
                row.monthName,
                String(row.primaryIssueCount),
                formatNumber(row.primaryIssueSize),
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row.map((cell) => {
                    const str = String(cell);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `month_wise_trustees_${primaryYearLabel}${enableCompare ? `_vs_${compareYearLabel}` : ''}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [comparisonData, enableCompare, primaryYearLabel, compareYearLabel, sizeUnit]);

    const handleExportQuarterWiseCSV = useCallback(() => {
        if (!quarterlyData.length) return;

        const headers = enableCompare
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

        const rows = quarterlyData.map((row) => {
            if (enableCompare) {
                return [
                    row.quarter,
                    String(row.primaryIssueCount),
                    String(row.compareIssueCount),
                    formatNumber(row.primaryIssueSize),
                    formatNumber(row.compareIssueSize),
                ];
            }
            return [
                row.quarter,
                String(row.primaryIssueCount),
                formatNumber(row.primaryIssueSize),
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row.map((cell) => {
                    const str = String(cell);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `quarter_wise_trustees_${primaryYearLabel}${enableCompare ? `_vs_${compareYearLabel}` : ''}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [quarterlyData, enableCompare, primaryYearLabel, compareYearLabel, sizeUnit]);

    const CustomTooltipComponent = useMemo(() => {
        return function TooltipComponent({ active, payload, label }: any) {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-[12px] shadow-lg p-3 text-[9px]">
                        <p className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{label}</p>
                        {payload.map((item: any, index: number) => (
                            <p key={index} style={{ color: item.color }} className="mb-1 text-gray-700 dark:text-gray-200">
                                {item.name}: {formatNumber(item.value)} {sizeUnit}
                            </p>
                        ))}
                    </div>
                );
            }
            return null;
        };
    }, [sizeUnit]);

    const handleFinancialYearChange = (value: string, type: 'primary' | 'compare') => {
        const selectedYear = FINANCIAL_YEAR_OPTIONS.find((item) => item.label === value);
        if (!selectedYear) return;
        if (type === 'primary') {
            setPrimaryStartDate(selectedYear.startDate);
            setPrimaryEndDate(selectedYear.endDate);
        } else {
            setCompareStartDate(selectedYear.startDate);
            setCompareEndDate(enableCompare
                ? getCompareEndDate(selectedYear.startDate, primaryEndDate)
                : selectedYear.endDate);
        }
    };

    useEffect(() => {
        if (!enableCompare) return;

        setCompareEndDate(getCompareEndDate(compareStartDate, primaryEndDate));
    }, [enableCompare, compareStartDate, primaryEndDate]);

    const handleResetFilters = () => {
        setPrimaryFilters(DEFAULT_FILTERS);
        setCompareFilters(DEFAULT_FILTERS);
        setPrimaryStartDate(FINANCIAL_YEAR_OPTIONS[0].startDate);
        setPrimaryEndDate(FINANCIAL_YEAR_OPTIONS[0].endDate);
        setCompareStartDate(FINANCIAL_YEAR_OPTIONS[1].startDate);
        setCompareEndDate(FINANCIAL_YEAR_OPTIONS[1].endDate);
    };

    const handleSearch = () => { setIsFiltersExpanded(false); };

    const clearAllPrimaryDropdowns = () => {
        setPrimaryFilters(DEFAULT_FILTERS);
    };

    const clearAllCompareDropdowns = () => {
        setCompareFilters(DEFAULT_FILTERS);
    };



    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-700 dark:text-gray-200">

                {/* HEADER */}
                <div>
                    <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Trustees Monthly Summary</h1>
                    <p className="text-[9px] text-gray-400 mb-6 mt-1">Trustees &gt; Monthly Summary</p>
                </div>

                {/* FILTERS - COLLAPSIBLE */}
                <SectionCard className="">
                    <button
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        className="w-full flex items-center justify-between px-5 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Filters</span>
                                {totalActiveFilterCount > 0 && (
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                        {totalActiveFilterCount} active
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isFiltersExpanded && activeFilterChips.length > 0 && (
                                <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-md">
                                    {activeFilterChips.slice(0, 3).map((chip) => (
                                        <ActiveFilterChip
                                            key={`${chip.type}-${chip.key}-${chip.index}`}
                                            label={chip.label}
                                            onRemove={() => {
                                                const newValues = chip.type === 'primary'
                                                    ? primaryFilters[chip.key].filter((_, i) => i !== chip.index)
                                                    : compareFilters[chip.key].filter((_, i) => i !== chip.index);
                                                updateFilter(chip.type, chip.key, newValues);
                                            }}
                                        />
                                    ))}
                                    {activeFilterChips.length > 3 && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                            +{activeFilterChips.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                            <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isFiltersExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {isFiltersExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-8">

                                    {/* PRIMARY FILTERS */}
                                    <div>
                                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200">Primary Filters</h2>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] text-gray-400 block mb-1">Size Unit</label>
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
                                                    onClick={() => setEnableCompare(!enableCompare)}
                                                    className={`cursor-pointer px-4 py-1.5 rounded-[12px] text-[9px] font-medium transition-all ${enableCompare
                                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    {enableCompare ? 'Disable Compare' : 'Enable Compare'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                            <FilterGroup label="Financial Year">
                                                <CustomDropdown
                                                    options={fyDropdownOptions}
                                                    value={getFinancialYearLabel(primaryStartDate, primaryEndDate)}
                                                    onChange={(val) => handleFinancialYearChange(String(val[0] || ''), 'primary')}
                                                    placeholder="Select FY"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    multiSelect={false}
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Ownership Type">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.ownershipType)}
                                                    value={primaryFilters.ownershipType}
                                                    onChange={(val) => updateFilter('primary', 'ownershipType', val as string[])}
                                                    placeholder="Select Ownership"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Sector">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.sector)}
                                                    value={primaryFilters.sector}
                                                    onChange={(val) => updateFilter('primary', 'sector', val as string[])}
                                                    placeholder="Select Sector"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Nature">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.nature)}
                                                    value={primaryFilters.nature}
                                                    onChange={(val) => updateFilter('primary', 'nature', val as string[])}
                                                    placeholder="Select Nature"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Security Type">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.securityType)}
                                                    value={primaryFilters.securityType}
                                                    onChange={(val) => updateFilter('primary', 'securityType', val as string[])}
                                                    placeholder="Select Security"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Credit Rating Agency">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.creditRatingAgency)}
                                                    value={primaryFilters.creditRatingAgency}
                                                    onChange={(val) => updateFilter('primary', 'creditRatingAgency', val as string[])}
                                                    placeholder="Select Agency"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Mode Of Issue">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.modeOfIssue)}
                                                    value={primaryFilters.modeOfIssue}
                                                    onChange={(val) => updateFilter('primary', 'modeOfIssue', val as string[])}
                                                    placeholder="Select Mode"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Seniority">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.seniority)}
                                                    value={primaryFilters.seniority}
                                                    onChange={(val) => updateFilter('primary', 'seniority', val as string[])}
                                                    placeholder="Select Seniority"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Listing Status">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.listingStatus)}
                                                    value={primaryFilters.listingStatus}
                                                    onChange={(val) => updateFilter('primary', 'listingStatus', val as string[])}
                                                    placeholder="Select Status"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Secured Flag">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.securedFlag)}
                                                    value={primaryFilters.securedFlag}
                                                    onChange={(val) => updateFilter('primary', 'securedFlag', val as string[])}
                                                    placeholder="Select Flag"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>

                                            <FilterGroup label="Rating">
                                                <CustomDropdown
                                                    options={toOptions(filterOptions.creditRating)}
                                                    value={primaryFilters.rating}
                                                    onChange={(val) => updateFilter('primary', 'rating', val as string[])}
                                                    placeholder="Select Rating"
                                                    menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                />
                                            </FilterGroup>
                                        </div>
                                    </div>

                                    {/* COMPARE FILTERS */}
                                    {enableCompare && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-8">
                                            <h2 className="text-sm font-semibold mb-5 text-gray-700 dark:text-gray-200">Compare Filters</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                                                <FilterGroup label="Compare Financial Year">
                                                    <CustomDropdown
                                                        options={fyDropdownOptions}
                                                        value={getFinancialYearLabel(compareStartDate, compareEndDate)}
                                                        onChange={(val) => handleFinancialYearChange(String(val[0] || ''), 'compare')}
                                                        placeholder="Select FY"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                        multiSelect={false}
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Ownership Type">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.ownershipType)}
                                                        value={compareFilters.ownershipType}
                                                        onChange={(val) => updateFilter('compare', 'ownershipType', val as string[])}
                                                        placeholder="Select Ownership"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Sector">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.sector)}
                                                        value={compareFilters.sector}
                                                        onChange={(val) => updateFilter('compare', 'sector', val as string[])}
                                                        placeholder="Select Sector"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Nature">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.nature)}
                                                        value={compareFilters.nature}
                                                        onChange={(val) => updateFilter('compare', 'nature', val as string[])}
                                                        placeholder="Select Nature"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Security Type">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.securityType)}
                                                        value={compareFilters.securityType}
                                                        onChange={(val) => updateFilter('compare', 'securityType', val as string[])}
                                                        placeholder="Select Security"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Credit Rating Agency">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.creditRatingAgency)}
                                                        value={compareFilters.creditRatingAgency}
                                                        onChange={(val) => updateFilter('compare', 'creditRatingAgency', val as string[])}
                                                        placeholder="Select Agency"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Mode Of Issue">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.modeOfIssue)}
                                                        value={compareFilters.modeOfIssue}
                                                        onChange={(val) => updateFilter('compare', 'modeOfIssue', val as string[])}
                                                        placeholder="Select Mode"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Seniority">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.seniority)}
                                                        value={compareFilters.seniority}
                                                        onChange={(val) => updateFilter('compare', 'seniority', val as string[])}
                                                        placeholder="Select Seniority"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Listing Status">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.listingStatus)}
                                                        value={compareFilters.listingStatus}
                                                        onChange={(val) => updateFilter('compare', 'listingStatus', val as string[])}
                                                        placeholder="Select Status"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Secured Flag">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.securedFlag)}
                                                        value={compareFilters.securedFlag}
                                                        onChange={(val) => updateFilter('compare', 'securedFlag', val as string[])}
                                                        placeholder="Select Flag"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Rating">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.creditRating)}
                                                        value={compareFilters.rating}
                                                        onChange={(val) => updateFilter('compare', 'rating', val as string[])}
                                                        placeholder="Select Rating"
                                                        menuClassName="w-48 max-h-56 overflow-y-auto overflow-x-hidden"
                                                    />
                                                </FilterGroup>
                                            </div>

                                            {/* Compare Active Filter Chips */}
                                            {compareActiveFilterCount > 0 && (
                                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Compare Active:
                                                    </span>
                                                    {(Object.keys(compareFilters) as Array<keyof SummaryFilterState>).map((key) =>
                                                        compareFilters[key].map((val, idx) => {
                                                            const labelMap: Record<keyof SummaryFilterState, string> = {
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
                                                            return (
                                                                <ActiveFilterChip
                                                                    key={`compare-${key}-${idx}`}
                                                                    label={`${labelMap[key]}: ${val}`}
                                                                    onRemove={() => {
                                                                        const newValues = compareFilters[key].filter((_, i) => i !== idx);
                                                                        updateFilter('compare', key, newValues);
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    )}
                                                    <button
                                                        onClick={clearAllCompareDropdowns}
                                                        className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                                    >
                                                        Clear all compare
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Primary Active Filter Chips */}
                                    {activeFilterCount > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Primary Active:
                                            </span>
                                            {(Object.keys(primaryFilters) as Array<keyof SummaryFilterState>).map((key) =>
                                                primaryFilters[key].map((val, idx) => {
                                                    const labelMap: Record<keyof SummaryFilterState, string> = {
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
                                                    return (
                                                        <ActiveFilterChip
                                                            key={`primary-${key}-${idx}`}
                                                            label={`${labelMap[key]}: ${val}`}
                                                            onRemove={() => {
                                                                const newValues = primaryFilters[key].filter((_, i) => i !== idx);
                                                                updateFilter('primary', key, newValues);
                                                            }}
                                                        />
                                                    );
                                                })
                                            )}
                                            <button
                                                onClick={clearAllPrimaryDropdowns}
                                                className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                            >
                                                Clear all primary
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <button onClick={handleSearch} className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-8 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md">
                                            <Search className="w-3.5 h-3.5" /> Search
                                        </button>
                                        <button onClick={handleResetFilters} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg px-5 h-8 text-xs font-medium transition-colors duration-150">
                                            <X className="w-3.5 h-3.5" /> Clear
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SectionCard>

                {/* SUMMARY */}
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
                        primaryValue={`₹${formatNumberToFourChar(primaryTotalSize)}`}
                        compareValue={`₹${formatNumberToFourChar(compareTotalSize)}`}
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
                        primaryValue={`₹${formatNumberToFourChar(avgPrimarySize)}`}
                        compareValue={`₹${formatNumberToFourChar(avgCompareSize)}`}
                        primaryNumber={displayPrimaryData.length ? primaryTotalSize / displayPrimaryData.length : 0}
                        compareNumber={displayCompareData.length ? compareTotalSize / displayCompareData.length : 0}
                        primaryLabel={primaryYearLabel}
                        compareLabel={compareYearLabel}
                        growth={
                            compareTotalSize > 0
                                ? (
                                    (
                                        (primaryTotalSize / Math.max(displayPrimaryData.length, 1) -
                                            compareTotalSize / Math.max(displayCompareData.length, 1)) /
                                        (compareTotalSize / Math.max(displayCompareData.length, 1))
                                    ) * 100
                                )
                                : 0
                        }
                        color="#D97706"
                        enableCompare={enableCompare}
                    />
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                    {/* AREA CHART */}
                    <SectionCard className='my-3'>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Monthly Issue Size Trend (₹ {sizeUnit})
                            </h2>
                            <DownloadPngButton onClick={() => downloadChartAsPng(areaChartRef.current, `monthly_issue_size_trend_${primaryYearLabel}`)} />
                        </div>
                        {isLoading ? (
                            <ChartSkeleton />
                        ) : primaryData.length > 0 ? (
                            <div ref={areaChartRef} className="bg-white dark:bg-[#1a1a2e]">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={enableCompare ? comparisonData : primaryChartData}>
                                        <defs>
                                            <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#423CAB" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#423CAB" stopOpacity={0.02} />
                                            </linearGradient>
                                            <linearGradient id="compareGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="monthName" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                                        <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                                        <Tooltip content={<CustomTooltipComponent />} />
                                        <Legend wrapperStyle={{ color: '#374151' }} />
                                        <Area
                                            type="monotone"
                                            dataKey={enableCompare ? 'primaryIssueSize' : 'issueSize'}
                                            name={getFinancialYearLabel(primaryStartDate, primaryEndDate)}
                                            stroke="#423CAB"
                                            fill="url(#primaryGrad)"
                                            strokeWidth={2}
                                        />
                                        {enableCompare && (
                                            <Area
                                                type="monotone"
                                                dataKey="compareIssueSize"
                                                name={getFinancialYearLabel(compareStartDate, compareEndDate)}
                                                stroke="#06B6D4"
                                                fill="url(#compareGrad)"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <NoDataState />
                        )}
                    </SectionCard>

                    {/* BAR CHART */}
                    <SectionCard className='my-3'>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Quarterly Summary (₹ {sizeUnit})
                            </h2>
                            <DownloadPngButton onClick={() => downloadChartAsPng(barChartRef.current, `quarterly_summary_${primaryYearLabel}`)} />
                        </div>
                        {isLoading ? (
                            <ChartSkeleton />
                        ) : quarterlyData.length > 0 ? (
                            <div ref={barChartRef} className="bg-white dark:bg-[#1a1a2e]">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={quarterlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="quarter" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                                        <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                                        <Tooltip content={<CustomTooltipComponent />} />
                                        <Legend wrapperStyle={{ color: '#374151' }} />
                                        <Bar dataKey="primaryIssueSize" name={getFinancialYearLabel(primaryStartDate, primaryEndDate)} fill="#423CAB" radius={[4, 4, 0, 0]} />
                                        {enableCompare && (
                                            <Bar dataKey="compareIssueSize" name={getFinancialYearLabel(compareStartDate, compareEndDate)} fill="#06B6D4" radius={[4, 4, 0, 0]} />
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
                            Month-Wise Data (Rupees in {sizeUnit})
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportMonthWiseCSV}
                                disabled={isLoading || comparisonData.length === 0}
                                className="flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-400 block mb-1">Value Convention</label>
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
                    </div>
                    <div className="p-5 pt-0">
                        <MonthWiseTable
                            data={comparisonData}
                            enableCompare={enableCompare}
                            primaryLabel={primaryYearLabel}
                            compareLabel={compareYearLabel}
                            isLoading={isLoading}
                            sizeUnit={sizeUnit}
                            primaryStartDate={primaryStartDate}
                            compareStartDate={compareStartDate}
                            primaryFilters={primaryFilters}
                            compareFilters={compareFilters}
                            tableName="trustees"
                        />
                    </div>
                </SectionCard>

                {/* QUARTER-WISE TABLE */}
                <SectionCard className="!p-0 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Quarter-Wise Data (Rupees in {sizeUnit})
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportQuarterWiseCSV}
                                disabled={isLoading || quarterlyData.length === 0}
                                className="flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] text-gray-400 block mb-1">Value Convention</label>
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
                    </div>
                    <div className="p-5 pt-0">
                        <QuarterWiseTable
                            data={quarterlyData}
                            enableCompare={enableCompare}
                            primaryLabel={primaryYearLabel}
                            compareLabel={compareYearLabel}
                            isLoading={isLoading}
                            sizeUnit={sizeUnit}
                            primaryStartDate={primaryStartDate}
                            compareStartDate={compareStartDate}
                            primaryFilters={primaryFilters}
                            compareFilters={compareFilters}
                            tableName="trustees"
                        />
                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}