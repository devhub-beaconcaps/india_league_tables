const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);


export const fetchRegistrarPageData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrars_page_top_registrars_data`, {
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
export const fetchRegistrarPageCreditRatingsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrars_page_credit_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching registrars data:", err.message);
    }
}

export const fetchRegistrarPageDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrarPage_detailed_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching registrars data:", err.message);
    }
}

export const fetchRegistrarMonthlySummaryData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrar_page_monthly_summary_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching registrar page monthly summary data:", err.message);
    }
};


export const fetchRegistrarMonthlyDetailedData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrars_page_monthly_detailed_data`, {
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

export const fetchRegistrarTopParticipantsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrar_top_participants_details`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching registrar page top participants data:", err.message);
    }
};


