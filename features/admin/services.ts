const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ilt.debtcircle.in';

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

export const getAdminTrusteesData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/admin-trustees`, {
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

export const mergeTrusteesData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/merge-trustees`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error merging trustees data:", err.message);
    }
}

export const getAdminSimilarTrusteesData = async (trusteeId: unknown) => {
    try {
        const response = await fetch(`${backendURL}/trustees/similar/${trusteeId}?threshold=50`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching similar trustee data:", err.message);
    }
}

export const getAdminAgenciesData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/admin-agencies`, {
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

export const mergeAgenciesData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/merge-agencies`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error merging agencies data:", err.message);
    }
}

export const getAdminRegistrarsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/admin-registrars`, {
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

export const mergeRegistrarsData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/merge-registrars`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error merging registrars data:", err.message);
    }
}

export const getAdminSimilarRegistrarsData = async (registrarId: unknown) => {
    try {
        const response = await fetch(`${backendURL}/registrars/similar/${registrarId}?threshold=50`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching similar registrar data:", err.message);
    }
}

export const getAdminSimilarAgenciesData = async (agencyId: unknown) => {
    try {
        const response = await fetch(`${backendURL}/agencies/similar/${agencyId}?threshold=50`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching similar agency data:", err.message);
    }
}

export const getMonthlyReportData = async (query: unknown) => {
    try {
        const response = await fetch(`${backendURL}/market-snapshot-data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error("Error fetching monthly data:", err.message);
    }
}

export const postIssuersData = async (query: unknown) => {
  try {
    const response = await fetch(`${backendURL}/bulk-issuers-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed (${response.status}): ${errorText || response.statusText}`
      );
    }

    return response.json();
  } catch (err: any) {
    console.error('Error uploading issuers data:', err.message);
    throw err; // <-- important: rethrow so caller can catch
  }
};