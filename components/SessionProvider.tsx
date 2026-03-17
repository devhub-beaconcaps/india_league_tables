'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionProviderProps {
    children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: SessionProviderProps) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}