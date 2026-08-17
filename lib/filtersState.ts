import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SummaryPage =
  | 'arrangers-summary'
  | 'trustees-summary'
  | 'registrars-summary'
  | 'rating-agencies-summary'
  | 'issuers-summary';

/* ── Shared UI state types ─────────────────────────────────── */

export type FrequencyValue = 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly';
export type SelectedPeriod = 'H1' | 'H2' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | number | null;
export type IssueType = 'size' | 'count';
export type ValueConvention = 'Crores' | 'Lakhs' | 'Billions';

/* ── Per-page filter shapes ────────────────────────────────── */

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
  'arrangers-summary': ArrangerFilters;
  'trustees-summary': TrusteeFilters;
  'registrars-summary': RegistrarFilters;
  'rating-agencies-summary': AgencyFilters;
  'issuers-summary': IssuerFilters;
}

/* ── Full page state (filters + UI state) ──────────────────── */

export interface PageState<P extends SummaryPage> {
  selectedFY: string;
  frequency: FrequencyValue;
  period: SelectedPeriod;
  issueType: IssueType;
  valueConvention: ValueConvention;
  filters: SummaryFiltersByPage[P];
}

/* ── Store interface ───────────────────────────────────────── */

interface SummaryFilterStore {
  /** Which page last owned the active filter context */
  activeFilterPage: SummaryPage | null;

  /** Persisted state for every page (kept even when not active) */
  pageState: Partial<{
    [P in SummaryPage]: PageState<P>;
  }>;

  /** Replace entire state object for a page and mark it active */
  setPageState: <P extends SummaryPage>(page: P, state: PageState<P>) => void;

  /** Update one filter array inside a page and mark it active */
  updatePageFilter: <P extends SummaryPage>(
    page: P,
    key: keyof SummaryFiltersByPage[P],
    value: string[]
  ) => void;

  /** Update one top-level field (selectedFY, frequency, etc.) and mark page active */
  updatePageField: <P extends SummaryPage>(
    page: P,
    key: Exclude<keyof PageState<P>, 'filters'>,
    value: any
  ) => void;

  /** Reset a page to defaults and mark it active */
  clearPageState: <P extends SummaryPage>(page: P, defaultState: PageState<P>) => void;

  /** Wipe everything */
  clearAllState: () => void;
}

/* ── Store implementation ──────────────────────────────────── */

export const useSummaryFilterStore =
  create<SummaryFilterStore>()(
    persist(
      (set) => ({
        activeFilterPage: null,
        pageState: {},

        setPageState: (page, state) =>
          set((prev) => ({
            activeFilterPage: page,
            pageState: {
              ...prev.pageState,
              [page]: state,
            },
          })),

        updatePageFilter: (page, key, value) =>
          set((prev) => {
            const current = prev.pageState[page];
            if (!current) {
              return { activeFilterPage: page };
            }
            return {
              activeFilterPage: page,
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
              return { activeFilterPage: page };
            }
            return {
              activeFilterPage: page,
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
            pageState: {
              ...prev.pageState,
              [page]: defaultState,
            },
          })),

        clearAllState: () =>
          set({
            activeFilterPage: null,
            pageState: {},
          }),
      }),
      {
        name: 'summary-filter-storage',
      }
    )
  );