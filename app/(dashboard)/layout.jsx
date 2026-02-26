'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '../../lib/store';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

const HEADER_HEIGHT = 55;

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="h-screen bg-[#EEF2F7] dark:bg-[var(--color-background)] overflow-hidden">
      
      {/* ✅ Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[var(--color-background)] shadow-sm"
        style={{ height: HEADER_HEIGHT }}
      >
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
      </div>

      {/* ✅ Content Below Header */}
      <div
        className="flex"
        style={{
          paddingTop: HEADER_HEIGHT,
          height: `calc(100vh)`
        }}
      >
        {/* ✅ Sidebar (NOT fixed) */}
        <div className="h-full">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </div>

        {/* ✅ Main Content (only this scrolls) */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}