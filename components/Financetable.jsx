"use client";

import { useState } from "react";

// const data = [
//   { name: "POWER FINANCE CORPORATION LIMITED", rank: 1, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 4, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "REC LIMITED", rank: 2, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 2, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "BAJAJ FINANCE LIMITED", rank: 3, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 9, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "PORTEAST INVESTMENT PRIVATE LIMITED", rank: 4, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 7, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "SMALL INDUSTRIES DEVELOPMENT BANK OF INDIA", rank: 5, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 8, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "INDIAN RAILWAY FINANCE CORPORATION LIMITED", rank: 6, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 6, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "BHARTI TELECOM LIMITED", rank: 7, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 5, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "RELIANCE RETAIL LIMITED", rank: 8, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 3, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "ADITYA BIRLA CAPITAL LIMITED", rank: 9, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 2, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
//   { name: "MUTHOOT FINCORP LIMITED", rank: 10, issueSize: 39993.58, deals: 41, mktShare: 3.52, prevRank: 1, prevSize: 40551.92, prevDeals: 24, prevMkt: 3.30, yoy: -0.69 },
// ];

const subHeaders = ["Rank", "Issue Size", "Deals", "Market Share (%)"];

const InfoIcon = () => (
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

function getFinancialYearRanges(rangeStr) {
  const [start, end] = rangeStr.split("-").map(Number);

  const currentYearRange = `${start}-${String(end).slice(-2)}`;
  const previousYearRange = `${start - 1}-${String(end - 1).slice(-2)}`;

  return {
    currentYearRange,
    previousYearRange
  };
}

export default function FinanceTable({ data, selectedFY, valueConvention }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  console.log('selectedFY: ', selectedFY);
  const result = getFinancialYearRanges(selectedFY);

  return (
    <div>
      <div className="w-full mx-auto">
        <div className="rounded-xl bg-white dark:bg-gray-900 overflow-hidden">

          <table className="w-full table-auto border-separate border-spacing-[4px] text-[10px]">

            <thead>
              <tr>
                <th className="bg-white dark:bg-gray-900"></th>

                <th
                  colSpan={4}
                  className="border border-gray-200 dark:border-gray-700 rounded-md py-2 text-center bg-gradient-to-br from-purple-900 to-purple-700"
                >
                  <span className="text-white font-semibold text-xs">
                    FY {result?.currentYearRange} <InfoIcon />
                  </span>
                </th>

                <th
                  colSpan={4}
                  className="border border-gray-200 dark:border-gray-700 rounded-md py-2 text-center bg-gradient-to-br from-purple-900 to-purple-700"
                >
                  <span className="text-white font-semibold text-xs">
                    FY {result?.previousYearRange} <InfoIcon />
                  </span>
                </th>

                <th className="bg-white dark:bg-gray-900"></th>
              </tr>

              <tr>
                <th className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-2 text-left font-semibold w-[30%]">
                  Issuer Name
                </th>

                {subHeaders.map((h) => (
                  <th
                    key={`fy26-${h}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-br from-purple-700 to-purple-500"
                  >
                    {h}
                  </th>
                ))}

                {subHeaders.map((h) => (
                  <th
                    key={`fy25-${h}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-br from-purple-700 to-purple-500"
                  >
                    {h}
                  </th>
                ))}

                <th className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-center font-semibold whitespace-nowrap">
                  YoY Change (%)
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`transition-colors ${hoveredRow === i
                      ? "bg-purple-50 dark:bg-purple-900/30"
                      : i % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    }`}
                >
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-3 font-medium break-words w-[420px] text-gray-800 dark:text-gray-200">
                    {row.name}
                  </td>

                  {/* FY26 */}
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.rank}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{valueConvention === 'Lakhs'
                          ? (parseFloat(row?.issueSize || 0) * 100).toFixed(2).toLocaleString()
                          : parseFloat(row?.issueSize || 0).toFixed(2).toLocaleString()}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.deals}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.mktShare}</td>

                  {/* FY25 */}
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.prevRank}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{valueConvention === 'Lakhs'
                          ? (parseFloat(row?.prevSize || 0) * 100).toFixed(2).toLocaleString()
                          : parseFloat(row?.prevSize || 0).toFixed(2).toLocaleString()}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.prevDeals}</td>
                  <td className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.prevMkt}</td>

                  <td className={`border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap font-medium ${row.yoy > 0 ? 'text-green-600' : row.yoy < 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                    {row.yoy}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
}