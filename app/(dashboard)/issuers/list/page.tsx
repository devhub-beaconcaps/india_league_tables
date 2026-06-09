'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Search, Download, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchIssuerMonthlyDetailedData } from '@/features/issuers/services';

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

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

function getCurrentFinancialYear(): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-indexed, so +1

    // Financial Year starts in April (month 4)
    // If current month is April or later, FY is current year to next year
    // Otherwise, FY is previous year to current year
    if (currentMonth >= 4) {
        return `${currentYear}-${currentYear + 1}`;
    } else {
        return `${currentYear - 1}-${currentYear}`;
    }
}

function getDateRange(period: string, fy: string): { startDate: string; endDate: string } | null {
    const fyData = parseFY(fy);
    if (!fyData) return null;
    const { startYear, endYear } = fyData;
    const p = period.toLowerCase().trim();

    let startDate: string;
    let endDate: string;

    // ── Quarters ──
    if (p === 'q1') {
        startDate = `${startYear}-04-01`;
        endDate = `${startYear}-06-30`;
    } else if (p === 'q2') {
        startDate = `${startYear}-07-01`;
        endDate = `${startYear}-09-30`;
    } else if (p === 'q3') {
        startDate = `${startYear}-10-01`;
        endDate = `${startYear}-12-31`;
    } else if (p === 'q4') {
        startDate = `${endYear}-01-01`;
        endDate = `${endYear}-03-31`;
    } else {
        // ── Months ──
        const monthNum = getMonthNumber(p);
        if (monthNum === null) return null;

        const year = monthNum >= 4 && monthNum <= 12 ? startYear : endYear;
        const lastDay = getLastDayOfMonth(year, monthNum);
        const mm = monthNum.toString().padStart(2, '0');

        startDate = `${year}-${mm}-01`;
        endDate = `${year}-${mm}-${lastDay}`;
    }

    // Clamp endDate to today if it's in the future
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (endDate > todayStr) {
        endDate = todayStr;
    }

    return { startDate, endDate };
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface TableDataItem {
    issuerId: string;
    issuerName: string;
    isin: string;
    securityName: string;
    securityType: string;
    modeOfIssue: string;
    allotmentDate: string;
    maturityDate: string;
    couponRate: string;
    issueSize: number | null;
    faceValue: number | null;
    rating: string;
    creditRatingAgency: string;
    debentureTrustee: string;
    registrar: string;
    arranger: string;
    seniority: string;
    taxFree: string;
    securedFlag: string;
    listingStatus: string;
    issuerMasterId: string;
}

interface PaginatedApiResponse {
    success: boolean;
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// ─────────────────────────────────────────────────────────────
// TABLE CONFIG
// ─────────────────────────────────────────────────────────────

const TABLE_COLUMNS = [
    { key: 'securityName', label: 'Security Name' },
    { key: 'securityType', label: 'Security Type' },
    { key: 'modeOfIssue', label: 'Mode of Issue' },
    { key: 'allotmentDate', label: 'Allotment Date' },
    { key: 'maturityDate', label: 'Maturity Date' },
    { key: 'couponRate', label: 'Coupon Rate' },
    { key: 'issueSize', label: 'Issue Size' },
    { key: 'faceValue', label: 'Face Value' },
    { key: 'rating', label: 'Rating' },
    { key: 'creditRatingAgency', label: 'Rating Agency' },
    { key: 'debentureTrustee', label: 'Debenture Trustee' },
    { key: 'registrar', label: 'Registrar' },
    { key: 'arranger', label: 'Arranger' },
    { key: 'seniority', label: 'Seniority' },
    { key: 'taxFree', label: 'Tax Free' },
    { key: 'securedFlag', label: 'Secured Flag' },
    { key: 'listingStatus', label: 'Listing Status' },
];

// ─────────────────────────────────────────────────────────────
// SKELETON & EMPTY STATE
// ─────────────────────────────────────────────────────────────

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

function NoDataState({ message = 'No data available', subMessage }: { message?: string; subMessage?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{message}</h3>
            {subMessage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{subMessage}</p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function IssuerListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const period = searchParams.get('period') || 'Q1';
    const fy = searchParams.get('fy') || getCurrentFinancialYear();

    const dateRange = useMemo(() => {
        return getDateRange(period, fy);
    }, [period, fy]);

    // ── Table State ──
    const [tableData, setTableData] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState<string>('issuerName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [error, setError] = useState<string | null>(null);

    // ── Helpers ──
    const formatCurrency = (value: number | null): string => {
        if (value === null || value === undefined || value === 0) return '-';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const isinHandler = (item: TableDataItem): void => {
        if (item.issuerId && item.issuerId !== '-') {
            router.push(`/specific-issuer/${item.issuerId}`);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // ── Data Fetch ──
    const fetchData = useCallback(async () => {
        if (!dateRange) return;

        setIsLoading(true);
        setError(null);

        try {
            const offset = (currentPage - 1) * pageSize;
            const trimmedSearch = searchQuery.trim();

            // Simple heuristic: if query looks like an ISIN (uppercase, no spaces, length >= 8)
            // send it as `isin`, otherwise send as `issuerName`.
            const looksLikeISIN = /^[A-Z0-9]{8,12}$/i.test(trimmedSearch) && !trimmedSearch.includes(' ');

            const requestBody = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                limit: pageSize,
                offset: offset,
                issuerName: !looksLikeISIN ? trimmedSearch : '',
                isin: looksLikeISIN ? trimmedSearch : '',
                rating: '',
                seniority: '',
                taxFree: '',
                securedFlag: '',
                trustee: '',
                creditRatingAgency: '',
                listingStatus: '',
                securityType: '',
                modeOfIssue: '',
                arranger: '',
                registrar: '',
            };

            const result: PaginatedApiResponse = await fetchIssuerMonthlyDetailedData(requestBody);

            if (result?.success) {
                const mapped: TableDataItem[] = result.data.map((item: any) => ({
                    issuerId: item?.issuerId || '-',
                    issuerName: item?.issuerName || '-',
                    isin: item?.isin || '-',
                    securityName: item?.securityName || '-',
                    securityType: item?.securityType || '-',
                    modeOfIssue: item?.modeOfIssue || '-',
                    allotmentDate: item?.allotmentDate || '-',
                    maturityDate: item?.maturityDate || '-',
                    couponRate: item?.couponRate || '-',
                    issueSize: item?.issueSize ?? null,
                    faceValue: item?.faceValue ?? null,
                    rating: item?.rating || '-',
                    creditRatingAgency: item?.creditRatingAgency || '-',
                    debentureTrustee: item?.debentureTrustee || '-',
                    registrar: item?.registrar || '-',
                    arranger: item?.arranger || '-',
                    seniority: item?.seniority || '-',
                    taxFree: item?.taxFree || '-',
                    securedFlag: item?.securedFlag || '-',
                    listingStatus: item?.listingStatus || '-',
                    issuerMasterId: item?.issuerMasterId || '-',
                }));

                setTableData(mapped);
                setTotalCount(result.pagination?.total || 0);
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (err: any) {
            console.error('Error fetching issuer list data:', err);
            setError(err?.message || 'Failed to fetch data');
            setTableData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, currentPage, pageSize, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Search Handlers ──
    const handleSearch = () => {
        setCurrentPage(1);
        fetchData();
    };

    const handleReset = () => {
        setSearchQuery('');
        setCurrentPage(1);
        // slight delay so state clears before fetch
        setTimeout(() => fetchData(), 0);
    };

    const handleExport = () => {
        if (!tableData || tableData.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            // Prepare headers: Issuer Name + ISIN + TABLE_COLUMNS
            const headers = ['Issuer Name', 'ISIN', ...TABLE_COLUMNS.map(col => col.label)];

            // Prepare data rows
            const dataRows = tableData.map(row => [
                row.issuerName,
                row.isin,
                ...TABLE_COLUMNS.map(col => {
                    const value = (row as any)[col.key];
                    // Format currency values if numeric
                    if (col.key === 'issueSize' || col.key === 'faceValue') {
                        return typeof value === 'number' ? formatCurrency(value) : value;
                    }
                    return value || '-';
                })
            ]);

            // Create workbook and worksheet
            const worksheetData = [headers, ...dataRows];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const columnWidths = headers.map(header => ({ wch: 15 }));
            worksheet['!cols'] = columnWidths;

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Issuer List');

            // Generate filename with current date
            const now = new Date();
            const filename = `issuer-list-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;

            // Trigger download
            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        }
    };

    // ── Client-side sort (optional polish) ──
    const sortedData = useMemo(() => {
        if (!sortColumn) return tableData;
        const dir = sortDirection === 'asc' ? 1 : -1;
        return [...tableData].sort((a, b) => {
            const aVal = (a as any)[sortColumn] ?? '';
            const bVal = (b as any)[sortColumn] ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return (aVal - bVal) * dir;
            }
            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }, [tableData, sortColumn, sortDirection]);

    // ── Render ──
    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full space-y-4 font-sans text-gray-700 dark:text-gray-200 p-4">
                {/* Header */}
                <div className="flex flex-col items-start gap-3">
                    <button
                        onClick={handleBack}
                        className="cursor-pointer text-xs border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Go back"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Issuer List</h1>
                        <p className="text-[9px] text-gray-400 mb-6 mt-1">Issuer &gt; List</p>
                    </div>
                </div>


                {/* Params / Date-Range Card */}
                <div className="bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 p-5 space-y-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400">Period</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {period || '—'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400">Financial Year</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {fy || '—'}
                            </span>
                        </div>
                    </div>

                    {dateRange && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-gray-400">Start Date</label>
                                <span className="text-sm font-bold text-[#423CAB]">{dateRange.startDate}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-gray-400">End Date</label>
                                <span className="text-sm font-bold text-[#423CAB]">{dateRange.endDate}</span>
                            </div>
                        </div>
                    )}

                    {!dateRange && period && fy && (
                        <p className="text-[9px] text-red-500 pt-2">Invalid period or financial year format.</p>
                    )}
                </div>

                {/* Search + Table Card */}
                <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Search Results</h2>
                            {!isLoading && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                    {totalCount} records
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by ISIN or Issuer Name..."
                                    className="w-full h-8 pl-3 pr-9 text-xs bg-gray-50 dark:bg-[#0f0f1a] border border-gray-200 dark:border-gray-700 rounded-lg
                                        text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                                        placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                />
                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>

                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-4 h-8 text-xs font-medium transition-all shadow-sm"
                            >
                                <Search className="w-3.5 h-3.5" />
                                Search
                            </button>

                            <button
                                onClick={handleExport}
                                className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </button>

                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg px-4 h-8 text-xs font-medium transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Clear
                            </button>
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
                        ) : sortedData.length > 0 ? (
                            <div className="rounded-xl bg-white dark:bg-gray-900 overflow-x-auto">
                                <table className="w-full table-auto border-separate border-spacing-[4px] text-[12px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                                            <th
                                                className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[180px]"
                                                onClick={() => handleSort('issuerName')}
                                            >
                                                <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                    Issuer Name
                                                    {sortColumn === 'issuerName' && (
                                                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[140px]"
                                                onClick={() => handleSort('isin')}
                                            >
                                                <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                    ISIN
                                                    {sortColumn === 'isin' && (
                                                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            {TABLE_COLUMNS.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[120px]"
                                                    onClick={() => handleSort(column.key)}
                                                >
                                                    <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                        {column.label}
                                                        {sortColumn === column.key && (
                                                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedData.map((row, index) => (
                                            <tr
                                                key={`${row.isin}-${index}`}
                                                className={`transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}
                                            >
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[180px] text-gray-800 dark:text-gray-200">
                                                    {row.issuerName}
                                                </td>
                                                <td
                                                    onClick={() => isinHandler(row)}
                                                    className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[140px] underline text-blue-500 decoration-sky-500 cursor-pointer"
                                                >
                                                    {row.isin}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[140px] text-gray-800 dark:text-gray-200">
                                                    {row.securityName}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    <span
                                                        className={`
                                                            inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                                                            ${row.securityType === 'Equity' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                                            ${row.securityType === 'Debentures' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                                                            ${row.securityType === 'Mutual Fund' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                                            ${row.securityType === 'Hybrid Fund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                                            ${!['Equity', 'Debentures', 'Mutual Fund', 'Hybrid Fund'].includes(row.securityType) ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                                                        `}
                                                    >
                                                        {row.securityType}
                                                    </span>
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    {row.modeOfIssue}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    {row.allotmentDate}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    {row.maturityDate}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                    {row.couponRate}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200 text-right">
                                                    {formatCurrency(row.issueSize)}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200 text-right">
                                                    {formatCurrency(row.faceValue)}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                    {row.rating}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                    {row.creditRatingAgency}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                    {row.debentureTrustee}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                    {row.registrar}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                    {row.arranger}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    {row.seniority}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                    {row.taxFree}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                    {row.securedFlag}
                                                </td>
                                                <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                    {row.listingStatus}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
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
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-[10px] font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {/* Simple page window: show up to 5 pages around current */}
                                        {(() => {
                                            const totalPages = Math.ceil(totalCount / pageSize) || 1;
                                            const pages: number[] = [];
                                            const start = Math.max(1, currentPage - 2);
                                            const end = Math.min(totalPages, start + 4);
                                            for (let i = start; i <= end; i++) pages.push(i);
                                            return pages.map((page) => {
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
                                            });
                                        })()}

                                        <button
                                            onClick={() => setCurrentPage((prev) => prev + 1)}
                                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                                            className="px-3 py-1.5 text-[10px] font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <NoDataState
                                message="No records found"
                                subMessage="Try adjusting your search or check the selected period & financial year."
                            />
                        )}
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
}