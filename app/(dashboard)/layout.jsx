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

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-[#F0F7FF] dark:bg-[var(--color-background)] overflow-hidden">
      
      {/* ✅ Fixed Header (Responsive) */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#1a1a2e] shadow-sm"
        style={{ height: HEADER_HEIGHT }}
      >
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
      </div>

      {/* ✅ Content Below Header */}
      <div
        className="flex relative"
        style={{
          paddingTop: HEADER_HEIGHT,
          height: `calc(100vh)`
        }}
      >
        
        {/* ✅ Mobile Overlay (Visible only when sidebar is open on mobile) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={handleOverlayClick}
          />
        )}

        {/* ✅ Sidebar (Responsive) */}
        <div 
          className={`
            h-full 
            /* Mobile: Fixed position overlay, hidden by default */
            fixed 
            inset-y-0 
            left-0 
            z-40 
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            
            /* Desktop: Static position, always visible */
            md:relative 
            md:translate-x-0 
            md:flex
          `}
        >
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </div>

        {/* ✅ Main Content (Responsive) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}