'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CustomDropdown from '@/components/CustomDropdown';
import { Search, Download, X, ChevronDown, ChevronUp, Calendar, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';

import { FilterOption, TableDataItem } from './types';
import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';
import { fetchTrusteePageDetailedData } from '@/features/trustees/services';
import { motion, AnimatePresence } from 'framer-motion';
import { useSummaryFilterStore } from '@/lib/filtersState';
import type { DetailedPageState, TrusteeDetailedFilters } from '@/lib/filtersState';

// ─── Constants ─────────────────────────────────────────────────────────────
const TRUSTEES_DETAILED_PAGE = 'trustees-detailed' as const;

// ─── Helper to get current financial year dates (India: April 1 - March 31) ──
function getCurrentFinancialYearDates() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startYear: number;
    let endYear: number;

    if (currentMonth >= 3) {
        startYear = currentYear;
        endYear = currentYear + 1;
    } else {
        startYear = currentYear - 1;
        endYear = currentYear;
    }

    const startDate = new Date(startYear, 3, 1);
    const endDate = new Date(endYear, 2, 31);
    const finalEndDate = endDate > now ? now : endDate;

    const formatLocalDate = (date: Date) => {
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

// ─── Types ──────────────────────────────────────────────────────────────────
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

interface PaginatedResponse {
    data: TableDataItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// ─── Column Definitions ──────────────────────────────────────────────────
interface Column {
    header: string;
    accessor: string;
}

const allColumns: Column[] = [
    { header: 'Trustee', accessor: 'trustee' },
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
    { header: 'Issue Size', accessor: 'issueSize' },
    { header: 'Security Type', accessor: 'securityType' },
    { header: 'Mode of Issue', accessor: 'modeOfIssue' },
    { header: 'Issue Value', accessor: 'issueValue' },
    { header: 'Face Value', accessor: 'faceValue' },
    { header: 'Allotment Date', accessor: 'allotmentDate' },
    { header: 'Date of Maturity', accessor: 'dateOfMaturity' },
];

const defaultColumns: string[] = [
    'trustee',
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
    'issueSize',
    'securityType',
    'modeOfIssue',
    'issueValue',
    'faceValue',
    'allotmentDate',
    'dateOfMaturity',
];

// ─── Skeleton Components ──────────────────────────────────────────────
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

// ─── Empty State Component ──────────────────────────────────────────────
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

// ─── Sub-components ──────────────────────────────────────────────────────
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

// ─── Main Component ──────────────────────────────────────────────────────
export default function DetailedAnalysis() {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const yearMenuRef = useRef<HTMLDivElement>(null);

    // ── Zustand Store ──
    const {
        activeFilterPage,
        detailedPageState,
        setDetailedPageState,
        updateDetailedPageFilter,
        updateDetailedPageField,
        clearDetailedPageState,
    } = useSummaryFilterStore();

    // ── Default State for this page ──
    const defaultDetailedState: DetailedPageState<typeof TRUSTEES_DETAILED_PAGE> = useMemo(() => ({
        fromAllotmentDate: DEFAULT_DATES.startDate,
        toAllotmentDate: DEFAULT_DATES.endDate,
        selectedYear: '',
        filters: {
            trustee: [],
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
        },
    }), []);

    // ── Effective State ──
    const isActivePage = activeFilterPage === TRUSTEES_DETAILED_PAGE;
    const storedState = detailedPageState[TRUSTEES_DETAILED_PAGE];
    const currentState = isActivePage && storedState ? storedState : defaultDetailedState;

    const { selectedYear, fromAllotmentDate, toAllotmentDate, filters } = currentState;

    // ── Ensure active page before any update ──
    const ensureActive = useCallback(() => {
        if (useSummaryFilterStore.getState().activeFilterPage !== TRUSTEES_DETAILED_PAGE) {
            setDetailedPageState(TRUSTEES_DETAILED_PAGE, currentState);
        }
    }, [setDetailedPageState, currentState]);

    // ── UI State (not persisted) ──
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [yearMenuOpen, setYearMenuOpen] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<'financial' | 'calendar' | null>(null);
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
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState<boolean>(false);

    const [filterOptions, setFilterOptions] = useState<FilterInputsResponse>({
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

    // ── Close dropdowns on outside click ──
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (yearMenuRef.current && !yearMenuRef.current.contains(event.target as Node)) {
                setYearMenuOpen(false);
                setHoveredCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Filter update helpers ──
    const updateFilter = useCallback((key: keyof TrusteeDetailedFilters, value: string[]) => {
        ensureActive();
        updateDetailedPageFilter(TRUSTEES_DETAILED_PAGE, key, value);
    }, [ensureActive, updateDetailedPageFilter]);

    const updateDate = useCallback((key: 'fromAllotmentDate' | 'toAllotmentDate', value: string) => {
        ensureActive();
        updateDetailedPageField(TRUSTEES_DETAILED_PAGE, key, value);
    }, [ensureActive, updateDetailedPageField]);

    const handleYearChange = (value: string) => {
        ensureActive();
        updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'selectedYear', value);
        const option = yearOptions.find(y => y.value === value);
        if (option) {
            updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'fromAllotmentDate', option.startDate);
            updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'toAllotmentDate', option.endDate);
        }
    };

    // ── API Calls ──
    const fetchFilterInputs = useCallback(async () => {
        setIsFiltersLoading(true);
        try {
            const query = {
                startDate: fromAllotmentDate || DEFAULT_DATES.startDate,
                endDate: toAllotmentDate || DEFAULT_DATES.endDate,
            };
            const data: FilterInputsResponse = await fetchIssueDetailsFilterInputsData(query);
            setFilterOptions(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching filter inputs:', err);
            setError('Failed to load filter options');
        } finally {
            setIsFiltersLoading(false);
        }
    }, [fromAllotmentDate, toAllotmentDate]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const offset = (currentPage - 1) * pageSize;
            const requestBody = {
                startDate: fromAllotmentDate || DEFAULT_DATES.startDate,
                endDate: toAllotmentDate || DEFAULT_DATES.endDate,
                limit: pageSize,
                offset: offset,
                search: searchQuery,
                trustee: filters.trustee[0] || '',  // API expects string
                rating: filters.creditRating,
                registrar: '',
                seniority: filters.seniority,
                securityType: filters.securityType,
                securedFlag: filters.servicedFlag,
                sector: filters.businessSector,
                nature: filters.issuerNatureType,
                ownershipType: filters.issuerOwnershipType,
                creditRatingAgency: filters.creditRatingAgency,
                listingStatus: filters.listingStatus,
                modeOfIssue: filters.modeOfIssue
            };

            const result: PaginatedResponse = await fetchTrusteePageDetailedData(requestBody);

            const mappedData: TableDataItem[] = result.data?.map((item: any) => ({
                id: item.id,
                isin: item.isin,
                issuerName: item.issuerName || '-',
                ownershipType: item.ownershipType || '-',
                nature: item.nature || '-',
                sector: item.sector || '-',
                creditRatingAgency: item.creditRatingAgency || '-',
                creditRating: item.creditRating || '-',
                arranger: item.arranger || '-',
                trustee: item.debentureTrustee || '-',
                seniority: item.seniority || '-',
                securedFlag: item.securedFlag || '-',
                listingStatus: item.listingStatus || '-',
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
    }, [filters, fromAllotmentDate, toAllotmentDate, currentPage, pageSize, searchQuery]);

    // ── Active Filters ──
    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) count += value.length;
        });
        if (selectedYear) count += 1;
        return count;
    }, [filters, selectedYear]);

    const activeFilterChips = useMemo(() => {
        const chips: { key: keyof TrusteeDetailedFilters; label: string; index: number }[] = [];
        const labelMap: Record<keyof TrusteeDetailedFilters, string> = {
            trustee: 'Trustee',
            issuerOwnershipType: 'Ownership',
            issuerNatureType: 'Nature',
            businessSector: 'Sector',
            securityType: 'Security',
            modeOfIssue: 'Mode',
            creditRatingAgency: 'Agency',
            creditRating: 'Rating',
            seniority: 'Seniority',
            servicedFlag: 'Secured',
            listingStatus: 'Listing',
        };

        (Object.keys(filters) as Array<keyof TrusteeDetailedFilters>).forEach((key) => {
            const value = filters[key];
            if (!Array.isArray(value) || value.length === 0) return;
            value.forEach((val, idx) => {
                chips.push({
                    key,
                    index: idx,
                    label: `${labelMap[key]}: ${val}`,
                });
            });
        });

        if (selectedYear) {
            chips.push({
                key: 'trustee', // dummy
                index: -1,
                label: `Year: ${yearOptions.find(y => y.value === selectedYear)?.label || selectedYear}`,
            });
        }

        return chips;
    }, [filters, selectedYear, yearOptions]);

    const handleRemoveChip = useCallback((chip: typeof activeFilterChips[0]) => {
        if (chip.label.startsWith('Year:')) {
            updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'selectedYear', '');
            updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'fromAllotmentDate', DEFAULT_DATES.startDate);
            updateDetailedPageField(TRUSTEES_DETAILED_PAGE, 'toAllotmentDate', DEFAULT_DATES.endDate);
            return;
        }
        const currentValue = filters[chip.key];
        if (Array.isArray(currentValue)) {
            const newValues = currentValue.filter((_, i) => i !== chip.index);
            updateFilter(chip.key, newValues);
        }
    }, [filters, updateFilter, updateDetailedPageField]);

    // ── Initial filter fetch ──
    useEffect(() => {
        fetchFilterInputs();
    }, [fetchFilterInputs]);

    // ── Fetch data on state changes ──
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Handlers ──
    const handleSearch = () => {
        setCurrentPage(1);
        setIsFiltersExpanded(false);
        fetchData();
    };

    const handleReset = () => {
        clearDetailedPageState(TRUSTEES_DETAILED_PAGE, defaultDetailedState);
        setSearchQuery('');
        setCurrentPage(1);
        setVisibleColumns(defaultColumns);
        setIsFiltersExpanded(false);
    };

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const handleExport = useCallback(() => {
        if (tableData.length === 0) {
            console.warn('No data to export');
            return;
        }

        const exportData = tableData.map((row) => {
            const newRow: Record<string, any> = {};
            filteredColumns.forEach(col => {
                const value = (row as any)[col.accessor];
                if (col.accessor === 'issueValue' || col.accessor === 'faceValue') {
                    newRow[col.header] = typeof value === 'number' ? formatCurrency(value) : value;
                } else {
                    newRow[col.header] = value || '-';
                }
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const colWidths = filteredColumns.map(() => ({ wch: 15 }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Trustee Analysis');

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `trustee-detailed-analysis-${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }, [tableData, filteredColumns]);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const renderCell = (row: TableDataItem, accessor: string) => {
        const value = row[accessor as keyof TableDataItem];

        if (accessor === 'isin') {
            return (
                <span
                    onClick={() => router.push(`/specific-issuer/${row.id}`)}
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

        if (accessor === 'allotmentDate' || accessor === 'dateOfMaturity') {
            return formatDate(value as string);
        }

        return value;
    };

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
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, "...", totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }
        return pages;
    };

    const startEntry: number = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endEntry: number = Math.min(currentPage * pageSize, totalCount);

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title & Breadcrumb ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Trustee Detailed Analysis</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Trustee <span className="mx-1">&gt;</span> Detailed Analysis
                    </p>
                </div>

                {/* ── Filters Section ── */}
                <SectionCard className="p-0">
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
                                            key={`${chip.key}-${chip.index}`}
                                            label={chip.label}
                                            onRemove={() => handleRemoveChip(chip)}
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                                <FilterGroup label="Trustee Name">
                                                    <TextInput
                                                        value={filters.trustee[0] || ''}
                                                        onChange={(val) => updateFilter('trustee', val ? [val] : [])}
                                                        placeholder="Enter Trustee Name"
                                                        type="text"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Issuer Ownership Type">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.ownershipType)}
                                                        value={filters.issuerOwnershipType}
                                                        onChange={(val) => updateFilter('issuerOwnershipType', val as string[])}
                                                        placeholder="Select Ownership"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Issuer Nature Type">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.nature)}
                                                        value={filters.issuerNatureType}
                                                        onChange={(val) => updateFilter('issuerNatureType', val as string[])}
                                                        placeholder="Select Nature"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Business Sector">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.sector)}
                                                        value={filters.businessSector}
                                                        onChange={(val) => updateFilter('businessSector', val as string[])}
                                                        placeholder="Select Sector"
                                                    />
                                                </FilterGroup>

                                                {/* ── Years Hover Dropdown ── */}
                                                <FilterGroup label="Years">
                                                    <div className="relative" ref={yearMenuRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setYearMenuOpen(!yearMenuOpen)}
                                                            className="w-full h-6 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
                                                                text-left text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                                                                flex items-center justify-between"
                                                        >
                                                            <span className={selectedYear ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>
                                                                {selectedYear
                                                                    ? yearOptions.find(y => y.value === selectedYear)?.label || 'Select Year'
                                                                    : 'Select Year'}
                                                            </span>
                                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${yearMenuOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {yearMenuOpen && (
                                                            <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                                                <div className="flex min-h-[160px]">
                                                                    <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 flex flex-col">
                                                                        <div
                                                                            onMouseEnter={() => setHoveredCategory('financial')}
                                                                            className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                                                                hoveredCategory === 'financial'
                                                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                            }`}
                                                                        >
                                                                            Financial Years
                                                                        </div>
                                                                        <div
                                                                            onMouseEnter={() => setHoveredCategory('calendar')}
                                                                            className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                                                                hoveredCategory === 'calendar'
                                                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                            }`}
                                                                        >
                                                                            Calendar Years
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-1/2 max-h-60 overflow-y-auto">
                                                                        {hoveredCategory === 'financial' && (
                                                                            <div className="flex flex-col">
                                                                                {yearOptions
                                                                                    .filter(y => y.group === 'Financial Year')
                                                                                    .map(y => (
                                                                                        <div
                                                                                            key={y.value}
                                                                                            onClick={() => {
                                                                                                handleYearChange(y.value);
                                                                                                setYearMenuOpen(false);
                                                                                                setHoveredCategory(null);
                                                                                            }}
                                                                                            className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                                                                                selectedYear === y.value
                                                                                                    ? 'text-[#423CAB] font-medium bg-indigo-50/50 dark:bg-indigo-900/20'
                                                                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                                            }`}
                                                                                        >
                                                                                            {y.label}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                        {hoveredCategory === 'calendar' && (
                                                                            <div className="flex flex-col">
                                                                                {yearOptions
                                                                                    .filter(y => y.group === 'Calendar Year')
                                                                                    .map(y => (
                                                                                        <div
                                                                                            key={y.value}
                                                                                            onClick={() => {
                                                                                                handleYearChange(y.value);
                                                                                                setYearMenuOpen(false);
                                                                                                setHoveredCategory(null);
                                                                                            }}
                                                                                            className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                                                                                selectedYear === y.value
                                                                                                    ? 'text-[#423CAB] font-medium bg-indigo-50/50 dark:bg-indigo-900/20'
                                                                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                                            }`}
                                                                                        >
                                                                                            {y.label}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                        {!hoveredCategory && (
                                                                            <div className="flex items-center justify-center h-full px-3 py-8 text-[10px] text-gray-400 dark:text-gray-500">
                                                                                Hover a category
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FilterGroup>

                                                <FilterGroup label="From Allotment Date">
                                                    <DateInput
                                                        value={fromAllotmentDate}
                                                        onChange={(val) => updateDate('fromAllotmentDate', val)}
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="To Allotment Date">
                                                    <DateInput
                                                        value={toAllotmentDate}
                                                        onChange={(val) => updateDate('toAllotmentDate', val)}
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Security Type">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.securityType)}
                                                        value={filters.securityType}
                                                        onChange={(val) => updateFilter('securityType', val as string[])}
                                                        placeholder="Select Security"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Mode of Issue">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.modeOfIssue)}
                                                        value={filters.modeOfIssue}
                                                        onChange={(val) => updateFilter('modeOfIssue', val as string[])}
                                                        placeholder="Select Mode"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Credit Rating Agency">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.creditRatingAgency)}
                                                        value={filters.creditRatingAgency}
                                                        onChange={(val) => updateFilter('creditRatingAgency', val as string[])}
                                                        placeholder="Select Agency"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Credit Rating">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.creditRating)}
                                                        value={filters.creditRating}
                                                        onChange={(val) => updateFilter('creditRating', val as string[])}
                                                        placeholder="Select Rating"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Seniority">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.seniority)}
                                                        value={filters.seniority}
                                                        onChange={(val) => updateFilter('seniority', val as string[])}
                                                        placeholder="Select Seniority"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Serviced Flag">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.securedFlag)}
                                                        value={filters.servicedFlag}
                                                        onChange={(val) => updateFilter('servicedFlag', val as string[])}
                                                        placeholder="Select Flag"
                                                    />
                                                </FilterGroup>

                                                <FilterGroup label="Listing Status">
                                                    <CustomDropdown
                                                        options={toOptions(filterOptions.listingStatus)}
                                                        value={filters.listingStatus}
                                                        onChange={(val) => updateFilter('listingStatus', val as string[])}
                                                        placeholder="Select Status"
                                                    />
                                                </FilterGroup>
                                            </div>

                                            {activeFilterChips.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Active:
                                                    </span>
                                                    {activeFilterChips.map((chip) => (
                                                        <ActiveFilterChip
                                                            key={`${chip.key}-${chip.index}`}
                                                            label={chip.label}
                                                            onRemove={() => handleRemoveChip(chip)}
                                                        />
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            clearDetailedPageState(TRUSTEES_DETAILED_PAGE, defaultDetailedState);
                                                        }}
                                                        className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium ml-1 transition-colors"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                            )}

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

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

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
                                                key={row.id}
                                                className={`
                                                    transition-colors
                                                    ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                                                `}
                                            >
                                                {filteredColumns.map((column) => (
                                                    <td
                                                        key={column.accessor}
                                                        className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200 ${column.accessor === 'issueValue' || column.accessor === 'faceValue' ? 'text-right' : ''}`}
                                                    >
                                                        {renderCell(row, column.accessor)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

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
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &laquo;
                                        </button>
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
                                                    <span key={index} className="px-2 text-gray-500">
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

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded disabled:opacity-40"
                                        >
                                            &rsaquo;
                                        </button>
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