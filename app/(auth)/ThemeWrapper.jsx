'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeWrapper({ children }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return children;
}