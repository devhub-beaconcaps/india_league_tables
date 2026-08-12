'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Search, Download, X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { fetchRatingAgencyTopParticipantsData } from '@/features/ratingAgencies/services';

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES FOR ANIMATIONS
// ─────────────────────────────────────────────────────────────

const animationStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-8px);
    }
  }

  .dropdown-row-enter {
    animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .dropdown-row-exit {
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = animationStyles;
    document.head.appendChild(style);
}

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
    const currentMonth = today.getMonth() + 1;

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

    if (p === 'q1') {
        return { startDate: `${startYear}-04-01`, endDate: `${startYear}-06-30` };
    }
    if (p === 'q2') {
        return { startDate: `${startYear}-07-01`, endDate: `${startYear}-09-30` };
    }
    if (p === 'q3') {
        return { startDate: `${startYear}-10-01`, endDate: `${startYear}-12-31` };
    }
    if (p === 'q4') {
        return { startDate: `${endYear}-01-01`, endDate: `${endYear}-03-31` };
    }

    const monthNum = getMonthNumber(p);
    if (monthNum === null) return null;

    const year = monthNum >= 4 && monthNum <= 12 ? startYear : endYear;
    const lastDay = getLastDayOfMonth(year, monthNum);
    const mm = monthNum.toString().padStart(2, '0');

    return {
        startDate: `${year}-${mm}-01`,
        endDate: `${year}-${mm}-${lastDay}`,
    };
}

function formatLocalDate(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function getFullFYDateRange(
    fy: string
): { startDate: string; endDate: string } | null {
    const fyData = parseFY(fy);
    if (!fyData) return null;

    const { startYear, endYear } = fyData;

    const startDate = `${startYear}-04-01`;

    // FY end date
    const fyEndDate = new Date(`${endYear}-03-31`);

    // Today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use whichever is earlier
    const actualEndDate =
        fyEndDate > today
            ? formatLocalDate(today)
            : `${endYear}-03-31`;

    return {
        startDate,
        endDate: actualEndDate,
    };
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toISOString().split('T')[0];
    } catch {
        return '-';
    }
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

interface GroupedRecord {
    groupKey: string;
    issuerName: string;
    count: number;
    representativeRow: TableDataItem;
    records: TableDataItem[];
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
// GROUPING UTILITY
// ─────────────────────────────────────────────────────────────

/**
 * Groups raw table data by issuerName.
 * Uses the first record in each group as the representative row.
 */
function groupByIssuerAndDate(data: TableDataItem[]): GroupedRecord[] {
    const map = new Map<string, TableDataItem[]>();

    for (const item of data) {
        const key = JSON.stringify([item.issuerName, item.allotmentDate]);
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(item);
    }

    const sortedKeys = Array.from(map.keys()).sort();

    return sortedKeys.map((key) => {
        const records = map.get(key)!;
        return {
            groupKey: key,
            issuerName: records[0].issuerName,
            count: records.length,
            representativeRow: records[0],
            records,
        };
    });
}

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

export default function RatingAgencyTopParticipantsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL params: ?id=8&fy=2026-2027
    const agencyId = searchParams.get('id') || '';
    const fy = searchParams.get('fy') || getCurrentFinancialYear();
    const urlStartDate = searchParams.get('startDate') || '';
    const urlEndDate = searchParams.get('endDate') || '';

    // ── Helper: read array filters from URL ──
    const getFilterArray = useCallback((key: string): string[] => {
        const values = searchParams.getAll(key);
        return values.filter(v => v !== '' && v !== null && v !== undefined);
    }, [searchParams]);

    // ── Date range: prefer URL dates, fallback to FY ──
    const dateRange = useMemo(() => {
        if (urlStartDate && urlEndDate) {
            return { startDate: urlStartDate, endDate: urlEndDate };
        }
        return getFullFYDateRange(fy);
    }, [urlStartDate, urlEndDate, fy]);

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

    // ── Grouping State ──
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [closingGroups, setClosingGroups] = useState<Set<string>>(new Set());

    // ── Sort field mapping (UI key -> API snake_case field) ──
    const apiSortFieldMap: Record<string, string> = {
        issuerName: 'issuer_name',
        isin: 'isin',
        securityName: 'security_name',
        securityType: 'security_type',
        modeOfIssue: 'mode_issue',
        allotmentDate: 'allotment_date',
        maturityDate: 'maturity_date',
        couponRate: 'coupon_rate',
        issueSize: 'issue_size',
        faceValue: 'face_value',
        rating: 'rating',
        creditRatingAgency: 'agency_name',
        debentureTrustee: 'debenture_trustee_name',
        registrar: 'registrar_detail',
        arranger: 'arranger_name',
        seniority: 'seniority',
        taxFree: 'tax_free',
        securedFlag: 'secured_flag',
        listingStatus: 'listing_status',
    };

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

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                setClosingGroups((closing) => new Set([...closing, groupKey]));
                setTimeout(() => {
                    next.delete(groupKey);
                    setExpandedGroups(new Set(next));
                    setClosingGroups((closing) => {
                        const updated = new Set(closing);
                        updated.delete(groupKey);
                        return updated;
                    });
                }, 400);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    // ── Data Fetch ──
    const fetchData = useCallback(async () => {
        if (!dateRange || !agencyId) return;

        setIsLoading(true);
        setError(null);

        try {
            const offset = (currentPage - 1) * pageSize;
            const trimmedSearch = searchQuery.trim();

            // ── Read filters from URL query params ──
            const ownershipType = getFilterArray('ownershipType');
            const nature = getFilterArray('nature');
            const sector = getFilterArray('sector');
            const securityType = getFilterArray('securityType');
            const creditRatingAgency = getFilterArray('creditRatingAgency');
            const modeOfIssue = getFilterArray('modeOfIssue');
            const seniority = getFilterArray('seniority');
            const listingStatus = getFilterArray('listingStatus');
            const securedFlag = getFilterArray('securedFlag');
            const rating = getFilterArray('rating');
            const arranger = getFilterArray('arranger');

            const requestBody = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                agencyId: Number(agencyId),
                SearchQuery: trimmedSearch,
                limit: pageSize,
                offset: offset,
                sortField: apiSortFieldMap[sortColumn] || 'issuer_name',
                sortOrder: sortDirection.toUpperCase(),
                // Filters from URL
                ownershipType,
                nature,
                sector,
                securityType,
                creditRatingAgency,
                modeOfIssue,
                seniority,
                listingStatus,
                securedFlag,
                rating,
                arranger,
            };

            const result = await fetchRatingAgencyTopParticipantsData(requestBody);

            if (result?.success) {
                const mapped: TableDataItem[] = result.data.map((item: any) => ({
                    issuerId: item?.issuerId ?? '-',
                    issuerName: item?.issuer_name ?? '-',
                    isin: item?.isin ?? '-',
                    securityName: item?.security_name ?? '-',
                    securityType: item?.security_type ?? '-',
                    modeOfIssue: item?.mode_issue ?? '-',
                    allotmentDate: formatDate(item?.allotment_date),
                    maturityDate: formatDate(item?.maturity_date),
                    couponRate: item?.coupon_rate ?? '-',
                    issueSize: item?.issue_size ?? null,
                    faceValue: item?.face_value ?? null,
                    rating: item?.rating ?? '-',
                    creditRatingAgency: item?.agency_name ?? '-',
                    debentureTrustee: item?.debenture_trustee_name ?? '-',
                    registrar: item?.registrar_detail ?? '-',
                    arranger: item?.arranger_name ?? '-',
                    seniority: item?.seniority ?? '-',
                    taxFree: item?.tax_free ?? '-',
                    securedFlag: item?.secured_flag ?? '-',
                    listingStatus: item?.listing_status ?? '-',
                    issuerMasterId: item?.issuer_master_id ?? '-',
                }));

                setTableData(mapped);
                setTotalCount(result.totalRecords || 0);
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (err: any) {
            console.error('Error fetching rating agency top participants:', err);
            setError(err?.message || 'Failed to fetch data');
            setTableData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, agencyId, currentPage, pageSize, searchQuery, sortColumn, sortDirection, getFilterArray]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Grouped Data (memoized) ──
    const groupedData = useMemo(() => {
        return groupByIssuerAndDate(tableData);
    }, [tableData]);

    // ── Sorted Grouped Data ──
    const sortedGroupedData = useMemo(() => {
        if (!sortColumn) return groupedData;

        const sorted = [...groupedData];
        sorted.sort((a, b) => {
            const aVal = (a.representativeRow as any)[sortColumn];
            const bVal = (b.representativeRow as any)[sortColumn];

            if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
            if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? 1 : -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [groupedData, sortColumn, sortDirection]);

    // ── Pagination (driven by API raw-record count) ──
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // The API already limited raw records to `pageSize`.
    // Show ALL groups from the current fetch; no frontend slicing needed.
    const paginatedGroups = sortedGroupedData;

    // ── Search Handlers ──
    const handleSearch = () => {
        setCurrentPage(1);
        fetchData();
    };

    const handleReset = () => {
        setSearchQuery('');
        setCurrentPage(1);
        setTimeout(() => fetchData(), 0);
    };

    const handleExport = () => {
        if (!tableData || tableData.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            const headers = [
                'Rating Agency',
                'Issuer Name',
                'ISIN',
                ...TABLE_COLUMNS.filter((col) => col.key !== 'creditRatingAgency').map((col) => col.label),
            ];

            const dataRows = tableData.map((row) => [
                row.creditRatingAgency,
                row.issuerName,
                row.isin,
                ...TABLE_COLUMNS.filter((col) => col.key !== 'creditRatingAgency').map((col) => {
                    const value = (row as any)[col.key];
                    if (col.key === 'issueSize' || col.key === 'faceValue') {
                        return typeof value === 'number' ? formatCurrency(value) : value;
                    }
                    return value || '-';
                }),
            ]);

            const worksheetData = [headers, ...dataRows];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            const columnWidths = headers.map(() => ({ wch: 18 }));
            worksheet['!cols'] = columnWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Participants');

            const now = new Date();
            const filename = `rating-agency-top-participants-${now.getFullYear()}-${(now.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;

            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        }
    };

    // ── Pagination display helpers ──
    const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endEntry = Math.min(currentPage * pageSize, totalCount);

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
                        <h1 className="text-xl font-bold">Rating Agency Top Participants</h1>
                        <p className="text-xs text-gray-500 mt-1 mb-6">Rating Agency &gt; Top Participants</p>
                    </div>
                </div>

                {/* Params / Date-Range Card */}
                <div className="bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 p-5 space-y-5">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400">Rating Agency ID</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {agencyId || '—'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400">Financial Year</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {fy || '—'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400">Total Records</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {isLoading ? '...' : totalCount}
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

                    {!dateRange && fy && (
                        <p className="text-[9px] text-red-500 pt-2">Invalid financial year format.</p>
                    )}

                    {!agencyId && (
                        <p className="text-[9px] text-red-500 pt-2">Rating Agency ID is missing from URL parameters.</p>
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
                                    {totalCount} securities · {paginatedGroups.length} unique issuers
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
                                    placeholder="Search across all fields..."
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
                        ) : tableData.length > 0 ? (
                            <div className="rounded-xl bg-white dark:bg-gray-900 overflow-x-auto">
                                <table className="w-full table-auto border-separate border-spacing-[4px] text-[12px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
                                            {/* Expand/Collapse column */}
                                            <th className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] w-[40px]">
                                                <span className="sr-only">Expand</span>
                                            </th>
                                            {/* Rating Agency */}
                                            <th
                                                className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[160px]"
                                                onClick={() => handleSort('creditRatingAgency')}
                                            >
                                                <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                    Rating Agency
                                                    {sortColumn === 'creditRatingAgency' &&
                                                        (sortDirection === 'asc' ? (
                                                            <ChevronUp className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronDown className="w-3 h-3" />
                                                        ))}
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[180px]"
                                                onClick={() => handleSort('issuerName')}
                                            >
                                                <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                    Issuer Name
                                                    {sortColumn === 'issuerName' &&
                                                        (sortDirection === 'asc' ? (
                                                            <ChevronUp className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronDown className="w-3 h-3" />
                                                        ))}
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[140px]"
                                                onClick={() => handleSort('isin')}
                                            >
                                                <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                    ISIN
                                                    {sortColumn === 'isin' &&
                                                        (sortDirection === 'asc' ? (
                                                            <ChevronUp className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronDown className="w-3 h-3" />
                                                        ))}
                                                </div>
                                            </th>
                                            {TABLE_COLUMNS.filter((column) => column.key !== 'creditRatingAgency').map((column) => (
                                                <th
                                                    key={column.key}
                                                    className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] min-w-[120px]"
                                                    onClick={() => handleSort(column.key)}
                                                >
                                                    <div className="flex items-center gap-1 justify-center cursor-pointer">
                                                        {column.label}
                                                        {sortColumn === column.key &&
                                                            (sortDirection === 'asc' ? (
                                                                <ChevronUp className="w-3 h-3" />
                                                            ) : (
                                                                <ChevronDown className="w-3 h-3" />
                                                            ))}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedGroups.map((group, groupIndex) => {
                                            const isExpanded = expandedGroups.has(group.groupKey);
                                            const rep = group.representativeRow;
                                            const groupBgClass = groupIndex % 2 === 0
                                                ? 'bg-white dark:bg-gray-900'
                                                : 'bg-gray-50 dark:bg-gray-800';

                                            return (
                                                <React.Fragment key={group.groupKey}>
                                                    {/* Group Header Row */}
                                                    <tr
                                                        className={`transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${groupBgClass}`}
                                                    >
                                                        <td
                                                            className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 text-center"
                                                            onClick={() => {
                                                                if (group.count > 1) toggleGroup(group.groupKey);
                                                                else isinHandler(rep);
                                                            }}
                                                        >
                                                            {group.count > 1 ? (
                                                                isExpanded ? (
                                                                    <ChevronDown className="w-4 h-4 text-[#423CAB] dark:text-[#8b7cf7] mx-auto" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 text-[#423CAB] dark:text-[#8b7cf7] mx-auto" />
                                                                )
                                                            ) : (
                                                                <span className="sr-only">Single ISIN</span>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[160px] text-gray-800 dark:text-gray-200">
                                                            {rep.creditRatingAgency}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[180px] text-gray-800 dark:text-gray-200">
                                                            {rep.issuerName}
                                                        </td>
                                                        <td
                                                            onClick={() => {
                                                                if (group.count > 1) toggleGroup(group.groupKey);
                                                                else isinHandler(rep);
                                                            }}
                                                            className='border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[140px] underline text-blue-500 decoration-sky-500 cursor-pointer'
                                                        >
                                                            {group.count > 1 ? `${group.count} ${group.count === 1 ? 'ISIN' : 'ISINs'}` : rep.isin}
                                                        </td>

                                                        {/* remaining header <td>s — keep exactly as you have them */}
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[140px] text-gray-800 dark:text-gray-200">
                                                            {rep.securityName}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            <span
                                                                className={`
                            inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                            ${rep.securityType === 'Equity' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                            ${rep.securityType === 'Debentures' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                            ${rep.securityType === 'Mutual Fund' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                            ${rep.securityType === 'Hybrid Fund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                            ${rep.securityType === 'Municipal Bonds' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : ''}
                            ${!['Equity', 'Debentures', 'Mutual Fund', 'Hybrid Fund', 'Municipal Bonds'].includes(rep.securityType) ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                        `}
                                                            >
                                                                {rep.securityType}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.modeOfIssue}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.allotmentDate}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.maturityDate}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                            {rep.couponRate}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200 text-right">
                                                            {formatCurrency(rep.issueSize)}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200 text-right">
                                                            {formatCurrency(rep.faceValue)}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                            {rep.rating}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                            {rep.debentureTrustee}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                            {rep.registrar}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.arranger}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.seniority}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                            {rep.taxFree}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[100px] text-gray-800 dark:text-gray-200">
                                                            {rep.securedFlag}
                                                        </td>
                                                        <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
                                                            {rep.listingStatus}
                                                        </td>
                                                    </tr>

                                                    {/* Child Rows */}
                                                    {isExpanded && group.records.map((row, rowIndex) => (
                                                        <tr
                                                            key={`${row.isin}-${rowIndex}`}
                                                            className={`transition-colors ${closingGroups.has(group.groupKey)
                                                                ? 'dropdown-row-exit'
                                                                : 'dropdown-row-enter'
                                                                } ${rowIndex % 2 === 0
                                                                    ? 'bg-slate-200 dark:bg-black'
                                                                    : 'bg-slate-200 dark:bg-black'
                                                                } hover:bg-slate-200 dark:hover:bg-slate-900`}
                                                        >
                                                            {/* keep all child <td>s exactly as they are */}
                                                            <td className="relative border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 bg-inherit">
                                                                <span className="absolute left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#423CAB] dark:bg-[#8b7cf7]" />
                                                                <span className="sr-only">—</span>
                                                            </td>
                                                            <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[160px] text-gray-800 dark:text-gray-200 bg-inherit border-l-4 border-[#423CAB] dark:border-[#8b7cf7]">
                                                                {row.creditRatingAgency}
                                                            </td>
                                                            <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium break-words min-w-[180px] text-gray-800 dark:text-gray-200">
                                                                {row.issuerName}
                                                            </td>
                                                            <td
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    isinHandler(row);
                                                                }}
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
                                ${row.securityType === 'Municipal Bonds' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : ''}
                                ${!['Equity', 'Debentures', 'Mutual Fund', 'Hybrid Fund', 'Municipal Bonds'].includes(row.securityType) ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
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
                                                                {row.debentureTrustee}
                                                            </td>
                                                            <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[140px] text-gray-800 dark:text-gray-200">
                                                                {row.registrar}
                                                            </td>
                                                            <td className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-3 font-medium whitespace-nowrap min-w-[120px] text-gray-800 dark:text-gray-200">
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
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                            Showing {startEntry}–{endEntry} of {totalCount} securities
                                            ({paginatedGroups.length} issuers on this page)
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-[10px] font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {(() => {
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
                                            disabled={currentPage >= totalPages}
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
                                subMessage="Try adjusting your search or check the selected financial year."
                            />
                        )}
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
}