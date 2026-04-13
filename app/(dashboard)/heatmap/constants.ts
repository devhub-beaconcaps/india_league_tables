// app/(analysis)/heatmap/constants.ts
import { LegendItem, TourStep, DropdownOption, MonthOption, HowToUseContent } from './types';

export const LEGEND_ITEMS: LegendItem[] = [
    { label: "ABOVE +25%", className: "bg-green-800 text-white dark:bg-green-900 dark:text-green-100" },
    { label: "+11 TO +25%", className: "bg-green-500 text-white dark:bg-green-600 dark:text-green-50" },
    { label: "0 TO +10%", className: "bg-green-300 text-gray-700 dark:bg-green-400 dark:text-gray-900" },
    { label: "0%", className: "bg-orange-200 text-gray-600 dark:bg-orange-300 dark:text-gray-800" },
    { label: "-10 TO 0%", className: "bg-red-300 text-white dark:bg-red-400 dark:text-red-950" },
    { label: "-25 TO -11%", className: "bg-red-500 text-white dark:bg-red-600 dark:text-red-50" },
    { label: "BELOW -25%", className: "bg-red-800 text-white dark:bg-red-900 dark:text-red-100" },
];

export const TOUR_STEPS: TourStep[] = [
    {
        id: 1,
        title: "Participants",
        description: "Select participants (Issuer, Arranger, Trustee, or Registrar) from this dropdown.",
        targetRef: "participantsRef",
    },
    {
        id: 2,
        title: "Ranks",
        description: "Filter data by selecting a rank range from this dropdown.",
        targetRef: "ranksRef",
    },
    {
        id: 3,
        title: "Frequency",
        description: "Choose a time period (Yearly, Half Yearly, Quarterly, Monthly) using these chips.",
        targetRef: "frequencyRef",
    },
    {
        id: 4,
        title: "Growth Categories",
        description: "Filter by growth categories using these percentage buttons.",
        targetRef: "legendRef",
    },
    {
        id: 5,
        title: "Search",
        description: "Use this search bar to find specific issuers by name.",
        targetRef: "searchRef",
    },
];

export const PARTICIPANT_OPTIONS: DropdownOption[] = [
    { label: "Issuer", value: "issuers" },
    { label: "Arranger", value: "arrangers" },
    { label: "Trustee", value: "trustees" },
    { label: "Registrar", value: "registrars" },
];

export const RANK_OPTIONS: DropdownOption[] = [
    { label: "Top 10", value: "10" },
    { label: "Top 20", value: "20" },
    { label: "Top 50", value: "50" },
];

export const FREQUENCY_OPTIONS: DropdownOption[] = [
    { label: "Yearly", value: "Yearly" },
    { label: "Half-Yearly", value: "Half-Yearly" },
    { label: "Quarterly", value: "Quarterly" },
    { label: "Monthly", value: "Monthly" },
];

export const MONTH_OPTIONS: MonthOption[] = [
    { label: "April", value: 3 },
    { label: "May", value: 4 },
    { label: "June", value: 5 },
    { label: "July", value: 6 },
    { label: "August", value: 7 },
    { label: "September", value: 8 },
    { label: "October", value: 9 },
    { label: "November", value: 10 },
    { label: "December", value: 11 },
    { label: "January", value: 0 },
    { label: "February", value: 1 },
    { label: "March", value: 2 },
];

export const HOW_TO_USE_CONTENT: HowToUseContent = {
    description:
        "The heat map displays top issuers by amount, with green for growth and red for declines. Amounts in crores.",
    points: [
        "Select participants from the dropdown",
        "Filter by rank range",
        "Choose time period using chips",
        "Use percentage buttons for growth categories",
        "Search for specific issuers",
    ],
};