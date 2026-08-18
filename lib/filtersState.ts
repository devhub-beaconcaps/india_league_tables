import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SummaryPage =
    | "arrangers-summary"
    | "trustees-summary"
    | "registrars-summary"
    | "rating-agencies-summary"
    | "issuers-summary";

export type MonthlyPage =
    | "arrangers-monthly"
    | "trustees-monthly"
    | "registrars-monthly"
    | "rating-agencies-monthly"
    | "issuers-monthly";

export type DetailedPage =
    | "arrangers-detailed"
    | "trustees-detailed"
    | "registrars-detailed"
    | "rating-agencies-detailed"
    | "issuers-detailed";

export type AnyPage = SummaryPage | MonthlyPage | DetailedPage;

/* ── Shared UI state types ─────────────────────────────────── */

export type FrequencyValue =
    | "Yearly"
    | "Half-Yearly"
    | "Quarterly"
    | "Monthly";

export type SelectedPeriod =
    | "H1"
    | "H2"
    | "Q1"
    | "Q2"
    | "Q3"
    | "Q4"
    | number
    | null;

export type IssueType = "size" | "count";

export type ValueConvention =
    | "Crores"
    | "Lakhs"
    | "Billions";

export type SizeUnit =
    | "Crores"
    | "Lakhs"
    | "Billions";

/* ── Per-page filter shapes (Summary) ──────────────────────── */

export interface ArrangerFilters {
    arranger: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface TrusteeFilters {
    trustee: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface RegistrarFilters {
    registrar: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface AgencyFilters {
    ownershipType: string[];
    nature: string[];
    sector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    rating: string[];
    seniority: string[];
    securedFlag: string[];
    listingStatus: string[];
}

export interface IssuerFilters {
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface SummaryFiltersByPage {
    "arrangers-summary": ArrangerFilters;
    "trustees-summary": TrusteeFilters;
    "registrars-summary": RegistrarFilters;
    "rating-agencies-summary": AgencyFilters;
    "issuers-summary": IssuerFilters;
}

/* ── Per-page filter shapes (Detailed) ───────────────────────── */

export interface ArrangerDetailedFilters {
    arranger: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface TrusteeDetailedFilters {
    trustee: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface RegistrarDetailedFilters {
    registrar: string[];
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface RatingAgencyDetailedFilters {
    ownershipType: string[];
    nature: string[];
    sector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    rating: string[];
    seniority: string[];
    securedFlag: string[];
    listingStatus: string[];
}

export interface IssuerDetailedFilters {
    issuerOwnershipType: string[];
    issuerNatureType: string[];
    businessSector: string[];
    securityType: string[];
    modeOfIssue: string[];
    creditRatingAgency: string[];
    creditRating: string[];
    seniority: string[];
    servicedFlag: string[];
    listingStatus: string[];
}

export interface DetailedFiltersByPage {
    "arrangers-detailed": ArrangerDetailedFilters;
    "trustees-detailed": TrusteeDetailedFilters;
    "registrars-detailed": RegistrarDetailedFilters;
    "rating-agencies-detailed": RatingAgencyDetailedFilters;
    "issuers-detailed": IssuerDetailedFilters;
}

/* ── Monthly filters ───────────────────────────────────────── */

export interface MonthlyFilters {
    ownershipType: string[];
    nature: string[];
    sector: string[];
    securityType: string[];
    creditRatingAgency: string[];
    modeOfIssue: string[];
    seniority: string[];
    listingStatus: string[];
    securedFlag: string[];
    rating: string[];
}

/* ── Full page state (Summary) ─────────────────────────────── */

export interface PageState<P extends SummaryPage> {
    selectedFY: string;
    frequency: FrequencyValue;
    period: SelectedPeriod;
    issueType: IssueType;
    valueConvention: ValueConvention;
    filters: SummaryFiltersByPage[P];
}

/* ── Full page state (Monthly) ─────────────────────────────── */

export interface MonthlyPageState {
    primaryStartDate: string;
    primaryEndDate: string;
    compareStartDate: string;
    compareEndDate: string;
    primaryFilters: MonthlyFilters;
    compareFilters: MonthlyFilters;
    enableCompare: boolean;
    sizeUnit: SizeUnit;
}

/* ── Full page state (Detailed) ─────────────────────────────── */

export interface DetailedPageState<P extends DetailedPage> {
    fromAllotmentDate: string;
    toAllotmentDate: string;
    selectedYear: string;
    filters: DetailedFiltersByPage[P];
}

/*
 * IMPORTANT:
 *
 * monthlyPageState contains ONLY the currently active monthly page.
 *
 * Example:
 *
 * {
 *   activeFilterPage: "trustees-monthly",
 *   monthlyPageState: {
 *     "trustees-monthly": {...}
 *   }
 * }
 *
 * It will NEVER contain:
 *
 * {
 *   "registrars-monthly": {...},
 *   "trustees-monthly": {...},
 *   "rating-agencies-monthly": {...}
 * }
 */
type ActiveMonthlyPageState = Partial<
    Record<MonthlyPage, MonthlyPageState>
>;

/* ── Store interface ───────────────────────────────────────── */

interface SummaryFilterStore {
    /** Which page currently owns the active filter context */
    activeFilterPage: AnyPage | null;

    /** Persisted state for summary pages */
    pageState: Partial<{
        [P in SummaryPage]: PageState<P>;
    }>;

    /**
     * Persisted state for ONLY the currently active monthly page.
     *
     * At most one key should exist here.
     */
    monthlyPageState: ActiveMonthlyPageState;

    /** Persisted state for ONLY the currently active detailed page */
    detailedPageState: ActiveDetailedPageState;

    /* ── Summary methods ─────────────────────────────────────── */

    setPageState: <P extends SummaryPage>(
        page: P,
        state: PageState<P>
    ) => void;

    updatePageFilter: <P extends SummaryPage>(
        page: P,
        key: keyof SummaryFiltersByPage[P],
        value: string[]
    ) => void;

    updatePageField: <P extends SummaryPage>(
        page: P,
        key: Exclude<keyof PageState<P>, "filters">,
        value: any
    ) => void;

    clearPageState: <P extends SummaryPage>(
        page: P,
        defaultState: PageState<P>
    ) => void;


    /* ── Detailed methods ───────────────────────────────────────── */

    setDetailedPageState: <P extends DetailedPage>(
        page: P,
        state: DetailedPageState<P>
    ) => void;

    updateDetailedPageFilter: <P extends DetailedPage>(
        page: P,
        key: keyof DetailedFiltersByPage[P],
        value: string[]
    ) => void;

    updateDetailedPageField: <P extends DetailedPage>(
        page: P,
        key: Exclude<keyof DetailedPageState<P>, "filters">,
        value: any
    ) => void;

    clearDetailedPageState: <P extends DetailedPage>(
        page: P,
        defaultState: DetailedPageState<P>
    ) => void;

    /* ── Monthly methods ─────────────────────────────────────── */

    /**
     * Replace the COMPLETE monthly state.
     *
     * This removes every previous monthly page.
     */
    setMonthlyPageState: (
        page: MonthlyPage,
        state: MonthlyPageState
    ) => void;

    /**
     * Update a filter ONLY if this page is currently active.
     */
    updateMonthlyPageFilter: (
        page: MonthlyPage,
        filterType: "primary" | "compare",
        key: keyof MonthlyFilters,
        value: string[]
    ) => void;

    /**
     * Update a monthly top-level field ONLY for the active page.
     */
    updateMonthlyPageField: <K extends keyof MonthlyPageState>(
        page: MonthlyPage,
        key: K,
        value: MonthlyPageState[K]
    ) => void;

    /**
     * Replace the active monthly page with its defaults.
     */
    clearMonthlyPageState: (
        page: MonthlyPage,
        defaultState: MonthlyPageState
    ) => void;

    /** Wipe everything */
    clearAllState: () => void;
}


/*
 * IMPORTANT:
 *
 * detailedPageState contains ONLY the currently active detailed page.
 *
 * Example:
 *
 * {
 *   activeFilterPage: "arrangers-detailed",
 *
 *   detailedPageState: {
 *     "arrangers-detailed": {
 *       ...
 *     }
 *   }
 * }
 *
 * When the user moves to issuers-detailed, the arrangers-detailed
 * state is replaced.
 *
 * Therefore it will NEVER contain:
 *
 * {
 *   "arrangers-detailed": {...},
 *   "issuers-detailed": {...}
 * }
 */
type ActiveDetailedPageState = Partial<
    {
        [P in DetailedPage]: DetailedPageState<P>;
    }
>;

/* ── Store implementation ─────────────────────────────────── */

export const useSummaryFilterStore =
    create<SummaryFilterStore>()(
        persist(
            (set) => ({
                activeFilterPage: null,

                pageState: {},

                monthlyPageState: {},

                detailedPageState: {},

                /* ======================================================
                 * SUMMARY STATE
                 * ====================================================== */

                setPageState: (page, state) =>
                    set((prev) => ({
                        activeFilterPage: page,

                        pageState: {
                            ...prev.pageState,
                            [page]: state,
                        },

                        /*
                         * If navigating from a monthly page to a summary page,
                         * remove the previous monthly filter context.
                         */
                        monthlyPageState: {},
                    })),

                updatePageFilter: (page, key, value) =>
                    set((prev) => {
                        const current = prev.pageState[page];

                        if (!current) {
                            return {
                                activeFilterPage: page,
                                monthlyPageState: {},
                            };
                        }

                        return {
                            activeFilterPage: page,

                            monthlyPageState: {},

                            pageState: {
                                ...prev.pageState,

                                [page]: {
                                    ...current,

                                    filters: {
                                        ...current.filters,
                                        [key]: value,
                                    } as any,
                                } as any,
                            },
                        };
                    }),

                updatePageField: (page, key, value) =>
                    set((prev) => {
                        const current = prev.pageState[page];

                        if (!current) {
                            return {
                                activeFilterPage: page,
                                monthlyPageState: {},
                            };
                        }

                        return {
                            activeFilterPage: page,

                            monthlyPageState: {},

                            pageState: {
                                ...prev.pageState,

                                [page]: {
                                    ...current,
                                    [key]: value,
                                } as any,
                            },
                        };
                    }),

                clearPageState: (page, defaultState) =>
                    set((prev) => ({
                        activeFilterPage: page,

                        monthlyPageState: {},

                        pageState: {
                            ...prev.pageState,
                            [page]: defaultState,
                        },
                    })),

                setDetailedPageState: (page, state) =>
                    set(() => ({
                        activeFilterPage: page,

                        detailedPageState: {
                            [page]: state,
                        },

                        /*
                         * Detailed page is now the active filter context.
                         * Remove monthly filter context.
                         */
                        monthlyPageState: {},
                    })),

                updateDetailedPageFilter: (page, key, value) =>
                    set((prev) => {
                        if (prev.activeFilterPage !== page) {
                            return {};
                        }

                        const current = prev.detailedPageState[page];

                        if (!current) {
                            return {};
                        }

                        return {
                            detailedPageState: {
                                [page]: {
                                    ...current,

                                    filters: {
                                        ...current.filters,
                                        [key]: value,
                                    },
                                },
                            },
                        };
                    }),

                updateDetailedPageField: (page, key, value) =>
                    set((prev) => {
                        if (prev.activeFilterPage !== page) {
                            return {};
                        }

                        const current = prev.detailedPageState[page];

                        if (!current) {
                            return {};
                        }

                        return {
                            detailedPageState: {
                                [page]: {
                                    ...current,
                                    [key]: value,
                                },
                            },
                        };
                    }),
                clearDetailedPageState: (page, defaultState) =>
                    set(() => ({
                        activeFilterPage: page,

                        detailedPageState: {
                            [page]: defaultState,
                        },

                        monthlyPageState: {},
                    })),

                /* ======================================================
                 * MONTHLY STATE
                 * ====================================================== */

                /**
                 * This is the MOST IMPORTANT change.
                 *
                 * Previously:
                 *
                 * monthlyPageState: {
                 *   ...prev.monthlyPageState,
                 *   [page]: state
                 * }
                 *
                 * That preserved all previous monthly pages.
                 *
                 * Now:
                 *
                 * monthlyPageState: {
                 *   [page]: state
                 * }
                 *
                 * Therefore ONLY the active page exists.
                 */
                setMonthlyPageState: (page, state) =>
                    set(() => ({
                        activeFilterPage: page,

                        monthlyPageState: {
                            [page]: state,
                        },
                    })),

                /**
                 * Update primary/compare filter.
                 *
                 * If this page is NOT active, ignore the update.
                 *
                 * This prevents an old page from accidentally modifying
                 * another page's filter state.
                 */
                updateMonthlyPageFilter: (
                    page,
                    filterType,
                    key,
                    value
                ) =>
                    set((prev) => {
                        /*
                         * Only the active monthly page is allowed to update
                         * monthlyPageState.
                         */
                        if (prev.activeFilterPage !== page) {
                            return {};
                        }

                        const current = prev.monthlyPageState[page];

                        if (!current) {
                            return {};
                        }

                        const filterKey =
                            filterType === "primary"
                                ? "primaryFilters"
                                : "compareFilters";

                        return {
                            monthlyPageState: {
                                [page]: {
                                    ...current,

                                    [filterKey]: {
                                        ...current[filterKey],
                                        [key]: value,
                                    },
                                },
                            },
                        };
                    }),

                /**
                 * Update primaryStartDate, primaryEndDate,
                 * compareStartDate, compareEndDate,
                 * enableCompare or sizeUnit.
                 */
                updateMonthlyPageField: (
                    page,
                    key,
                    value
                ) =>
                    set((prev) => {
                        /*
                         * Do not allow inactive pages to update state.
                         */
                        if (prev.activeFilterPage !== page) {
                            return {};
                        }

                        const current =
                            prev.monthlyPageState[page];

                        if (!current) {
                            return {};
                        }

                        return {
                            monthlyPageState: {
                                [page]: {
                                    ...current,
                                    [key]: value,
                                },
                            },
                        };
                    }),

                /**
                 * Reset the active monthly page.
                 *
                 * It still remains the ONLY page stored.
                 */
                clearMonthlyPageState: (
                    page,
                    defaultState
                ) =>
                    set(() => ({
                        activeFilterPage: page,

                        monthlyPageState: {
                            [page]: defaultState,
                        },
                    })),

                /* ======================================================
                 * CLEAR EVERYTHING
                 * ====================================================== */

                clearAllState: () =>
                    set({
                        activeFilterPage: null,
                        pageState: {},
                        monthlyPageState: {},
                        detailedPageState: {},
                    }),
            }),

            {
                name: "summary-filter-storage",

                /*
                 * Increase version so existing localStorage data from
                 * the old multi-monthly-page implementation is migrated.
                 */
                version: 3,

                /**
                 * Migrate old localStorage structure.
                 *
                 * Old structure could contain:
                 *
                 * monthlyPageState: {
                 *   "registrars-monthly": {...},
                 *   "trustees-monthly": {...}
                 * }
                 *
                 * We retain ONLY the state belonging to activeFilterPage.
                 */
                migrate: (persistedState: any, version) => {
                    if (version < 2) {
                        const activePage =
                            persistedState?.activeFilterPage;

                        const oldMonthlyPageState =
                            persistedState?.monthlyPageState ?? {};

                        /*
                         * Only retain monthly state when the active page
                         * is actually a monthly page.
                         */
                        const isMonthlyPage =
                            activePage === "arrangers-monthly" ||
                            activePage === "trustees-monthly" ||
                            activePage === "registrars-monthly" ||
                            activePage === "rating-agencies-monthly" ||
                            activePage === "issuers-monthly";

                        return {
                            ...persistedState,

                            monthlyPageState:
                                isMonthlyPage &&
                                    oldMonthlyPageState[activePage]
                                    ? {
                                        [activePage]:
                                            oldMonthlyPageState[activePage],
                                    }
                                    : {},
                        };
                    }

                    return persistedState;
                },
            }
        )
    );