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
    issuerName: string | number;
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
    tenure: string | number;
    amountGreaterThanOrEqual: string;
    dayMoreThanOrEqual: string;
}

export interface TableDataItem {
    id: string | number;
    issuerName: string;
    securityName: string;
    securityType: string;
    modeOfIssue: string;
    issueValue: number;
    faceValue: number;
    allotmentDate: string;
    dateOfMaturity: string;
}
