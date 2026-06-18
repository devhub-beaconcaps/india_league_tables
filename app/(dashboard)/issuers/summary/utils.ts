// app/(issuers)/summary/utils.ts
import {
    RawIssuerItem,
    RawSectorItem,
    RawOutstandingItem,
    RawDebtItem,
    RawRatingItem,
    FormattedIssuerItem,
    FormattedSectorItem,
    FormattedOutstandingItem,
    FormattedDebtItem,
    FormattedMarketShareItem,
    FormattedRatingItem,
    FYOption,
    DateRange,
    GetDateRangeParams,
    IssueType,
    FrequencyValue,
    SelectedPeriod,
} from './types';

function capAtCurrentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (date > now) {
        // Return current date in the same format
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    
    return dateStr;
}

export const formatData = (data: RawIssuerItem[]): FormattedIssuerItem[] => {
    return data?.map(item => ({
        name: item.name,
        issueSize: Number(item.currentSize) || 0,
        deals: Number(item.currentDeals) || 0,
        mktShare: Number(item.currentMarketShare) || 0,
        rank: Number(item.rank) || 0,
        prevSize: Number(item.previousSize) || 0,
        prevDeals: Number(item.previousDeals) || 0,
        prevMkt: Number(item.previousMarketShare) || 0,
        prevRank: Number(item.previousRank) || 0,
        yoy: item.yoyChange ? Number(item.yoyChange) : 0,
    }));
};

export const formatSectorData = (data: RawSectorItem[]): FormattedSectorItem[] => {
    return data?.map(item => ({
        sector: item.name,
        cy: Number(item.value) || 0,
        py: Number(item.previousValue) || 0,
    }));
};

export function getShortForm(text: string): string {
    if (!text) return '';

    const words = text.split(/[\s\-_/]+/);
    let result = '';

    words.forEach(word => {
        if (!word) return;
        result += word[0].toUpperCase();
        for (let i = 1; i < word.length; i++) {
            if (word[i] === word[i].toUpperCase() && /[A-Z]/.test(word[i])) {
                result += word[i];
            }
        }
    });

    return result;
}

export const formatOutstandingData = (data: RawOutstandingItem[]): FormattedOutstandingItem[] => {
    return data?.map(item => ({
        month: item.month,
        issue: Number(item.issue) || 0,
        outstanding: Number(item.outstanding) || 0,
        redemption: Number(item.redemption) || 0,
    }));
};

export const formatDebtData = (data: RawDebtItem[]): FormattedDebtItem[] => {
    return data?.map(item => ({
        month: item.label,
        noOfIssues: Number(item.isin_count) || 0,
        issueSize: Number(item.issue_size) || 0,
        year: item.year,
    }));
};

export function formatMarketShareData(
    data: RawIssuerItem[],
    issueType: IssueType
): FormattedMarketShareItem[] {
    const key = issueType === 'size' ? 'currentSize' : 'currentDeals';

    const total = data.reduce((sum, item) => sum + Number(item[key] || 0), 0);

    const generateColor = (index: number, totalItems: number): string => {
        const hue = Math.round((360 / totalItems) * index);
        return `hsl(${hue}, 60%, 50%)`;
    };

    return data.map((item, index) => {
        const value = Number(item[key] || 0);
        const percent = total ? (value / total) * 100 : 0;

        return {
            name: item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name,
            value: Number(percent.toFixed(2)),
            color: generateColor(index, data.length),
        };
    });
}

export const getFinancialYears = (): FYOption[] => {
    const today = new Date();
    const currentMonth = today.getMonth();
    // Financial year runs April-March, so if we're before April, current FY started last year
    const currentFYStart = currentMonth < 3 ? today.getFullYear() - 1 : today.getFullYear();

    return Array.from({ length: 5 }, (_, i) => {
        const start = currentFYStart - i;
        const end = start + 1;
        return {
            label: `FY ${start}-${String(end).slice(-2)}`,
            value: `${start}-${end}`,
            startYear: start,
        };
    });
};

export const formatDate = (year: number, month: number, day: number, time = '00:00:00'): string => {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const getFinancialYearRange = (fy: string): DateRange => {
    const startYear = Number(fy.split('-')[0]);
    const endYear = startYear + 1;
    const today = new Date();
    
    // If FY hasn't started yet, cap to current date
    const fyStart = new Date(startYear, 3, 1);
    if (fyStart > today) {
        return {
            startDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
            endDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate(), '23:59:59'),
        };
    }
    
    const range = {
        startDate: formatDate(startYear, 3, 1),
        endDate: formatDate(endYear, 2, 31, '23:59:59'),
    };
    
    return {
        startDate: range.startDate,
        endDate: capAtCurrentDate(range.endDate),
    };
};

export const getDateRange = ({ fy, frequency, period }: GetDateRangeParams): DateRange | null => {
    const startYear = Number(fy.split('-')[0]);
    const endYear = startYear + 1;
    const today = new Date();

    // If the entire financial year is in the future, return null or handle accordingly
    const fyStartDate = new Date(startYear, 3, 1); // April 1
    if (fyStartDate > today) {
        // Financial year hasn't started yet, use current date range or return null
        return {
            startDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
            endDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate(), '23:59:59'),
        };
    }

    if (frequency === 'Yearly') {
        const range = getFinancialYearRange(fy);
        return {
            startDate: range.startDate,
            endDate: capAtCurrentDate(range.endDate),
        };
    }

    if (frequency === 'Half-Yearly') {
        const range = period === 'H1'
            ? {
                startDate: formatDate(startYear, 3, 1),
                endDate: formatDate(startYear, 8, 30, '23:59:59'),
            }
            : {
                startDate: formatDate(startYear, 9, 1),
                endDate: formatDate(endYear, 2, 31, '23:59:59'),
            };
        
        return {
            startDate: range.startDate,
            endDate: capAtCurrentDate(range.endDate),
        };
    }

    if (frequency === 'Quarterly') {
        const quarters: Record<string, [number, number]> = {
            Q1: [3, 5],
            Q2: [6, 8],
            Q3: [9, 11],
            Q4: [0, 2],
        };
        const [startMonth, endMonth] = quarters[period as string];
        const year = period === 'Q4' ? endYear : startYear;
        
        const range = {
            startDate: formatDate(year, startMonth, 1),
            endDate: formatDate(year, endMonth + 1, 0, '23:59:59'),
        };
        
        return {
            startDate: range.startDate,
            endDate: capAtCurrentDate(range.endDate),
        };
    }

    if (frequency === 'Monthly' && period !== null) {
        const monthIndex = Number(period);
        const year = monthIndex <= 2 ? endYear : startYear;
        
        const range = {
            startDate: formatDate(year, monthIndex, 1),
            endDate: formatDate(year, monthIndex + 1, 0, '23:59:59'),
        };
        
        return {
            startDate: range.startDate,
            endDate: capAtCurrentDate(range.endDate),
        };
    }

    return null;
};

export function getMonthDates(month: string, year: number): DateRange {
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const today = new Date();

    let start = new Date(year, monthIndex, 1);
    if (today.getFullYear() === year && today.getMonth() === monthIndex) {
        start = today;
    }

    const end = new Date(year, monthIndex + 1, 0);

    const format = (d: Date): string =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { startDate: format(start), endDate: format(end) };
}

export function getCurrYearMonthDates(month: string, year: number): DateRange {
    // Parse the month string (e.g., "January") to get its zero-based index (0-11)
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const today = new Date();

    // Default start date is the 1st day of the requested month
    let start = new Date(year, monthIndex, 1);

    // If the requested month and year match the current month and year, update start to today
    if (today.getFullYear() === year && today.getMonth() === monthIndex) {
        start = today;
    }

    // End date is the last day of the requested month 
    // (Using 0 for the day gets the last day of the previous month, so we add 1 to monthIndex)
    const end = new Date(year, monthIndex + 1, 0);

    // Helper to format Date objects as "YYYY-MM-DD"
    const format = (d: Date): string => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        
        return `${yyyy}-${mm}-${dd}`;
    };

    return { 
        startDate: format(start), 
        endDate: format(end) 
    };
}

export function formatRatingsData(data: RawRatingItem[], creditRatingAgency: string | number): FormattedRatingItem[] {
    const generateColor = (index: number, totalItems: number): string => {
        const hue = Math.round((360 / totalItems) * index);
        return `hsl(${hue}, 60%, 50%)`;
    };

    return data?.map((item, index) => ({
        name: Number(creditRatingAgency) > 0 ? (item.name ?? '') : (item.label ?? ''),
        value: Number(item.rating_no) || 0,
        color: generateColor(index, data.length),
    }));
}