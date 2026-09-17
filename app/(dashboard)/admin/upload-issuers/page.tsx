'use client';

// Install dependency:  npm i xlsx
// (SheetJS) — used to parse .xlsx / .xls / .csv files

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import * as XLSX from 'xlsx';

import { motion, AnimatePresence } from 'framer-motion';

import {
    Upload,
    FileSpreadsheet,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Trash2,
    Eye,
} from 'lucide-react';
import { postIssuersData } from '@/features/admin/services';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type RowData = Record<string, string | number | boolean | null>;

interface ParsedSheet {
    fileName: string;
    sheetName: string;
    headers: string[];
    rows: RowData[];
}

interface AlertState {
    type: 'success' | 'error';
    message: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// ─────────────────────────────────────────────────────────────
// Section Card (matches reference design)
// ─────────────────────────────────────────────────────────────

function SectionCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}
        >
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Alert Banner
// ─────────────────────────────────────────────────────────────

function AlertBanner({
    type,
    message,
    onClose,
}: {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}) {
    const isSuccess = type === 'success';

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
            role="alert"
        >
            {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}

            <span className="flex-1 font-medium leading-relaxed">
                {message}
            </span>

            <button
                onClick={onClose}
                className="hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────
// Confirmation Modal
// ─────────────────────────────────────────────────────────────

function ConfirmationModal({
    open,
    rowCount,
    fileName,
    isSubmitting,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    rowCount: number;
    fileName: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => {
                        if (!isSubmitting) onCancel();
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-5"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Confirm Upload
                                </h3>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Are you sure you want to submit the
                                    parsed data? This will process{' '}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {rowCount}
                                    </span>{' '}
                                    row{rowCount === 1 ? '' : 's'} from{' '}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200 break-all">
                                        {fileName}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="px-4 h-8 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={onConfirm}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 h-8 text-xs font-medium rounded-lg bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5" />
                                        Confirm & Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────
// Empty State (matches reference)
// ─────────────────────────────────────────────────────────────

function NoDataState({
    message = 'No data available',
    subMessage,
}: {
    message?: string;
    subMessage?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-gray-400 dark:text-gray-500" />
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

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatCell(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}


/**
 * Maps a canonical agency name (as stored in the DB) → a list of
 * alias / short‑form spellings we expect to see in the Excel file.
 * Longest aliases should be listed first when possible — the matcher
 * will prefer the longest non‑overlapping alias anyway.
 */
const AGENCY_ALIASES: Record<string, string[]> = {
    CRISIL: ['CRISIL'],
    CARE: ['CARE'],
    ICRA: ['ICRA'],
    IVR: ['IVR'],
    'Acuite Ratings': ['ACUITE'],
    'BRICKWORK RATINGS': ['BRICKWORK'],
    'Infomerics Valuation and Rating': ['INFOMERICS'],
    'INDIA RATING AND RESEARCH PVT. LTD': [
        'INDIA RATING AND RESEARCH PVT. LTD',
        'INDIA RATING AND RESEARCH PVT LTD',
        'INDIA RATING AND RESEARCH',
    ],
    'INDIA RATING': [
        'INDIA RATING',
        'INDIA RATINGS',
        'INDIA',
        'IND',
    ],
    'CREDIT ANALYSIS & RESEARCH LTD': [
        'CREDIT ANALYSIS & RESEARCH LTD',
        'CREDIT ANALYSIS & RESEARCH',
        'CREDIT ANALYSIS',
    ],
    'Accurate Corporate Econometric Research': ['ACCURATE'],
    MOODYS: ['MOODYS', "MOODY'S", 'MOODY'],
};

const OUTLOOKS = [
    'STABLE',
    'POSITIVE',
    'NEGATIVE',
    'NO OUTLOOK',
    'NULL',
    'NA',
    '-',
];

function parseCreditRating(value: unknown): Array<{
    credit_rating: string;
    rating_agency: string;
    outlook: string;
}> {
    const empty = { credit_rating: '', rating_agency: '', outlook: '' };

    if (value === null || value === undefined) return [empty];
    let raw = String(value).trim();
    if (!raw) return [empty];

    // Normalize: replace `/` first, then collapse whitespace.
    // Do NOT strip parentheses — they form parts of (SO) / (CE) suffixes.
    raw = raw
        .replace(/\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // ─────────────────────────────────────────────────────────
    // 1. Find every known agency via its aliases
    // ─────────────────────────────────────────────────────────
    const upperRaw = raw.toUpperCase();
    const occupied = new Array<boolean>(raw.length).fill(false);

    type AliasPair = { agency: string; aliasUpper: string };
    const aliasPairs: AliasPair[] = [];
    for (const [agency, aliases] of Object.entries(AGENCY_ALIASES)) {
        for (const alias of aliases) {
            aliasPairs.push({ agency, aliasUpper: alias.toUpperCase() });
        }
    }
    aliasPairs.sort((a, b) => b.aliasUpper.length - a.aliasUpper.length);

    const agencyMatches: Array<{
        agency: string;
        index: number;
        length: number;
    }> = [];

    for (const { agency, aliasUpper } of aliasPairs) {
        let idx = upperRaw.indexOf(aliasUpper);
        while (idx !== -1) {
            const before = idx > 0 ? upperRaw[idx - 1] : ' ';
            const after =
                idx + aliasUpper.length < upperRaw.length
                    ? upperRaw[idx + aliasUpper.length]
                    : ' ';
            const isBoundaryBefore = !/[A-Z0-9]/.test(before);
            const isBoundaryAfter = !/[A-Z0-9]/.test(after);

            let overlaps = false;
            for (let k = idx; k < idx + aliasUpper.length; k++) {
                if (occupied[k]) {
                    overlaps = true;
                    break;
                }
            }

            if (isBoundaryBefore && isBoundaryAfter && !overlaps) {
                agencyMatches.push({
                    agency,
                    index: idx,
                    length: aliasUpper.length,
                });
                for (let k = idx; k < idx + aliasUpper.length; k++) {
                    occupied[k] = true;
                }
            }

            idx = upperRaw.indexOf(aliasUpper, idx + 1);
        }
    }

    agencyMatches.sort((a, b) => a.index - b.index);

    // ─────────────────────────────────────────────────────────
    // 2. Rating regex — covers every variant in the DB
    // ─────────────────────────────────────────────────────────
    //  - optional PP-MLD / PPMLD prefix
    //  - long-term:  AAA AA A BBB BB B CCC CC C D  (+/- optional)
    //  - short-term: A1 A2 A3 A4                    (+/- optional)
    //  - optional `r` suffix (with or without preceding space)
    //  - optional `(SO)` or `(CE)` suffix
    //  - or a standalone special state: SUSPENDED / WITHDRAWN / Withdrwan
    const RATING_REGEX =
        /\b(?:(?:PP-?\s?MLD\s*)?(?:A1|A2|A3|A4|AAA|AA|A|BBB|BB|B|CCC|CC|C|D)(?:\s*[+\-])?(?:\s*[rR])?(?:\s*\(\s*(?:SO|CE)\s*\))?|(?:SUSPENDED|WITHDRAWN|Withdrwan))/i;

    // ─────────────────────────────────────────────────────────
    // 3. Helper: extract rating + outlook from a text segment
    // ─────────────────────────────────────────────────────────
    const extractRatingAndOutlook = (segment: string) => {
        let remaining = segment;
        let outlook = '';

        const sortedOutlooks = [...OUTLOOKS].sort(
            (a, b) => b.length - a.length
        );

        for (const out of sortedOutlooks) {
            const regex = new RegExp(
                `\\b${out.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
                'i'
            );
            if (regex.test(remaining)) {
                outlook = out;
                remaining = remaining
                    .replace(regex, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                break;
            }
        }

        if (outlook) {
            const upper = outlook.toUpperCase();
            if (upper === 'STABLE') outlook = 'Stable';
            else if (upper === 'POSITIVE') outlook = 'Positive';
            else if (upper === 'NEGATIVE') outlook = 'Negative';
            else if (upper === 'NO OUTLOOK') outlook = 'No Outlook';
            else if (upper === 'NULL') outlook = 'NULL';
            else if (upper === '-') outlook = '-';
            else if (upper === 'NA') outlook = 'No Outlook';
        }

        let creditRating = '';
        const match = remaining.match(RATING_REGEX);
        if (match) {
            creditRating = match[0].trim();
        }

        return { credit_rating: creditRating, outlook };
    };

    // ─────────────────────────────────────────────────────────
    // 4. Case A: at least one known agency → split at agencies
    // ─────────────────────────────────────────────────────────
    if (agencyMatches.length > 0) {
        const results: Array<{
            credit_rating: string;
            rating_agency: string;
            outlook: string;
        }> = [];

        const firstAgencyIdx = agencyMatches[0].index;
        const beforeFirst = raw.substring(0, firstAgencyIdx).trim();
        if (beforeFirst) {
            const parsed = extractRatingAndOutlook(beforeFirst);
            if (parsed.credit_rating !== '' || parsed.outlook !== '') {
                results.push({
                    credit_rating: parsed.credit_rating,
                    rating_agency: '',
                    outlook: parsed.outlook,
                });
            }
        }

        for (let i = 0; i < agencyMatches.length; i++) {
            const current = agencyMatches[i];
            const next = agencyMatches[i + 1];
            const start = current.index + current.length;
            const end = next ? next.index : raw.length;
            const segment = raw.substring(start, end).trim();
            const parsed = extractRatingAndOutlook(segment);

            results.push({
                credit_rating: parsed.credit_rating,
                rating_agency: current.agency,
                outlook: parsed.outlook,
            });
        }

        return results;
    }

    // ─────────────────────────────────────────────────────────
    // 5. Case B: no agencies → split at each rating position
    // ─────────────────────────────────────────────────────────
    const RATING_REGEX_GLOBAL =
        /\b(?:(?:PP-?\s?MLD\s*)?(?:A1|A2|A3|A4|AAA|AA|A|BBB|BB|B|CCC|CC|C|D)(?:\s*[+\-])?(?:\s*[rR])?(?:\s*\(\s*(?:SO|CE)\s*\))?|(?:SUSPENDED|WITHDRAWN|Withdrwan))/gi;

    const ratingPositions: Array<{ index: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = RATING_REGEX_GLOBAL.exec(raw)) !== null) {
        ratingPositions.push({ index: m.index });
        // Guard against zero-length matches (shouldn't happen, but safe)
        if (m.index === RATING_REGEX_GLOBAL.lastIndex) {
            RATING_REGEX_GLOBAL.lastIndex++;
        }
    }

    if (ratingPositions.length > 1) {
        const results: Array<{
            credit_rating: string;
            rating_agency: string;
            outlook: string;
        }> = [];

        for (let i = 0; i < ratingPositions.length; i++) {
            const current = ratingPositions[i];
            const next = ratingPositions[i + 1];
            const start = current.index;
            const end = next ? next.index : raw.length;
            const segment = raw.substring(start, end).trim();
            const parsed = extractRatingAndOutlook(segment);

            results.push({
                credit_rating: parsed.credit_rating,
                rating_agency: '',
                outlook: parsed.outlook,
            });
        }
        return results;
    }

    // ─────────────────────────────────────────────────────────
    // 6. Case C: single block (or nothing)
    // ─────────────────────────────────────────────────────────
    const parsed = extractRatingAndOutlook(raw);
    return [
        {
            credit_rating: parsed.credit_rating,
            rating_agency: '',
            outlook: parsed.outlook,
        },
    ];
}

// ─────────────────────────────────────────────────────────────
// Transform parsed Excel row → API payload
// Excel headers are PascalCase → map to backend field names
// ─────────────────────────────────────────────────────────────

const toNumberOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
};

/** Multiply by a factor only if the value is present and numeric. */
const scaleIfPresent = (val: unknown, factor: number): number | null => {
    const n = toNumberOrNull(val);
    return n === null ? null : n * factor;
};

/**
 * Placeholder values seen in Excel files that should be treated as "no value"
 * rather than being sent to the backend.
 */
const PLACEHOLDER_VALUES = new Set([
    'not found',
    'n.a.',
    'n.a',
    'na',
    'n/a',
    'none',
    'null',
    '-',
    '--',
    'nil',
    'unknown',
    'not applicable',
    'not available',
    '[●]'
]);


/** Normalize a string for placeholder comparison. */
const normalizeForPlaceholder = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[.\-_\s/\\,]+/g, '') // remove dots, dashes, underscores, spaces, slashes, commas
        .trim();

/**
 * Return a trimmed string, or `null` if it is blank / a known placeholder.
 * Handles variants like "Not Found", "N.A.", "N/A", "NA.", "Nil", "--", "—", etc.
 */
const cleanText = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;

    const raw = String(val).trim();
    if (!raw) return null;

    const normalized = normalizeForPlaceholder(raw);

    // Explicit dash‑only values ("-", "--", "—", "–", "..") → null
    if (/^[-—–.]+$/.test(raw)) return null;

    if (PLACEHOLDER_VALUES.has(normalized)) return null;

    return raw;
};

function transformIssuerForAPI(item: RowData) {
    return {
        // ── Identity ─────────────────────────────────────────
        isin: cleanText(item.ISIN),
        issuerName: cleanText(item.IssuerName),

        // ── Parties ──────────────────────────────────────────
        leadManagerArranger: cleanText(item.Arranger),
        trustee: cleanText(item.Trustee),
        registrar: cleanText(item.Registrar),
        rating_agency: cleanText(item.rating_agency),

        // ── Issue metadata ───────────────────────────────────
        issueDescription: cleanText(item.IssueDescription),
        typeOfIssuanceTypeOfPlacement: cleanText(item.TypeOfIssuance),
        allotmentDate: toNumberOrNull(item.AllotmentDate),   // Excel serial
        maturityDate: toNumberOrNull(item.MaturityDate),     // Excel serial
        tenor: cleanText(item.Tenor),

        // ── Money fields (unit conversions) ──────────────────
        // FaceValue is given in lakhs → convert to raw rupees
        faceValue: scaleIfPresent(item.FaceValue, 100000),

        // AmountRaised / BaseIssueSize / GreenShoeOption / AnchorAmount
        // and QIB / Non-QIB totals are given in crores → convert to raw rupees
        amountRaised: scaleIfPresent(item.AmountRaised, 10000000),
        baseIssueSize: scaleIfPresent(item.BaseIssueSize, 10000000),
        greenShoeOption: scaleIfPresent(item.GreenShoeOption, 10000000),
        anchorAmount: scaleIfPresent(item.AnchorAmount, 10000000),
        totalQibBiddingAmount: scaleIfPresent(item.TotalQIBBidding, 10000000),
        totalQibAmountAcceptedAmount: scaleIfPresent(item.TotalQIBAmountAccepted, 10000000),
        totalNonQibBiddingAmount: scaleIfPresent(item.TotalNonQIBBidding, 10000000),
        totalNonQibAmountAcceptedAmount: scaleIfPresent(item.TotalNonQIBAmountAccepted, 10000000),

        // ── Ratings (added by parseCreditRating) ─────────────
        creditRating: cleanText(item.credit_rating),
        outlook: cleanText(item.outlook),

        // ── Pricing / bidding ────────────────────────────────
        typeOfBookBidding: cleanText(item.TypeOfBookBidding),
        priceInRs: toNumberOrNull(item.Price),
        spreadBps: toNumberOrNull(item.Spread),
        yield: toNumberOrNull(item.Yield),
        mannerOfAllotment: cleanText(item.MannerOfAllotment),
        mannerOfSettlement: cleanText(item.MannerOfSettlement),
        linkOfGidPpm: cleanText(item.LinkOfGID),
        linkOfKidTermsheet: cleanText(item.LinkOfKID),
        noOfSuccesfulBiddersCategoryOfInvestors: cleanText(item.NoOfSuccesfulBidders),
        typeOfBidding: cleanText(item.TypeOfBidding),
        securedUnsecured: cleanText(item.SecuredUnsecured),

        // ── Coupon / tenure ──────────────────────────────────
        coupon_rate: toNumberOrNull(item.Coupon),
        couponFrequency: cleanText(item.CouponFrequency),
        maturityType: cleanText(item.MaturityType),
        interestPaymentType: cleanText(item.InterestPaymentType),

        // ── Anchor investors ─────────────────────────────────
        noOfAnchorInvestors: toNumberOrNull(item.NoOfAnchorInvestors),

        // ── Cut-off ──────────────────────────────────────────
        cutOffYieldPriceRs: toNumberOrNull(item.CutOffYield),
        weightedAverageCutOffYieldPriceRsSpreadBps:
            toNumberOrNull(item.WeightedAverageCutOffYield),
    };
}

async function parseExcelFile(file: File): Promise<ParsedSheet> {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.length) {
        throw new Error('The uploaded file contains no sheets.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const json = XLSX.utils.sheet_to_json<RowData>(sheet, {
        defval: '',
    });

    if (!json.length) {
        throw new Error(
            'The first sheet is empty. Please upload a file with at least one row of data.'
        );
    }

    // ---------------------------------------------------------
    // Process credit rating column
    // ---------------------------------------------------------
    const processedRows: RowData[] = json.flatMap((row) => {
        const creditRatingKey = Object.keys(row).find((key) => {
            const normalizedKey = key
                .trim()
                .toLowerCase()
                .replace(/[\s_-]+/g, '');

            return normalizedKey === 'creditrating';
        });

        if (!creditRatingKey) {
            return [row];
        }

        const parsedRatings = parseCreditRating(row[creditRatingKey]);

        // Defensive: if parser returns nothing, keep a single row with the column removed
        if (!parsedRatings.length) {
            const newRow: RowData = { ...row };
            delete newRow[creditRatingKey];
            return [newRow];
        }

        // One input row → one output row per parsed rating
        return parsedRatings.map((parsedRating) => {
            const newRow: RowData = {
                ...row,
                credit_rating: parsedRating.credit_rating,
                rating_agency: parsedRating.rating_agency,
                outlook: parsedRating.outlook,
            };

            delete newRow[creditRatingKey];
            return newRow;
        });
    });

    const headers = Object.keys(processedRows[0]);

    if (!headers.length) {
        throw new Error('Could not detect any columns in the file.');
    }

    return {
        fileName: file.name,
        sheetName,
        headers,
        rows: processedRows,
    };
}


// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function UploadIssuers() {
    // ── File / data state ─────────────────────────────────────
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedSheet | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // ── UI state ──────────────────────────────────────────────
    const [alert, setAlert] = useState<AlertState | null>(null);
    const [page, setPage] = useState(1);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // ── Auto-dismiss success alerts ───────────────────────────
    useEffect(() => {
        if (alert?.type === 'success') {
            const t = setTimeout(() => setAlert(null), 4000);
            return () => clearTimeout(t);
        }
    }, [alert]);

    // ── Pagination ────────────────────────────────────────────
    const totalRows = parsedData?.rows.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

    const pagedRows = useMemo(() => {
        if (!parsedData) return [];
        const start = (page - 1) * ROWS_PER_PAGE;
        return parsedData.rows.slice(start, start + ROWS_PER_PAGE);
    }, [parsedData, page]);

    useEffect(() => {
        setPage(1);
    }, [parsedData]);

    // ── File handling ─────────────────────────────────────────
    const validateAndParse = useCallback(async (selected: File) => {
        setAlert(null);

        const ext = '.' + (selected.name.split('.').pop() || '').toLowerCase();

        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setAlert({
                type: 'error',
                message: `Unsupported file type "${ext}". Please upload a .xlsx, .xls or .csv file.`,
            });
            return;
        }

        if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setAlert({
                type: 'error',
                message: `File is too large (${(selected.size / 1024 / 1024).toFixed(
                    2
                )} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
            });
            return;
        }

        setIsParsing(true);
        setParsedData(null);

        try {
            const parsed = await parseExcelFile(selected);

            setFile(selected);
            setParsedData(parsed);

            setAlert({
                type: 'success',
                message: `"${selected.name}" loaded successfully — ${parsed.rows.length} row(s) across ${parsed.headers.length} column(s) extracted from sheet "${parsed.sheetName}".`,
            });
        } catch (err) {
            console.error('Excel parse error:', err);
            setFile(null);
            setParsedData(null);
            setAlert({
                type: 'error',
                message:
                    err instanceof Error
                        ? err.message
                        : 'Failed to parse the Excel file. Please check the file and try again.',
            });
        } finally {
            setIsParsing(false);
        }
    }, []);

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files?.[0];
            if (selected) validateAndParse(selected);
            // reset input so re-selecting the same file still triggers onChange
            e.target.value = '';
        },
        [validateAndParse]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const dropped = e.dataTransfer.files?.[0];
            if (dropped) validateAndParse(dropped);
        },
        [validateAndParse]
    );

    const handleRemoveFile = useCallback(() => {
        setFile(null);
        setParsedData(null);
        setAlert(null);
        setPage(1);
        if (inputRef.current) inputRef.current.value = '';
    }, []);

    // ── Submit flow ───────────────────────────────────────────
    const handleSubmitClick = useCallback(() => {
        if (!parsedData || !parsedData.rows.length) {
            setAlert({
                type: 'error',
                message: 'Please upload a valid Excel file before submitting.',
            });
            return;
        }
        setIsConfirmOpen(true);
    }, [parsedData]);

    const handleConfirmSubmit = useCallback(async () => {
        if (!parsedData || !file) return;

        setIsSubmitting(true);

        try {
            // 1. Transform every parsed row into the API payload shape
            const payload = parsedData.rows.map(transformIssuerForAPI);
            console.log('payload ', payload);


            // 2. Call the API (postIssuersData already handles errors internally)
            const response = await postIssuersData(payload);

            // 3. Handle case where postIssuersData swallowed an error and returned undefined
            if (!response) {
                throw new Error(
                    'Upload failed. Please check the file contents and try again.'
                );
            }

            // 4. Handle partial failures reported by the backend
            const failed = response?.summary?.failed ?? 0;
            const success = response?.summary?.success ?? payload.length;
            // const failed = 0;
            // const success = 1;

            if (failed > 0) {
                setAlert({
                    type: 'error',
                    message: `Upload completed with ${failed} failure(s). ${success} succeeded. Check the server logs for details.`,
                });
            } else {
                setAlert({
                    type: 'success',
                    message:

                        `Successfully submitted ${payload.length} row(s) from "${parsedData.fileName}".`,
                });
            }

            setIsConfirmOpen(false);
        } catch (err) {
            console.error('Submit error:', err);
            setAlert({
                type: 'error',
                message:
                    err instanceof Error
                        ? err.message
                        : 'Something went wrong while submitting. Please try again.',
            });
            setIsConfirmOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [parsedData, file]);

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">
            {/* Header */}
            <SectionCard>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                        <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold">
                            Upload Issuers
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Upload an Excel file to preview and submit issuer data
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Upload card */}
            <SectionCard>
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center text-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                        {isParsing ? (
                            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {isParsing
                                ? 'Parsing file…'
                                : 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            Supported formats: .xlsx, .xls, .csv · Max {MAX_FILE_SIZE_MB} MB
                        </p>
                    </div>
                </div>

                {/* Selected file pill */}
                {file && (
                    <div className="flex items-center justify-between gap-3 mt-4 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">
                                {file.name}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                                ({parsedData?.rows.length ?? 0} rows)
                            </span>
                        </div>

                        <button
                            onClick={handleRemoveFile}
                            className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    </div>
                )}

                {/* Alert */}
                <AnimatePresence>
                    {alert && (
                        <div className="mt-4">
                            <AlertBanner
                                type={alert.type}
                                message={alert.message}
                                onClose={() => setAlert(null)}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </SectionCard>

            {/* Preview table */}
            <SectionCard>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <h2 className="text-sm font-semibold">
                            Data Preview
                        </h2>
                        {parsedData && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {totalRows} row{totalRows === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    {parsedData && totalRows > 0 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                    )}
                </div>

                {isParsing ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    </div>
                ) : parsedData && parsedData.rows.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-800/60">
                                    <tr>
                                        {parsedData.headers.map((header) => (
                                            <th
                                                key={header}
                                                className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {pagedRows.map((row, idx) => (
                                        <tr
                                            key={`${page}-${idx}`}
                                            className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                                        >
                                            {parsedData.headers.map((header) => (
                                                <td
                                                    key={header}
                                                    className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap"
                                                >
                                                    {formatCell(row[header])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Showing{' '}
                                    {(page - 1) * ROWS_PER_PAGE + 1}–
                                    {Math.min(
                                        page * ROWS_PER_PAGE,
                                        totalRows
                                    )}{' '}
                                    of {totalRows}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        disabled={page === 1}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => i + 1
                                    )
                                        .filter((p) => {
                                            if (totalPages <= 7) return true;
                                            return (
                                                p === 1 ||
                                                p === totalPages ||
                                                Math.abs(p - page) <= 1
                                            );
                                        })
                                        .map((p, i, arr) => {
                                            const prev = arr[i - 1];
                                            const showEllipsis =
                                                prev && p - prev > 1;

                                            return (
                                                <span
                                                    key={p}
                                                    className="flex items-center"
                                                >
                                                    {showEllipsis && (
                                                        <span className="px-1 text-[10px] text-gray-400">
                                                            …
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setPage(p)
                                                        }
                                                        className={`min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${page === p
                                                            ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </span>
                                            );
                                        })}

                                    <button
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(
                                                    totalPages,
                                                    p + 1
                                                )
                                            )
                                        }
                                        disabled={page === totalPages}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <NoDataState
                        message="No data to preview"
                        subMessage="Upload an Excel file above to see the extracted rows here."
                    />
                )}
            </SectionCard>

            {/* Actions */}
            <SectionCard>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={handleRemoveFile}
                        disabled={!file || isSubmitting}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 h-9 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>

                    <button
                        onClick={handleSubmitClick}
                        disabled={
                            !parsedData ||
                            !parsedData.rows.length ||
                            isParsing ||
                            isSubmitting
                        }
                        className="flex items-center gap-2 bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white rounded-lg px-5 h-9 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Submit
                    </button>
                </div>
            </SectionCard>

            {/* Confirmation modal */}
            <ConfirmationModal
                open={isConfirmOpen}
                rowCount={parsedData?.rows.length ?? 0}
                fileName={parsedData?.fileName ?? ''}
                isSubmitting={isSubmitting}
                onCancel={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSubmit}
            />
        </div>
    );
}