//filterState.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SummaryPage =
  | 'arrangers-summary'
  | 'trustees-summary'
  | 'registrars-summary'
  | 'rating-agencies-summary'
  | 'issuers-summary';

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

interface SummaryFilterStore {
  filters: Partial<SummaryFiltersByPage>;

  setPageFilters: <P extends SummaryPage>(
    page: P,
    filters: SummaryFiltersByPage[P]
  ) => void;

  updatePageFilter: <P extends SummaryPage>(
    page: P,
    key: keyof SummaryFiltersByPage[P],
    value: string[]
  ) => void;

  clearPageFilters: <P extends SummaryPage>(
    page: P,
    defaultFilters: SummaryFiltersByPage[P]
  ) => void;

  clearAllFilters: () => void;
}

export const useSummaryFilterStore =
  create<SummaryFilterStore>()(
    persist(
      (set) => ({
        filters: {},

        setPageFilters: (page, filters) =>
          set((state) => ({
            filters: {
              ...state.filters,
              [page]: filters,
            },
          })),

        updatePageFilter: (page, key, value) =>
          set((state) => {
            const currentFilters = state.filters[page];

            if (!currentFilters) {
              return state;
            }

            return {
              filters: {
                ...state.filters,
                [page]: {
                  ...currentFilters,
                  [key]: value,
                },
              },
            };
          }),

        clearPageFilters: (page, defaultFilters) =>
          set((state) => ({
            filters: {
              ...state.filters,
              [page]: defaultFilters,
            },
          })),

        clearAllFilters: () =>
          set({
            filters: {},
          }),
      }),
      {
        name: 'summary-filter-storage',
      }
    )
  );