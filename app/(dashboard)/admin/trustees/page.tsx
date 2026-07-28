'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Check, AlertCircle, X, Loader2,
    List, Search, Globe, GitMerge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
    getAdminTrusteesData,
    getAdminSimilarTrusteesData,
    mergeTrusteesData
} from '@/features/admin/services';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrusteeItem {
    id: number;
    trustee_name: string;
    short_name: string | null;
    trustshpd: string | null;
    website: string | null;
    is_active: number | boolean;
    is_deleted: number | boolean;
    parent_id: number;
}

interface SimilarTrustee {
    id: number;
    name: string;
    short_name: string | null;
    trustee_name: string | null;
    trustshpd: string | null;
    website: string | null;
    is_active: number | boolean;
    is_deleted: number | boolean;
    similarity: number;
    similarityFormatted: string;
}

interface MergeApiResponse {
    success: boolean;
    message: string;
    data: {
        mainTrustee: {
            id: number;
            name: string;
            short_name: string | null;
            trustee_name: string | null;
            trustshpd: string | null;
            website: string | null;
            is_active: number | boolean;
            is_deleted: number | boolean;
        };
        similarTrustees: SimilarTrustee[];
        totalFound: number;
        threshold?: number;
    };
}

// ─── Column Configuration ────────────────────────────────────────────────────

interface ColumnConfig {
    key: string;
    label: string;
    width: string;
    align: 'left' | 'center' | 'right';
}

const LIST_COLUMN_CONFIG: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px', align: 'left' },
    { key: 'trustee_name', label: 'Trustee Name', width: '220px', align: 'left' },
    { key: 'short_name', label: 'Short Name', width: '160px', align: 'left' },
    { key: 'trustshpd', label: 'Trustshpd', width: '160px', align: 'left' },
    { key: 'is_active', label: 'Status', width: '90px', align: 'center' },
    { key: 'is_deleted', label: 'Deleted', width: '90px', align: 'center' },
    { key: 'website', label: 'Website', width: '100px', align: 'center' },
    { key: 'merge', label: 'Merge', width: '80px', align: 'center' },
];

// ─── Skeleton Components ─────────────────────────────────────────────────────

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton height={40} />
            {[...Array(rows)].map((_, i) => (
                <Skeleton key={i} height={50} />
            ))}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}>
        {children}
    </div>
);

function StatusBadge({ isActive }: { isActive: number | boolean }) {
    const active = isActive === 1 || isActive === true;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function DeletedBadge({ isDeleted }: { isDeleted: number | boolean }) {
    const deleted = isDeleted === 1 || isDeleted === true;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${deleted
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {deleted ? 'Yes' : 'No'}
        </span>
    );
}

// ─── Alert Banner Component ─────────────────────────────────────────────────

interface AlertBannerProps {
    type: 'success' | 'error';
    message: string;
    onDismiss?: () => void;
}

function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
    const isSuccess = type === 'success';
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                }`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isSuccess
                ? 'bg-emerald-100 dark:bg-emerald-800/40'
                : 'bg-red-100 dark:bg-red-800/40'
                }`}>
                {isSuccess ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${isSuccess ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                    {isSuccess ? 'Success' : 'Error'}
                </p>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${isSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {message}
                </p>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className={`p-1 rounded-md transition-colors flex-shrink-0 ${isSuccess
                        ? 'hover:bg-emerald-100 dark:hover:bg-emerald-800/40 text-emerald-500 dark:text-emerald-400'
                        : 'hover:bg-red-100 dark:hover:bg-red-800/40 text-red-500 dark:text-red-400'
                        }`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </motion.div>
    );
}

// ─── Merge Modal ─────────────────────────────────────────────────────────────

interface MergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    data: MergeApiResponse['data'] | null;
    loading: boolean;
    error: string | null;
    selectedIds: number[];
    onToggleId: (id: number) => void;
    isSubmitting: boolean;
}

function MergeModal({ isOpen, onClose, onSubmit, data, loading, error, selectedIds, onToggleId, isSubmitting }: MergeModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                        onClick={!isSubmitting ? onClose : undefined}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    >
                        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Merge Trustees</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        {data?.mainTrustee?.name
                                            ? `Main: ${data.mainTrustee.name}`
                                            : 'Select similar trustees to merge'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {loading && <TableSkeleton rows={4} />}
                                {error && (
                                    <div className="mb-3">
                                        <AlertBanner type="error" message={error} />
                                    </div>
                                )}
                                {!loading && !error && data && (
                                    <div className="space-y-2">
                                        {data.similarTrustees.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">No similar trustees found</p>
                                            </div>
                                        ) : (
                                            data.similarTrustees.map((item) => (
                                                <label
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => onToggleId(item.id)}
                                                        disabled={isSubmitting}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer disabled:opacity-50"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                            {item.name}
                                                        </p>
                                                        {item.short_name && (
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                                {item.short_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                                                        {item.similarityFormatted}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {selectedIds.length} selected
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                        className="px-4 h-9 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onSubmit}
                                        disabled={selectedIds.length === 0 || isSubmitting}
                                        className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                Submit Merge
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrusteesPage() {
    // ─── List States ─────────────────────────────────────────────────
    const [trustees, setTrustees] = useState<TrusteeItem[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [listSearch, setListSearch] = useState('');
    const [listLimit, setListLimit] = useState(10);
    const [listOffset, setListOffset] = useState(0);
    const [listTotal, setListTotal] = useState(0);

    // ─── Alert States ────────────────────────────────────────────────
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ─── Merge States ────────────────────────────────────────────────
    const [mergeModalOpen, setMergeModalOpen] = useState(false);
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeError, setMergeError] = useState<string | null>(null);
    const [mergeData, setMergeData] = useState<MergeApiResponse['data'] | null>(null);
    const [selectedMergeIds, setSelectedMergeIds] = useState<number[]>([]);
    const [currentMergeTrusteeId, setCurrentMergeTrusteeId] = useState<number | null>(null);
    const [isMergeSubmitting, setIsMergeSubmitting] = useState(false);

    // ─── Fetch Trustees ─────────────────────────────────────────────
    const fetchTrustees = useCallback(async (limit: number, offset: number) => {
        setListLoading(true);
        setListError(null);
        try {
            const result = await getAdminTrusteesData({ limit, offset });
            console.log('result fetched trustees', result);

            if (result.success) {
                setTrustees(result.data);
                setListTotal(result.pagination.total);
            } else {
                setListError(result.error || 'Failed to fetch trustees');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setListError('Network error. Please try again.');
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrustees(listLimit, listOffset);
    }, [listLimit, listOffset, fetchTrustees]);

    // ─── Merge Handlers ──────────────────────────────────────────────
    const openMergeModal = useCallback(async (trusteeId: number) => {
        setCurrentMergeTrusteeId(trusteeId);
        setMergeModalOpen(true);
        setMergeLoading(true);
        setMergeError(null);
        setMergeData(null);
        setSelectedMergeIds([]);

        try {
            const result = await getAdminSimilarTrusteesData(trusteeId);
            if (result.success) {
                setMergeData(result.data);
            } else {
                setMergeError(result.message || 'Failed to fetch similar trustees');
            }
        } catch (err) {
            console.error('Merge fetch error:', err);
            setMergeError('Network error while fetching similar trustees');
        } finally {
            setMergeLoading(false);
        }
    }, []);

    const toggleMergeSelection = useCallback((id: number) => {
        setSelectedMergeIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const handleMergeSubmit = useCallback(async () => {
        if (currentMergeTrusteeId === null || currentMergeTrusteeId === undefined) return;

        setIsMergeSubmitting(true);
        setSubmitSuccess(null);
        setSubmitError(null);

        try {
            const payload = {
                mainTrusteeId: Number(currentMergeTrusteeId),      // <-- parse to number
                mergeTrusteeIds: selectedMergeIds.map(id => Number(id)), // <-- parse each to number
            };

            const result = await mergeTrusteesData(payload);

            if (result?.success) {
                setSubmitSuccess(result?.message || `Successfully merged ${selectedMergeIds.length} trustee(s).`);
                setMergeModalOpen(false);
                setSelectedMergeIds([]);
                setCurrentMergeTrusteeId(null);
                setMergeData(null);
                fetchTrustees(listLimit, listOffset);
            } else {
                setSubmitError(result?.message || 'Merge failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Merge submission error:', err);
            setSubmitError(err?.message || 'Failed to merge trustees. Please check your connection and try again.');
        } finally {
            setIsMergeSubmitting(false);
        }
    }, [currentMergeTrusteeId, selectedMergeIds, listLimit, listOffset, fetchTrustees]);

    // ─── List Pagination Helpers ─────────────────────────────────────
    const listTotalPages = Math.ceil(listTotal / listLimit) || 1;
    const listCurrentPage = Math.floor(listOffset / listLimit) + 1;

    const goToListPage = (page: number) => {
        const newOffset = (page - 1) * listLimit;
        setListOffset(newOffset);
    };

    const filteredTrustees = React.useMemo(() => {
        if (!listSearch.trim()) return trustees;
        const q = listSearch.toLowerCase();
        return trustees.filter(t =>
            (t.trustee_name?.toLowerCase() || '').includes(q) ||
            (t.short_name?.toLowerCase() || '').includes(q) ||
            (t.trustshpd?.toLowerCase() || '').includes(q) ||
            String(t.id).includes(q)
        );
    }, [trustees, listSearch]);

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Header ── */}
                <SectionCard>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                Trustees
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Trustees &gt; List
                            </p>
                        </div>
                    </div>
                </SectionCard>

                {/* ── Alert Banners ── */}
                <AnimatePresence>
                    {submitSuccess && (
                        <AlertBanner type="success" message={submitSuccess} onDismiss={() => setSubmitSuccess(null)} />
                    )}
                    {submitError && (
                        <AlertBanner type="error" message={submitError} onDismiss={() => setSubmitError(null)} />
                    )}
                </AnimatePresence>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* LIST VIEW                                                  */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <SectionCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <List className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Trustees List
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px]">
                                {listTotal} total
                            </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search trustees..."
                                    value={listSearch}
                                    onChange={(e) => setListSearch(e.target.value)}
                                    className="w-full sm:w-56 pl-8 pr-3 h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <select
                                value={listLimit}
                                onChange={(e) => { setListLimit(Number(e.target.value)); setListOffset(0); }}
                                className="h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                            </select>
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        {listLoading ? (
                            <TableSkeleton rows={listLimit} />
                        ) : listError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                                    <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{listError}</p>
                                <button
                                    onClick={() => fetchTrustees(listLimit, listOffset)}
                                    className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredTrustees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <List className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">No trustees found</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                                    {listSearch ? 'No results match your search.' : 'The trustees list is currently empty.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full text-[11px] border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                                                {LIST_COLUMN_CONFIG.map((col) => (
                                                    <th
                                                        key={col.key}
                                                        className={`px-3 py-2.5 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                                                        style={{ minWidth: col.width }}
                                                    >
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {filteredTrustees.map((row, index) => (
                                                <tr
                                                    key={row.id}
                                                    className={`group transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-[#1a1a2e]' : 'bg-gray-50/50 dark:bg-gray-800/20'} hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10`}
                                                >
                                                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                                                        {row.id}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                                                        {row.trustee_name || '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                                        {row.short_name || '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                                        {row.trustshpd || '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <StatusBadge isActive={row.is_active} />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <DeletedBadge isDeleted={row.is_deleted} />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        {row.website ? (
                                                            <a
                                                                href={row.website.startsWith('http') ? row.website : `https://${row.website}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                                title={row.website}
                                                            >
                                                                <Globe className="w-3.5 h-3.5" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button
                                                            onClick={() => openMergeModal(row.id)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                            title="Find similar trustees to merge"
                                                        >
                                                            <GitMerge className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* List Pagination */}
                                {listTotalPages > 1 && !listSearch && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            Showing {listOffset + 1} to {Math.min(listOffset + filteredTrustees.length, listTotal)} of {listTotal} entries
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => goToListPage(1)}
                                                disabled={listCurrentPage === 1}
                                                className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                First
                                            </button>
                                            <button
                                                onClick={() => goToListPage(Math.max(1, listCurrentPage - 1))}
                                                disabled={listCurrentPage === 1}
                                                className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Prev
                                            </button>

                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: Math.min(5, listTotalPages) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (listTotalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (listCurrentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (listCurrentPage >= listTotalPages - 2) {
                                                        pageNum = listTotalPages - 4 + i;
                                                    } else {
                                                        pageNum = listCurrentPage - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => goToListPage(pageNum)}
                                                            className={`w-7 h-7 text-[10px] rounded-md transition-colors ${listCurrentPage === pageNum
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => goToListPage(Math.min(listTotalPages, listCurrentPage + 1))}
                                                disabled={listCurrentPage === listTotalPages}
                                                className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                            <button
                                                onClick={() => goToListPage(listTotalPages)}
                                                disabled={listCurrentPage === listTotalPages}
                                                className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Last
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* ── Merge Modal ── */}
                <MergeModal
                    isOpen={mergeModalOpen}
                    onClose={() => {
                        if (isMergeSubmitting) return;
                        setMergeModalOpen(false);
                        setSelectedMergeIds([]);
                        setCurrentMergeTrusteeId(null);
                        setMergeData(null);
                        setMergeError(null);
                    }}
                    onSubmit={handleMergeSubmit}
                    data={mergeData}
                    loading={mergeLoading}
                    error={mergeError}
                    selectedIds={selectedMergeIds}
                    onToggleId={toggleMergeSelection}
                    isSubmitting={isMergeSubmitting}
                />
            </div>
        </SkeletonTheme>
    );
}