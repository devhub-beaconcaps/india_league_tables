"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { fetchHeatmapEntityData } from "../../../features/analysis/services";
import CustomDropdown from "@/components/CustomDropdown";

const LEGEND_ITEMS = [
    { label: "ABOVE +25%", className: "bg-green-800 text-white dark:bg-green-900 dark:text-green-100" },
    { label: "+11 TO +25%", className: "bg-green-500 text-white dark:bg-green-600 dark:text-green-50" },
    { label: "0 TO +10%", className: "bg-green-300 text-gray-700 dark:bg-green-400 dark:text-gray-900" },
    { label: "0%", className: "bg-orange-200 text-gray-600 dark:bg-orange-300 dark:text-gray-800" },
    { label: "-10 TO 0%", className: "bg-red-300 text-white dark:bg-red-400 dark:text-red-950" },
    { label: "-25 TO -11%", className: "bg-red-500 text-white dark:bg-red-600 dark:text-red-50" },
    { label: "BELOW -25%", className: "bg-red-800 text-white dark:bg-red-900 dark:text-red-100" },
];



const TOUR_STEPS = [
    {
        id: 1,
        title: "Participants",
        description: "Select participants (Issuer, Arranger, Trustee, or Registrar) from this dropdown.",
        targetRef: "participantsRef",
    },
    {
        id: 2,
        title: "Ranks",
        description: "Filter data by selecting a rank range from this dropdown.",
        targetRef: "ranksRef",
    },
    {
        id: 3,
        title: "Frequency",
        description: "Choose a time period (Yearly, Half Yearly, Quarterly, Monthly) using these chips.",
        targetRef: "frequencyRef",
    },
    {
        id: 4,
        title: "Growth Categories",
        description: "Filter by growth categories using these percentage buttons.",
        targetRef: "legendRef",
    },
    {
        id: 5,
        title: "Search",
        description: "Use this search bar to find specific issuers by name.",
        targetRef: "searchRef",
    },
];

const PARTICIPANT_OPTIONS = [
    { label: "Issuer", value: "issuers" },
    { label: "Arranger", value: "arrangers" },
    { label: "Trustee", value: "trustees" },
    { label: "Registrar", value: "registrars" },
];

const RANK_OPTIONS = [
    { label: "Top 10", value: "10" },
    { label: "Top 20", value: "20" },
    { label: "Top 50", value: "50" },
];

const FREQUENCY_OPTIONS = [
    { label: "Yearly", value: "Yearly" },
    { label: "Half-Yearly", value: "Half-Yearly" },
    { label: "Quarterly", value: "Quarterly" },
    { label: "Monthly", value: "Monthly" },
];

const MONTH_OPTIONS = [
    { label: "April", value: 3 },
    { label: "May", value: 4 },
    { label: "June", value: 5 },
    { label: "July", value: 6 },
    { label: "August", value: 7 },
    { label: "September", value: 8 },
    { label: "October", value: 9 },
    { label: "November", value: 10 },
    { label: "December", value: 11 },
    { label: "January", value: 0 },
    { label: "February", value: 1 },
    { label: "March", value: 2 },
];

function getCurrentFinancialYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let startYear;
    let endYear;

    if (currentMonth < 3) {
        startYear = currentYear - 1;
        endYear = currentYear;
    } else {
        startYear = currentYear;
        endYear = currentYear + 1;
    }

    return { startYear, endYear };
}

function formatDate(year, month, day, time) {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${time}`;
}

function getDateRangeByFrequency(frequency, period) {
    const { startYear, endYear } = getCurrentFinancialYear();

    if (frequency === "Yearly") {
        return {
            startDate: formatDate(startYear, 3, 1, "00:00:00"),
            endDate: formatDate(endYear, 2, 31, "23:59:59"),
        };
    }

    if (frequency === "Half-Yearly") {
        if (period === "H1") {
            return {
                startDate: formatDate(startYear, 3, 1, "00:00:00"), // Apr
                endDate: formatDate(startYear, 8, 30, "23:59:59"),  // Sep
            };
        } else {
            return {
                startDate: formatDate(startYear, 9, 1, "00:00:00"), // Oct
                endDate: formatDate(endYear, 2, 31, "23:59:59"),   // Mar
            };
        }
    }

    if (frequency === "Quarterly") {
        const quarters = {
            Q1: [3, 5],   // Apr-Jun
            Q2: [6, 8],   // Jul-Sep
            Q3: [9, 11],  // Oct-Dec
            Q4: [0, 2],   // Jan-Mar
        };

        const [startMonth, endMonth] = quarters[period];

        const year = period === "Q4" ? endYear : startYear;

        return {
            startDate: formatDate(year, startMonth, 1, "00:00:00"),
            endDate: formatDate(year, endMonth + 1, 0, "23:59:59"),
        };
    }

    if (frequency === "Monthly" && period !== null) {
        const monthIndex = Number(period);
        const year = monthIndex <= 2 ? endYear : startYear;

        return {
            startDate: formatDate(year, monthIndex, 1, "00:00:00"),
            endDate: formatDate(year, monthIndex + 1, 0, "23:59:59"),
        };
    }

    return null;
}

const formatData = (data) => {
    // 1. Pre-calculate all numeric values
    const numbers = data?.map(item => Number(item.yoy));

    // 2. Find the maximum absolute value to use as our scale anchor
    const maxVal = Math.max(...numbers.map(n => Math.abs(n)), 1);

    return data?.map((item) => {
        const val = Number(item.yoy);

        // 3. Calculate a ratio (0 to 1)
        const intensity = Math.min(Math.abs(val) / maxVal, 1);

        // 4. Define brightness range
        const minBrightness = 50;
        const maxBrightness = 200;

        // Calculate the color channel value
        const colorValue = Math.round(minBrightness + (maxBrightness - minBrightness) * intensity);

        // Helper for Hex
        const toHex = (n) => n.toString(16).padStart(2, '0');

        // FIX: Declare 'color' variable here so it is accessible in the return statement
        let color;

        if (val >= 0) {
            color = `#00${toHex(colorValue)}00`;
        } else {
            color = `#${toHex(colorValue)}0000`;
        }

        return {
            name: item.issuer_name,
            change: val.toFixed(2),
            amount: item.cy_issue_size,
            color: color
        };
    });
};

const HOW_TO_USE_CONTENT = {
    description: "The heat map displays top issuers by amount, with green for growth and red for declines. Amounts in crores.",
    points: [
        "Select participants from the dropdown",
        "Filter by rank range",
        "Choose time period using chips",
        "Use percentage buttons for growth categories",
        "Search for specific issuers",
    ],
};


export default function HeatMap() {



    const [activeLegend, setActiveLegend] = useState(null);
    const [entityData, setEntityData] = useState([]);
    const [search, setSearch] = useState("");
    const [participants, setParticipants] = useState("issuers");
    const [ranks, setRanks] = useState("10");
    const [frequency, setFrequency] = useState("Yearly");
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [currentTourStep, setCurrentTourStep] = useState(0);
    const [isTourActive, setIsTourActive] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const dateRange = useMemo(() => {
        return getDateRangeByFrequency(frequency, selectedPeriod);
    }, [frequency, selectedPeriod]);

    const [showHowToUse, setShowHowToUse] = useState(false);
    const howToUseRef = useRef(null);
    const participantsRef = useRef(null);
    const ranksRef = useRef(null);
    const frequencyRef = useRef(null);
    const legendRef = useRef(null);
    const searchRef = useRef(null);

    const filteredEntityData = useMemo(() => {
        let filtered = [...entityData];

        // 🔹 Legend Filtering
        if (activeLegend) {
            filtered = filtered.filter((item) => {
                const value = Number(item.change);

                switch (activeLegend) {
                    case "ABOVE +25%":
                        return value > 25;

                    case "+11 TO +25%":
                        return value >= 11 && value <= 25;

                    case "0 TO +10%":
                        return value > 0 && value <= 10;

                    case "0%":
                        return value === 0;

                    case "-10 TO 0%":
                        return value >= -10 && value < 0;

                    case "-25 TO -11%":
                        return value >= -25 && value <= -11;

                    case "BELOW -25%":
                        return value < -25;

                    default:
                        return true;
                }
            });
        }

        // 🔹 Search Filtering (debounced)
        if (debouncedSearch) {
            filtered = filtered.filter((item) =>
                item.name?.toLowerCase().includes(debouncedSearch)
            );
        }

        return filtered;

    }, [entityData, activeLegend, debouncedSearch]);

    const fetchEntityData = async () => {
        if (!dateRange) return;
        try {

            const query = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                entity: participants, // e.g. "issuers"
                limit: Number(ranks) || 10
            };

            const data = await fetchHeatmapEntityData(query, participants);
            const formattedData = formatData(data?.data || []);
            console.log(`Fetched entity data:`, formattedData);
            setEntityData(formattedData || []);
        } catch (error) {
            console.error(`Error fetching entity data:`, error.message);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (dateRange) {
            fetchEntityData();
        }
    }, [participants, ranks, dateRange]);

    const refs = {
        participantsRef,
        ranksRef,
        frequencyRef,
        legendRef,
        searchRef,
    };

    useEffect(() => {
        if (isTourActive && currentTourStep > 0 && currentTourStep <= TOUR_STEPS.length) {
            const step = TOUR_STEPS[currentTourStep - 1];
            const targetElement = refs[step.targetRef]?.current;
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setTargetRect(rect);
                targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [currentTourStep, isTourActive]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (howToUseRef.current && !howToUseRef.current.contains(e.target)) {
                setShowHowToUse(false);
            }
        };
        if (showHowToUse) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showHowToUse]);

    const handleReset = () => {
        setSearch("");
        setParticipants("issuers");
        setRanks("10");
        setFrequency("Yearly");
        setActiveLegend(null);
    };

    const startTour = () => {
        setIsTourActive(true);
        setCurrentTourStep(1);
    };

    const nextStep = () => {
        if (currentTourStep < TOUR_STEPS.length) {
            setCurrentTourStep(currentTourStep + 1);
        }
    };

    const finishTour = () => {
        setIsTourActive(false);
        setCurrentTourStep(0);
        setTargetRect(null);
    };

    const getTooltipPosition = () => {
        if (!targetRect) return { top: "50%", left: "50%" };

        const tooltipWidth = 320;
        const tooltipHeight = 150;
        const padding = 20;

        let top = targetRect.bottom + padding;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

        // Adjust if goes off screen
        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }
        if (top + tooltipHeight > window.innerHeight - padding) {
            top = targetRect.top - tooltipHeight - padding;
        }

        return { top: `${top}px`, left: `${left}px` };
    };

    return (
        <div className="min-h-full bg-slate-100 dark:bg-slate-900 p-4 md:p-2 relative">
            {/* Tour Overlay */}
            {isTourActive && (
                <>
                    {/* Dark overlay with cutout */}
                    <div className="fixed inset-0 z-40 pointer-events-none">
                        <div className="absolute inset-0 bg-black/60 dark:bg-black/10" />
                        {targetRect && (
                            <div
                                className="absolute bg-transparent border-2 border-white/50 rounded-lg transition-all duration-300 pointer-events-auto"
                                style={{
                                    top: targetRect.top - 8,
                                    left: targetRect.left - 8,
                                    width: targetRect.width + 16,
                                    height: targetRect.height + 16,
                                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                                }}
                            />
                        )}
                    </div>

                    {/* Tooltip Modal */}
                    {currentTourStep > 0 && currentTourStep <= TOUR_STEPS.length && (
                        <div
                            className="fixed z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-slate-600 transition-all duration-300"
                            style={getTooltipPosition()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                    {TOUR_STEPS[currentTourStep - 1].title}
                                </h3>
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                    {currentTourStep} / {TOUR_STEPS.length}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                {TOUR_STEPS[currentTourStep - 1].description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    {TOUR_STEPS.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-colors ${idx + 1 === currentTourStep
                                                ? "bg-indigo-600 dark:bg-indigo-400"
                                                : "bg-gray-300 dark:bg-slate-600"
                                                }`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    {currentTourStep < TOUR_STEPS.length ? (
                                        <button
                                            onClick={nextStep}
                                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            Next
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={finishTour}
                                            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            Finish
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Page Header with Take Tour Button */}
            {/* Page Header with Take Tour Button */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100">Heat Map</h1>
                    <p className="text-xs md:text-[10px] text-gray-400 dark:text-gray-500 mt-1">Analysis - Heat Map</p>
                </div>

                <div className="flex items-center gap-2 relative">
                    {/* How To Use Button */}
                    <div ref={howToUseRef} className="relative">
                        <button
                            onClick={() => setShowHowToUse((prev) => !prev)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-medium transition-all duration-200 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            How To Use
                        </button>

                        {/* How To Use Modal */}
                        {showHowToUse && (
                            <div className="absolute w-80 md:w-100  bg-white dark:bg-slate-800 -right-[7rem] md:right-0 z-50 p-5 rounded-2xl shadow-2xl">
                                <div className="relative bg-white dark:bg-slate-700 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700  pr-3 pt-5 pb-5 pl-15">

                                    <div className="absolute -top-1 -left-1 w-12 h-12 rounded-full bg-violet-600 dark:bg-violet-500 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowHowToUse(false)}
                                        className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-lg font-semibold transition-colors"
                                    >
                                        ×
                                    </button>

                                    {/* Icon + Title Row */}
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* <div className="w-12 h-12 rounded-full bg-violet-600 dark:bg-violet-500 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div> */}
                                        <h3 className="text-[20px] font-semibold text-gray-800 dark:text-gray-100">How to Use</h3>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-4 leading-relaxed">
                                        {HOW_TO_USE_CONTENT.description}
                                    </p>

                                    {/* Bullet Points */}
                                    <ul className="space-y-2.5">
                                        {HOW_TO_USE_CONTENT.points.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-[10px] text-gray-600 dark:text-gray-300">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Take Tour Button */}
                    <button
                        onClick={startTour}
                        disabled={isTourActive}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-medium transition-all duration-200 ${isTourActive
                            ? "bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            }`}
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M322.5 351.7L523.4 150.9L391 520.3L322.5 351.7zM489.4 117L288.6 317.8L120 249.3L489.4 117zM70.1 280.8L275.9 364.4L359.5 570.2C364.8 583.3 377.6 591.9 391.8 591.9C406.5 591.9 419.6 582.7 424.6 568.8L602.6 72C606.1 62.2 603.6 51.4 596.3 44C589 36.6 578.1 34.2 568.3 37.7L71.4 215.7C57.5 220.7 48.3 233.8 48.3 248.5C48.3 262.7 56.9 275.5 70 280.8z" /></svg>
                        Take Tour
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-slate-900/50">

                {/* Controls Row - Responsive Layout */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">

                    {/* Left Group: Search & Reset */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div ref={searchRef} className="relative">
                            <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 w-full sm:min-w-[200px] bg-white dark:bg-slate-700">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by Issuer Name"
                                    className="border-none outline-none bg-transparent text-xs md:text-[10px] text-gray-700 dark:text-gray-200 w-full placeholder-gray-400 dark:placeholder-gray-500"
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
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-[12px] px-5 h-10 md:h-6 text-xs md:text-[10px] transition-colors duration-150 cursor-pointer w-full sm:w-auto"
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
                        <div ref={participantsRef}>
                            <CustomDropdown
                                label="Participants"
                                options={PARTICIPANT_OPTIONS}
                                value={participants}
                                onChange={(val) => setParticipants(val)}
                                width="min-w-[120px]"
                            />
                        </div>

                        {/* Ranks */}
                        <div ref={ranksRef}>
                            <CustomDropdown
                                label="Ranks"
                                options={RANK_OPTIONS}
                                value={ranks}
                                onChange={(val) => setRanks(val)}
                                width="min-w-[110px]"
                            />
                        </div>

                        {/* Frequency */}
                        <div ref={frequencyRef}>
                            <CustomDropdown
                                label="Frequency"
                                options={FREQUENCY_OPTIONS}
                                value={frequency}
                                onChange={(value) => {
                                    setFrequency(value);

                                    if (value === "Half-Yearly") setSelectedPeriod("H1");
                                    else if (value === "Quarterly") setSelectedPeriod("Q1");
                                    else if (value === "Monthly") setSelectedPeriod(3);
                                    else setSelectedPeriod(null);
                                }}
                                width="min-w-[120px]"
                            />
                        </div>

                        {/* Dynamic Period Selector */}
                        {frequency === "Half-Yearly" && (
                            <div className="flex gap-2 mt-2">
                                {["H1", "H2"].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setSelectedPeriod(h)}
                                        className={`px-3 py-1 rounded-full text-xs ${selectedPeriod === h
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                                            }`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        )}

                        {frequency === "Quarterly" && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setSelectedPeriod(q)}
                                        className={`px-3 py-1 rounded-full text-xs ${selectedPeriod === q
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                                            }`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {frequency === "Monthly" && (
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <CustomDropdown
                                    label="Months"
                                    options={MONTH_OPTIONS}
                                    value={selectedPeriod}
                                    onChange={(val) => setSelectedPeriod(val)}
                                    width="min-w-[110px]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend Pills - Horizontal scroll on mobile */}
                <div ref={legendRef} className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap gap-2 mb-6 scrollbar-hide">
                    {LEGEND_ITEMS.map((item) => (
                        <span
                            key={item.label}
                            onClick={() =>
                                setActiveLegend(
                                    activeLegend === item.label ? null : item.label
                                )
                            }
                            className={`${item.className} 
                                whitespace-nowrap 
                                rounded-full 
                                px-4 py-1.5 
                                text-[10px] 
                                font-medium 
                                tracking-wide 
                                cursor-pointer 
                                select-none 
                                transition-all
                                ${activeLegend === item.label
                                    ? "ring-2 ring-black dark:ring-white scale-105"
                                    : "opacity-80 hover:opacity-100"
                                }`}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>

                {/* Heat Map Grid - Responsive Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntityData?.map((item, id) => (
                        <div
                            key={id}
                            style={{ backgroundColor: item.color }}
                            className={`rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-slate-900/60 shadow-sm dark:shadow-slate-900/30`}
                        >
                            <p className={`text-white text-[10px] md:text-[10px] font-medium uppercase tracking-wide mb-3`}>
                                {item.name}
                            </p>
                            <p className={`text-white text-sm md:text-[13px] font-medium leading-none mb-2`}>
                                {item.change}
                            </p>
                            <p className={`text-white text-[10px] md:text-[8px] tracking-wide`}>
                                {item.amount}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}