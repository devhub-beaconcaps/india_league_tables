"use client";

import React, { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Trash2,
  Table,
  X,
  Eye,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { postReIssuanceData } from "@/features/admin/services";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

interface TransformedItem {
  biddingDate: number | null;
  issuerName: string;
  isin: string;
  issueDescription: string;
  typeOfIssuance: string;
  allotmentDate: number | null;
  faceValue: number | null;
  creditRating: string;
  typeOfBookBidding: string;
  price: number | null;
  spread: number | null;
  yield: number | null;
  mannerOfAllotment: string;
  mannerOfSettlement: string;
  linkOfGidPpm: string;
  linkOfKidTermSheet: string;
  baseIssueSize: number | null;
  greenShoeOption: number | null;
  amountRaised: number | null;
  maturityDate: number | null;
  coupon: number | null;
  couponFrequency: string;
  successfulBiddersCategory: string;
  typeOfBidding: string;
  securedUnsecured: string;
  tenor: string;
  maturityType: string;
  interestPaymentType: string;
  anchorAmount: number | null;
  numberOfAnchorInvestors: number | null;
  totalQibBidding: number | null;
  totalQibAmountAccepted: number | null;
  totalNonQibBidding: number | null;
  totalNonQibAmountAccepted: number | null;
  cutoffYieldPrice: number | null;
  weightedAverageCutoffYieldPrice: number | null;
  issuanceDoneThroughBiddingProcess: boolean | null;
}

// ─── Column Configuration ────────────────────────────────────────────────────

interface ColumnConfig {
  key: keyof TransformedItem;
  label: string;
  width: string;
  align: "left" | "center" | "right";
  format?: (value: any) => React.ReactNode;
}

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: "isin", label: "ISIN", width: "140px", align: "left" },
  { key: "issuerName", label: "Issuer Name", width: "180px", align: "left" },
  { key: "issueDescription", label: "Description", width: "220px", align: "left", format: (v) => <TruncatedText text={v} maxLength={50} /> },
  { key: "typeOfIssuance", label: "Issuance Type", width: "120px", align: "center" },
  { key: "creditRating", label: "Credit Rating", width: "200px", align: "left", format: (v) => <TruncatedText text={v} maxLength={40} /> },
  { key: "amountRaised", label: "Amount Raised", width: "130px", align: "right", format: (v) => formatCurrency(v) },
  { key: "coupon", label: "Coupon", width: "90px", align: "right", format: (v) => formatPercentage(v) },
  { key: "securedUnsecured", label: "Security", width: "110px", align: "center", format: (v) => <SecurityBadge type={v} /> },
  { key: "tenor", label: "Tenor", width: "140px", align: "center" },
  { key: "interestPaymentType", label: "Interest Type", width: "120px", align: "center" },
  { key: "faceValue", label: "Face Value", width: "110px", align: "right", format: (v) => formatNumber(v) },
  { key: "price", label: "Price", width: "90px", align: "right", format: (v) => formatNumber(v) },
  { key: "baseIssueSize", label: "Base Issue Size", width: "130px", align: "right", format: (v) => formatNumber(v) },
  { key: "couponFrequency", label: "Coupon Freq.", width: "110px", align: "center" },
  { key: "allotmentDate", label: "Allotment (Serial)", width: "110px", align: "center", format: (v) => formatExcelSerialDisplay(v) },
  { key: "maturityDate", label: "Maturity (Serial)", width: "110px", align: "center", format: (v) => formatExcelSerialDisplay(v) },
  { key: "biddingDate", label: "Bidding (Serial)", width: "110px", align: "center", format: (v) => formatExcelSerialDisplay(v) },
  { key: "greenShoeOption", label: "Green Shoe", width: "90px", align: "center", format: (v) => (v === 0 ? "No" : v ? "Yes" : "-") },
];

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatCurrency(value: any): React.ReactNode {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num === 0) return "-";
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatNumber(value: any): React.ReactNode {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num === 0) return "0";
  return num.toLocaleString("en-IN");
}

function formatPercentage(value: any): React.ReactNode {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num === 0) return "0%";
  return `${num}%`;
}

function serialToDateString(serial: number): string {
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + serial * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

function formatExcelSerialDisplay(value: number | null): React.ReactNode {
  if (value === null || value === undefined) return "-";
  return (
    <span title={serialToDateString(value)} className="font-mono text-[10px]">
      {value}
    </span>
  );
}

function TruncatedText({
  text,
  maxLength = 40,
}: {
  text: string;
  maxLength?: number;
}) {
  if (!text || text === "-")
    return <span className="text-gray-400">-</span>;
  if (text.length <= maxLength) return <span>{text}</span>;
  return (
    <span
      title={text}
      className="cursor-help border-b border-dotted border-gray-400"
    >
      {text.substring(0, maxLength)}...
    </span>
  );
}

function SecurityBadge({ type }: { type: string }) {
  if (!type) return <span className="text-gray-400">-</span>;
  const isSecured = type.toLowerCase().includes("secured");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
        isSecured
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      }`}
    >
      {isSecured ? "🔒 Secured" : "🔓 Unsecured"}
    </span>
  );
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

const SectionCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}
  >
    {children}
  </div>
);

// ─── Alert Banner Component ─────────────────────────────────────────────────

interface AlertBannerProps {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
}

function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        isSuccess
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isSuccess
            ? "bg-emerald-100 dark:bg-emerald-800/40"
            : "bg-red-100 dark:bg-red-800/40"
        }`}
      >
        {isSuccess ? (
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold ${
            isSuccess
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-red-800 dark:text-red-300"
          }`}
        >
          {isSuccess ? "Success" : "Error"}
        </p>
        <p
          className={`text-[11px] mt-0.5 leading-relaxed ${
            isSuccess
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`p-1 rounded-md transition-colors flex-shrink-0 ${
            isSuccess
              ? "hover:bg-emerald-100 dark:hover:bg-emerald-800/40 text-emerald-500 dark:text-emerald-400"
              : "hover:bg-red-100 dark:hover:bg-red-800/40 text-red-500 dark:text-red-400"
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

function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  rowCount,
  columnCount,
  fileName,
  isSubmitting,
}: ConfirmModalProps) {
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
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Confirm Submission
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Please review before proceeding
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    File Name
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                    {fileName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Total Rows
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {rowCount}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mapped Fields
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {columnCount}
                  </span>
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

// ─── Row Detail Modal ────────────────────────────────────────────────────────

interface RowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: TransformedItem | null;
}

function RowDetailModal({ isOpen, onClose, row }: RowDetailModalProps) {
  if (!row) return null;

  const detailFields = [
    { label: "Bidding Date (Serial)", value: row.biddingDate ?? "-" },
    { label: "ISIN", value: row.isin || "-" },
    { label: "Issuer Name", value: row.issuerName || "-" },
    { label: "Issue Description", value: row.issueDescription || "-" },
    { label: "Type of Issuance", value: row.typeOfIssuance || "-" },
    { label: "Allotment Date (Serial)", value: row.allotmentDate ?? "-" },
    { label: "Face Value", value: formatNumber(row.faceValue) },
    { label: "Credit Rating", value: row.creditRating || "-" },
    { label: "Type of Book Bidding", value: row.typeOfBookBidding || "-" },
    { label: "Price", value: formatNumber(row.price) },
    { label: "Spread", value: formatNumber(row.spread) },
    { label: "Yield", value: formatNumber(row.yield) },
    { label: "Manner of Allotment", value: row.mannerOfAllotment || "-" },
    { label: "Manner of Settlement", value: row.mannerOfSettlement || "-" },
    { label: "Link of GID/PPM", value: <TruncatedText text={row.linkOfGidPpm} maxLength={60} /> },
    { label: "Link of KID/Term Sheet", value: <TruncatedText text={row.linkOfKidTermSheet} maxLength={60} /> },
    { label: "Base Issue Size", value: formatNumber(row.baseIssueSize) },
    { label: "Green Shoe Option", value: formatNumber(row.greenShoeOption) },
    { label: "Amount Raised", value: formatCurrency(row.amountRaised) },
    { label: "Maturity Date (Serial)", value: row.maturityDate ?? "-" },
    { label: "Coupon", value: formatPercentage(row.coupon) },
    { label: "Coupon Frequency", value: row.couponFrequency || "-" },
    { label: "Successful Bidders Category", value: row.successfulBiddersCategory || "-" },
    { label: "Type of Bidding", value: row.typeOfBidding || "-" },
    { label: "Secured / Unsecured", value: row.securedUnsecured || "-" },
    { label: "Tenor", value: row.tenor || "-" },
    { label: "Maturity Type", value: row.maturityType || "-" },
    { label: "Interest Payment Type", value: row.interestPaymentType || "-" },
    { label: "Anchor Amount", value: formatNumber(row.anchorAmount) },
    { label: "Number of Anchor Investors", value: formatNumber(row.numberOfAnchorInvestors) },
    { label: "Total QIB Bidding", value: formatNumber(row.totalQibBidding) },
    { label: "Total QIB Amount Accepted", value: formatNumber(row.totalQibAmountAccepted) },
    { label: "Total Non-QIB Bidding", value: formatNumber(row.totalNonQibBidding) },
    { label: "Total Non-QIB Amount Accepted", value: formatNumber(row.totalNonQibAmountAccepted) },
    { label: "Cutoff Yield/Price", value: formatNumber(row.cutoffYieldPrice) },
    { label: "Weighted Avg Cutoff Yield/Price", value: formatNumber(row.weightedAverageCutoffYieldPrice) },
    {
      label: "Issuance Through Bidding",
      value:
        row.issuanceDoneThroughBiddingProcess === true
          ? "Yes"
          : row.issuanceDoneThroughBiddingProcess === false
          ? "No"
          : "-",
    },
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
            <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Row Details
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ISIN: {row.isin}
                  </p>
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
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                    >
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {field.label}
                      </p>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Data Transformation Helpers ─────────────────────────────────────────────

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function toBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).toLowerCase().trim();
  if (str === "yes" || str === "true" || str === "1") return true;
  if (str === "no" || str === "false" || str === "0") return false;
  return null;
}

/**
 * Converts various date inputs into Excel serial number format.
 * Handles:
 * - Already a number (Excel serial) → returned as-is
 * - Date object → converted to serial
 * - String in dd-mm-yyyy format
 * - String in mm/dd/yyyy or dd/mm/yyyy format (auto-detected)
 * - Any other string → parsed via Date constructor
 */
function toExcelSerial(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;

  // Already an Excel serial number
  if (typeof value === "number") return value;

  let year: number, month: number, day: number;

  if (value instanceof Date) {
    year = value.getFullYear();
    month = value.getMonth() + 1;
    day = value.getDate();
  } else {
    const str = String(value).trim();
    if (!str) return null;

    // Match dd-mm-yyyy, dd/mm/yyyy, mm-dd-yyyy, mm/dd/yyyy
    const match = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (match) {
      let first = parseInt(match[1], 10);
      let second = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);

      if (str.includes("-")) {
        // Hyphen format: assume dd-mm-yyyy (common in CSV exports)
        day = first;
        month = second;
      } else {
        // Slash format: disambiguate mm/dd/yyyy vs dd/mm/yyyy
        if (first > 12 && second <= 12) {
          // First > 12 → must be day → dd/mm/yyyy
          day = first;
          month = second;
        } else if (second > 12 && first <= 12) {
          // Second > 12 → must be day → mm/dd/yyyy
          day = second;
          month = first;
        } else {
          // Ambiguous (both ≤ 12) → default to mm/dd/yyyy
          day = second;
          month = first;
        }
      }
      year = y;
    } else {
      // Fallback: native Date parsing
      const parsed = new Date(str);
      if (isNaN(parsed.getTime())) return null;
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    }
  }

  // Calculate Excel serial using UTC to avoid timezone off-by-one issues
  const dateUTC = Date.UTC(year, month - 1, day);
  const epochUTC = Date.UTC(1899, 11, 30); // Excel epoch (1900 date system with bug)
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dateUTC - epochUTC) / msPerDay);
}

function transformData(rawData: ParsedRow[]): { data: TransformedItem[] } {
  const data = rawData.map((row) => {
    return {
      biddingDate: toExcelSerial(row.bidding_date),
      issuerName: String(row.issuer_name ?? ""),
      isin: String(row.isin ?? ""),
      issueDescription: String(row.issue_description ?? ""),
      typeOfIssuance: String(row.type_of_issuance ?? ""),
      allotmentDate: toExcelSerial(row.allotment_date),
      faceValue: toNumber(row.face_value),
      creditRating: String(row.credit_rating ?? ""),
      typeOfBookBidding: String(row.type_of_book_bidding ?? ""),
      price: toNumber(row.price),
      spread: toNumber(row.spread),
      yield: toNumber(row.yield),
      mannerOfAllotment: String(row.manner_of_allotment ?? ""),
      mannerOfSettlement: String(row.manner_of_settlement ?? ""),
      linkOfGidPpm: String(row.link_of_gid_ppm ?? ""),
      linkOfKidTermSheet: String(row.link_of_kid_term_sheet ?? ""),
      baseIssueSize: toNumber(row.base_issue_size),
      greenShoeOption: toNumber(row.green_shoe_option),
      amountRaised: toNumber(row.amount_raised),
      maturityDate: toExcelSerial(row.maturity_date),
      coupon: toNumber(row.coupon),
      couponFrequency: String(row.coupon_frequency ?? ""),
      successfulBiddersCategory: String(row.successful_bidders_category ?? ""),
      typeOfBidding: String(row.type_of_bidding ?? ""),
      securedUnsecured: String(row.secured_unsecured ?? ""),
      tenor: String(row.tenor ?? ""),
      maturityType: String(row.maturity_type ?? ""),
      interestPaymentType: String(row.interest_payment_type ?? ""),
      anchorAmount: toNumber(row.anchor_amount),
      numberOfAnchorInvestors: toNumber(row.number_of_anchor_investors),
      totalQibBidding: toNumber(row.total_qib_bidding),
      totalQibAmountAccepted: toNumber(row.total_qib_amount_accepted),
      totalNonQibBidding: toNumber(row.total_non_qib_bidding),
      totalNonQibAmountAccepted: toNumber(row.total_non_qib_amount_accepted),
      cutoffYieldPrice: toNumber(row.cutoff_yield_price),
      weightedAverageCutoffYieldPrice: toNumber(
        row.weighted_average_cutoff_yield_price
      ),
      issuanceDoneThroughBiddingProcess: toBoolean(
        row.issuance_done_through_bidding_process
      ),
    };
  });

  return { data };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reissuance() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
  const [transformedPayload, setTransformedPayload] = useState<{
    data: TransformedItem[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TransformedItem | null>(null);
  const [showRowDetail, setShowRowDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Submission States ────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcel = useCallback(async (uploadedFile: File) => {
    setIsParsing(true);
    setError(null);
    setSubmitSuccess(null);
    setSubmitError(null);

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
        setError(
          "The file appears to be empty or has no readable data."
        );
        setParsedData(null);
        setTransformedPayload(null);
      } else {
        setParsedData(jsonData);
        setTransformedPayload(transformData(jsonData));
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error parsing Excel:", err);
      setError(
        "Failed to parse the file. Please ensure it is a valid .xlsx, .xls, or .csv file."
      );
      setParsedData(null);
      setTransformedPayload(null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const validateAndSetFile = useCallback(
    (uploadedFile: File) => {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      const isValidType =
        validTypes.includes(uploadedFile.type) ||
        uploadedFile.name.endsWith(".csv");
      if (!isValidType) {
        setError("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
        return;
      }

      setFile(uploadedFile);
      parseExcel(uploadedFile);
    },
    [parseExcel]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;
      validateAndSetFile(uploadedFile);
    },
    [validateAndSetFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (!droppedFile) return;
      validateAndSetFile(droppedFile);
    },
    [validateAndSetFile]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setTransformedPayload(null);
    setError(null);
    setCurrentPage(1);
    setSearchQuery("");
    setSubmitSuccess(null);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      const res = await postReIssuanceData(transformedPayload);
      console.log("payload:", transformedPayload);

    //   const res = {
    //     success: true,
    //     message: "test",
    //     processed: transformedPayload.data.length,
    //   };

      if (res?.success === true) {
        setSubmitSuccess(
          `Successfully processed ${res.processed ?? transformedPayload.data.length} record(s).`
        );
        setShowConfirm(false);
      } else {
        setSubmitError(
          res?.message ||
            "Something went wrong while submitting data. Please try again."
        );
        setShowConfirm(false);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit data. Please check your connection and try again.";
      setSubmitError(errorMessage);
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [transformedPayload]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleRowClick = useCallback((row: TransformedItem) => {
    setSelectedRow(row);
    setShowRowDetail(true);
  }, []);

  // Filter and paginate data
  const filteredData = React.useMemo(() => {
    if (!transformedPayload?.data) return [];
    if (!searchQuery.trim()) return transformedPayload.data;

    const query = searchQuery.toLowerCase();
    return transformedPayload.data.filter(
      (row) =>
        row.isin.toLowerCase().includes(query) ||
        row.issuerName.toLowerCase().includes(query) ||
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
    <SkeletonTheme
      enableAnimation={true}
      baseColor="#1F2937"
      highlightColor="#90969bff"
      borderRadius="0.5rem"
    >
      <div className="min-h-full p-4 md:p-6 space-y-4 font-sans text-gray-800 dark:text-gray-100">
        {/* ── Page Header ── */}
        <SectionCard>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Reissuance
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reissuance &gt; Upload
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Submission Alert Banners ── */}
        <AnimatePresence>
          {submitSuccess && (
            <AlertBanner
              type="success"
              message={submitSuccess}
              onDismiss={() => setSubmitSuccess(null)}
            />
          )}
          {submitError && (
            <AlertBanner
              type="error"
              message={submitError}
              onDismiss={() => setSubmitError(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Upload Section ── */}
        <SectionCard className="p-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Upload Excel File
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              Upload an Excel or CSV file to convert it into structured JSON
              data
            </p>
          </div>

          <div className="px-5 py-6">
            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-400 dark:hover:border-gray-600"
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
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB ·{" "}
                        {transformedPayload?.data.length || 0} rows
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
                      animate={{ opacity: 1, height: "auto" }}
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
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full sm:w-48 pl-8 pr-3 h-8 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <svg
                            className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>

                        {/* Rows per page */}
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
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
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-10">
                              #
                            </th>
                            {COLUMN_CONFIG.map((col) => (
                              <th
                                key={col.key}
                                className={`px-3 py-2.5 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${
                                  col.align === "center"
                                    ? "text-center"
                                    : col.align === "right"
                                    ? "text-right"
                                    : "text-left"
                                }`}
                                style={{ minWidth: col.width }}
                              >
                                {col.label}
                              </th>
                            ))}
                            <th className="px-3 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300 w-16">
                              View
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {previewItems.map((row, index) => {
                            const actualIndex =
                              (currentPage - 1) * rowsPerPage + index;

                            return (
                              <tr
                                key={actualIndex}
                                className={`group transition-colors duration-150 ${
                                  index % 2 === 0
                                    ? "bg-white dark:bg-[#1a1a2e]"
                                    : "bg-gray-50/50 dark:bg-gray-800/20"
                                } hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10`}
                              >
                                <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 font-mono text-[10px]">
                                  {actualIndex + 1}
                                </td>
                                {COLUMN_CONFIG.map((col) => (
                                  <td
                                    key={col.key}
                                    className={`px-3 py-2.5 ${
                                      col.align === "center"
                                        ? "text-center"
                                        : col.align === "right"
                                        ? "text-right"
                                        : "text-left"
                                    }`}
                                  >
                                    {col.format ? (
                                      col.format(row[col.key])
                                    ) : (
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {String(row[col.key] ?? "-")}
                                      </span>
                                    )}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                          {Math.min(
                            currentPage * rowsPerPage,
                            filteredData.length
                          )}{" "}
                          of {filteredData.length} entries
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
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-2 h-7 text-[10px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Prev
                          </button>

                          <div className="flex items-center gap-0.5">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
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
                                        ? "bg-indigo-600 text-white"
                                        : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(totalPages, p + 1)
                              )
                            }
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
                      No data found
                    </h3>
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
          fileName={file?.name || ""}
          isSubmitting={isSubmitting}
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