'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
    Upload, FileSpreadsheet, Check, AlertCircle, Trash2, Table, X, Loader2,
    List, Search, ChevronLeft, ChevronRight, Globe, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { getAdminArrangersData, postArrangersData } from '@/features/admin/services';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
    [key: string]: string | number | boolean | null;
}

interface UploadPayloadItem {
    isin: string;
    issuerDetailsIssuerName: string;
    arrangerDetailsArranger: string;
}

interface ArrangerItem {
    id: number;
    arranger_name: string;
    contact_person: string | null;
    contact_no: string | null;
    email_id: string | null;
    smt_status: string | null;
    is_active: number | boolean;
    website: string | null;
}

// ─── Column Configuration ────────────────────────────────────────────────────

interface ColumnConfig {
    key: string;
    label: string;
    width: string;
    align: 'left' | 'center' | 'right';
}

const UPLOAD_COLUMN_CONFIG: ColumnConfig[] = [
    { key: 'isin', label: 'ISIN', width: '160px', align: 'left' },
    { key: 'issuerDetailsIssuerName', label: 'Issuer Name', width: '220px', align: 'left' },
    { key: 'arrangerDetailsArranger', label: 'Arranger', width: '200px', align: 'left' },
];

const LIST_COLUMN_CONFIG: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px', align: 'left' },
    { key: 'arranger_name', label: 'Arranger Name', width: '220px', align: 'left' },
    { key: 'contact_person', label: 'Contact Person', width: '160px', align: 'left' },
    { key: 'contact_no', label: 'Contact No', width: '130px', align: 'left' },
    { key: 'email_id', label: 'Email', width: '200px', align: 'left' },
    { key: 'smt_status', label: 'SMT Status', width: '100px', align: 'center' },
    { key: 'is_active', label: 'Status', width: '90px', align: 'center' },
    { key: 'website', label: 'Website', width: '100px', align: 'center' },
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

// ─── Confirmation Modal ──────────────────────────────────────────────────────

interface ConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    rowCount: number;
    columnCount: number;
    fileName: string;
    isSubmitting: boolean;
}

function ConfirmModal({ isOpen, onConfirm, onCancel, rowCount, columnCount, fileName, isSubmitting }: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                        onClick={!isSubmitting ? onCancel : undefined}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    >
                        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Confirm Submission</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Please review before proceeding</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">File Name</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{fileName}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Total Rows</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{rowCount}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Mapped Fields</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{columnCount}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                    className="px-4 h-9 text-xs cursor-pointer font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Confirm & Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Data Transformation ─────────────────────────────────────────────────────

function transformData(rawData: ParsedRow[]): { data: UploadPayloadItem[] } {
    const data = rawData.map((row) => {
        return {
            isin: String(row.ISIN ?? ''),
            issuerDetailsIssuerName: String(row.issuer_details_issuer_name ?? ''),
            arrangerDetailsArranger: String(row.arranger_details_arranger ?? ''),
        };
    });

    return { data };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArrangersPage() {
    const [activeView, setActiveView] = useState<'list' | 'upload'>('list');

    // ─── List States ─────────────────────────────────────────────────
    const [arrangers, setArrangers] = useState<ArrangerItem[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [listSearch, setListSearch] = useState('');
    const [listLimit, setListLimit] = useState(10);
    const [listOffset, setListOffset] = useState(0);
    const [listTotal, setListTotal] = useState(0);
    const [listHasMore, setListHasMore] = useState(false);

    // ─── Upload States ───────────────────────────────────────────────
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
    const [transformedPayload, setTransformedPayload] = useState<{ data: UploadPayloadItem[] } | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    // ─── Submission States ───────────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Fetch Arrangers ─────────────────────────────────────────────
    const fetchArrangers = useCallback(async (limit: number, offset: number) => {
        setListLoading(true);
        setListError(null);
        try {

            const result = await getAdminArrangersData({ limit, offset })
            console.log('result fetched arrangers', result);
            
            if (result.success) {
                setArrangers(result.data);
                setListTotal(result.pagination.total);
                setListHasMore(result.pagination.hasMore);
            } else {
                setListError(result.error || 'Failed to fetch arrangers');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setListError('Network error. Please try again.');
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeView === 'list') {
            fetchArrangers(listLimit, listOffset);
        }
    }, [activeView, listLimit, listOffset, fetchArrangers]);

    // ─── Upload Handlers ─────────────────────────────────────────────
    const parseExcel = useCallback(async (uploadedFile: File) => {
        setIsParsing(true);
        setError(null);
        setSubmitSuccess(null);
        setSubmitError(null);

        try {
            const data = await uploadedFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array", cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { defval: null, raw: true });

            if (!jsonData || jsonData.length === 0) {
                setError('The file appears to be empty or has no readable data.');
                setParsedData(null);
                setTransformedPayload(null);
            } else {
                setParsedData(jsonData);
                setTransformedPayload(transformData(jsonData));
                setCurrentPage(1);
            }
        } catch (err) {
            console.error('Error parsing Excel:', err);
            setError('Failed to parse the file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
            setParsedData(null);
            setTransformedPayload(null);
        } finally {
            setIsParsing(false);
        }
    }, []);

    const validateAndSetFile = useCallback((uploadedFile: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        const isValidType = validTypes.includes(uploadedFile.type) || uploadedFile.name.endsWith('.csv');
        if (!isValidType) {
            setError('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
            return;
        }
        setFile(uploadedFile);
        parseExcel(uploadedFile);
    }, [parseExcel]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        validateAndSetFile(uploadedFile);
    }, [validateAndSetFile]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;
        validateAndSetFile(droppedFile);
    }, [validateAndSetFile]);

    const handleRemoveFile = useCallback(() => {
        setFile(null);
        setParsedData(null);
        setTransformedPayload(null);
        setError(null);
        setCurrentPage(1);
        setSearchQuery('');
        setSubmitSuccess(null);
        setSubmitError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleSubmit = useCallback(() => {
        if (!transformedPayload || transformedPayload.data.length === 0) return;
        setShowConfirm(true);
    }, [transformedPayload]);

    const handleConfirm = useCallback(async () => {
        if (!transformedPayload) return;
        setIsSubmitting(true);
        setSubmitSuccess(null);
        setSubmitError(null);

        try {
            const res = await postArrangersData(transformedPayload);
            if (res?.success === true) {
                setSubmitSuccess(`Successfully processed ${res.processed ?? transformedPayload.data.length} record(s).`);
                setShowConfirm(false);
            } else {
                setSubmitError(res?.message || 'Something went wrong while submitting data. Please try again.');
                setShowConfirm(false);
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to submit data. Please check your connection and try again.';
            setSubmitError(errorMessage);
            setShowConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [transformedPayload]);

    const handleCancel = useCallback(() => {
        setShowConfirm(false);
    }, []);

    // ─── Upload Preview Pagination ───────────────────────────────────
    const filteredData = React.useMemo(() => {
        if (!transformedPayload?.data) return [];
        if (!searchQuery.trim()) return transformedPayload.data;
        const query = searchQuery.toLowerCase();
        return transformedPayload.data.filter(row =>
            row.isin.toLowerCase().includes(query) ||
            row.issuerDetailsIssuerName.toLowerCase().includes(query) ||
            row.arrangerDetailsArranger.toLowerCase().includes(query)
        );
    }, [transformedPayload, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const previewItems = paginatedData;

    // ─── List Pagination Helpers ─────────────────────────────────────
    const listTotalPages = Math.ceil(listTotal / listLimit) || 1;
    const listCurrentPage = Math.floor(listOffset / listLimit) + 1;

    const goToListPage = (page: number) => {
        const newOffset = (page - 1) * listLimit;
        setListOffset(newOffset);
    };

    const filteredArrangers = React.useMemo(() => {
        if (!listSearch.trim()) return arrangers;
        const q = listSearch.toLowerCase();
        return arrangers.filter(a =>
            (a.arranger_name?.toLowerCase() || '').includes(q) ||
            (a.contact_person?.toLowerCase() || '').includes(q) ||
            (a.email_id?.toLowerCase() || '').includes(q) ||
            String(a.id).includes(q) ||
            (a.contact_no?.toLowerCase() || '').includes(q)
        );
    }, [arrangers, listSearch]);

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Header ── */}
                <SectionCard>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {activeView === 'list' ? 'Arrangers' : 'Arrangers Upload'}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {activeView === 'list' ? 'Arrangers > List' : 'Arrangers > Upload'}
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveView(activeView === 'list' ? 'upload' : 'list')}
                            className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-4 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                        >
                            {activeView === 'list' ? (
                                <>
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload Arrangers
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to List
                                </>
                            )}
                        </button>
                    </div>
                </SectionCard>

                {/* ── Submission Alert Banners ── */}
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
                {activeView === 'list' && (
                    <SectionCard className="p-0 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <List className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Arrangers List
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px]">
                                    {listTotal} total
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search arrangers..."
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
                                        onClick={() => fetchArrangers(listLimit, listOffset)}
                                        className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : filteredArrangers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <List className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">No arrangers found</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                                        {listSearch ? 'No results match your search.' : 'The arrangers list is currently empty.'}
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
                                                {filteredArrangers.map((row, index) => (
                                                    <tr
                                                        key={row.id}
                                                        className={`group transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-[#1a1a2e]' : 'bg-gray-50/50 dark:bg-gray-800/20'} hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10`}
                                                    >
                                                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                                                            {row.id}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                                                            {row.arranger_name || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                                            {row.contact_person || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                                            {row.contact_no || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                                                            {row.email_id ? (
                                                                <a href={`mailto:${row.email_id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                                    {row.email_id}
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">
                                                            {row.smt_status || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <StatusBadge isActive={row.is_active} />
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* List Pagination */}
                                    {listTotalPages > 1 && !listSearch && (
                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                Showing {listOffset + 1} to {Math.min(listOffset + filteredArrangers.length, listTotal)} of {listTotal} entries
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
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* UPLOAD VIEW                                                */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeView === 'upload' && (
                    <SectionCard className="p-0">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Upload Excel File
                            </h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                Upload an Excel or CSV file to convert it into structured JSON data
                            </p>
                        </div>

                        <div className="px-5 py-6">
                            {!file ? (
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                        : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-400 dark:hover:border-gray-600'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                Supports .xlsx, .xls, .csv files
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* File Info */}
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                                <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    {(file.size / 1024).toFixed(1)} KB &middot; {transformedPayload?.data.length || 0} rows
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="p-2 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Parse Error Message */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300 text-xs overflow-hidden"
                                            >
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Transformed Data Preview */}
                                    {isParsing ? (
                                        <TableSkeleton />
                                    ) : transformedPayload && transformedPayload.data.length > 0 ? (
                                        <div className="space-y-3">
                                            {/* Table Header with Search & Pagination Controls */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                    <Table className="w-3.5 h-3.5" />
                                                    Mapped Data Preview
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px]">
                                                        {filteredData.length} rows
                                                    </span>
                                                </h3>

                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    {/* Search */}
                                                    <div className="relative flex-1 sm:flex-none">
                                                        <input
                                                            type="text"
                                                            placeholder="Search ISIN, issuer, arranger..."
                                                            value={searchQuery}
                                                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                                            className="w-full sm:w-52 pl-8 pr-3 h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                        />
                                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                                    </div>

                                                    {/* Rows per page */}
                                                    <select
                                                        value={rowsPerPage}
                                                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                        className="h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    >
                                                        <option value={10}>10 / page</option>
                                                        <option value={25}>25 / page</option>
                                                        <option value={50}>50 / page</option>
                                                        <option value={100}>100 / page</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Proper Table */}
                                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                <table className="w-full text-[11px] border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                                                            <th className="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-10">#</th>
                                                            {UPLOAD_COLUMN_CONFIG.map((col) => (
                                                                <th
                                                                    key={col.key}
                                                                    className={`px-3 py-2.5 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                                                    style={{ minWidth: col.width }}
                                                                >
                                                                    {col.label}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                        {previewItems.map((row, index) => {
                                                            const actualIndex = (currentPage - 1) * rowsPerPage + index;
                                                            return (
                                                                <tr
                                                                    key={actualIndex}
                                                                    className={`group transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-[#1a1a2e]' : 'bg-gray-50/50 dark:bg-gray-800/20'} hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10`}
                                                                >
                                                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 font-mono text-[10px]">
                                                                        {actualIndex + 1}
                                                                    </td>
                                                                    {UPLOAD_COLUMN_CONFIG.map((col) => (
                                                                        <td
                                                                            key={col.key}
                                                                            className={`px-3 py-2.5 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                                                        >
                                                                            <span className="text-gray-700 dark:text-gray-300">{String((row as any)[col.key] ?? '-')}</span>
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between pt-2">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setCurrentPage(1)}
                                                            disabled={currentPage === 1}
                                                            className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            First
                                                        </button>
                                                        <button
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={currentPage === 1}
                                                            className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Prev
                                                        </button>

                                                        <div className="flex items-center gap-0.5">
                                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                let pageNum: number;
                                                                if (totalPages <= 5) {
                                                                    pageNum = i + 1;
                                                                } else if (currentPage <= 3) {
                                                                    pageNum = i + 1;
                                                                } else if (currentPage >= totalPages - 2) {
                                                                    pageNum = totalPages - 4 + i;
                                                                } else {
                                                                    pageNum = currentPage - 2 + i;
                                                                }

                                                                return (
                                                                    <button
                                                                        key={pageNum}
                                                                        onClick={() => setCurrentPage(pageNum)}
                                                                        className={`w-7 h-7 text-[10px] rounded-md transition-colors ${currentPage === pageNum
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
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Next
                                                        </button>
                                                        <button
                                                            onClick={() => setCurrentPage(totalPages)}
                                                            disabled={currentPage === totalPages}
                                                            className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Last
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-6 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            Submit Data
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : !error ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">No data found</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                                                The uploaded file does not contain any readable rows.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* ── Confirmation Modal ── */}
                <ConfirmModal
                    isOpen={showConfirm}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    rowCount={transformedPayload?.data.length || 0}
                    columnCount={Object.keys(transformedPayload?.data[0] ?? {}).length}
                    fileName={file?.name || ''}
                    isSubmitting={isSubmitting}
                />
            </div>
        </SkeletonTheme>
    );
}