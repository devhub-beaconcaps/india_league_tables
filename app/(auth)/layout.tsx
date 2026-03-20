import { redirect } from 'next/navigation';
import ThemeWrapper from '../../components/ThemeWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthLayoutProps {
    children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function AuthLayout({ children }: AuthLayoutProps) {

    return (
        <ThemeWrapper>
            <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50 dark:bg-gray-950 transition-colors">
                <div className="w-full max-w-xl">
                    {children}
                </div>
            </div>
        </ThemeWrapper>
    );
}