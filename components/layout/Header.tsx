'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useThemeStore } from '../../lib/store';
import ILTLogo from '../../public/img/ILTLogo.png';
import { cn } from '../../lib/utils';
import {
    Menu,
    Sun,
    Moon,
    User,
    LogOut,
    ChevronDown,
    Settings,
} from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
    id: number;
    title: string;
    time: string;
    isNew: boolean;
}

interface HeaderProps {
    onMenuClick: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({ onMenuClick }: HeaderProps) {
    const { data: session } = useSession();
    const { theme, toggleTheme } = useThemeStore();
    const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

    // Kept typed but unused — remove if notifications UI is not needed
    const _notifications: Notification[] = [
        { id: 1, title: 'New report available', time: '2 minutes ago', isNew: true },
        { id: 2, title: 'System update completed', time: '1 hour ago', isNew: true },
        { id: 3, title: 'New issuer registered', time: '3 hours ago', isNew: false },
    ];

    return (
        <header className="h-full bg-[var(--color-card)] dark:bg-gray-900 border-b border-[#ECECEC] dark:border-gray-800 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">

            {/* Left section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--color-accent)] dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    <Menu className="w-5 h-5 text-[var(--color-foreground)] dark:text-gray-100" />
                </button>

                <div>
                    <Image src={ILTLogo} alt="ILT Logo" className="w-15 h-8" />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl hover:bg-[var(--color-accent)] dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95 relative group"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-[var(--color-foreground)] dark:text-yellow-400 group-hover:rotate-90 transition-transform duration-300" />
                    ) : (
                        <Moon className="w-5 h-5 text-[var(--color-foreground)] dark:text-blue-400 group-hover:-rotate-12 transition-transform duration-300" />
                    )}
                </button>

                {/* Profile */}
                <div className="relative ml-2">
                    <button
                        onClick={() => setIsProfileOpen(prev => !prev)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-[var(--color-accent)] dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-[var(--color-border)] dark:hover:border-gray-700"
                    >
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-[var(--color-foreground)] dark:text-white leading-tight">
                                {session?.user?.name ?? 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                        </div>
                        <ChevronDown
                            className={cn(
                                'w-4 h-4 text-[var(--color-muted)] dark:text-gray-400 transition-transform duration-200',
                                isProfileOpen && 'rotate-180'
                            )}
                        />
                    </button>

                    {/* Profile dropdown */}
                    {isProfileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-gray-900 border border-black dark:border-gray-700 rounded-2xl shadow-2xl z-50 animate-fade-in-scale overflow-hidden">
                                <div className="p-4 border-b border-black dark:border-gray-700">
                                    <p className="font-semibold text-[var(--color-foreground)] dark:text-white">
                                        {session?.user?.name ?? 'User'}
                                    </p>
                                    <p className="text-sm text-[var(--color-muted)] dark:text-gray-400">
                                        {session?.user?.email ?? 'user@example.com'}
                                    </p>
                                </div>
                                <div className="p-2">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-accent)] dark:hover:bg-gray-800 text-sm text-[var(--color-foreground)] dark:text-gray-200 transition-colors duration-150">
                                        <User className="w-4 h-4 text-[var(--color-muted)] dark:text-gray-400" />
                                        Profile
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-accent)] dark:hover:bg-gray-800 text-sm text-[var(--color-foreground)] dark:text-gray-200 transition-colors duration-150">
                                        <Settings className="w-4 h-4 text-[var(--color-muted)] dark:text-gray-400" />
                                        Settings
                                    </button>
                                    <div className="h-px bg-[var(--color-border)] dark:bg-gray-700 my-1" />
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors duration-150"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}