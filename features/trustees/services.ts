const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);


export const fetchTrusteePageTrusteesData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trustees_page_top_trustees_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching trustees data:", err.message);
    }
}

export const fetchTrusteePageCreditRatingsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trustees_page_credit_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching trustees data:", err.message);
    }
}
export const fetchTrusteePageDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trusteePage_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching trustees data:", err.message);
    }
}

export const fetchTrusteeMonthlySummaryData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trustee_page_monthly_summary_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching trustees page monthly summary data:", err.message);
    }
};

export const fetchTrusteeMonthlyDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trustee_page_monthly_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching issuer page monthly detailed data:", err.message);
    }
};


