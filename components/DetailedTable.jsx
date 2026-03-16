"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DetailedTable({ columns = [], data = [] }) {
    const [hoveredRow, setHoveredRow] = useState(null);
    const router = useRouter();
    

    const isinHandler = (item) => {
        // console.log("item id: ", item?.id);
        router.push(`/specific-issuer/${item?.id}`);
    }


    return (
        <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-900">
            <table className="w-full table-auto border-separate border-spacing-[4px] text-[11px]">

                {/* Table Header */}
                <thead className="bg-gray-100">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-[9px] text-center text-white font-semibold whitespace-nowrap bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
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
                                ? "bg-gradient-to-r from-[#423CAB] to-[#653FD8]"
                                : rowIndex % 2 === 0
                                    ? "bg-white dark:bg-gray-900"
                                    : "bg-gray-50 dark:bg-gray-800"
                                }`}
                        >
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="border border-gray-200 dark:border-gray-700 rounded-md text-center px-1 py-[9px] whitespace-nowrap text-gray-800 dark:text-gray-200">
                                    {col.accessor === 'Isin' ? (
                                        <><div onClick={() => isinHandler(row)} className="underline text-blue-500 decoration-sky-500 cursor-pointer" >{row[col.accessor]}</div></>
                                    ) : (
                                        <>{row[col.accessor]}</>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}