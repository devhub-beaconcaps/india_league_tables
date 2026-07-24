const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// const backendURL = 'http://localhost:4000';

// console.log("ENV VALUE:", process.env.NEXT_PUBLIC_BACKEND_URL);


export const postReIssuanceData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/bulk-upsert`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error posting re-issuance data:", err.message);
    }
}

export const postArrangersData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/bulk-arrangers`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error posting arrangers data:", err.message);
    }
}
