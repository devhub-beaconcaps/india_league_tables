import Image from "next/image";
import downTrend from '@/public/img/downwardArrow.png'
import upTrend from '@/public/img/upwardArrow.png'

interface SummaryDiagonalCardProps {
    title: string;
    primaryValue: string | number;
    compareValue: string | number;
    primaryNumber: number;
    compareNumber: number;
    primaryLabel: string;
    compareLabel: string;
    growth: number;
    color: string;
    enableCompare: boolean;
}

function SectionCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-white dark:bg-[#1a1a2e] rounded-[12px] shadow-sm border border-gray-200 dark:border-gray-600 px-5 py-3 ${className}`}
        >
            {children}
        </div>
    );
}

const colorMap = {
    "#423CAB": "dark:text-[#423CAB]",
    "#059669": "dark:text-[#059669]",
    "#D97706": "dark:text-[#D97706]"
};

export const SummaryDiagonalCard = ({
    title,
    primaryValue,
    compareValue,
    primaryNumber,
    compareNumber,
    primaryLabel,
    compareLabel,
    growth,
    color,
    enableCompare,
}: SummaryDiagonalCardProps) => {
    if (!enableCompare) {
        return (
            <SectionCard className="relative min-h-[100px]">
                <p className="text-[10px] uppercase tracking-wider dark:text-[#d5dbe8] mb-3">
                    {title}
                </p>

                <div className="flex flex-col justify-center">
                    <span
                        className={`text-3xl font-bold ${colorMap[color]}`}
                    >
                        {primaryValue}
                    </span>

                    <span className="text-[11px] text-gray-500 mt-2">
                        {primaryLabel}
                    </span>
                </div>
            </SectionCard>
        );
    }

    const primaryHigher = primaryNumber >= compareNumber;

    return (
        <SectionCard className="relative h-[190px] overflow-hidden">

            <p className="text-[10px] uppercase tracking-wider dark:text-[#d5dbe8]">
                {title}
            </p>

            {/* Diagonal */}

            {/* Market Trend Arrow */}

            <div className={`absolute left-[35%] ${primaryHigher ? 'top-[40%]': 'top-[35%]'}`}>
                {/* Removed relative from Image style */}
                <Image
                    style={{ width: '50%', height: 'auto' }}
                    src={primaryHigher ? upTrend : downTrend}
                    alt=""
                />

                {/* Growth */}

                {/* This will now position itself relative to the parent div above */}
                <div className={`absolute ${primaryHigher ? 'top-1 left-[22px]' : 'top-1 left-[30px]'} z-10`}>
                    <span className={`font-bold text-sm ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
                    </span>
                </div>
            </div>

        
            {/* Compare */}

            <div
                className={`absolute ${primaryHigher
                    ? "left-6 bottom-6"
                    : "left-6 top-10"
                    }`}
            >
                <p className="text-[10px] dark:text-[#d5dbe8]">
                    {compareLabel}
                </p>

                <p className="text-xl md:text-2xl font-bold dark:text-cyan-500">
                    {compareValue}
                </p>
            </div>

            {/* Primary */}

            <div
                className={`absolute text-right ${primaryHigher
                    ? "right-6 top-10"
                    : "right-6 bottom-6"
                    }`}
            >
                <p className="text-[10px] dark:text-[#d5dbe8]">
                    {primaryLabel}
                </p>

                <p
                    className="text-xl md:text-2xl font-bold dark:text-yellow-600"
                >
                    {primaryValue}
                </p>
            </div>
        </SectionCard>
    );
}