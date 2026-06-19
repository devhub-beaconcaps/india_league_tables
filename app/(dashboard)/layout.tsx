'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '../../lib/store';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { useUser } from '@clerk/nextjs'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useRouter } from 'next/navigation';



// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
    children: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 55;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const { theme } = useThemeStore();
    const router = useRouter();

    const { isSignedIn, user, isLoaded } = useUser();



    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleOverlayClick = (): void => {
        setIsSidebarOpen(false);
    };

    // Handle loading state
    // Handle loading state
    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-[120px] h-[120px]">
                        <DotLottieReact
                            src="https://lottie.host/22feb182-5b2a-45b8-91bd-ffc09a0de205/dn7Bz2NCSh.lottie"
                            loop
                            autoplay
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // Protect the page from unauthenticated users
    if (!isSignedIn) {
        router.push('/sign-in');
        return null;
    }

    return (
        <div className="h-screen bg-[#F0F7FF] dark:bg-[var(--color-background)] overflow-hidden">

            {/* Fixed Header */}
            <div
                className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#1a1a2e] shadow-sm"
                style={{ height: HEADER_HEIGHT }}
            >
                <Header onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
            </div>

            {/* Layout Below Header */}
            <div
                className="flex relative"
                style={{
                    paddingTop: HEADER_HEIGHT,
                    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                }}
            >
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed left-0 right-0 bottom-0 bg-black/50 z-30 md:hidden"
                        style={{ top: HEADER_HEIGHT }}
                        onClick={handleOverlayClick}
                    />
                )}

                {/* Sidebar */}
                <div
                    className={`
                        fixed
                        left-0
                        z-40
                        transform transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        md:relative md:translate-x-0 md:flex
                    `}
                    style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
                >
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto ">
                    {children}
                </main>
            </div>
        </div>
    );
}