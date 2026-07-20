'use client';

import React, { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, Trash2, Table, X, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { postReIssuanceData } from '@/features/admin/services';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
    [key: string]: string | number | boolean | null;
}

interface CreditRatingItem {
    agencyName: string;
    rating: string;
    outlook: string;
}

interface TransformedItem {
    isin: string;
    security_name: string;
    issuer_name: string;
    creditRatingData: CreditRatingItem[];
    greenShoeOption: string;
    amountRaised: string;
    coupon: string | number | null;
    securedUnsecured: string;
    tenureInYears: number;
    tenureInMonths: number;
    tenureInDays: number;
    interestPaymentType: string;
    faceValue: number;
    price: number;
    baseIssueSize: number;
    couponFrequency: string;
    issueDescription: string;
    allotmentDate: string;
    maturityDate: string;
}

// ─── Column Configuration ────────────────────────────────────────────────────

interface ColumnConfig {
    key: keyof TransformedItem;
    label: string;
    width: string;
    align: 'left' | 'center' | 'right';
    format?: (value: any) => React.ReactNode;
}

const COLUMN_CONFIG: ColumnConfig[] = [
    { key: 'isin', label: 'ISIN', width: '140px', align: 'left' },
    { key: 'issuer_name', label: 'Issuer Name', width: '180px', align: 'left' },
    { key: 'creditRatingData', label: 'Credit Rating', width: '200px', align: 'left', format: (v) => <CreditRatingBadge data={v} /> },
    { key: 'amountRaised', label: 'Amount Raised', width: '120px', align: 'right', format: (v) => formatCurrency(v) },
    { key: 'coupon', label: 'Coupon', width: '100px', align: 'right', format: (v) => formatPercentage(v) },
    { key: 'securedUnsecured', label: 'Security Type', width: '120px', align: 'center', format: (v) => <SecurityBadge type={v} /> },
    { key: 'tenureInYears', label: 'Tenure (Yrs)', width: '100px', align: 'center', format: (v) => v || '-' },
    { key: 'tenureInMonths', label: 'Tenure (Mos)', width: '100px', align: 'center', format: (v) => v || '-' },
    { key: 'interestPaymentType', label: 'Interest Type', width: '130px', align: 'center' },
    { key: 'faceValue', label: 'Face Value', width: '110px', align: 'right', format: (v) => formatNumber(v) },
    { key: 'price', label: 'Price', width: '100px', align: 'right', format: (v) => formatNumber(v) },
    { key: 'baseIssueSize', label: 'Base Issue Size', width: '130px', align: 'right', format: (v) => formatNumber(v) },
    { key: 'couponFrequency', label: 'Coupon Freq.', width: '120px', align: 'center' },
    { key: 'allotmentDate', label: 'Allotment Date', width: '130px', align: 'center' },
    { key: 'maturityDate', label: 'Maturity Date', width: '130px', align: 'center' },
    { key: 'greenShoeOption', label: 'Green Shoe', width: '110px', align: 'center', format: (v) => <GreenShoeBadge value={v} /> },
    { key: 'issueDescription', label: 'Description', width: '250px', align: 'left', format: (v) => <TruncatedText text={v} maxLength={60} /> },
];

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatCurrency(value: any): React.ReactNode {
    if (!value || value === '0' || value === 0) return '-';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value);
    if (isNaN(num)) return String(value);
    return `₹${num.toLocaleString('en-IN')}`;
}

function formatNumber(value: any): React.ReactNode {
    if (value === null || value === undefined || value === '' || value === 0) return '-';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('en-IN');
}

function formatPercentage(value: any): React.ReactNode {
    if (!value || value === '0' || value === 0) return '-';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value);
    if (isNaN(num)) return String(value);
    return `${num}%`;
}

function TruncatedText({ text, maxLength = 40 }: { text: string; maxLength?: number }) {
    if (!text || text === '-') return <span className="text-gray-400">-</span>;
    if (text.length <= maxLength) return <span>{text}</span>;
    return (
        <span title={text} className="cursor-help border-b border-dotted border-gray-400">
            {text.substring(0, maxLength)}...
        </span>
    );
}

function CreditRatingBadge({ data }: { data: CreditRatingItem[] }) {
    if (!data || data.length === 0) return <span className="text-gray-400">-</span>;
    return (
        <div className="flex flex-col gap-1">
            {data.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                        {item.agencyName}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{item.rating}</span>
                    {item.outlook && (
                        <span className={`text-[10px] px-1 rounded ${
                            item.outlook.toLowerCase().includes('positive') ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            item.outlook.toLowerCase().includes('negative') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                            {item.outlook}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function SecurityBadge({ type }: { type: string }) {
    if (!type) return <span className="text-gray-400">-</span>;
    const isSecured = type.toLowerCase().includes('secured');
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isSecured 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
        }`}>
            {isSecured ? '🔒 Secured' : '🔓 Unsecured'}
        </span>
    );
}

function GreenShoeBadge({ value }: { value: string }) {
    if (!value || value.toLowerCase() === 'no' || value === '0') {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">No</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Yes</span>;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton height={40} />
            {[...Array(5)].map((_, i) => (
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

// ─── Confirmation Modal ──────────────────────────────────────────────────────

interface ConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    rowCount: number;
    columnCount: number;
    fileName: string;
}

function ConfirmModal({ isOpen, onConfirm, onCancel, rowCount, columnCount, fileName }: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                        onClick={onCancel}
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
                                    className="px-4 h-9 text-xs cursor-pointer font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-5 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Confirm & Submit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Row Detail Modal ────────────────────────────────────────────────────────

interface RowDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    row: TransformedItem | null;
}

function RowDetailModal({ isOpen, onClose, row }: RowDetailModalProps) {
    if (!row) return null;

    const detailFields = [
        { label: 'ISIN', value: row.isin || '-' },
        { label: 'Security Name', value: row.security_name || '-' },
        { label: 'Issuer Name', value: row.issuer_name || '-' },
        { label: 'Amount Raised', value: formatCurrency(row.amountRaised) },
        { label: 'Coupon', value: formatPercentage(row.coupon) },
        { label: 'Security Type', value: row.securedUnsecured || '-' },
        { label: 'Tenure', value: `${row.tenureInYears}Y ${row.tenureInMonths}M ${row.tenureInDays}D` },
        { label: 'Interest Payment Type', value: row.interestPaymentType || '-' },
        { label: 'Face Value', value: formatNumber(row.faceValue) },
        { label: 'Price', value: formatNumber(row.price) },
        { label: 'Base Issue Size', value: formatNumber(row.baseIssueSize) },
        { label: 'Coupon Frequency', value: row.couponFrequency || '-' },
        { label: 'Allotment Date', value: row.allotmentDate || '-' },
        { label: 'Maturity Date', value: row.maturityDate || '-' },
        { label: 'Green Shoe Option', value: row.greenShoeOption || '-' },
        { label: 'Issue Description', value: row.issueDescription || '-' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    >
                        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Row Details</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">ISIN: {row.isin}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {detailFields.map((field, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{field.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {row.creditRatingData && row.creditRatingData.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Credit Ratings</p>
                                        <div className="space-y-2">
                                            {row.creditRatingData.map((rating, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                                    <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                                                        {rating.agencyName}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rating.rating}</span>
                                                    {rating.outlook && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            rating.outlook.toLowerCase().includes('positive') ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                            rating.outlook.toLowerCase().includes('negative') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                            'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                            {rating.outlook}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Data Transformation ─────────────────────────────────────────────────────

function parseCreditRating(creditRatingStr: string): CreditRatingItem[] {
    if (!creditRatingStr) return [];

    const parts = creditRatingStr.split(',').map(p => p.trim()).filter(Boolean);
    const result: CreditRatingItem[] = [];

    parts.forEach(part => {
        const dashIndex = part.indexOf('-');
        if (dashIndex === -1) return;

        const agencyName = part.substring(0, dashIndex).trim();
        const rest = part.substring(dashIndex + 1).trim();
        const lastSpaceIndex = rest.lastIndexOf(' ');

        if (lastSpaceIndex > -1) {
            const rating = rest.substring(0, lastSpaceIndex).trim();
            const outlook = rest.substring(lastSpaceIndex + 1).trim();
            result.push({ agencyName, rating, outlook });
        } else {
            result.push({ agencyName, rating: rest, outlook: '' });
        }
    });

    return result;
}

function parseTenor(tenorStr: string) {
    let tenureInYears = 0;
    let tenureInMonths = 0;
    let tenureInDays = 0;

    if (tenorStr) {
        const yearMatch = tenorStr.match(/(\d+)\s*YEARS?/i);
        const monthMatch = tenorStr.match(/(\d+)\s*MONTHS?/i);
        const dayMatch = tenorStr.match(/(\d+)\s*DAYS?/i);

        if (yearMatch) tenureInYears = parseInt(yearMatch[1], 10);
        if (monthMatch) tenureInMonths = parseInt(monthMatch[1], 10);
        if (dayMatch) tenureInDays = parseInt(dayMatch[1], 10);
    }

    return { tenureInYears, tenureInMonths, tenureInDays };
}

function transformData(rawData: ParsedRow[]): { data: TransformedItem[] } {
    const data = rawData.map((row) => {
        const creditRatingData = parseCreditRating(String(row.credit_rating ?? ''));
        const { tenureInYears, tenureInMonths, tenureInDays } = parseTenor(String(row.tenor ?? ''));

        return {
            isin: String(row.isin ?? ''),
            security_name: '',
            issuer_name: String(row.issuer_name ?? ''),
            creditRatingData,
            greenShoeOption: String(row.green_shoe_option ?? ''),
            amountRaised: String(row.amount_raised ?? ''),
            coupon: String(row.coupon ?? ''),
            securedUnsecured: String(row.secured_unsecured ?? ''),
            tenureInYears,
            tenureInMonths,
            tenureInDays,
            interestPaymentType: String(row.interest_payment_type ?? ''),
            faceValue: Number(row.face_value ?? 0),
            price: Number(row.price ?? 0),
            baseIssueSize: Number(row.base_issue_size ?? 0),
            couponFrequency: String(row.coupon_frequency ?? ''),
            issueDescription: String(row.issue_description ?? ''),
            allotmentDate: formatExcelDate(row.allotment_date),
            maturityDate: formatExcelDate(row.maturity_date),
        };
    });

    return { data };
}


function formatExcelDate(value: any): string {
    if (!value) return "";

    let date: Date;

    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);

        date = new Date(
            parsed.y,
            parsed.m - 1,
            parsed.d
        );
    } else {
        date = new Date(value);

        if (isNaN(date.getTime())) {
            return String(value);
        }
    }

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reissuance() {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
    const [transformedPayload, setTransformedPayload] = useState<{ data: TransformedItem[] } | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRow, setSelectedRow] = useState<TransformedItem | null>(null);
    const [showRowDetail, setShowRowDetail] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseExcel = useCallback(async (uploadedFile: File) => {
        setIsParsing(true);
        setError(null);

        try {
            const data = await uploadedFile.arrayBuffer();
            const workbook = XLSX.read(data, {
                type: "array",
                cellDates: true,
            });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
                defval: null,
                raw: true,
            });

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
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleSubmit = useCallback(() => {
        if (!transformedPayload || transformedPayload.data.length === 0) return;
        setShowConfirm(true);
    }, [transformedPayload]);

    const handleConfirm = useCallback(async () => {
        console.log('Submitted Reissuance Data:', transformedPayload);

        const res = await postReIssuanceData(transformedPayload);
        console.log('Reissuance Data Response:', res);

        setShowConfirm(false);
    }, [transformedPayload]);

    const handleCancel = useCallback(() => {
        setShowConfirm(false);
    }, []);

    const handleRowClick = useCallback((row: TransformedItem) => {
        setSelectedRow(row);
        setShowRowDetail(true);
    }, []);

    const toggleRowExpand = useCallback((index: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    // Filter and paginate data
    const filteredData = React.useMemo(() => {
        if (!transformedPayload?.data) return [];
        if (!searchQuery.trim()) return transformedPayload.data;

        const query = searchQuery.toLowerCase();
        return transformedPayload.data.filter(row => 
            row.isin.toLowerCase().includes(query) ||
            row.issuer_name.toLowerCase().includes(query) ||
            row.security_name.toLowerCase().includes(query) ||
            row.issueDescription.toLowerCase().includes(query)
        );
    }, [transformedPayload, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const previewItems = paginatedData;

    return (
        <SkeletonTheme enableAnimation={true} baseColor="#1F2937" highlightColor="#90969bff" borderRadius="0.5rem">
            <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">

                {/* ── Page Header ── */}
                <SectionCard>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reissuance</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reissuance &gt; Upload</p>
                        </div>
                    </div>
                </SectionCard>

                {/* ── Upload Section ── */}
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
                                                {(file.size / 1024).toFixed(1)} KB · {transformedPayload?.data.length || 0} rows
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

                                {/* Error Message */}
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
                                                        placeholder="Search ISIN, issuer..."
                                                        value={searchQuery}
                                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                                        className="w-full sm:w-48 pl-8 pr-3 h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                    <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
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
                                                        {COLUMN_CONFIG.map((col) => (
                                                            <th 
                                                                key={col.key} 
                                                                className={`px-3 py-2.5 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${
                                                                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                                                }`}
                                                                style={{ minWidth: col.width }}
                                                            >
                                                                {col.label}
                                                            </th>
                                                        ))}
                                                        <th className="px-3 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300 w-16">View</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {previewItems.map((row, index) => {
                                                        const actualIndex = (currentPage - 1) * rowsPerPage + index;
                                                        const isExpanded = expandedRows.has(actualIndex);

                                                        return (
                                                            <React.Fragment key={actualIndex}>
                                                                <tr 
                                                                    className={`group transition-colors duration-150 ${
                                                                        index % 2 === 0 
                                                                            ? 'bg-white dark:bg-[#1a1a2e]' 
                                                                            : 'bg-gray-50/50 dark:bg-gray-800/20'
                                                                    } hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10`}
                                                                >
                                                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 font-mono text-[10px]">
                                                                        {actualIndex + 1}
                                                                    </td>
                                                                    {COLUMN_CONFIG.map((col) => (
                                                                        <td 
                                                                            key={col.key}
                                                                            className={`px-3 py-2.5 ${
                                                                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                                                            }`}
                                                                        >
                                                                            {col.format 
                                                                                ? col.format(row[col.key]) 
                                                                                : <span className="text-gray-700 dark:text-gray-300">{String(row[col.key] ?? '-')}</span>
                                                                            }
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        <button
                                                                            onClick={() => handleRowClick(row)}
                                                                            className="p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                                            title="View details"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            </React.Fragment>
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
                                                                    className={`w-7 h-7 text-[10px] rounded-md transition-colors ${
                                                                        currentPage === pageNum
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
                                                className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#423CAB] to-[#653FD8] hover:from-[#3732a0] hover:to-[#5a35c7] text-white rounded-lg px-6 h-9 text-xs font-medium transition-all duration-150 shadow-sm hover:shadow-md"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Submit Data
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

                {/* ── Confirmation Modal ── */}
                <ConfirmModal
                    isOpen={showConfirm}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    rowCount={transformedPayload?.data.length || 0}
                    columnCount={Object.keys(transformedPayload?.data[0] ?? {}).length}
                    fileName={file?.name || ''}
                />

                {/* ── Row Detail Modal ── */}
                <RowDetailModal
                    isOpen={showRowDetail}
                    onClose={() => setShowRowDetail(false)}
                    row={selectedRow}
                />
            </div>
        </SkeletonTheme>
    );
}