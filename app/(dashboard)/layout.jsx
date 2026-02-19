'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '../../lib/store';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on client side
    const savedTheme = localStorage.getItem('theme-storage');
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      setTheme(parsed.state?.theme || 'light');
    }
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
