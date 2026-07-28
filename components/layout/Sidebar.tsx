'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton, useClerk, UserButton } from "@clerk/nextjs";
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    BarChart2,
    Building2,
    Handshake,
    Shield,
    ClipboardList,
    Award,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    LucideIcon,
    Heart 
} from 'lucide-react';
import { useThemeStore } from '../../lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildNavItem {
    name: string;
    href: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    children?: ChildNavItem[];
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Analysis',
        href: '/analysis',
        icon: BarChart2,
        children: [
            { name: 'Heatmap', href: '/heatmap' },
        ],
    },
    {
        name: 'Issuer',
        href: '/issuers',
        icon: Building2,
        children: [
            { name: 'Summary', href: '/issuers/summary' },
            { name: 'Monthly', href: '/issuers/monthly' },
            { name: 'Details', href: '/issuers/details' },
        ],
    },
    {
        name: 'Arrangers',
        href: '/arrangers',
        icon: Handshake,
        children: [
            { name: 'Summary', href: '/arrangers/summary' },
            { name: 'Monthly', href: '/arrangers/monthly' },
            { name: 'Details', href: '/arrangers/details' },
        ],
    },
    {
        name: 'Trustee',
        href: '/trustees',
        icon: Shield,
        children: [
            { name: 'Summary', href: '/trustees/summary' },
            { name: 'Monthly', href: '/trustees/monthly' },
            { name: 'Details', href: '/trustees/details' },
        ],
    },
    {
        name: 'Registrar',
        href: '/registrars',
        icon: ClipboardList,
        children: [
            { name: 'Summary', href: '/registrars/summary' },
            { name: 'Monthly', href: '/registrars/monthly' },
            { name: 'Details', href: '/registrars/details' },
        ],
    },
    {
        name: 'Rating Agency',
        href: '/agencies',
        icon: Award,
        children: [
            { name: 'Summary', href: '/agencies/summary' },
            { name: 'Monthly', href: '/agencies/monthly' },
            { name: 'Details', href: '/agencies/details' },
        ],
    },
    {
        name: 'Admin Tabs',
        href: '/admin',
        icon: Heart,
        children: [
            { name: 'Reissuance', href: '/admin/re-issuance' },
            { name: 'Arranger', href: '/admin/arrangers' },
            { name: 'Trustee', href: '/admin/trustees' }
        ],
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose, collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useThemeStore();
    const { signOut } = useClerk();
    const router = useRouter();
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const toggleExpand = (name: string): void => {
        setExpandedItem(expandedItem === name ? null : name);
    };

    const handleLogout = async () => {
        await signOut(); // clears session cleanly first
        router.push('/sign-in'); // then navigate — skip / entirely
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed relative top-0 left-0 z-50 h-full flex flex-col',
                    'bg-white dark:bg-[#1a1a2e]',
                    'border-r border-gray-200 dark:border-gray-700',
                    'transition-all duration-300 ease-in-out',
                    'overflow-x-hidden',
                    collapsed ? 'w-[72px]' : 'w-[176px]',
                    'lg:static lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Collapse Button (desktop only) */}
                <div className="absolute top-0 right-0 hidden lg:flex justify-center">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 transition"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#1a1a2e]">
                    {navigation.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`) ||
                            (item.children?.some(
                                child =>
                                    pathname === child.href ||
                                    pathname.startsWith(`${child.href}/`)
                            ) ?? false);

                        const Icon = item.icon;
                        const hasChildren = (item.children?.length ?? 0) > 0;
                        const isExpanded = expandedItem === item.name;

                        return (
                            <div key={item.name}>
                                <div
                                    onClick={() => {
                                        // Only toggle submenu when expanded and item has children.
                                        // When collapsed we let the inner Link handle navigation to the item's href.
                                        if (hasChildren && !collapsed) {
                                            toggleExpand(item.name);
                                        }
                                    }}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2 my-3 rounded-[19px] text-[13px] font-medium transition-all duration-150 group relative cursor-pointer',
                                        isActive
                                            ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white shadow-sm dark:shadow-indigo-900/30'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200'
                                    )}
                                >
                                    <Link
                                        href={item.href}
                                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                            if (hasChildren && !collapsed) {
                                                e.preventDefault();
                                                toggleExpand(item.name);
                                            } else {
                                                // Close sidebar (mobile overlay) when navigating
                                                onClose();
                                            }
                                        }}
                                        className="flex items-center gap-2.5 flex-1"
                                    >
                                        <Icon
                                            className={cn(
                                                'w-4 h-4 shrink-0',
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-gray-500 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                            )}
                                        />

                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 truncate">{item.name}</span>
                                                {hasChildren ? (
                                                    <ChevronDown
                                                        className={cn(
                                                            'w-3.5 h-3.5 text-gray-400 dark:text-gray-600 shrink-0 transition-transform duration-200',
                                                            isExpanded && 'rotate-180'
                                                        )}
                                                    />
                                                ) : !isActive && (
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 shrink-0" />
                                                )}
                                            </>
                                        )}
                                    </Link>

                                    {/* Tooltip when collapsed */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg dark:shadow-black/30">
                                            {item.name}
                                        </div>
                                    )}
                                </div>

                                {/* Submenu */}
                                {hasChildren && isExpanded && !collapsed && (
                                    <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-0.5 mt-1">
                                        {item.children!.map((child) => {
                                            const isChildActive =
                                                pathname === child.href ||
                                                pathname.startsWith(`${child.href}/`);

                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    onClick={onClose}
                                                    className={cn(
                                                        'flex items-center gap-2 px-3 py-2 rounded-[19px] text-[13px] font-medium transition-all duration-150',
                                                        isChildActive
                                                            ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white'
                                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200'
                                                    )}
                                                >
                                                    <span className="flex-1 truncate">{child.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-3 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3 bg-white dark:bg-[#1a1a2e]">
                    {/* Theme Toggle */}
                    {!collapsed ? (
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 gap-0.5">
                            <button
                                onClick={() => theme !== 'light' && toggleTheme()}
                                className={cn(
                                    'flex items-center gap-1 flex-1 justify-center text-[13px] py-1.5 rounded-full transition-all duration-150',
                                    theme === 'light'
                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                )}
                            >
                                <Sun className="w-3 h-3" />
                                <span>Light</span>
                            </button>
                            <button
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                className={cn(
                                    'flex items-center gap-1 flex-1 justify-center text-[13px] py-1.5 rounded-full transition-all duration-150',
                                    theme === 'dark'
                                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                )}
                            >
                                <Moon className="w-3 h-3" />
                                <span>Dark</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                ) : (
                                    <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Logout */}
                    {!collapsed && (
                        <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-[13px] font-medium hover:opacity-75 transition px-1">
                            <LogOut className="w-3.5 h-3.5" />

                            <span>Logout</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}