'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CustomDropdown from '@/components/CustomDropdown';
import { Search, Download, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

import {FilterOption, DateRange, FilterState, TableDataItem} from './types';


import {ISSUER_NAME_OPTIONS, ISSUER_OWNERSHIP_OPTIONS, ISSUER_NATURE_OPTIONS, BUSINESS_SECTOR_OPTIONS, SECURITY_TYPE_OPTIONS, MODE_OF_ISSUE_OPTIONS, CREDIT_RATING_AGENCY_OPTIONS, CREDIT_RATING_OPTIONS, SENIORITY_OPTIONS, SERVICED_FLAG_OPTIONS, LISTING_STATUS_OPTIONS, TAX_FREE_OPTIONS, DEAL_SIZE_OPTIONS, TENURE_OPTIONS, TABLE_COLUMNS} from './constants';
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
    value: string;
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

export default function ArrangersDetailedAnalysis() {
    const router = useRouter();

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        issuerName: '',
        issuerOwnershipType: '',
        issuerNatureType: '',
        businessSector: '',
        fromAllotmentDate: '',
        toAllotmentDate: '',
        securityType: '',
        modeOfIssue: '',
        creditRatingAgency: '',
        creditRating: '',
        seniority: '',
        servicedFlag: '',
        listingStatus: '',
        taxFree: '',
        dealSizeInCr: '',
        tenure: '',
        amountGreaterThanOrEqual: '',
        dayMoreThanOrEqual: '',
    });

    // Table states
    const [tableData, setTableData] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltersLoading, setIsFiltersLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [sortColumn, setSortColumn] = useState<string>('issuerName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');

    // Update filter helper
    const updateFilter = useCallback((key: keyof FilterState, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Simulate API call - replace with actual API
            // const response = await fetchDetailedAnalysisData({
            //     ...filters,
            //     page: currentPage,
            //     pageSize,
            //     sortColumn,
            //     sortDirection,
            //     searchQuery,
            // });

            // Simulated data matching the image
            const mockData: TableDataItem[] = [
                {
                    id: 1,
                    issuerName: '360 ONE GROWTH FUND',
                    securityName: '360 ONE',
                    securityType: 'Equity',
                    modeOfIssue: 'Public Offering',
                    issueValue: 95000,
                    faceValue: 95000,
                    allotmentDate: '15-Apr-2024',
                    dateOfMaturity: '15-Apr-2026',
                },
                {
                    id: 2,
                    issuerName: '360 ONE PRIME LIMITED',
                    securityName: '360 ONE',
                    securityType: 'Debentures',
                    modeOfIssue: 'Private Placement',
                    issueValue: 100000,
                    faceValue: 100000,
                    allotmentDate: '27-Mar-2024',
                    dateOfMaturity: '27-Mar-2026',
                },
                {
                    id: 3,
                    issuerName: '360 ONE EMERGING MARKETS',
                    securityName: '360 ONE',
                    securityType: 'Mutual Fund',
                    modeOfIssue: 'Public Offering',
                    issueValue: 100000,
                    faceValue: 100000,
                    allotmentDate: '10-Jan-2024',
                    dateOfMaturity: '10-Jan-2026',
                },
                {
                    id: 4,
                    issuerName: '360 ONE GROWTH FUND',
                    securityName: '360 ONE',
                    securityType: 'Equity',
                    modeOfIssue: 'Public Offering',
                    issueValue: 50000,
                    faceValue: 50000,
                    allotmentDate: '15-Apr-2024',
                    dateOfMaturity: '15-Apr-2026',
                },
                {
                    id: 5,
                    issuerName: '360 ONE PRIME LIMITED',
                    securityName: '360 ONE',
                    securityType: 'Debentures',
                    modeOfIssue: 'Private Placement',
                    issueValue: 100000,
                    faceValue: 100000,
                    allotmentDate: '27-Mar-2024',
                    dateOfMaturity: '27-Mar-2026',
                },
                {
                    id: 6,
                    issuerName: 'ADITYA BIRLA CAPITAL LIMITED',
                    securityName: '360 ONE',
                    securityType: 'Hybrid Fund',
                    modeOfIssue: 'Private Placement',
                    issueValue: 75000,
                    faceValue: 75000,
                    allotmentDate: '01-May-2024',
                    dateOfMaturity: '01-May-2026',
                },
                {
                    id: 7,
                    issuerName: '360 ONE BALANCED FUND',
                    securityName: '360 ONE',
                    securityType: 'Hybrid Fund',
                    modeOfIssue: 'Private Placement',
                    issueValue: 75000,
                    faceValue: 75000,
                    allotmentDate: '01-May-2024',
                    dateOfMaturity: '01-May-2026',
                },
                {
                    id: 8,
                    issuerName: '360 ONE BALANCED FUND',
                    securityName: '360 ONE',
                    securityType: 'Hybrid Fund',
                    modeOfIssue: 'Private Placement',
                    issueValue: 75000,
                    faceValue: 75000,
                    allotmentDate: '01-May-2024',
                    dateOfMaturity: '01-May-2026',
                },
            ];

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            setTableData(mockData);
            setTotalCount(100);
        } catch (err) {
            console.error('API Error:', err);
            setTableData([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, pageSize, sortColumn, sortDirection, searchQuery]);

    // Initial fetch
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
            issuerName: '',
            issuerOwnershipType: '',
            issuerNatureType: '',
            businessSector: '',
            fromAllotmentDate: '',
            toAllotmentDate: '',
            securityType: '',
            modeOfIssue: '',
            creditRatingAgency: '',
            creditRating: '',
            seniority: '',
            servicedFlag: '',
            listingStatus: '',
            taxFree: '',
            dealSizeInCr: '',
            tenure: '',
            amountGreaterThanOrEqual: '',
            dayMoreThanOrEqual: '',
        });
        setSearchQuery('');
        setCurrentPage(1);
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
        // Implement export logic
        console.log('Exporting data...');
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

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Title & Breadcrumb ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Detailed Analysis</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">
                        Reports <span className="mx-1">&gt;</span> Issuer <span className="mx-1">&gt;</span> Detailed Analysis
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
                                <FilterGroup label="Issuer Name">
                                    <CustomDropdown
                                        options={ISSUER_NAME_OPTIONS}
                                        value={filters.issuerName}
                                        onChange={(val) => updateFilter('issuerName', val)}
                                        placeholder="Select Issuer"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Issuer Ownership Type">
                                    <CustomDropdown
                                        options={ISSUER_OWNERSHIP_OPTIONS}
                                        value={filters.issuerOwnershipType}
                                        onChange={(val) => updateFilter('issuerOwnershipType', val)}
                                        placeholder="Select Ownership"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Issuer Nature Type">
                                    <CustomDropdown
                                        options={ISSUER_NATURE_OPTIONS}
                                        value={filters.issuerNatureType}
                                        onChange={(val) => updateFilter('issuerNatureType', val)}
                                        placeholder="Select Nature"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Business Sector">
                                    <CustomDropdown
                                        options={BUSINESS_SECTOR_OPTIONS}
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
                                        options={SECURITY_TYPE_OPTIONS}
                                        value={filters.securityType}
                                        onChange={(val) => updateFilter('securityType', val)}
                                        placeholder="Select Security"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Mode of Issue">
                                    <CustomDropdown
                                        options={MODE_OF_ISSUE_OPTIONS}
                                        value={filters.modeOfIssue}
                                        onChange={(val) => updateFilter('modeOfIssue', val)}
                                        placeholder="Select Mode"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Credit Rating Agency">
                                    <CustomDropdown
                                        options={CREDIT_RATING_AGENCY_OPTIONS}
                                        value={filters.creditRatingAgency}
                                        onChange={(val) => updateFilter('creditRatingAgency', val)}
                                        placeholder="Select Agency"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Credit Rating">
                                    <CustomDropdown
                                        options={CREDIT_RATING_OPTIONS}
                                        value={filters.creditRating}
                                        onChange={(val) => updateFilter('creditRating', val)}
                                        placeholder="Select Rating"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Seniority">
                                    <CustomDropdown
                                        options={SENIORITY_OPTIONS}
                                        value={filters.seniority}
                                        onChange={(val) => updateFilter('seniority', val)}
                                        placeholder="Select Seniority"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Serviced Flag">
                                    <CustomDropdown
                                        options={SERVICED_FLAG_OPTIONS}
                                        value={filters.servicedFlag}
                                        onChange={(val) => updateFilter('servicedFlag', val)}
                                        placeholder="Select Flag"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Listing Status">
                                    <CustomDropdown
                                        options={LISTING_STATUS_OPTIONS}
                                        value={filters.listingStatus}
                                        onChange={(val) => updateFilter('listingStatus', val)}
                                        placeholder="Select Status"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Tax Free">
                                    <CustomDropdown
                                        options={TAX_FREE_OPTIONS}
                                        value={filters.taxFree}
                                        onChange={(val) => updateFilter('taxFree', val)}
                                        placeholder="Select Tax Status"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Deal Size (in Cr)">
                                    <CustomDropdown
                                        options={DEAL_SIZE_OPTIONS}
                                        value={filters.dealSizeInCr}
                                        onChange={(val) => updateFilter('dealSizeInCr', val)}
                                        placeholder="Select Size"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Tenure">
                                    <CustomDropdown
                                        options={TENURE_OPTIONS}
                                        value={filters.tenure}
                                        onChange={(val) => updateFilter('tenure', val)}
                                        placeholder="Select Tenure"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Amount greater than or equal">
                                    <TextInput
                                        value={filters.amountGreaterThanOrEqual}
                                        onChange={(val) => updateFilter('amountGreaterThanOrEqual', val)}
                                        placeholder="Enter amount"
                                        type="number"
                                    />
                                </FilterGroup>

                                <FilterGroup label="Day more than or equal to">
                                    <TextInput
                                        value={filters.dayMoreThanOrEqual}
                                        onChange={(val) => updateFilter('dayMoreThanOrEqual', val)}
                                        placeholder="Enter days"
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
                    {/* Table Header with Search */}
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
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <TableSkeleton />
                        ) : tableData.length > 0 ? (
                            <div className="rounded-xl bg-white dark:bg-gray-900 overflow-x-auto">
                                <table className="w-full table-auto border-separate border-spacing-[4px] text-[12px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                                            <th className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] w-[30%]">
                                                Issuer Name
                                            </th>
                                            {TABLE_COLUMNS.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]`}
                                                    onClick={() => handleSort(column.key)}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {column.label}
                                                        {sortColumn === column.key && (
                                                            sortDirection === 'asc'
                                                                ? <ChevronUp className="w-3 h-3" />
                                                                : <ChevronDown className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="">
                                        {tableData.map((row, index) => (
                                            <tr
                                                key={row.id}
                                                className={`
                                                    transition-colors
                                                    ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                                                `}
                                            >
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    {row.issuerName}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    {row.securityName}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    <span className={`
                                                        inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                                                        ${row.securityType === 'Equity' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                                        ${row.securityType === 'Debentures' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                                                        ${row.securityType === 'Mutual Fund' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                                        ${row.securityType === 'Hybrid Fund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                                    `}>
                                                        {row.securityType}
                                                    </span>
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    {row.modeOfIssue}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200 text-right">
                                                    {formatCurrency(row.issueValue)}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200 text-right">
                                                    {formatCurrency(row.faceValue)}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    {row.allotmentDate}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                                                    {row.dateOfMaturity}
                                                </td>
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