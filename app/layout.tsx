import { Inter } from 'next/font/google';
import { SessionProvider } from '../components/SessionProvider';
import type { Metadata } from 'next';
import './globals.css';

// ─── Font ─────────────────────────────────────────────────────────────────────

const inter = Inter({ subsets: ['latin'] });

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: 'FinDash - Financial Dashboard',
    description: 'A comprehensive financial dashboard with analytics and reporting',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RootLayoutProps {
    children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    );
}