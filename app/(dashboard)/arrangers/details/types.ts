// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterOption {
    label: string;
    value: string | number;
}

export interface DateRange {
    fromDate: string;
    toDate: string;
}

export interface FilterState {
    arranger: string | number;
    issuerOwnershipType: string | number;
    issuerNatureType: string | number;
    businessSector: string | number;
    fromAllotmentDate: string;
    toAllotmentDate: string;
    securityType: string | number;
    modeOfIssue: string | number;
    creditRatingAgency: string | number;
    creditRating: string | number;
    seniority: string | number;
    servicedFlag: string | number;
    listingStatus: string | number;
    taxFree: string | number;
    dealSizeInCr: string | number;
}

export interface TableDataItem {
    id: string | number;
    isin:string;
    issuerName: string;
    securityName: string;
    securityType: string;
    modeOfIssue: string;
    issueValue: number;
    faceValue: number;
    allotmentDate: string;
    dateOfMaturity: string;
    arranger: string;
    nature: string;
    sector: string;
    creditRatingAgency: string;
    creditRating: string;
    seniority: string;
    securedFlag: string;
    listingStatus: string;
    taxFree: string;
    issueSize: number;
    ownershipType: string;
}
