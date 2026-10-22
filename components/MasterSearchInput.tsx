'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchMasterSearch, type MasterSearchResult } from '@/features/masterSearch/services';

type MasterTable = 'Arranger' | 'Registrar' | 'Trustee';

interface MasterSearchInputProps {
    masterTable: MasterTable;
    value: string;
    placeholder: string;
    onSelect: (value: string) => void;
}

export default function MasterSearchInput({
    masterTable,
    value,
    placeholder,
    onSelect,
}: MasterSearchInputProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeRequestRef = useRef<AbortController | null>(null);
    const lastRequestedQueryRef = useRef<string | null>(null);
    const shouldDebounceSearchRef = useRef(false);
    const [inputValue, setInputValue] = useState(value);
    const [results, setResults] = useState<MasterSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) setInputValue(value);
    }, [isOpen, value]);

    const searchMaster = useCallback(async (searchQuery: string) => {
        activeRequestRef.current?.abort();
        const controller = new AbortController();
        activeRequestRef.current = controller;
        lastRequestedQueryRef.current = searchQuery;
        setIsLoading(true);
        setSearchError(null);

        try {
            const response = await fetchMasterSearch(masterTable, searchQuery, controller.signal);
            if (!controller.signal.aborted) {
                setResults(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error(`Error searching ${masterTable.toLowerCase()}s:`, error);
                setResults([]);
                setSearchError(`Unable to load ${masterTable.toLowerCase()}s`);
            }
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    }, [masterTable]);

    useEffect(() => {
        if (!isOpen || !shouldDebounceSearchRef.current) return;

        const timeoutId = window.setTimeout(() => {
            shouldDebounceSearchRef.current = false;
            void searchMaster(inputValue);
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [inputValue, isOpen, searchMaster]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => () => activeRequestRef.current?.abort(), []);

    const handleFocus = () => {
        shouldDebounceSearchRef.current = false;
        setIsOpen(true);
        void searchMaster(inputValue);
    };

    const handleInputChange = (nextValue: string) => {
        shouldDebounceSearchRef.current = nextValue !== inputValue;
        setInputValue(nextValue);
        if (nextValue !== lastRequestedQueryRef.current) {
            setResults([]);
            setIsLoading(true);
            setSearchError(null);
        }
    };

    const listId = `${masterTable.toLowerCase()}-search-results`;
    const entityName = `${masterTable.toLowerCase()}s`;

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={inputValue}
                onFocus={handleFocus}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                className="w-full h-6 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg
                    text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
                    placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {isOpen && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-xs shadow-lg dark:border-gray-700 dark:bg-[#1a1a2e]"
                >
                    {isLoading && (
                        <li className="flex items-center gap-2 px-3 py-2 text-gray-500" role="status">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Searching {entityName}...
                        </li>
                    )}
                    {!isLoading && searchError && (
                        <li className="px-3 py-2 text-red-500" role="alert">{searchError}</li>
                    )}
                    {!isLoading && !searchError && results.map((result) => (
                        <li key={result.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={result.shortName === value}
                                onClick={() => {
                                    setInputValue(result.shortName);
                                    setIsOpen(false);
                                    onSelect(result.shortName);
                                }}
                                className="w-full truncate px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                title={result.name}
                            >
                                {result.shortName}
                            </button>
                        </li>
                    ))}
                    {!isLoading && !searchError && results.length === 0 && (
                        <li className="px-3 py-2 text-gray-500">No {entityName} found</li>
                    )}
                </ul>
            )}
        </div>
    );
}
