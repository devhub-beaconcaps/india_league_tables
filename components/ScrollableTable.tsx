'use client';

import { FormattedIssuerItem } from '@/app/(dashboard)/arrangers/summary/types';
import { useRouter } from 'next/navigation';
import React from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScrollableTableProps {
  pageType: string;
  selectedFY: string;
  data: FormattedIssuerItem[];
  valueConvention?: 'Crores' | 'Lakhs' | 'Billions';
}

// ─── Format Helpers ─────────────────────────────────────────────────────────

const formatCurrency = (value: number, convention: 'Crores' | 'Lakhs' | 'Billions' = 'Crores'): string => {

    if (convention === 'Billions') {
        return `${(value / 100).toFixed(2)}B`;
    }
    if (convention === 'Lakhs') {
        return `${(value * 100).toLocaleString()} L`;
    }

    return `${value.toLocaleString()} Cr`;
    
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScrollableTable({ data, selectedFY, pageType, valueConvention = 'Crores' }: ScrollableTableProps) {

  const router = useRouter();

  const handleClick = (id: number) => {
    // URL params: ?id=8&fy=2026-2027
    router.push(`/${pageType}/top-participants?id=${encodeURIComponent(id)}&fy=${selectedFY}`);
  }

  const sizeLabel = valueConvention === 'Billions' ? 'Size (B)' : valueConvention === 'Lakhs' ? 'Size (L)' : 'Size (Cr)';

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="shrink-0">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white">
              <th className="px-3 py-2 text-left font-semibold w-[60px]">Rank</th>
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-right font-semibold w-[100px]">{sizeLabel}</th>
              <th className="px-3 py-2 text-right font-semibold w-[80px]">Deals</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-[11px]">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, index) => (
              <tr
                key={row.id}
                className={`
                  transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50
                  ${index % 2 === 0 ? 'bg-white dark:bg-[#1a1a2e]' : 'bg-gray-50/50 dark:bg-gray-900/50'}
                `}
              >
                <td className="px-3 py-2.5 text-left w-[60px]">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#423CAB]/10 text-[#423CAB] dark:bg-[#423CAB]/20 dark:text-[#8b7cf7] text-[10px] font-bold">
                    {row?.rank}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-left font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  {row?.name}
                </td>
                <td className="px-3 py-2.5 text-right w-[100px] font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(row?.issueSize, valueConvention)}
                </td>
                <td className="px-3 py-2.5 text-right w-[80px] text-gray-600 dark:text-gray-400">
                  <span onClick={() => handleClick(row.id)} className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium" >
                    {formatNumber(row?.deals || 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}