"use client";

import { useState } from "react";

const LEGEND_ITEMS = [
    { label: "ABOVE +25%", className: "bg-green-800 text-white dark:bg-green-900 dark:text-green-100" },
    { label: "+11 TO +25%", className: "bg-green-500 text-white dark:bg-green-600 dark:text-green-50" },
    { label: "0 TO +10%", className: "bg-green-300 text-gray-700 dark:bg-green-400 dark:text-gray-900" },
    { label: "0%", className: "bg-orange-200 text-gray-600 dark:bg-orange-300 dark:text-gray-800" },
    { label: "-10 TO 0%", className: "bg-red-300 text-white dark:bg-red-400 dark:text-red-950" },
    { label: "-25 TO -11%", className: "bg-red-500 text-white dark:bg-red-600 dark:text-red-50" },
    { label: "BELOW -25%", className: "bg-red-800 text-white dark:bg-red-900 dark:text-red-100" },
];

const SAMPLE_DATA = [
    {
        id: 1,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-green-700 dark:bg-green-800",
        nameClass: "text-green-200 dark:text-green-300",
        changeClass: "text-white dark:text-green-50",
        amountClass: "text-green-100 dark:text-green-200",
    },
    {
        id: 2,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-green-700 dark:bg-green-800",
        nameClass: "text-green-200 dark:text-green-300",
        changeClass: "text-white dark:text-green-50",
        amountClass: "text-green-100 dark:text-green-200",
    },
    {
        id: 3,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-green-400 dark:bg-green-500",
        nameClass: "text-green-900 dark:text-green-950",
        changeClass: "text-white dark:text-green-100",
        amountClass: "text-green-800 dark:text-green-900",
    },
    {
        id: 4,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-orange-400 dark:bg-orange-500",
        nameClass: "text-orange-100 dark:text-orange-200",
        changeClass: "text-white dark:text-orange-50",
        amountClass: "text-orange-100 dark:text-orange-200",
    },
    {
        id: 5,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-red-400 dark:bg-red-500",
        nameClass: "text-red-100 dark:text-red-200",
        changeClass: "text-white dark:text-red-50",
        amountClass: "text-red-100 dark:text-red-200",
    },
    {
        id: 6,
        name: "PORTEAST INVESTMENT PRIVATE LIMITED",
        change: "+100.00%",
        amount: "₹ 28,600 CR.",
        cardClass: "bg-red-700 dark:bg-red-800",
        nameClass: "text-red-200 dark:text-red-300",
        changeClass: "text-white dark:text-red-100",
        amountClass: "text-red-100 dark:text-red-200",
    },
];

export default function HeatMap() {
    const [search, setSearch] = useState("");
    const [participants, setParticipants] = useState("Issuer");
    const [ranks, setRanks] = useState("Top 10");
    const [frequency, setFrequency] = useState("Yearly");

    const handleReset = () => {
        setSearch("");
        setParticipants("Issuer");
        setRanks("Top 10");
        setFrequency("Yearly");
    };

    return (
        <div className="min-h-full bg-slate-100 dark:bg-slate-900 p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">Heat Map</h1>
                <p className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500 mt-1">Analysis - Heat Map</p>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-slate-900/50">

                {/* Controls Row - Responsive Layout */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">
                    
                    {/* Left Group: Search & Reset */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 w-full sm:min-w-[200px] bg-white dark:bg-slate-700">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Issuer Name"
                                className="border-none outline-none bg-transparent text-xs md:text-[9px] text-gray-700 dark:text-gray-200 w-full placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 md:w-4 md:h-4 bg-[#423CAB]/80 dark:bg-indigo-500/90 rounded-full">
                                <svg
                                    className="w-3 h-3 md:w-2 md:h-2 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-[12px] px-5 h-10 md:h-6 text-xs md:text-[9px] transition-colors duration-150 cursor-pointer w-full sm:w-auto"
                        >
                            <svg
                                className="w-4 h-4 md:w-3.5 md:h-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                viewBox="0 0 24 24"
                            >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                            Reset
                        </button>
                    </div>

                    {/* Right Group: Dropdowns - Pushed to right on desktop, stacked on mobile */}
                    <div className="flex flex-col sm:flex-row lg:ml-auto gap-4 w-full lg:w-auto">
                        {/* Participants */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <label className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500">Participants</label>
                            <select
                                value={participants}
                                onChange={(e) => setParticipants(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 text-xs md:text-[9px] text-gray-700 dark:text-gray-200 dark:bg-slate-700 outline-none cursor-pointer w-full sm:min-w-[120px]"
                            >
                                <option className="dark:bg-slate-700 dark:text-gray-200">Issuer</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Arranger</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Trustee</option>
                            </select>
                        </div>

                        {/* Ranks */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <label className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500">Ranks</label>
                            <select
                                value={ranks}
                                onChange={(e) => setRanks(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 text-xs md:text-[9px] text-gray-700 dark:text-gray-200 dark:bg-slate-700 outline-none cursor-pointer w-full sm:min-w-[110px]"
                            >
                                <option className="dark:bg-slate-700 dark:text-gray-200">Top 10</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Top 20</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Top 50</option>
                            </select>
                        </div>

                        {/* Frequency */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <label className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 text-xs md:text-[9px] text-gray-700 dark:text-gray-200 dark:bg-slate-700 outline-none cursor-pointer w-full sm:min-w-[110px]"
                            >
                                <option className="dark:bg-slate-700 dark:text-gray-200">Yearly</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Quarterly</option>
                                <option className="dark:bg-slate-700 dark:text-gray-200">Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Legend Pills - Horizontal scroll on mobile */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap gap-2 mb-6 scrollbar-hide">
                    {LEGEND_ITEMS.map((item) => (
                        <span
                            key={item.label}
                            className={`${item.className} whitespace-nowrap rounded-full px-4 py-1.5 text-[9px] font-medium tracking-wide cursor-pointer select-none`}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>

                {/* Heat Map Grid - Responsive Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SAMPLE_DATA.map((item) => (
                        <div
                            key={item.id}
                            className={`${item.cardClass} rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-slate-900/60 shadow-sm dark:shadow-slate-900/30`}
                        >
                            <p className={`${item.nameClass} text-[10px] md:text-[9px] font-medium uppercase tracking-wide mb-3`}>
                                {item.name}
                            </p>
                            <p className={`${item.changeClass} text-sm md:text-[12px] font-medium leading-none mb-2`}>
                                {item.change}
                            </p>
                            <p className={`${item.amountClass} text-[10px] md:text-[8px] tracking-wide`}>
                                {item.amount}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}