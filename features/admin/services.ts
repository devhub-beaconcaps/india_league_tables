// const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const backendURL = 'http://localhost:4000';

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

export const getAdminArrangersData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/admin-arrangers`, {
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

export const getAdminSimilarArrangerData = async (arrangerId: unknown) => {
    try {
        const response = await fetch(`${backendURL}/arrangers/similar/${arrangerId}?threshold=50`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching similar arrangers data:", err.message);
    }
}

export const mergeArrangersData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/merge-arrangers`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error merging arrangers data:", err.message);
    }
}
