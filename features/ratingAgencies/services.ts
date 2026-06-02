const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);


export const fetchRatingAgencyPageData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/rating_agencies_page_top_agencies_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching agencies data:", err.message);
    }
}
export const fetchRatingAgencyCreditRatingsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/rating_agencies_page_credit_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching ratings data:", err.message);
    }
}

export const fetchRatingAgencyDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/agencyPage_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching rating agencies detailed data:", err.message);
    }
}

export const fetchRatingAgencyMonthlySummaryData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/rating_agencies_page_monthly_summary_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching rating agency page monthly summary data:", err.message);
    }
};

export const fetchRatingAgencyMonthlyDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/rating_agencies_page_monthly_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching rating agency page monthly detailed data:", err.message);
    }
};

export const fetchRatingAgencyTopParticipantsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/rating_agency_top_participants_details`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching rating agency page top participants data:", err.message);
    }
};
