'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CustomDropdown from '@/components/CustomDropdown';
import { Search, Download, X, ChevronDown, ChevronUp, Calendar, SlidersHorizontal } from 'lucide-react';
import { FilterOption, DateRange, FilterState, TableDataItem } from './types';
import { fetchIssueDetailsData, fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';
import { motion, AnimatePresence } from 'framer-motion'

// ─── API Configuration ─────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper to get current financial year dates (India: April 1 - March 31)
function getCurrentFinancialYearDates() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startYear: any;
    let endYear: any;

    // Determine financial year bounds
    if (currentMonth >= 3) { // April is 3
        startYear = currentYear;
        endYear = currentYear + 1;
    } else {
        startYear = currentYear - 1;
        endYear = currentYear;
    }

    const startDate = new Date(startYear, 3, 1);
    const endDate = new Date(endYear, 2, 31);

    // If the financial year end is in the future, use today
    const finalEndDate = endDate > now ? now : endDate;

    // Helper to format date as YYYY-MM-DD using LOCAL time
    const formatLocalDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(finalEndDate)
    };
}

function formatLocalDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getYearOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const formatLocalDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const today = formatLocalDate(now);

    const financialYears = [];
    const calendarYears = [];

    for (let i = 0; i < 5; i++) {
        const year = currentYear - i;

        const fyEnd = `${year + 1}-03-31`;
        const cyEnd = `${year}-12-31`;

        financialYears.push({
            value: `FY-${year}`,
            label: `FY ${year}-${String(year + 1).slice(-2)}`,
            startDate: `${year}-04-01`,
            endDate: fyEnd > today ? today : fyEnd,
            group: 'Financial Year',
        });

        calendarYears.push({
            value: `CY-${year}`,
            label: `CY ${year}`,
            startDate: `${year}-01-01`,
            endDate: cyEnd > today ? today : cyEnd,
            group: 'Calendar Year',
        });
    }

    return [...financialYears, ...calendarYears];
}

const DEFAULT_DATES = getCurrentFinancialYearDates();

// ─── Types ─────────────────────────────────────────────────────────────────

interface Column {
    header: string;
    accessor: string;
}

interface FilterInputsResponse {
    taxFree: string[];
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

interface PaginatedResponse {
    data: TableDataItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// ─── Column Definitions ─────────────────────────────────────────────────────

const allColumns: Column[] = [
    { header: 'Issuer Name', accessor: 'issuerName' },
    { header: 'ISIN', accessor: 'isin' },
    { header: 'Security Name', accessor: 'securityName' },
    { header: 'Nature', accessor: 'nature' },
    { header: 'Ownership Type', accessor: 'ownershipType' },
    { header: 'Sector', accessor: 'sector' },
    { header: 'Credit Rating Agency', accessor: 'creditRatingAgency' },
    { header: 'Credit Rating', accessor: 'creditRating' },
    { header: 'Seniority', accessor: 'seniority' },
    { header: 'Secured Flag', accessor: 'securedFlag' },
    { header: 'Listing Status', accessor: 'listingStatus' },
    { header: 'Tax Free', accessor: 'taxFree' },
    { header: 'Issue Size', accessor: 'issueSize' },
    { header: 'Security Type', accessor: 'securityType' },
    { header: 'Mode of Issue', accessor: 'modeOfIssue' },
    { header: 'Issue Value', accessor: 'issueValue' },
    { header: 'Face Value', accessor: 'faceValue' },
    { header: 'Allotment Date', accessor: 'allotmentDate' },
    { header: 'Date of Maturity', accessor: 'dateOfMaturity' },
];

const defaultColumns: string[] = [
    'issuerName',
    'isin',
    'securityName',
    'nature',
    'ownershipType',
    'sector',
    'creditRatingAgency',
    'creditRating',
    'seniority',
    'securedFlag',
    'listingStatus',
    'taxFree',
    'issueSize',
    'securityType',
    'modeOfIssue',
    'issueValue',
    'faceValue',
    'allotmentDate',
    'dateOfMaturity',
];

// ─── Skeleton Components ─────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton height={40} />
            {[...Array(8)].map((_, i) => (
                <Skeleton key={i} height={48} />
            ))}
        </div>
    );
}

function FilterSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
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

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 ${className}`}>
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

const DateInput = ({
    value,
    onChange,
    placeholder
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string
}) => (
    <div className="relative">
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-6 px-3 pr-8 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
                text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
        className="w-full h-6 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
            text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
            placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
);

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

const formatDate = (dateString: string | number | null): string => {
    if (!dateString || dateString === '-') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetailedAnalysis() {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isinHandler = (item: any): void => {
        router.push(`/specific-issuer/${item?.id}`);
    };

    // ── Collapsible Filters State ──
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    const [selectedYear, setSelectedYear] = useState('');

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        issuerOwnershipType: '',
        issuerNatureType: '',
        businessSector: '',
        fromAllotmentDate: DEFAULT_DATES.startDate,
        toAllotmentDate: DEFAULT_DATES.endDate,
        securityType: '',
        modeOfIssue: '',
        creditRatingAgency: '',
        creditRating: '',
        seniority: '',
        servicedFlag: '',
        listingStatus: '',
    });
    // Filter options states
    const [filterOptions, setFilterOptions] = useState<FilterInputsResponse>({
        taxFree: [],
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

    // Table states
    const [tableData, setTableData] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltersLoading, setIsFiltersLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [sortColumn, setSortColumn] = useState<string>('issuerName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Column selector states
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState<boolean>(false);

    const yearOptions = useMemo(() => getYearOptions(), []);

    const filteredColumns = useMemo<Column[]>(() => {
        return allColumns.filter(col => visibleColumns.includes(col.accessor));
    }, [visibleColumns]);

    const toggleColumn = (accessor: string): void => {
        setVisibleColumns(prev =>
            prev.includes(accessor)
                ? prev.filter(col => col !== accessor)
                : [...prev, accessor]
        );
    };

    // Close column dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update filter helper
    const updateFilter = useCallback((key: keyof FilterState, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleYearChange = (value: string) => {
        setSelectedYear(value);

        const option = yearOptions.find(y => y.value === value);

        if (!option) return;

        updateFilter('fromAllotmentDate', option.startDate);
        updateFilter('toAllotmentDate', option.endDate);
    };

    // ─── API Functions ─────────────────────────────────────────────────────

    // Fetch filter inputs data
    const fetchFilterInputs = useCallback(async () => {
        setIsFiltersLoading(true);
        try {
            const query = {
                startDate: filters.fromAllotmentDate || DEFAULT_DATES.startDate,
                endDate: filters.toAllotmentDate || DEFAULT_DATES.endDate,
            };

            const data: FilterInputsResponse = await fetchIssueDetailsFilterInputsData(query);

            console.log('Filter inputs data:', data);

            setFilterOptions(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching filter inputs:', err);
            setError('Failed to load filter options');
        } finally {
            setIsFiltersLoading(false);
        }
    }, [filters.fromAllotmentDate, filters.toAllotmentDate]);

    // Fetch table data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * pageSize;

            const requestBody = {
                startDate: filters.fromAllotmentDate || DEFAULT_DATES.startDate,
                endDate: filters.toAllotmentDate || DEFAULT_DATES.endDate,
                limit: pageSize,
                offset: offset,
                search: searchQuery,           // ← NEW: pass the search input value
                rating: filters.creditRating,
                registrar: '',
                arranger: '',
                seniority: filters.seniority,
                securityType: filters.securityType,
                securedFlag: filters.servicedFlag,
                sector: filters.businessSector,
                trustee: '',
                nature: filters.issuerNatureType,
                ownershipType: filters.issuerOwnershipType,
                creditRatingAgency: filters.creditRatingAgency,
                listingStatus: filters.listingStatus,
                modeOfIssue: filters.modeOfIssue
                // REMOVED: issuerName, taxFree, dealSize
            };

            const result: PaginatedResponse = await fetchIssueDetailsData(requestBody);

            // Map backend data to frontend format
            const mappedData: TableDataItem[] = result.data?.map((item: any) => ({
                id: item.id,
                isin: item.isin,
                issuerName: item.issuerName || '-',
                ownershipType: item.ownershipType || '-',
                nature: item.nature || '-',
                sector: item.sector || '-',
                creditRatingAgency: item.creditRatingAgency || '-',
                creditRating: item.creditRating || '-',
                seniority: item.seniority || '-',
                securedFlag: item.securedFlag || '-',
                listingStatus: item.listingStatus || '-',
                taxFree: item.taxFree || '-',
                issueSize: item.issueSize || 0,
                securityName: item.securityName || '-',
                securityType: item.securityType || '-',
                modeOfIssue: item.modeOfIssue || '-',
                issueValue: item.issueSize || 0,
                faceValue: item.faceValue || 0,
                allotmentDate: item.allotmentDate || '-',
                dateOfMaturity: item.maturityDate || '-',
            }));

            setTableData(mappedData);
            setTotalCount(result.pagination.total);
        } catch (err) {
            console.error('API Error:', err);
            setError('Failed to fetch data');
            setTableData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, pageSize, searchQuery]);

    // ── Active Filters Count ──
    const activeFilterCount = useMemo(() => {
        let count = 0;

        Object.entries(filters).forEach(([key, value]) => {
            if (!value) return;

            if (
                !selectedYear &&
                (
                    (key === 'fromAllotmentDate' && value === DEFAULT_DATES.startDate) ||
                    (key === 'toAllotmentDate' && value === DEFAULT_DATES.endDate)
                )
            ) {
                return;
            }

            count++;
        });

        return count;
    }, [filters, selectedYear]);

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof FilterState; label: string }[] = [];

        const labelMap: Record<keyof FilterState, string> = {
            issuerOwnershipType: 'Ownership',
            issuerNatureType: 'Nature',
            businessSector: 'Sector',
            fromAllotmentDate: 'From Date',
            toAllotmentDate: 'To Date',
            securityType: 'Security',
            modeOfIssue: 'Mode',
            creditRatingAgency: 'Agency',
            creditRating: 'Rating',
            seniority: 'Seniority',
            servicedFlag: 'Secured',
            listingStatus: 'Listing',
        };

        (Object.keys(filters) as Array<keyof FilterState>).forEach((key) => {
            const value = filters[key];

            if (!value) return;

            // Hide default dates only when NO year is selected
            if (
                !selectedYear &&
                (
                    (key === 'fromAllotmentDate' && value === DEFAULT_DATES.startDate) ||
                    (key === 'toAllotmentDate' && value === DEFAULT_DATES.endDate)
                )
            ) {
                return;
            }

            const displayValue =
                key === 'fromAllotmentDate' || key === 'toAllotmentDate'
                    ? formatDate(value as string)
                    : value;

            chips.push({
                key,
                label: `${labelMap[key]}: ${displayValue}`,
            });
        });

        return chips;
    }, [filters, selectedYear]);

    // Initial fetch for filter inputs
    useEffect(() => {
        fetchFilterInputs();
    }, [fetchFilterInputs]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle search
    const handleSearch = () => {
        setCurrentPage(1);
        setIsFiltersExpanded(false);
        fetchData();
    };

    // Handle reset
    const handleReset = () => {
        setFilters({
            issuerOwnershipType: '',
            issuerNatureType: '',
            businessSector: '',
            fromAllotmentDate: DEFAULT_DATES.startDate,
            toAllotmentDate: DEFAULT_DATES.endDate,
            securityType: '',
            modeOfIssue: '',
            creditRatingAgency: '',
            creditRating: '',
            seniority: '',
            servicedFlag: '',
            listingStatus: '',
        });
        setSearchQuery('');
        setSelectedYear('');
        setCurrentPage(1);
        setVisibleColumns(defaultColumns);
        setIsFiltersExpanded(false); // ← ADD THIS
        setTimeout(fetchData, 0);
    };

    // Handle sort
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Handle export
    const handleExport = () => {
        if (!tableData || tableData.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            const headers = filteredColumns.map(col => col.header);
            const dataRows = tableData.map(row =>
                filteredColumns.map(col => {
                    const value = (row as any)[col.accessor];
                    // Format currency values if numeric
                    if (col.accessor === 'issueValue' || col.accessor === 'faceValue') {
                        return typeof value === 'number' ? formatCurrency(value) : value;
                    }
                    return value || '-';
                })
            );

            // Create workbook and worksheet
            const worksheetData = [headers, ...dataRows];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const columnWidths = headers.map(() => ({ wch: 15 }));
            worksheet['!cols'] = columnWidths;

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Issuer Details');

            // Generate filename with current date
            const now = new Date();
            const filename = `issuer-details-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;

            // Trigger download
            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        }
    };

    // Format currency
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Render cell with special formatting
    const renderCell = (row: TableDataItem, accessor: string) => {
        const value = row[accessor as keyof TableDataItem];

        if (accessor === 'isin') {
            return (
                <span
                    onClick={() => isinHandler(row)}
                    className="underline text-blue-500 decoration-sky-500 cursor-pointer"
                >
                    {value}
                </span>
            );
        }

        if (accessor === 'securityType') {
            return (
                <span
                    className={`
                        inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                        ${value === 'Equity' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        ${value === 'Debentures' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                        ${value === 'Mutual Fund' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                        ${value === 'Hybrid Fund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    `}
                >
                    {value}
                </span>
            );
        }

        if (accessor === 'issueValue' || accessor === 'faceValue') {
            return (
                <span className="text-right block">
                    {formatCurrency(value as number)}
                </span>
            );
        }

        // ← NEW: Format date columns
        if (accessor === 'allotmentDate' || accessor === 'dateOfMaturity') {
            return formatDate(value as string);
        }

        return value;
    };

    // Convert array to dropdown options format
    const toOptions = (items: string[]): FilterOption[] => {
        return items.map(item => ({
            value: item,
            label: item,
        }));
    };

    const totalPages: number = Math.ceil(totalCount / pageSize);

    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, "...", totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(
                    1,
                    "...",
                    totalPages - 4,
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages
                );
            } else {
                pages.push(
                    1,
                    "...",
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    "...",
                    totalPages
                );
            }
        }

        return pages;
    };

    const startEntry: number =
        totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;

    const endEntry: number = Math.min(currentPage * pageSize, totalCount);

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title & Breadcrumb ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Detailed Analysis</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Issuer <span className="mx-1">&gt;</span> Detailed Analysis
                    </p>
                </div>

                {/* ── Filters Section ── */}
                <SectionCard className="p-0">
                    {/* Collapsed Header Bar */}
                    <button
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        className="w-full cursor-pointer flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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

                    <AnimatePresence>
                        {isFiltersExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    {isFiltersLoading ? (
                                        <FilterSkeleton />
                                    ) : (
                                        <>
                                            {/* Filter Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                                {/* ... keep all your existing FilterGroup items exactly as they are ... */}
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

                                                <FilterGroup label="Years">
                                                    <CustomDropdown
                                                        options={[
                                                            {
                                                                label: "Financial Year",
                                                                options: yearOptions
                                                                    .filter(x => x.group === "Financial Year")
                                                                    .map(x => ({
                                                                        value: x.value,
                                                                        label: x.label,
                                                                    }))
                                                            },
                                                            {
                                                                label: "Calendar Year",
                                                                options: yearOptions
                                                                    .filter(x => x.group === "Calendar Year")
                                                                    .map(x => ({
                                                                        value: x.value,
                                                                        label: `CY ${x.startDate.slice(0, 4)}`,
                                                                    })),
                                                            },
                                                        ]}
                                                        value={selectedYear}
                                                        onChange={(val) => handleYearChange(val as string)}
                                                        placeholder="Select Year"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="From Allotment Date">
                                                    <DateInput
                                                        value={filters.fromAllotmentDate}
                                                        onChange={(val) => updateFilter('fromAllotmentDate', val)}
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="To Allotment Date">
                                                    <DateInput
                                                        value={filters.toAllotmentDate}
                                                        onChange={(val) => updateFilter('toAllotmentDate', val)}
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
                                                        value={filters.creditRatingAgency}
                                                        onChange={(val) => updateFilter('creditRatingAgency', val)}
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
                                                        onClick={() => {
                                                            setSelectedYear('');

                                                            setFilters({
                                                                issuerOwnershipType: '',
                                                                issuerNatureType: '',
                                                                businessSector: '',
                                                                fromAllotmentDate: DEFAULT_DATES.startDate,
                                                                toAllotmentDate: DEFAULT_DATES.endDate,
                                                                securityType: '',
                                                                modeOfIssue: '',
                                                                creditRatingAgency: '',
                                                                creditRating: '',
                                                                seniority: '',
                                                                servicedFlag: '',
                                                                listingStatus: '',
                                                            });
                                                        }}
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
                                                    onClick={handleExport}
                                                    className="flex items-center gap-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-5 h-6 text-xs font-medium transition-colors duration-150"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Export
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
                            </motion.div>
                        )}

                    </AnimatePresence>
                </SectionCard>

                {/* ── Data Table Section ── */}
                <SectionCard className="p-5">
                    {/* Table Header with Search & Column Selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Search Results
                            </h2>
                            {!isLoading && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                    {totalCount} records
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search ISIN or issuers..."
                                    className="w-full h-6 px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#0f0f1a] border border-gray-200 dark:border-gray-700 rounded-lg 
        text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
        placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                />
                            </div>

                            {/* Custom Column Selector */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsColumnMenuOpen(prev => !prev)}
                                    className="text-xs border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Columns
                                </button>

                                {isColumnMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-60 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] shadow-lg p-3 z-20">
                                        {allColumns.map(col => (
                                            <label
                                                key={col.accessor}
                                                className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 py-1 px-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col.accessor)}
                                                    onChange={() => toggleColumn(col.accessor)}
                                                    className="cursor-pointer accent-violet-500 dark:accent-violet-400"
                                                />
                                                {col.header}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <TableSkeleton />
                        ) : tableData.length > 0 ? (
                            <div className="rounded-xl bg-white dark:bg-gray-900 overflow-x-auto">
                                <table className="w-full table-auto overflow-x-auto border-separate border-spacing-[4px] text-[12px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                                            {filteredColumns.map((column) => (
                                                <th
                                                    key={column.accessor}
                                                    className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                                                    onClick={() => handleSort(column.accessor)}
                                                >
                                                    <div className="flex items-center gap-1 justify-center">
                                                        {column.header}
                                                        {sortColumn === column.accessor && (
                                                            sortDirection === 'asc'
                                                                ? <ChevronUp className="w-3 h-3" />
                                                                : <ChevronDown className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData?.map((row, index) => (
                                            <tr
                                                key={index}
                                                className={`
                                                    transition-colors
                                                    ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                                                `}
                                            >
                                                {filteredColumns.map((column) => (
                                                    <td
                                                        key={column.accessor}
                                                        className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200"
                                                    >
                                                        {renderCell(row, column.accessor)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-6">

                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Showing {startEntry} to {endEntry} of {totalCount} entries
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                Show
                                            </span>

                                            <select
                                                value={pageSize}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    setPageSize(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="h-7 px-2 text-[10px] bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#423CAB]"
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>

                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                entries
                                            </span>
                                        </div>

                                    </div>
                                    <div className="flex items-center gap-1">

                                        {/* First */}
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &laquo;
                                        </button>

                                        {/* Previous */}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &lsaquo;
                                        </button>

                                        {getPageNumbers().map((page, index) => {

                                            if (page === "...") {
                                                return (
                                                    <span
                                                        key={index}
                                                        className="px-2 text-gray-500"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`px-3 py-1 rounded text-sm ${currentPage === page
                                                        ? "bg-[#423CAB] text-white"
                                                        : "border border-gray-300 dark:border-gray-700"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        {/* Next */}
                                        <button
                                            onClick={() =>
                                                setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                            }
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &rsaquo;
                                        </button>

                                        {/* Last */}
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &raquo;
                                        </button>

                                    </div>
                                </div>
                            </div>
                        ) : (
                            <NoDataState
                                message="No records found"
                                subMessage="Try adjusting your filters or search criteria to find what you're looking for."
                            />
                        )}
                    </div>
                </SectionCard>
            </div>
        </SkeletonTheme>
    );
}