// ─── Constants ───────────────────────────────────────────────────────────────

import { FilterOption } from "./types";

export const ISSUER_NAME_OPTIONS: FilterOption[] = [
    { label: 'All Issuers', value: '' },
    { label: '360 ONE GROWTH FUND', value: '360-one-growth' },
    { label: '360 ONE PRIME LIMITED', value: '360-one-prime' },
    { label: 'ADITYA BIRLA CAPITAL LIMITED', value: 'aditya-birla' },
];

export const ISSUER_OWNERSHIP_OPTIONS: FilterOption[] = [
    { label: 'All Ownership Types', value: '' },
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
    { label: 'Government', value: 'government' },
];

export const ISSUER_NATURE_OPTIONS: FilterOption[] = [
    { label: 'All Nature Types', value: '' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Financial Institution', value: 'fi' },
    { label: 'NBFC', value: 'nbfc' },
];

export const BUSINESS_SECTOR_OPTIONS: FilterOption[] = [
    { label: 'All Sectors', value: '' },
    { label: 'Financial Services', value: 'financial' },
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Infrastructure', value: 'infrastructure' },
    { label: 'Technology', value: 'technology' },
];

export const SECURITY_TYPE_OPTIONS: FilterOption[] = [
    { label: 'All Security Types', value: '' },
    { label: 'Equity', value: 'equity' },
    { label: 'Debentures', value: 'debentures' },
    { label: 'Mutual Fund', value: 'mutual-fund' },
    { label: 'Hybrid Fund', value: 'hybrid-fund' },
];

export const MODE_OF_ISSUE_OPTIONS: FilterOption[] = [
    { label: 'All Modes', value: '' },
    { label: 'Public Offering', value: 'public-offering' },
    { label: 'Private Placement', value: 'private-placement' },
];

export const CREDIT_RATING_AGENCY_OPTIONS: FilterOption[] = [
    { label: 'All Agencies', value: '' },
    { label: 'CRISIL', value: 'crisil' },
    { label: 'ICRA', value: 'icra' },
    { label: 'CARE', value: 'care' },
    { label: 'India Ratings', value: 'india-ratings' },
];

export const CREDIT_RATING_OPTIONS: FilterOption[] = [
    { label: 'All Ratings', value: '' },
    { label: 'AAA', value: 'aaa' },
    { label: 'AA+', value: 'aa-plus' },
    { label: 'AA', value: 'aa' },
    { label: 'A+', value: 'a-plus' },
];

export const SENIORITY_OPTIONS: FilterOption[] = [
    { label: 'All Seniorities', value: '' },
    { label: 'Senior', value: 'senior' },
    { label: 'Subordinate', value: 'subordinate' },
];

export const SERVICED_FLAG_OPTIONS: FilterOption[] = [
    { label: 'All', value: '' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
];

export const LISTING_STATUS_OPTIONS: FilterOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Listed', value: 'listed' },
    { label: 'Unlisted', value: 'unlisted' },
];

export const TAX_FREE_OPTIONS: FilterOption[] = [
    { label: 'All', value: '' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
];

export const DEAL_SIZE_OPTIONS: FilterOption[] = [
    { label: 'All Sizes', value: '' },
    { label: '< 50 Cr', value: 'lt-50' },
    { label: '50 - 100 Cr', value: '50-100' },
    { label: '100 - 500 Cr', value: '100-500' },
    { label: '> 500 Cr', value: 'gt-500' },
];

export const TENURE_OPTIONS: FilterOption[] = [
    { label: 'All Tenures', value: '' },
    { label: '< 1 Year', value: 'lt-1' },
    { label: '1 - 3 Years', value: '1-3' },
    { label: '3 - 5 Years', value: '3-5' },
    { label: '> 5 Years', value: 'gt-5' },
];

export const TABLE_COLUMNS = [
    { key: 'isin', label: 'ISIN', width: 'w-[130px]'},
    { key: 'securityName', label: 'Security Name', width: 'w-[150px]' },
    { key: 'nature', label: 'Nature Type', width: 'w-[150px]' },
    { key: 'ownershipType', label: 'Ownership Type', width: 'w-[150px]' },
    { key: 'sector', label: 'Sector', width: 'w-[150px]' },
    { key: 'creditRating', label: 'Ratings', width: 'w-[150px]' },
    { key: 'seniority', label: 'Seniority', width: 'w-[150px]' },
    { key: 'securedFlag', label: 'Secured Flag', width: 'w-[150px]' },
    { key: 'listingStatus', label: 'Listing Status', width: 'w-[150px]' },
    { key: 'taxFree', label: 'Tax Free', width: 'w-[130px]' },
    { key: 'issueSize', label: 'Deals size', width: 'w-[130px]' },
    { key: 'securityType', label: 'Security Type', width: 'w-[130px]' },
    { key: 'modeOfIssue', label: 'Mode of Issue', width: 'w-[140px]' },
    { key: 'issueValue', label: 'Issue Value (₹)', width: 'w-[130px]' },
    { key: 'faceValue', label: 'Face Value (₹)', width: 'w-[130px]' },
    { key: 'allotmentDate', label: 'Allotment Date', width: 'w-[130px]' },
    { key: 'dateOfMaturity', label: 'Date of Maturity', width: 'w-[140px]' },
];
