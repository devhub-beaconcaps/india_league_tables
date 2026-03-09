const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);

export const fetchHeatmapEntityData = async (query: unknown) => {
    console.log(`Fetching data for endpoint: ${backendURL} with query:`, query);
    try {
        const response = await fetch(`${backendURL}/analysisPage_entity_ranking_data`, {
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