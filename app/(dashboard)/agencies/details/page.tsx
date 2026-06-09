'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CustomDropdown from '@/components/CustomDropdown';
import { Search, Download, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

import { FilterOption, FilterState, TableDataItem } from './types';
import { fetchIssueDetailsFilterInputsData } from '@/features/issuers/services';
import { fetchRatingAgencyDetailedData } from '@/features/ratingAgencies/services';


// Helper to get current financial year dates (India: April 1 - March 31)
const getCurrentFinancialYearDates = () => {
    const today = new Date('2026-05-07'); // Current date
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed, April = 3

    // Financial year starts April 1
    // If current month is Jan-Mar, FY started previous year
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;

    const startDate = `${fyStartYear}-04-01`;
    const endDate = today.toISOString().split('T')[0]; // 2026-05-07

    return { startDate, endDate };
};

const DEFAULT_DATES = getCurrentFinancialYearDates();

// ─── Types ─────────────────────────────────────────────────────────────────

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

interface Column {
    header: string;
    accessor: string;
}

const allColumns: Column[] = [
    { header: 'Rating Agency', accessor: 'creditRatingAgency' },
    { header: 'Issuer Name', accessor: 'issuerName' },
    { header: 'ISIN', accessor: 'isin' },
    { header: 'Security Name', accessor: 'securityName' },
    { header: 'Nature', accessor: 'nature' },
    { header: 'Ownership Type', accessor: 'ownershipType' },
    { header: 'Sector', accessor: 'sector' },
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
    'creditRatingAgency',
    'issuerName',
    'isin',
    'securityName',
    'nature',
    'ownershipType',
    'sector',
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetailedAnalysis() {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isinHandler = (item: any): void => {
        router.push(`/specific-issuer/${item?.id}`);
    };

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        registrar: '',
        issuerOwnershipType: '',
        issuerNatureType: '',
        businessSector: '',
        fromAllotmentDate: DEFAULT_DATES.startDate,  // 2026-04-01
        toAllotmentDate: DEFAULT_DATES.endDate,        // 2026-05-07
        securityType: '',
        modeOfIssue: '',
        creditRatingAgency: '',
        creditRating: '',
        seniority: '',
        servicedFlag: '',
        listingStatus: '',
        taxFree: '',
        dealSizeInCr: '',
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
                registrar: filters.registrar,
                rating: filters.creditRating,
                seniority: filters.seniority,
                securityType: filters.securityType,
                taxFree: filters.taxFree,
                securedFlag: filters.servicedFlag,
                sector: filters.businessSector,
                nature: filters.issuerNatureType,
                ownershipType: filters.issuerOwnershipType,
                creditRatingAgency: filters.creditRatingAgency,
                dealSize: filters.dealSizeInCr,
                listingStatus: filters.listingStatus,
                modeOfIssue: filters.modeOfIssue
            };

            const result: PaginatedResponse = await fetchRatingAgencyDetailedData(requestBody);

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
                arranger: item.arranger || '-',
                trustee: item.debentureTrustee || '-',
                registrar: item.registrar || '-',
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

            console.log("mappedData", mappedData)

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
    }, [filters, currentPage, pageSize]);

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
        fetchData();
    };

    // Handle reset
    const handleReset = () => {
        setFilters({
            registrar: '',
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
            taxFree: '',
            dealSizeInCr: '',
        });
        setSearchQuery('');
        setCurrentPage(1);
        setVisibleColumns(defaultColumns);
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
    const handleExport = useCallback(() => {
        if (tableData.length === 0) {
            console.warn('No data to export');
            return;
        }

        // Build export data from visible columns only
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

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = filteredColumns.map(() => ({ wch: 15 }));
        worksheet['!cols'] = colWidths;

        // Create workbook and append worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rating Agency Analysis');

        // Generate filename with current date
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `rating-agency-detailed-analysis-${dateStr}.xlsx`;

        // Trigger download
        XLSX.writeFile(workbook, filename);
    }, [tableData, filteredColumns]);

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
                <span className="block">
                    {formatCurrency(value as number)}
                </span>
            );
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

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title & Breadcrumb ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rating Agencies Detailed Analysis</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Rating Agency <span className="mx-1">&gt;</span> Detailed Analysis
                    </p>
                </div>

                {/* ── Filters Section ── */}
                <SectionCard className="p-5">
                    {isFiltersLoading ? (
                        <FilterSkeleton />
                    ) : (
                        <>
                            {/* Filter Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                                <FilterGroup label="Rating Agency Name">
                                    <TextInput
                                        value={filters.creditRatingAgency}
                                        onChange={(val) => updateFilter('creditRatingAgency', val)}
                                        placeholder="Enter Rating Agency Name"
                                        type="text"
                                    />
                                </FilterGroup>

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

                                <FilterGroup label="Security Type">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.securityType)}
                                        value={filters.securityType}
                                        onChange={(val) => updateFilter('securityType', val)}
                                        placeholder="Select Security"
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

                                <FilterGroup label="Tax Free">
                                    <CustomDropdown
                                        options={toOptions(filterOptions.taxFree)}
                                        value={filters.taxFree}
                                        onChange={(val) => updateFilter('taxFree', val)}
                                        placeholder="Select Tax Status"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Deal Size (in Cr)">
                                    <TextInput
                                        value={filters.dealSizeInCr}
                                        onChange={(val) => updateFilter('dealSizeInCr', val)}
                                        placeholder="Enter Size"
                                        type="number"
                                    />
                                </FilterGroup>
                            </div>

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
                                    placeholder="Search ISIN..."
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
                                                key={row.id}
                                                className={`
                                                    transition-colors
                                                    ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                                                `}
                                            >
                                                {filteredColumns.map((column) => (
                                                    <td
                                                        key={column.accessor}
                                                        className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200 ${
                                                            column.accessor === 'issueValue' || column.accessor === 'faceValue' ? 'text-right' : ''
                                                        }`}
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Show</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
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
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">entries</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-[10px] font-medium rounded-md border border-gray-200 dark:border-gray-700 
                                                text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 
                                                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {[...Array(Math.min(5, Math.ceil(totalCount / pageSize)))].map((_, i) => {
                                            const page = i + 1;
                                            const isActive = page === currentPage;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`
                                                        px-3 py-1.5 text-[10px] font-medium rounded-md transition-colors
                                                        ${isActive
                                                            ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                            : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }
                                                    `}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                                            className="px-3 py-1.5 text-[10px] font-medium rounded-md border border-gray-200 dark:border-gray-700 
                                                text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 
                                                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
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