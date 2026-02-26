'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useThemeStore } from '../../lib/store';
import ILTLogo from '../../public/img/ILTLogo.png';
import { cn } from '../../lib/utils';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Check,
} from 'lucide-react';
import Image from 'next/image';

export function Header({ onMenuClick }) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useThemeStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'New report available', time: '2 minutes ago', isNew: true },
    { id: 2, title: 'System update completed', time: '1 hour ago', isNew: true },
    { id: 3, title: 'New issuer registered', time: '3 hours ago', isNew: false },
  ];

  return (
    <header className="h-full bg-[var(--color-card)] border-[var(--color-border)] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--color-accent)] transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Menu className="w-5 h-5 text-[var(--color-foreground)]" />
        </button>

        {/* Search */}
        <div className="">
          <div>
            <Image src={ILTLogo} alt="ILT Logo" className="w-15 h-8" />
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-[var(--color-accent)] transition-all duration-200 hover:scale-105 active:scale-95 relative group"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-[var(--color-foreground)] group-hover:rotate-90 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-[var(--color-foreground)] group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="p-2.5 rounded-xl hover:bg-[var(--color-accent)] transition-all duration-200 hover:scale-105 active:scale-95 relative"
          >
            <Bell className="w-5 h-5 text-[var(--color-foreground)]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>

          {/* Notifications dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-96 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 animate-fade-in-scale overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold text-[var(--color-foreground)]">Notifications</h3>
                  <button className="text-xs text-[var(--color-primary-500)] hover:underline font-medium">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 hover:bg-[var(--color-accent)] cursor-pointer transition-colors duration-150 border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        notification.isNew ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-muted-foreground)]'
                      )} />
                      <div className="flex-1">
                        <p className={cn(
                          'text-sm',
                          notification.isNew ? 'font-medium text-[var(--color-foreground)]' : 'text-[var(--color-muted)]'
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-accent)]/50">
                  <button className="w-full py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative ml-2">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-[var(--color-accent)] transition-all duration-200 border border-transparent hover:border-[var(--color-border)]"
          >
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-[var(--color-foreground)] leading-tight">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-[var(--color-muted)]">Admin</p>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-[var(--color-muted)] transition-transform duration-200',
              isProfileOpen && 'rotate-180'
            )} />
          </button>

          {/* Profile dropdown */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-64 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 animate-fade-in-scale overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)]">
                  <p className="font-semibold text-[var(--color-foreground)]">{session?.user?.name || 'User'}</p>
                  <p className="text-sm text-[var(--color-muted)]">{session?.user?.email || 'user@example.com'}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-accent)] text-sm text-[var(--color-foreground)] transition-colors duration-150">
                    <User className="w-4 h-4 text-[var(--color-muted)]" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-accent)] text-sm text-[var(--color-foreground)] transition-colors duration-150">
                    <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                    Settings
                  </button>
                  <div className="h-px bg-[var(--color-border)] my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-600 transition-colors duration-150"
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
