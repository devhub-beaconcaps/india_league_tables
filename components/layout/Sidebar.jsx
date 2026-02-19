'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Building2,
  Handshake,
  Shield,
  ClipboardList,
  Award,
  X,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Issuers', href: '/issuers', icon: Building2 },
  { name: 'Arrangers', href: '/arrangers', icon: Handshake },
  { name: 'Trustees', href: '/trustees', icon: Shield },
  { name: 'Registrars', href: '/registrars', icon: ClipboardList },
  { name: 'Agencies', href: '/agencies', icon: Award },
];

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-[var(--color-card)] border-r border-[var(--color-border)]',
          'transition-all duration-300 ease-out lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-[var(--color-border)]">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow duration-300">
              <span className="text-white font-bold text-lg">F</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-[var(--color-card)]" />
            </div>
            <div>
              <span className="font-bold text-xl text-[var(--color-foreground)] tracking-tight">
                FinDash
              </span>
              <p className="text-[10px] text-[var(--color-muted)] -mt-0.5 tracking-wider uppercase">Pro</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors duration-200"
          >
            <X className="w-5 h-5 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <p className="px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
            Main Menu
          </p>
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  'sidebar-link',
                  isActive && 'active',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive ? 'text-white' : 'text-[var(--color-muted)]',
                  'group-hover:scale-110'
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pro Banner */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="relative overflow-hidden rounded-xl gradient-primary p-4 text-white shadow-lg shadow-blue-500/30">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/20 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />
            
            <div className="relative flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Pro Plan</p>
                <p className="text-xs text-white/80 mt-0.5">Advanced analytics & more</p>
              </div>
            </div>
            <button className="relative mt-3 w-full py-2 px-3 bg-white text-[var(--color-primary-600)] text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors duration-200">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
