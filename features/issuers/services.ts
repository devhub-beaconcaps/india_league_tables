const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);

export const fetchissuePageTableData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_top_issuers_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching issuers table data:", err.message);
    }
}

export const fetchTopSectorsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_top_sectors_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching top issuers sectors data:", err.message);
    }
}

export const fetchOutstandingData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_outstanding_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching outstanding data:", err.message);
    }
};


export const fetchCurrentYearRedemptionData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_current_year_debt_redemption_data`);
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching current_year_debt_redemption_data :", err.message);
    }
};

export const fetchNextYearRedemptionData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_next_year_redemption_data`);
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching issuers_page_next_year_redemption_data :", err.message);
    }
};

export const fetchCreditRatingsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/issuers_page_agency_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching outstanding data:", err.message);
    }
}