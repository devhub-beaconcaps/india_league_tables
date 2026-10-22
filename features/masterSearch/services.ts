const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ilt.debtcircle.in';

export interface MasterSearchResult {
    id: number;
    shortName: string;
    name: string;
    parentId: number;
}

export interface MasterSearchResponse {
    data: MasterSearchResult[];
}

export const fetchMasterSearch = async (
    masterTable: 'Arranger' | 'Registrar' | 'Trustee',
    searchQuery: string,
    signal?: AbortSignal,
): Promise<MasterSearchResponse> => {
    const response = await fetch(`${backendURL}/masterSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterTable, searchQuery }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Master search failed with status ${response.status}`);
    }

    return response.json() as Promise<MasterSearchResponse>;
};
