"use client";

import { useState } from "react";

export default function DetailedTable({ columns = [], data = [] }) {
    const [hoveredRow, setHoveredRow] = useState(null);
    return (
        <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-900">
            <table className="w-full table-auto border-separate border-spacing-[4px] text-[10px]">

                {/* Table Header */}
                <thead className="bg-gray-100">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 text-center text-white font-semibold whitespace-nowrap bg-gradient-to-br from-purple-700 to-purple-500"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onMouseEnter={() => setHoveredRow(rowIndex)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={`transition-colors ${hoveredRow === rowIndex
                                ? "bg-purple-50 dark:bg-purple-900/30"
                                : rowIndex % 2 === 0
                                    ? "bg-white dark:bg-gray-900"
                                    : "bg-gray-50 dark:bg-gray-800"
                                }`}
                        >
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                    {row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}