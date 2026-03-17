"use client";

import { useState } from "react";
import {
    User,
    FileText,
    Percent,
    Calendar,
    Star,
    Shield,
    RefreshCw,
    AlertTriangle,
    Users,
    LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId =
    | "issuer-profile"
    | "instrument-specifications"
    | "coupon-rate-summary"
    | "redemption-schedule"
    | "rating-summary"
    | "security-listing-overview"
    | "restructuring-information"
    | "default-event-summary"
    | "key-participants";

interface SidebarItem {
    id: SectionId;
    label: string;
    icon: LucideIcon;
}

export interface IssuerDataItem {
    label: string;
    value: string;
    type: SectionId;
}

interface ProfileSectionProps {
    title: string;
    data?: IssuerDataItem[];
}

interface IssuerProfileCardProps {
    issuerData: IssuerDataItem[] | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const sidebarItems: SidebarItem[] = [
    { id: "issuer-profile", label: "Issuer Profile", icon: User },
    { id: "instrument-specifications", label: "Instrument Specifications", icon: FileText },
    { id: "coupon-rate-summary", label: "Coupon Rate Summary", icon: Percent },
    { id: "redemption-schedule", label: "Redemption Schedule", icon: Calendar },
    { id: "rating-summary", label: "Rating Summary", icon: Star },
    { id: "security-listing-overview", label: "Security Listing Overview", icon: Shield },
    { id: "restructuring-information", label: "Restructuring Information", icon: RefreshCw },
    { id: "default-event-summary", label: "Default Event Summary", icon: AlertTriangle },
    { id: "key-participants", label: "Key Participants", icon: Users },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProfileSection = ({ title, data }: ProfileSectionProps) => {
    return (
        <div className="pl-4 sm:pl-5 pt-4 sm:pt-5 border border-gray-200 dark:border-gray-700 rounded-[13px] bg-white dark:bg-gray-900">
            <h2 className="text-[15px] sm:text-[17px] font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {title}
            </h2>

            <div className="border-t border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                    {data?.length === 0 && (
                        <p className="p-4 text-sm text-gray-400">No Data Available</p>
                    )}

                    {data?.map((item, index) => (
                        <div key={index} className="p-4">
                            <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                                {item.value}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                {item.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IssuerProfileCard({ issuerData }: IssuerProfileCardProps) {
    const [activeSection, setActiveSection] = useState<SectionId>("issuer-profile");

    const filteredData = issuerData?.filter(
        (item) => item.type === activeSection
    );

    const issuerName = issuerData?.find(item => item.label === "Issuer Name")?.value ?? null;
    const ISINName = issuerData?.find(item => item.label === "ISIN")?.value ?? null;

    const currentTitle =
        sidebarItems.find((item) => item.id === activeSection)?.label ?? "";

    return (
        <div className="min-h-screen bg-[#eef1f6] dark:bg-gray-950 p-3 sm:p-4">
            <div className="bg-white dark:bg-gray-900 relative rounded-2xl shadow-sm w-full overflow-hidden border border-gray-100 dark:border-gray-800">

                {/* Header Badge */}
                <div className="absolute -top-[1px] -left-[1px]">
                    <span className="inline-block bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white text-[13px] sm:text-[15px] font-semibold px-3 sm:px-4 py-2.5 sm:py-3 rounded-br-[25px] tracking-wide">
                        {ISINName}
                    </span>
                </div>

                {/* Title */}
                <div className="px-4 sm:px-6 pt-4 pb-4 mt-[3.5rem] border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[16px] sm:text-[18px] font-bold text-gray-800 dark:text-gray-100 leading-snug">
                        {issuerName}
                    </p>
                    <p className="text-[14px] sm:text-[18px] text-gray-500 dark:text-gray-400 mt-1">
                        {issuerName}
                    </p>
                </div>

                {/* Body */}
                <div className="flex flex-col lg:flex-row px-4 sm:px-6 min-h-[380px]">

                    {/* Sidebar */}
                    <aside className="lg:w-[210px] border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 py-3 pr-0 lg:pr-4 flex-shrink-0">
                        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-0 pb-2 lg:pb-0">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`flex-shrink-0 lg:w-full rounded-[10px] cursor-pointer flex items-center gap-2.5 px-3 lg:px-4 py-2.5 my-0 lg:my-2 text-left transition-colors whitespace-nowrap ${
                                            isActive
                                                ? "bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        <Icon
                                            size={14}
                                            className={`flex-shrink-0 ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-gray-400 dark:text-gray-500"
                                            }`}
                                        />
                                        <span className="text-[11px] font-medium leading-tight">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 lg:pl-6 pt-4 lg:pt-6 pr-0 lg:pr-[6rem] bg-white dark:bg-gray-900">
                        <ProfileSection title={currentTitle} data={filteredData} />
                    </main>
                </div>
            </div>
        </div>
    );
}