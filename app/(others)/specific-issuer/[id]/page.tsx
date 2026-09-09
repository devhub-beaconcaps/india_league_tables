'use client'

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoveLeft } from "lucide-react";
import { fetchSpecificISINData } from '@/features/issuers/services';
import IssuerProfileCard, { IssuerDataItem } from '@/components/Issuerprofilecomponent';
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useThemeStore } from '@/lib/store';

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

interface FieldMapEntry {
    key: string;
    label: string;
    type: SectionId;
}

interface RawISINData {
    [key: string]: string | number | null | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fieldMap: FieldMapEntry[] = [
    // Issuer Profile
    { key: "Issuer Name", label: "Issuer Name", type: "issuer-profile" },
    { key: "ISIN", label: "ISIN", type: "issuer-profile" },
    { key: "Issuer Former Name", label: "Issuer Former Name", type: "issuer-profile" },
    { key: "Issuer Ownership Type", label: "Issuer Ownership Type", type: "issuer-profile" },
    { key: "Nature Type", label: "Nature Type", type: "issuer-profile" },

    // Instrument Specifications
    { key: "Security Name", label: "Security Name", type: "instrument-specifications" },
    { key: "Security Class", label: "Security Type", type: "instrument-specifications" },
    { key: "Secured Flag", label: "Secured Flag", type: "instrument-specifications" },
    { key: "Convertible Type A", label: "Convertible Type", type: "instrument-specifications" },
    { key: "Face Value", label: "Face Value", type: "instrument-specifications" },
    { key: "Issue Price", label: "Issue Price", type: "instrument-specifications" },
    { key: "Issue Size", label: "Issue Size", type: "instrument-specifications" },
    { key: "Mode of Issue", label: "Mode of Issue", type: "instrument-specifications" },

    // Coupon Rate Summary
    { key: "Coupon Rate", label: "Coupon Rate (%)", type: "coupon-rate-summary" },
    { key: "Coupon Type", label: "Coupon Type", type: "coupon-rate-summary" },
    { key: "Interest Type", label: "Interest Type", type: "coupon-rate-summary" },
    { key: "Frequency Dis", label: "Coupon Frequency", type: "coupon-rate-summary" },
    { key: "Day Count", label: "Day Count Convention", type: "coupon-rate-summary" },
    { key: "Coupon Pay Date", label: "Coupon Pay Date", type: "coupon-rate-summary" },
    { key: "Interest Start Date", label: "Interest Start Date", type: "coupon-rate-summary" },

    // Redemption Schedule
    { key: "Allotment Date", label: "Allotment Date", type: "redemption-schedule" },
    { key: "Maturity Date", label: "Maturity Date", type: "redemption-schedule" },
    { key: "Type of Redemption", label: "Redemption Type", type: "redemption-schedule" },
    { key: "Tenure : No of Years", label: "Tenure (Years)", type: "redemption-schedule" },
    { key: "Redemption Details", label: "Redemption Details", type: "redemption-schedule" },
    { key: "Next schedule Date", label: "Next Schedule Date", type: "redemption-schedule" },
    { key: "Default in Redemption", label: "Default in Redemption", type: "redemption-schedule" },
    { key: "Redemption Premimum Date", label: "Redemption Premium Date", type: "redemption-schedule" },

    // Rating Summary
    { key: "Rated Flag", label: "Rated Status", type: "rating-summary" },
    { key: "ISIN Description", label: "ISIN Description", type: "rating-summary" },

    // Security Listing Overview
    { key: "Security Status", label: "Listing Status", type: "security-listing-overview" },
    { key: "Business Sector", label: "Sector", type: "security-listing-overview" },

    // Restructuring Information
    { key: "Stipulation Details", label: "Stipulation Details", type: "restructuring-information" },
];

function transformInstrumentData(data: RawISINData): IssuerDataItem[] {
    return fieldMap.map((field) => ({
        label: field.label,
        value: String(data[field.key] ?? "-"),
        type: field.type,
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpecificIssuerPage() {
    const params = useParams();
    const id = params?.id as string | undefined;
    const router = useRouter();
    const { theme } = useThemeStore();

    const [ISINData, setISINData] = useState<IssuerDataItem[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                setLoading(true);

                const query = { masterIssuerId: id };

                const resData = await fetchSpecificISINData(query);
                // Response is an array; extract the first object
                const data = Array.isArray(resData) ? resData[0] : resData;

                const formattedData = transformInstrumentData(data || {});
                setISINData(formattedData);
            } catch (error) {
                console.error("error issuer profile fetching: ", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    return (
        <div>
            <div>
                <div className="p-4">
                    <button
                        className="cursor-pointer px-3 py-2 bg-gray-300 rounded-[12px]"
                        onClick={() => router.back()}
                    >
                        <MoveLeft />
                    </button>
                </div>
                <SkeletonTheme
                    baseColor={
                        theme === "dark"
                            ? "#374151"
                            : "#e5e7eb"
                    }
                    highlightColor={
                        theme === "dark"
                            ? "#4b5563"
                            : "#f8fafc"
                    }
                    duration={1}
                >
                    <IssuerProfileCard
                        issuerData={ISINData}
                        isLoading={loading}
                    />
                </SkeletonTheme>
            </div>
        </div>
    );
}