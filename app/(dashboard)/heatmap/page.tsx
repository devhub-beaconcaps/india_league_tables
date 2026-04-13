"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { fetchHeatmapEntityData } from "../../../features/analysis/services";
import CustomDropdown from "@/components/CustomDropdown";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Import types
import {
    FormattedEntityItem,
    HeatmapApiResponse,
    FrequencyValue,
    HalfYearlyPeriod,
    QuarterlyPeriod,
    SelectedPeriod,
    TourRefs,
    DateRange,
} from './types';

// Import constants
import {
    LEGEND_ITEMS,
    TOUR_STEPS,
    PARTICIPANT_OPTIONS,
    RANK_OPTIONS,
    FREQUENCY_OPTIONS,
    MONTH_OPTIONS,
    HOW_TO_USE_CONTENT,
} from './constants';

// Import utils
import {
    getDateRangeByFrequency,
    formatData,
} from './utils';

// ─── Skeleton Components ─────────────────────────────────────────────────────

function HeatmapCardSkeleton() {
    return (
        <div className="rounded-2xl p-5 md:p-6 bg-gray-200 dark:bg-slate-700">
            <Skeleton width="60%" height={10} className="mb-3" />
            <Skeleton width="40%" height={16} className="mb-2" />
            <Skeleton width="30%" height={8} />
        </div>
    );
}

function LegendSkeleton() {
    return (
        <div className="flex gap-2 mb-6">
            {[...Array(7)].map((_, i) => (
                <Skeleton key={i} width={80} height={28} borderRadius={9999} />
            ))}
        </div>
    );
}

function ControlsSkeleton() {
    return (
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex gap-3">
                <Skeleton width={200} height={40} borderRadius={12} />
                <Skeleton width={80} height={40} borderRadius={12} />
            </div>
            <div className="flex gap-4 lg:ml-auto">
                <Skeleton width={120} height={40} />
                <Skeleton width={110} height={40} />
                <Skeleton width={120} height={40} />
            </div>
        </div>
    );
}

// ─── Empty State Component ───────────────────────────────────────────────────

function NoDataState({ message = "No data available", subMessage }: { message?: string; subMessage?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-[#1a1a2e] rounded-2xl">
            <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <svg 
                    className="w-10 h-10 text-gray-400 dark:text-gray-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                {message}
            </h3>
            {subMessage && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    {subMessage}
                </p>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HeatMap() {
    const [activeLegend, setActiveLegend] = useState<string | null>(null);
    const [entityData, setEntityData] = useState<FormattedEntityItem[]>([]);
    const [search, setSearch] = useState<string>("");
    const [participants, setParticipants] = useState<string>("issuers");
    const [ranks, setRanks] = useState<string>("10");
    const [frequency, setFrequency] = useState<FrequencyValue>("Yearly");
    const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>(null);
    const [currentTourStep, setCurrentTourStep] = useState<number>(0);
    const [isTourActive, setIsTourActive] = useState<boolean>(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
    
    // Loading state
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const dateRange = useMemo<DateRange | null>(
        () => getDateRangeByFrequency(frequency, selectedPeriod),
        [frequency, selectedPeriod]
    );

    const howToUseRef = useRef<HTMLDivElement>(null);
    const participantsRef = useRef<HTMLDivElement>(null);
    const ranksRef = useRef<HTMLDivElement>(null);
    const frequencyRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const refs: TourRefs = useMemo(() => ({
        participantsRef,
        ranksRef,
        frequencyRef,
        legendRef,
        searchRef,
    }), []);

    const filteredEntityData = useMemo<FormattedEntityItem[]>(() => {
        let filtered = [...entityData];

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

        if (debouncedSearch) {
            filtered = filtered.filter((item) =>
                item.name?.toLowerCase().includes(debouncedSearch)
            );
        }

        return filtered;
    }, [entityData, activeLegend, debouncedSearch]);

    const fetchEntityData = useCallback(async (): Promise<void> => {
        if (!dateRange) return;
        setIsLoading(true);
        try {
            const query = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                entity: participants,
                limit: Number(ranks) || 10,
            };

            const data: HeatmapApiResponse = await fetchHeatmapEntityData(query);
            const formattedData = formatData(data?.data || []);
            console.log("Fetched entity data:", formattedData);
            setEntityData(formattedData || []);
        } catch (error) {
            console.error("Error fetching entity data:", (error as Error).message);
            setEntityData([]);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, participants, ranks]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (dateRange) {
            fetchEntityData();
        }
    }, [participants, ranks, dateRange, fetchEntityData]);

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
    }, [currentTourStep, isTourActive, refs]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (howToUseRef.current && !howToUseRef.current.contains(e.target as Node)) {
                setShowHowToUse(false);
            }
        };
        if (showHowToUse) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showHowToUse]);

    const handleReset = (): void => {
        setSearch("");
        setParticipants("issuers");
        setRanks("10");
        setFrequency("Yearly");
        setActiveLegend(null);
        setSelectedPeriod(null);
    };

    const startTour = (): void => {
        setIsTourActive(true);
        setCurrentTourStep(1);
    };

    const nextStep = (): void => {
        if (currentTourStep < TOUR_STEPS.length) {
            setCurrentTourStep(currentTourStep + 1);
        }
    };

    const finishTour = (): void => {
        setIsTourActive(false);
        setCurrentTourStep(0);
        setTargetRect(null);
    };

    const getTooltipPosition = (): React.CSSProperties => {
        if (!targetRect) return { top: "50%", left: "50%" };

        const tooltipWidth = 320;
        const tooltipHeight = 150;
        const padding = 20;

        let top = targetRect.bottom + padding;
        let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }
        if (top + tooltipHeight > window.innerHeight - padding) {
            top = targetRect.top - tooltipHeight - padding;
        }

        return { top: `${top}px`, left: `${left}px` };
    };

    // Determine if filters are applied
    const hasActiveFilters = activeLegend || debouncedSearch;

    return (
        <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9" borderRadius="0.5rem">
            <div className="min-h-full bg-slate-100 dark:bg-slate-900 p-4 md:p-2 relative">
                {/* Tour Overlay */}
                {isTourActive && (
                    <>
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

                {/* Page Header */}
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

                            {showHowToUse && (
                                <div className="absolute w-80 md:w-100 bg-white dark:bg-slate-800 -right-[7rem] md:right-0 z-50 p-5 rounded-2xl shadow-2xl">
                                    <div className="relative bg-white dark:bg-slate-700 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 pr-3 pt-5 pb-5 pl-15">
                                        <div className="absolute -top-1 -left-1 w-12 h-12 rounded-full bg-violet-600 dark:bg-violet-500 flex items-center justify-center shrink-0">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <button
                                            onClick={() => setShowHowToUse(false)}
                                            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-lg font-semibold transition-colors"
                                        >
                                            ×
                                        </button>
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-[20px] font-semibold text-gray-800 dark:text-gray-100">How to Use</h3>
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-4 leading-relaxed">
                                            {HOW_TO_USE_CONTENT.description}
                                        </p>
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
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                <path d="M322.5 351.7L523.4 150.9L391 520.3L322.5 351.7zM489.4 117L288.6 317.8L120 249.3L489.4 117zM70.1 280.8L275.9 364.4L359.5 570.2C364.8 583.3 377.6 591.9 391.8 591.9C406.5 591.9 419.6 582.7 424.6 568.8L602.6 72C606.1 62.2 603.6 51.4 596.3 44C589 36.6 578.1 34.2 568.3 37.7L71.4 215.7C57.5 220.7 48.3 233.8 48.3 248.5C48.3 262.7 56.9 275.5 70 280.8z" />
                            </svg>
                            Take Tour
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-slate-900/50">
                    {isLoading ? (
                        <>
                            <ControlsSkeleton />
                            <LegendSkeleton />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(9)].map((_, i) => (
                                    <HeatmapCardSkeleton key={i} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Controls Row */}
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-6">

                                {/* Left Group: Search & Reset */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                    <div ref={searchRef} className="relative">
                                        <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 w-full sm:min-w-[200px] bg-white dark:bg-slate-700">
                                            <input
                                                value={search}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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

                                {/* Right Group: Dropdowns */}
                                <div className="flex flex-col sm:flex-row lg:ml-auto gap-4 w-full lg:w-auto">
                                    <div ref={participantsRef}>
                                        <CustomDropdown
                                            label="Participants"
                                            options={PARTICIPANT_OPTIONS}
                                            value={participants}
                                            onChange={(val) => setParticipants(String(val))}
                                            width="min-w-[120px]"
                                        />
                                    </div>

                                    <div ref={ranksRef}>
                                        <CustomDropdown
                                            label="Ranks"
                                            options={RANK_OPTIONS}
                                            value={ranks}
                                            onChange={(val) => setRanks(String(val))}
                                            width="min-w-[110px]"
                                        />
                                    </div>

                                    <div ref={frequencyRef}>
                                        <CustomDropdown
                                            label="Frequency"
                                            options={FREQUENCY_OPTIONS}
                                            value={frequency}
                                            onChange={(value) => {
                                                const freq = value as FrequencyValue;
                                                setFrequency(freq);

                                                if (freq === "Half-Yearly") setSelectedPeriod("H1");
                                                else if (freq === "Quarterly") setSelectedPeriod("Q1");
                                                else if (freq === "Monthly") setSelectedPeriod(3);
                                                else setSelectedPeriod(null);
                                            }}
                                            width="min-w-[120px]"
                                        />
                                    </div>

                                    {frequency === "Half-Yearly" && (
                                        <div className="flex gap-2 mt-2">
                                            {(["H1", "H2"] as HalfYearlyPeriod[]).map((h) => (
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
                                            {(["Q1", "Q2", "Q3", "Q4"] as QuarterlyPeriod[]).map((q) => (
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
                                                value={selectedPeriod as number}
                                                onChange={(val) => setSelectedPeriod(Number(val))}
                                                width="min-w-[110px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Legend Pills */}
                            <div ref={legendRef} className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap gap-2 mb-6 scrollbar-hide">
                                {LEGEND_ITEMS.map((item) => (
                                    <span
                                        key={item.label}
                                        onClick={() =>
                                            setActiveLegend(activeLegend === item.label ? null : item.label)
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

                            {/* Heat Map Grid */}
                            {filteredEntityData.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredEntityData.map((item, id) => (
                                        <div
                                            key={id}
                                            style={{ backgroundColor: item.color }}
                                            className="rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-slate-900/60 shadow-sm dark:shadow-slate-900/30"
                                        >
                                            <p className="text-white text-[10px] md:text-[10px] font-medium uppercase tracking-wide mb-3">
                                                {item.name}
                                            </p>
                                            <p className="text-white text-sm md:text-[13px] font-medium leading-none mb-2">
                                                {item.change}%
                                            </p>
                                            <p className="text-white text-[10px] md:text-[8px] tracking-wide">
                                                ₹{item.amount} Cr
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <NoDataState 
                                    message={hasActiveFilters ? "No matching data found" : "No data available"}
                                    subMessage={hasActiveFilters 
                                        ? "Try adjusting your search or filters to see more results." 
                                        : "Try selecting different participants, ranks, or date ranges."}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </SkeletonTheme>
    );
}