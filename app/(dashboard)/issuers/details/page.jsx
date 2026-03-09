'use client';

import DetailedTable from '@/components/DetailedTable';
import { useEffect, useMemo, useState } from 'react';



const columns = [
    { header: "Rank", accessor: "rank" },
    { header: "Company Name", accessor: "company" },
    { header: "Issue Size", accessor: "issueSize" },
    { header: "Deals", accessor: "deals" },
    { header: "Market Share", accessor: "marketShare" }
];

const data = [
    {
        rank: 1,
        company: "Power Finance Corporation Ltd",
        issueSize: "39993.58",
        deals: 41,
        marketShare: "3.52%"
    },
    {
        rank: 2,
        company: "REC Limited",
        issueSize: "35821.21",
        deals: 33,
        marketShare: "3.12%"
    },
    {
        rank: 3,
        company: "HDFC Bank",
        issueSize: "31011.45",
        deals: 29,
        marketShare: "2.78%"
    }
];

export default function IssuerDetails() {
console.log("test");
    const [selectedFY, setSelectedFY] = useState('2025-26');
    const [valueConvention, setValueConvention] = useState('Crores');

    const selectClass =
        'text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer';

    return (
        <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

            {/* ── Page Title ── */}
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Detailed Analysis</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">Issuer &gt; details</p>
            </div>

            {/* ── Top 10 Issuers Table ── */}
            <SectionCard>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Top 10 Issuers (Rupees in Crores)</h2>
                    <div className="w-full sm:w-auto">
                        <label className="text-[9px] text-gray-400 block mb-1">Value Convention</label>
                        <select
                            value={valueConvention}
                            onChange={(e) => setValueConvention(e.target.value)}
                            className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] px-1 w-full sm:w-[7rem] py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200"
                        >
                            <option value="Crores">Crores</option>
                            <option value="Lakhs">Lakhs</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <DetailedTable columns={columns} data={data} />
                </div>
            </SectionCard>

        </div>
    );
}

const SectionCard = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}>
        {children}
    </div>
);