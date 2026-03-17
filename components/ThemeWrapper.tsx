'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeWrapperProps {
    children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
    const { theme } = useThemeStore();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return <>{children}</>;
}