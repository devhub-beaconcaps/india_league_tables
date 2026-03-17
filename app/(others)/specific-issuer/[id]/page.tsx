'use client'

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoveLeft } from "lucide-react";
import { fetchSpecificISINData } from '@/features/issuers/services';
import IssuerProfileCard, { IssuerDataItem } from '@/components/Issuerprofilecomponent';

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
    { key: "issuer_name", label: "Issuer Name", type: "issuer-profile" },
    { key: "isin", label: "ISIN", type: "issuer-profile" },
    { key: "cin", label: "CIN", type: "issuer-profile" },
    { key: "issuer_former_name", label: "Issuer Former Name", type: "issuer-profile" },

    // Instrument Specifications
    { key: "security_name", label: "Security Name", type: "instrument-specifications" },
    { key: "security_type", label: "Security Type", type: "instrument-specifications" },
    { key: "secured_flag", label: "Security Status", type: "instrument-specifications" },
    { key: "convertible_type_a", label: "Convertible Type", type: "instrument-specifications" },
    { key: "face_value", label: "Face Value", type: "instrument-specifications" },
    { key: "issue_price", label: "Issue Price", type: "instrument-specifications" },
    { key: "issue_size", label: "Issue Size", type: "instrument-specifications" },
    { key: "mode_of_issue", label: "Mode of Issue", type: "instrument-specifications" },

    // Coupon Rate Summary
    { key: "coupon_rate", label: "Coupon Rate (%)", type: "coupon-rate-summary" },
    { key: "coupon_type", label: "Coupon Type", type: "coupon-rate-summary" },
    { key: "interest_type", label: "Interest Type", type: "coupon-rate-summary" },
    { key: "freq_dis", label: "Coupon Frequency", type: "coupon-rate-summary" },
    { key: "day_count", label: "Day Count Convention", type: "coupon-rate-summary" },

    // Redemption Schedule
    { key: "allotment_date", label: "Allotment Date", type: "redemption-schedule" },
    { key: "maturity_date", label: "Maturity Date", type: "redemption-schedule" },
    { key: "redemptionDate", label: "Redemption Date", type: "redemption-schedule" },
    { key: "type_redmptn", label: "Redemption Type", type: "redemption-schedule" },
    { key: "tenure_no_years", label: "Tenure (Years)", type: "redemption-schedule" },

    // Rating Summary
    { key: "rated_flag", label: "Rated Status", type: "rating-summary" },
    { key: "credit_rating", label: "Credit Rating", type: "rating-summary" },
    { key: "credit_rating_agency", label: "Credit Rating Agency", type: "rating-summary" },

    // Security Listing Overview
    { key: "listing_status", label: "Listing Status", type: "security-listing-overview" },
    { key: "sector", label: "Sector", type: "security-listing-overview" },
    { key: "industry", label: "Industry", type: "security-listing-overview" },

    // Key Participants
    { key: "debenture_trustee", label: "Debenture Trustee", type: "key-participants" },
    { key: "Registrar", label: "Registrar", type: "key-participants" },

    // Restructuring Information
    { key: "security_status", label: "Security Status", type: "restructuring-information" },
    { key: "stipulation_details", label: "Stipulation Details", type: "restructuring-information" },
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

    const [ISINData, setISINData] = useState<IssuerDataItem[] | null>(null);

    console.log("id", id);

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                const query = { masterIssuerId: id };
                const resData: RawISINData = await fetchSpecificISINData(query);

                console.log('fetched data of ISIN...', id, resData);
                const formattedData = transformInstrumentData(resData);
                console.log('formattedData: ', formattedData);

                setISINData(formattedData);
            } catch (error) {
                console.error("error issuer profile fetching: ", error);
            }
        };

        fetchData();
    }, [id]); // ← just add id here

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
                <IssuerProfileCard issuerData={ISINData} />
            </div>
        </div>
    );
}