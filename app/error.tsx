'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
                    Something went wrong
                </h2>
                <p className="text-[var(--color-muted)] mb-6">
                    We apologize for the inconvenience. Please try again.
                </p>
                <Button onClick={reset}>Try again</Button>
            </div>
        </div>
    );
}