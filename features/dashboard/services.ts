const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);

export const fetchDashboardTablesData = async (query: unknown, endpoint: string) => {
    console.log(`Fetching data for endpoint: ${backendURL} with query:`, query);
    try {
        const response = await fetch(`${backendURL}/${endpoint}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard table data:", err.message);
    }
};

export const fetchDashboardStatsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/dashboard_top_stats_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard_top_stats_data :", err.message);
    }
};

export const fetchDashboardSectorsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/dashboard_sectors_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard sectors data:", err.message);
    }
};

export const fetchDashboardRatingAgencyData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/dashboard_agency_rating_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard_agency_rating_data :", err.message);
    }
};

export const fetchDashboardMonthlyVolumeData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/dashboard_monthly_comparison_data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard_monthly_comparison_data :", err.message);
    }
};

export const fetchDashboardIssueVolumeTrendsData = async () => {
    try {
        const response = await fetch(`${backendURL}/dashboard_issue_volume_trends_data`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching dashboard_issue_volume_trends_data :", err.message);
    }
};