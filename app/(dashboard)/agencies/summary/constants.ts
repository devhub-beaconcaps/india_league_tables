// app/(issuers)/summary/constants.ts
import { DropdownOption } from './types';

export const creditRatingAgencyOptions = [
    { label: 'All', id: '0' },
    { label: 'INDIA RATING', id: '1' },
    { label: 'CRISIL', id: '2' },
    { label: 'ICRA', id: '3' },
    { label: 'Acuite Ratings', id: '4' },
    { label: 'CARE', id: '5' },
    { label: 'BRICKWORK RATINGS', id: '6' },
    { label: 'Infomerics Valuation and Rating', id: '7' },
];

export const frequencyOptions: DropdownOption[] = [
    { label: 'Yearly', value: 'Yearly' },
    { label: 'Half-Yearly', value: 'Half-Yearly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Monthly', value: 'Monthly' },
];

export const monthOptions: DropdownOption[] = [
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
];

export const valueConventionOptions: DropdownOption[] = [
    { label: 'Crores', value: 'Crores' },
    { label: 'Lakhs', value: 'Lakhs' },
];

export const creditAgencyDropdownOptions: DropdownOption[] = creditRatingAgencyOptions.map(item => ({
    label: item.label,
    value: item.id,
}));