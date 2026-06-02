const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);


export const fetchArrangerPageArrangersData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arrangers_page_top_arrangers_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching arrangers data:", err.message);
    }
}


export const fetchArrangerPageCreditRatingsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arrangers_page_credit_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching arrangers credit ratings data:", err.message);
    }
}

export const fetchArrangersDetailsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arrangerPage_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching issue details data:", err.message);
    }
};

export const fetchArrangerMonthlySummaryData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arranger_page_monthly_summary_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching arrangers page monthly summary data:", err.message);
    }
};

export const fetchArrangerMonthlyDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arrangers_page_monthly_detailed_data`, {
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

export const fetchArrangerTopParticipantsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arranger_top_participants_details`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching arrangers page top participants data:", err.message);
    }
};