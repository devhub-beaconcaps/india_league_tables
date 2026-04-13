// app/(analysis)/heatmap/utils.ts
import { 
    FinancialYear, 
    DateRange, 
    RawEntityItem, 
    FormattedEntityItem, 
    FrequencyValue, 
    SelectedPeriod 
} from './types';

export function getCurrentFinancialYear(): FinancialYear {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let startYear: number;
    let endYear: number;

    if (currentMonth < 3) {
        startYear = currentYear - 1;
        endYear = currentYear;
    } else {
        startYear = currentYear;
        endYear = currentYear + 1;
    }

    return { startYear, endYear };
}

export function formatDate(year: number, month: number, day: number, time: string): string {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${time}`;
}

export function getDateRangeByFrequency(frequency: FrequencyValue, period: SelectedPeriod): DateRange | null {
    const { startYear, endYear } = getCurrentFinancialYear();

    if (frequency === "Yearly") {
        return {
            startDate: formatDate(startYear, 3, 1, "00:00:00"),
            endDate: formatDate(endYear, 2, 31, "23:59:59"),
        };
    }

    if (frequency === "Half-Yearly") {
        if (period === "H1") {
            return {
                startDate: formatDate(startYear, 3, 1, "00:00:00"),
                endDate: formatDate(startYear, 8, 30, "23:59:59"),
            };
        } else {
            return {
                startDate: formatDate(startYear, 9, 1, "00:00:00"),
                endDate: formatDate(endYear, 2, 31, "23:59:59"),
            };
        }
    }

    if (frequency === "Quarterly") {
        const quarters: Record<string, [number, number]> = {
            Q1: [3, 5],
            Q2: [6, 8],
            Q3: [9, 11],
            Q4: [0, 2],
        };

        const key = period as string;
        const [startMonth, endMonth] = quarters[key];
        const year = period === "Q4" ? endYear : startYear;

        return {
            startDate: formatDate(year, startMonth, 1, "00:00:00"),
            endDate: formatDate(year, endMonth + 1, 0, "23:59:59"),
        };
    }

    if (frequency === "Monthly" && period !== null) {
        const monthIndex = Number(period);
        const year = monthIndex <= 2 ? endYear : startYear;

        return {
            startDate: formatDate(year, monthIndex, 1, "00:00:00"),
            endDate: formatDate(year, monthIndex + 1, 0, "23:59:59"),
        };
    }

    return null;
}

export const formatData = (data: RawEntityItem[]): FormattedEntityItem[] => {
    const numbers = data?.map((item) => Number(item.yoy));
    const maxVal = Math.max(...numbers.map((n) => Math.abs(n)), 1);

    return data?.map((item) => {
        const val = Number(item.yoy);
        const intensity = Math.min(Math.abs(val) / maxVal, 1);

        const minBrightness = 50;
        const maxBrightness = 200;
        const colorValue = Math.round(minBrightness + (maxBrightness - minBrightness) * intensity);

        const toHex = (n: number): string => n.toString(16).padStart(2, "0");

        const color: string =
            val >= 0
                ? `#00${toHex(colorValue)}00`
                : `#${toHex(colorValue)}0000`;

        return {
            name: item.issuer_name,
            change: val.toFixed(2),
            amount: item.cy_issue_size,
            color,
        };
    });
};