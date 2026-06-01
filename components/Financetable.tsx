"use client";

import { JSX, useState } from "react";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface TableRowData {
  name: string;
  rank: string | number;
  issueSize: string | number;
  deals: string | number;
  mktShare: string | number;
  prevRank: string | number;
  prevSize: string | number;
  prevDeals: string | number;
  prevMkt: string | number;
  yoy: number;
}

interface TotalsData {
  currentSize: number;
  currentDeals: number;
  previousSize: number;
  previousDeals: number;
}

interface FinanceTableProps {
  totalsData: TotalsData | null | undefined;
  data: TableRowData[];
  selectedFY: string;
  valueConvention: "Lakhs" | "Crores" | string;
  type: string;
}

interface FinancialYearRanges {
  currentYearRange: string;
  previousYearRange: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUB_HEADERS: string[] = ["Rank", "Issue Size", "Deals", "Market Share (%)"];

// ============================================================================
// COMPONENTS
// ============================================================================

const InfoIcon = (): JSX.Element => (
  <svg
    className="inline-block ml-1 w-3.5 h-3.5 opacity-90"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFinancialYearRanges(rangeStr: string): FinancialYearRanges {
  const [start, end] = rangeStr.split("-").map(Number);

  const currentYearRange: string = `${start}-${String(end).slice(-2)}`;
  const previousYearRange: string = `${start - 1}-${String(end - 1).slice(-2)}`;

  return {
    currentYearRange,
    previousYearRange,
  };
}

function formatIssueSize(value: string | number | undefined, convention: string): string {
  const numValue: number = parseFloat(String(value || 0));
  const formatted = convention === "Lakhs"
    ? Number((numValue * 100).toFixed(2)).toLocaleString()
    : Number(numValue.toFixed(2)).toLocaleString();
  return `₹${formatted}`;
}

function calculateTotalDeals(data: TableRowData[], key: "deals" | "prevDeals"): number {
  return data.reduce((acc: number, row: TableRowData) => {
    return acc + parseFloat(String(row?.[key] || 0));
  }, 0);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FinanceTable({
  totalsData,
  data,
  selectedFY,
  valueConvention,
  type,
}: FinanceTableProps): JSX.Element {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  console.log("selectedFY: ", selectedFY);
  
  const result: FinancialYearRanges = getFinancialYearRanges(selectedFY);

  // Calculate totals
  const totalCurrentIssueSize: number = data.reduce(
    (acc: number, row: TableRowData) => acc + parseFloat(String(row?.issueSize || 0)),
    0
  );
  
  const totalPreviousIssueSize: number = data.reduce(
    (acc: number, row: TableRowData) => acc + parseFloat(String(row?.prevSize || 0)),
    0
  );
  
  const totalCurrentMktShare: number = data.reduce(
    (acc: number, row: TableRowData) => acc + parseFloat(String(row?.mktShare || 0)),
    0
  );
  
  const totalPreviousMktShare: number = data.reduce(
    (acc: number, row: TableRowData) => acc + parseFloat(String(row?.prevMkt || 0)),
    0
  );
  
  const changeInMktShare: number = 
    totalPreviousMktShare !== 0
      ? ((totalPreviousMktShare - totalCurrentMktShare) / totalPreviousMktShare) * 100
      : 0;

  // Calculate total deals
  const totalCurrentDeals: number = calculateTotalDeals(data, "deals");
  const totalPreviousDeals: number = calculateTotalDeals(data, "prevDeals");

  // Helper to determine YoY color class
  const getYoyColorClass = (value: number): string => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-800 dark:text-gray-200";
  };

  return (
    <div>
      <div className="w-full mx-auto">
        <div className="rounded-xl bg-white dark:bg-gray-900 overflow-x-auto">
          <table className="w-full table-auto border-separate border-spacing-[4px] text-[12px]">
            <thead>
              <tr>
                <th className="bg-white dark:bg-gray-900"></th>

                <th
                  colSpan={4}
                  className="border border-gray-200 dark:border-gray-700 rounded-md py-2 text-center bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                >
                  <span className="text-white font-semibold text-[12px]">
                    FY {result?.currentYearRange} <InfoIcon />
                  </span>
                </th>

                <th
                  colSpan={4}
                  className="border border-gray-200 dark:border-gray-700 rounded-md py-2 text-center bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                >
                  <span className="text-white font-semibold text-[12px]">
                    FY {result?.previousYearRange} <InfoIcon />
                  </span>
                </th>

                <th className="bg-white dark:bg-gray-900"></th>
              </tr>

              <tr>
                <th className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8] w-[30%]">
                  {type} Name
                </th>

                {SUB_HEADERS.map((h: string) => (
                  <th
                    key={`fy26-${h}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                  >
                    {h}
                  </th>
                ))}

                {SUB_HEADERS.map((h: string) => (
                  <th
                    key={`fy25-${h}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                  >
                    {h}
                  </th>
                ))}

                <th className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]">
                  YoY Change (%)
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((row: TableRowData, i: number) => (
                <tr
                  key={i}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`transition-colors ${
                    hoveredRow === i
                      ? "bg-purple-50 dark:bg-purple-900/30"
                      : i % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                    {row.name}
                  </td>

                  {/* FY26 - Current Year */}
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.rank}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {formatIssueSize(row?.issueSize, valueConvention)}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.deals}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.mktShare}
                  </td>

                  {/* FY25 - Previous Year */}
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.prevRank}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {formatIssueSize(row?.prevSize, valueConvention)}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.prevDeals}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                    {row.prevMkt}
                  </td>

                  <td
                    className={`border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap font-medium ${getYoyColorClass(
                      row.yoy
                    )}`}
                  >
                    {row.yoy}
                  </td>
                </tr>
              ))}

              {/* Top 10 Total Row */}
              <tr>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                  Top 10 Total
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  #
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number(totalCurrentIssueSize.toFixed(2)).toLocaleString()}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {totalCurrentDeals}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number(totalCurrentMktShare.toFixed(2)).toLocaleString()}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  #
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number(totalPreviousIssueSize.toFixed(2)).toLocaleString()}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {totalPreviousDeals}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number(totalPreviousMktShare.toFixed(2)).toLocaleString()}
                </td>
                <td
                  className={`border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap font-medium ${getYoyColorClass(
                    changeInMktShare
                  )}`}
                >
                  {Number(changeInMktShare.toFixed(2)).toLocaleString()}
                </td>
              </tr>

              {/* Industry Total Row */}
              <tr>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                  Industry Total
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  #
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number((totalsData?.currentSize || 0).toFixed(2)).toLocaleString()}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {totalsData?.currentDeals || 0}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  100
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  #
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {Number((totalsData?.previousSize || 0).toFixed(2)).toLocaleString()}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  {totalsData?.previousDeals || 0}
                </td>
                <td className="border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                  100
                </td>
                <td
                  className={`border-2 border-violet-400 dark:border-gray-300 rounded-md text-center px-1 whitespace-nowrap font-medium ${getYoyColorClass(
                    changeInMktShare
                  )}`}
                >
                  {Number(changeInMktShare.toFixed(2)).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}