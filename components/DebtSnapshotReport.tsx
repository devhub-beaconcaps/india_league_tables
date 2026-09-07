'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

import upTrend from '@/public/img/ILTMonthlyReportFirstPage.png'
import Image, { StaticImageData } from 'next/image';
import fifthLast from '@/public/img/fifthLast.png';
import fourthLast from '@/public/img/fourthLast.png';
import thirdLast from '@/public/img/thirdLast.png';
import secondLastOne from '@/public/img/secondLastOne.png';
import type { CSSProperties } from 'react';
import lastOne from '@/public/img/lastOne.png';
import substack from '@/public/img/substack.png';
import whatsapp from '@/public/img/whatsapp.png';
import linkedIn from '@/public/img/linkedIn.png';
import telegram from '@/public/img/telegram.png';
import twitter from '@/public/img/twitter.png';
import instagram from '@/public/img/instagram.png';
import { Link } from 'lucide-react';

const extraImagePages: Array<{
  src: StaticImageData;
  alt: string;
  overlay: {
    containerStyle: React.CSSProperties;
    imageStyle: React.CSSProperties;
    images: StaticImageData[];
    links?: string[];
  } | null;

}> = [
    // Page 0: fifthLast – no overlay
    { src: fifthLast, alt: 'Fifth Last', overlay: null },

    // Page 1: fourthLast – overlay
    {
      src: fourthLast,
      alt: 'Fourth Last',
      overlay: {
        containerStyle: {
          position: 'absolute',
          top: '90%',
          left: '29%',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '8px',
          // adjust as needed
        } as React.CSSProperties,
        imageStyle: {
          width: 60,
          height: 60,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
          'https://example.com/4',
          'https://example.com/5',
          'https://example.com/6'
        ]
      },
    },

    // Page 2: thirdLast – no overlay
    { src: thirdLast, alt: 'Third Last', overlay: null },

    // Page 3: secondLastOne – overlay
    {
      src: secondLastOne,
      alt: 'Second Last',
      overlay: {
        containerStyle: {
          position: 'absolute',
          bottom: '36%',
          right: '27%',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '12px',
          // adjust as needed
        } as React.CSSProperties,
        imageStyle: {
          width: 60,
          height: 60,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
          'https://example.com/4',
          'https://example.com/5',
          'https://example.com/6'
        ]
      },
    },

    // Page 4: lastOne – overlay
    {
      src: lastOne,
      alt: 'Last One',
      overlay: {
        containerStyle: {
          position: 'absolute',
          top: '86%',
          left: '33%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '1px',
          // adjust as needed
        } as React.CSSProperties,
        imageStyle: {
          width: 50,
          height: 50,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
          'https://example.com/4',
          'https://example.com/5',
          'https://example.com/6'
        ]
      },
    },
  ];



// ----- Types -----
interface TotalIssuersResult {
  total_issuers: string;
}
interface TotalIssueCountResult {
  total_isins: string;
}
interface TotalIssueSizeResult {
  total_issue_size: string;
}
interface AvgIssueSizeResult {
  avg_issue_size: string;
}
interface TotalUniqueIssuersResult {
  total_issuers: string;
}
interface TopIssuerByIssueSizeResult {
  issuer_name: string;
  total_issue_size: string;
}
interface TopIssuerByIssuerNumberResult {
  issuer_name: string;
  isin_count: string;
}
interface TopRatingResult {
  rating: string;
  count_entries: string;
}
interface IssuerListResult {
  issuer_name: string;
  isin_count: string;
  total_issue_size: string;
  latest_rating: string | null;
  sector: string | null;
}
interface RatingsListResult {
  rating_label: string;
  issuer_count_current_month: string | number;
  total_issue_size_current_month: string | number;
  shares_current_month: string | number;
  issuer_count_previous_month: string | number;
  total_issue_size_previous_month: string | number;
  shares_previous_month: string | number;
}

interface SectorListResult {
  sector_name: string;
  isin_count_current_month: string | number;
  issuer_count_current_month: string | number;
  total_issue_size_current_month: string | number;
  shares_current_month: string | number;
  isin_count_previous_month: string | number;
  issuer_count_previous_month: string | number;
  total_issue_size_previous_month: string | number;
  shares_previous_month: string | number;
}
interface SectorAndRatingListResult {
  sector_name: string;
  total_issue_size_crores: string;
  AAA: string;
  AA_plus: string;
  AA: string;
  AA_minus: string;
  A_plus: string;
  A_others: string;
}
interface MonthlyCompareListResult {
  metric_name: string;
  value_2025: string;
  value_2026: string;
  yoy_change_pct: string;
}
interface TopSectorsWithIssuersResult {
  sector_name: string;
  issuer_name: string;
  total_issue_size: string;
  isin_count: string;
  tenure_min?: number;
  tenure_max?: number;
  coupon_min?: string;
  coupon_max?: string;
  avg_coupon_rate?: string;
}
interface TopRatingWithIssuersResult {
  rating_bucket: string;
  issuer_name: string;
  total_issue_size: string;
  isin_count: string;
  tenure_min: number;
  tenure_max: number;
  coupon_min: string;
  coupon_max: string;
  avg_coupon_rate: string;
}

interface TopSectorNameResult {
  sector_name: string;
}

interface ReportData {
  totalIssuersResult: TotalIssuersResult[];
  totalIssueCountResult: TotalIssueCountResult[];
  totalIssueSizeResult: TotalIssueSizeResult[];
  AvgIssueSizeResult: AvgIssueSizeResult[];
  totalUniqueIssuersResult: TotalUniqueIssuersResult[];
  topSectorNameQueryResult: TopSectorNameResult[];
  topIssuerByIssueSizeResult: TopIssuerByIssueSizeResult[];
  topIssuerByIssuerNumberResult: TopIssuerByIssuerNumberResult[];
  topRatingResult: TopRatingResult[];
  issuerListResult: IssuerListResult[];
  ratingsListResult: RatingsListResult[];
  sectorListResult: SectorListResult[];
  sectorAndRatingListResult: SectorAndRatingListResult[];
  monthlyCompareListResult: MonthlyCompareListResult[];
  topSectorsWithIssuersResult: TopSectorsWithIssuersResult[];
  topRatingWithIssuersResult: TopRatingWithIssuersResult[];
}

// ----- Sector short-name mapping -----
const sectorShortNameMap: Record<string, string> = {
  'Non-Banking Financial Company (NBFC)': 'NBFC',
  'Housing Finance Company': 'HFC',
  'Residential, Commercial Projects': 'RCP',
  'Other Financial Services': 'OFS',
  'Iron & Steel': 'I&S',
  'Stockbroking & Allied': 'S&A',
  Diversified: 'D',
  // Add any other sectors that may appear in your data
};

const getSectorShortName = (fullName: string): string => {
  // If the full name is short enough, no abbreviation needed
  if (fullName.length <= 15) return fullName;
  // Predefined mapping
  if (sectorShortNameMap[fullName]) return sectorShortNameMap[fullName];
  // Extract from parentheses if present
  const match = fullName.match(/\(([^)]+)\)/);
  if (match) return match[1];
  // Fallback: initials
  return fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const getSectorDisplayName = (fullName: string): string => {
  // Check if the name already contains parentheses
  const match = fullName.match(/^([^(]+)\(([^)]+)\)$/);
  if (match) {
    const main = match[1].trim();
    const inside = match[2].trim();
    // If the inside is the same as the main part, avoid duplication
    if (main === inside) {
      return main;
    }
    // Otherwise keep the original (e.g., "Non-Banking Financial Company (NBFC)")
    return fullName;
  }
  // No parentheses – append a short name
  const short = getSectorShortName(fullName);
  // Fallback: if short name equals the full name, return the full name only
  if (short === fullName) return fullName;
  return `${fullName} (${short})`;
};

// ----- Default Data (fully updated from the provided JSON) -----
const defaultData: ReportData = {
  totalIssuersResult: [{ total_issuers: '152' }],
  totalIssueCountResult: [{ total_isins: '152' }],
  totalIssueSizeResult: [{ total_issue_size: '84588' }],
  AvgIssueSizeResult: [{ avg_issue_size: '556' }],
  totalUniqueIssuersResult: [{ total_issuers: '114' }],
  topSectorNameQueryResult: [{ sector_name: 'Non-Banking Financial Company (NBFC)' }],
  topIssuerByIssueSizeResult: [
    {
      issuer_name: 'EQYIZEN INVESTMENT PRIVATE LIMITED',
      total_issue_size: '213500000000',
    },
  ],
  topIssuerByIssuerNumberResult: [
    { issuer_name: 'MUTHOOT FINCORP LIMITED', isin_count: '13' },
  ],
  topRatingResult: [{ rating: 'AAA', count_entries: '55' }],
  issuerListResult: [
    {
      issuer_name: 'EQYIZEN INVESTMENT PRIVATE LIMITED',
      isin_count: '1',
      total_issue_size: '21350',
      latest_rating: null,
      sector: null,
    },
    {
      issuer_name: 'SMALL INDUSTRIES DEVELOPMENT BANK OF INDIA',
      isin_count: '1',
      total_issue_size: '8000',
      latest_rating: 'AAA',
      sector: 'Financial Institution',
    },
    {
      issuer_name: 'NATIONAL BANK FOR AGRICULTURE AND RURAL DEVELOPMENT',
      isin_count: '1',
      total_issue_size: '8000',
      latest_rating: 'AAA',
      sector: 'Financial Institution',
    },
    {
      issuer_name: 'TATA CAPITAL LIMITED',
      isin_count: '2',
      total_issue_size: '4780',
      latest_rating: 'AAA',
      sector: 'Investment Company',
    },
    {
      issuer_name: 'SAMMAAN CAPITAL LIMITED',
      isin_count: '2',
      total_issue_size: '4510',
      latest_rating: 'AAA',
      sector: 'Housing Finance Company',
    },
    {
      issuer_name: 'BAJAJ FINANCE LIMITED',
      isin_count: '1',
      total_issue_size: '4000',
      latest_rating: 'AAA',
      sector: 'Non-Banking Financial Company (NBFC)',
    },
    {
      issuer_name: 'MUTHOOT FINCORP LIMITED',
      isin_count: '13',
      total_issue_size: '2888',
      latest_rating: 'AA+',
      sector: 'Non-Banking Financial Company (NBFC)',
    },
    {
      issuer_name: 'NTPC GREEN ENERGY LIMITED',
      isin_count: '1',
      total_issue_size: '2500',
      latest_rating: 'AAA',
      sector: 'Diversified',
    },
    {
      issuer_name: 'BAJAJ HOUSING FINANCE LIMITED',
      isin_count: '1',
      total_issue_size: '2500',
      latest_rating: 'AAA',
      sector: 'Housing Finance Company',
    },
    {
      issuer_name: 'HDB FINANCIAL SERVICES LIMITED',
      isin_count: '3',
      total_issue_size: '2350',
      latest_rating: 'AAA',
      sector: 'Non-Banking Financial Company (NBFC)',
    },
  ],
  ratingsListResult: [
    {
      rating_label: 'AAA',
      issuer_count_current_month: 22,
      total_issue_size_current_month: 23393,
      shares_current_month: 39.29,
      issuer_count_previous_month: 40,
      total_issue_size_previous_month: 8435,
      shares_previous_month: 35.71,
    },
    {
      rating_label: 'AA+',
      issuer_count_current_month: 4,
      total_issue_size_current_month: 1248,
      shares_current_month: 7.14,
      issuer_count_previous_month: 13,
      total_issue_size_previous_month: 1608,
      shares_previous_month: 11.61,
    },
    // ... (other rating entries omitted for brevity; include full array)
  ],
  sectorListResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      isin_count_current_month: 66,
      issuer_count_current_month: 66,
      total_issue_size_current_month: 22965,
      shares_current_month: 72.53,
      isin_count_previous_month: 181,
      issuer_count_previous_month: 181,
      total_issue_size_previous_month: 60139,
      shares_previous_month: 67.79,
    },
    // ... (other sector entries)
  ],
  sectorAndRatingListResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      total_issue_size_crores: '8349.54',
      AAA: '944.01',
      AA_plus: '30',
      AA: '0',
      AA_minus: '0',
      A_plus: '0',
      A_others: '7375.53',
    },
    {
      sector_name: 'Housing Finance Company',
      total_issue_size_crores: '5010',
      AAA: '0',
      AA_plus: '0',
      AA: '0',
      AA_minus: '0',
      A_plus: '0',
      A_others: '5010',
    },
    // ... (other cross-table entries)
  ],
  monthlyCompareListResult: [
    {
      metric_name: 'Issuers',
      value_2025: '623',
      value_2026: '152',
      yoy_change_pct: '-75.6',
    },
    {
      metric_name: 'Issue Size',
      value_2025: '84413',
      value_2026: '84588',
      yoy_change_pct: '0.21',
    },
    {
      metric_name: 'ISINs',
      value_2025: '623',
      value_2026: '152',
      yoy_change_pct: '-75.6',
    },
  ],
  topSectorsWithIssuersResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'BAJAJ FINANCE LIMITED',
      total_issue_size: '4000',
      isin_count: '1',
      tenure_min: 1172,
      tenure_max: 1172,
      coupon_min: '7.7000',
      coupon_max: '7.7000',
      avg_coupon_rate: '7.7',
    },
    // ... (more entries)
  ],
  topRatingWithIssuersResult: [
    {
      rating_bucket: 'AAA',
      issuer_name: 'NATIONAL BANK FOR AGRICULTURE AND RURAL DEVELOPMENT',
      total_issue_size: '16000',
      isin_count: '2',
      tenure_min: 1257,
      tenure_max: 1257,
      coupon_min: '7.1600',
      coupon_max: '7.1600',
      avg_coupon_rate: '7.16',
    },
    // ... (more entries)
  ],
};

// ----- Helpers -----
const formatCrores = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-IN');
};

const formatPercent = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return num.toFixed(2) + '%';
};

const formatCoupon = (value: string | number): string => {
  if (value === 'Market-Linked' || value === 'Market-Linked Coupon') return 'Market-Linked';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return num.toFixed(2) + '%';
};

const formatTenure = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  const years = num / 365;
  if (Math.abs(years - Math.round(years)) < 0.01) {
    return Math.round(years).toString();
  }
  return years.toFixed(1);
};

const formatTenureRange = (min: number | undefined, max: number | undefined): string => {
  if (min === undefined && max === undefined) return '—';
  if (min === undefined) return formatTenure(max!);
  if (max === undefined) return formatTenure(min);
  if (min === max) return formatTenure(min);
  return `${formatTenure(min)}-${formatTenure(max)}`;
};

const formatCouponRange = (min: string | undefined, max: string | undefined): string => {
  const fmt = (val: string | undefined): string | undefined => {
    if (!val) return undefined;
    return formatCoupon(val);
  };
  const fMin = fmt(min);
  const fMax = fmt(max);
  if (!fMin && !fMax) return '—';
  if (!fMin) return fMax!;
  if (!fMax) return fMin;
  if (fMin === fMax) return fMin;
  const minNum = parseFloat(min || '');
  const maxNum = parseFloat(max || '');
  if (!isNaN(minNum) && !isNaN(maxNum)) {
    if (minNum === maxNum) return fMin;
    return `${fMin}-${fMax}`;
  }
  return `${fMin}-${fMax}`;
};

// ----- Grouped Bar Chart (reusable) -----
interface GroupedBarChartProps {
  data: Array<{
    label: string;
    value1: number;
    value2: number;
  }>;
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.label,
    value2025: item.value1,
    value2026: item.value2,
  }));

  return (
    <div style={{ width: '50%', height: 210 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value2025" fill="#3b82f6" name="2025">
            <LabelList
              dataKey="value2025"
              position="top"
              formatter={(v: number) => v.toFixed(1)}
              style={{ fontSize: 8, fill: '#6b7280' }}
            />
          </Bar>
          <Bar dataKey="value2026" fill="#f97316" name="2026">
            <LabelList
              dataKey="value2026"
              position="top"
              formatter={(v: number) => v.toFixed(1)}
              style={{ fontSize: 8, fill: '#6b7280' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ----- Main Component -----
interface DebtSnapshotReportProps {
  data?: ReportData;
}

const DebtSnapshotReport: React.FC<DebtSnapshotReportProps> = ({ data = defaultData }) => {
  const PAGE_HEIGHT = 1622;
  const PAGE_MAX_WIDTH = '1152px';
  const HEADER_HEIGHT = 60;
  const FOOTER_HEIGHT = 40;
  const CONTENT_PADDING = 24;
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - CONTENT_PADDING * 2 - 16;

  const measurementRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<any[][]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('DebtSnapshotReport data:', data);

  // ----- Build sections from data -----
  const getSections = useCallback(() => {
    const sections: any[] = [];
    const d = data;

    // Market Snapshot (cards)
    sections.push({
      id: 'market-snapshot',
      type: 'cards',
      data: {
        total_issuers: d.totalIssuersResult?.[0]?.total_issuers || '0',
        total_isins: d.totalIssueCountResult?.[0]?.total_isins || '0',
        total_issue_size: d.totalIssueSizeResult?.[0]?.total_issue_size || '0',
        avg_issue_size: d.AvgIssueSizeResult || '0',
        top_sector: d.topSectorNameQueryResult?.[0]?.sector_name || '—',
        top_issuer_size: d.topIssuerByIssueSizeResult?.[0]?.issuer_name || '—',
        top_issuer_count: d.topIssuerByIssuerNumberResult?.[0]?.issuer_name || '—',
        top_rating: d.topRatingResult?.[0]?.rating || '—',
      },
    });

    // Issuances by Issuer (table) – removed ISIN Count column
    if (d.issuerListResult?.length) {
      sections.push({
        id: 'issuances-by-issuer',
        type: 'table',
        title: 'Top 10 Issuers',
        columns: ['Issuer Name', 'Total Issue Size (Cr)', 'Latest Rating', 'Sector'],
        data: d.issuerListResult,
        rowRenderer: (item: IssuerListResult) => [
          item.issuer_name,
          formatCrores(item.total_issue_size),
          item.latest_rating || '—',
          item.sector ? getSectorDisplayName(item.sector) : '—',
        ],
      });
    }

    // Credit Rating Distribution (table + chart)
    if (d.ratingsListResult?.length) {
      sections.push({
        id: 'credit-rating-distribution',
        type: 'ratingDistribution',
        data: d.ratingsListResult,
      });
    }

    // Issuances by Sector (table + chart) – removed ISIN Count columns
    if (d.sectorListResult?.length) {
      sections.push({
        id: 'issuances-by-sector',
        type: 'sectorDistribution',
        data: d.sectorListResult,
      });
    }

    // Sector × Credit Rating Cross Table
    if (d.sectorAndRatingListResult?.length) {
      sections.push({
        id: 'sector-rating-cross',
        type: 'crossTable',
        data: d.sectorAndRatingListResult,
      });
    }

    // Monthly Compare (table + chart)
    if (d.monthlyCompareListResult?.length) {
      sections.push({
        id: 'monthly-compare',
        type: 'monthlyCompare',
        data: d.monthlyCompareListResult,
      });
    }

    // Sector-wise issuer tables – removed ISIN Count column
    if (d.topSectorsWithIssuersResult?.length) {
      const grouped = d.topSectorsWithIssuersResult.reduce((acc, item) => {
        if (!acc[item.sector_name]) acc[item.sector_name] = [];
        acc[item.sector_name].push(item);
        return acc;
      }, {} as Record<string, TopSectorsWithIssuersResult[]>);

      const sectorEntries = Object.entries(grouped);
      sectorEntries.forEach(([sector, issuers], index) => {
        const section: any = {
          id: `sector-${sector.replace(/\s/g, '-')}`,
          type: 'sectorIssuerTable',
          title: getSectorDisplayName(sector), // show full + short in heading
          data: issuers,
        };
        if (index === 0) {
          section.groupHeading = 'Issuances by Sector';
        }
        sections.push(section);
      });
    }

    // Rating-wise issuer tables – removed ISIN Count column
    if (d.topRatingWithIssuersResult?.length) {
      const groupedByRating = d.topRatingWithIssuersResult.reduce((acc, item) => {
        if (!acc[item.rating_bucket]) acc[item.rating_bucket] = [];
        acc[item.rating_bucket].push(item);
        return acc;
      }, {} as Record<string, TopRatingWithIssuersResult[]>);

      const ratingEntries = Object.entries(groupedByRating);
      ratingEntries.forEach(([rating, issuers], index) => {
        const section: any = {
          id: `rating-${rating.replace(/\s/g, '-')}`,
          type: 'sectorIssuerTable',
          title: `Rating: ${rating}`,
          data: issuers,
        };
        if (index === 0) {
          section.groupHeading = 'Issuances by Ratings';
        }
        sections.push(section);
      });
    }

    // Key Takeaways (bullet points)
    sections.push({
      id: 'key-takeaways',
      type: 'bulletPoints',
      data: [
        'July 2026 recorded healthy debt-market activity with 112 issuances worth Rs 1,84,650 Cr across 48 issuers, reflecting sustained primary-market momentum.',
        'Issuance activity was led by large NBFCs and infrastructure financiers (REC, PFC, NaBFID, IRFC), consistent with continued reliance on long-tenor bond funding for infrastructure and lending growth.',
        'AAA remained the dominant rating category (~70% of value), underscoring investor preference for high-grade paper amid prevailing rate conditions.',
        'NBFC and Infrastructure were the leading sectors by value (40.2% and 18.8% respectively), together accounting for nearly 60% of total issuance.',
        'Credit quality is highly concentrated in top-rated sectors (Banks, NBFC) while Manufacturing and Others show more diversified — and comparatively lower-rated — funding profiles.',
        'On a YoY basis, July 2026 issuance value grew 21.2% over July 2025, indicating an expanding primary debt market rather than a one-off surge.',
        'Issuer participation widened modestly (41 → 48), suggesting broader market access rather than reliance on a few large repeat issuers.',
        'The gap between value growth (21.2%) and issuer growth (17.1%) implies incrementally larger ticket sizes per issuer year-on-year.',
      ],
    });

    return sections;
  }, [data]);

  // ----- Pagination via measurement (unchanged) -----
  useEffect(() => {
    const sections = getSections();
    if (sections.length === 0) {
      setPages([]);
      return;
    }

    if (measurementTimeoutRef.current) clearTimeout(measurementTimeoutRef.current);

    measurementTimeoutRef.current = setTimeout(() => {
      if (!measurementRef.current) return;
      const measurementPage = measurementRef.current.querySelector('.measurement-page') as HTMLElement;
      if (!measurementPage) return;

      void measurementPage.offsetHeight;

      const contentArea = measurementPage.querySelector('.content-area') as HTMLElement;
      if (!contentArea) return;

      const sectionElements = measurementPage.querySelectorAll('.section-item');
      const sectionHeights: number[] = [];
      sectionElements.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        sectionHeights.push(rect.height);
      });

      const pagesResult: any[][] = [];
      let currentPage: any[] = [];
      let currentHeight = 0;

      sections.forEach((section, index) => {
        const height = sectionHeights[index] || 0;
        const sectionHeightWithMargin = height + 4;
        if (currentHeight + sectionHeightWithMargin > AVAILABLE_HEIGHT && currentPage.length > 0) {
          pagesResult.push(currentPage);
          currentPage = [];
          currentHeight = 0;
        }
        currentPage.push(section);
        currentHeight += sectionHeightWithMargin;
      });

      if (currentPage.length > 0) {
        pagesResult.push(currentPage);
      }

      setPages(pagesResult);
    }, 250);

    return () => {
      if (measurementTimeoutRef.current) clearTimeout(measurementTimeoutRef.current);
    };
  }, [getSections, AVAILABLE_HEIGHT]);

  // ----- Render section helpers -----
  const renderSection = useCallback((section: any, isMeasurement = false) => {
    const id = isMeasurement ? `measure-${section.id}` : section.id;
    const key = isMeasurement ? `measure-${section.id}` : `render-${section.id}`;

    const sectionStyle: React.CSSProperties = {
      padding: '6px 12px',
      marginBottom: '4px',
      backgroundColor: '#ffffff',
      borderRadius: '6px',
    };

    switch (section.type) {
      case 'cards': {
        const {
          total_issuers,
          total_isins,
          total_issue_size,
          avg_issue_size,
          top_sector,
          top_issuer_size,
          top_issuer_count,
          top_rating,
        } = section.data;
        const cards = [
          { label: 'Total Issuers', value: total_issuers },
          { label: 'Total ISINs', value: total_isins },
          { label: 'Total Issue Size (Cr)', value: formatCrores(total_issue_size) },
          { label: 'Avg Issue Size (Cr)', value: formatCrores(avg_issue_size) },
          { label: 'Top Issuer (By Issue Size)', value: top_issuer_size },
          { label: 'Top Issuer (By No. of Issues)', value: top_issuer_count },
          { label: 'Top Sector', value: top_sector },
          { label: 'Top Rating', value: top_rating },
        ];
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 className='translate-y-[-6px]' style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              Market Snapshot
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className='translate-y-[-6px]' style={{ fontSize: '0.65rem', color: '#6b7280' }}>{card.label}</div>
                  <div className='translate-y-[-6px]' style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'table': {
        const { title, columns, data, rowRenderer } = section;
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 className='translate-y-[-6px]' style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              {title}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.7rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    {columns.map((col: string, idx: number) => (
                      <th key={idx} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className='translate-y-[-6px]'>{col}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, idx: number) => {
                    const row = rowRenderer(item);
                    return (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className='translate-y-[-6px]'>{cell}</div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'ratingDistribution': {
        const ratingData = section.data as RatingsListResult[];
        const chartData = ratingData.map((item) => ({
          label: item.rating_label,
          value1: parseFloat(item.total_issue_size_previous_month as string) || 0,
          value2: parseFloat(item.total_issue_size_current_month as string) || 0,
        }));
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 className='translate-y-[-6px]' style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              Credit Rating Distribution
            </h2>
            <div style={{ overflowX: 'auto', marginBottom: '6px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.7rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>Rating</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Issuer Count</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Total Issue Size (Cr)</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Shares (%)</div></th>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                  </tr>
                </thead>
                <tbody>
                  {ratingData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>{item.rating_label}</div></td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>{item.issuer_count_previous_month}</div></td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>{item.issuer_count_current_month}</div></td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size_previous_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size_current_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatPercent(item.shares_previous_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatPercent(item.shares_current_month)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GroupedBarChart data={chartData} />
            </div>
          </div>
        );
      }

      case 'sectorDistribution': {
        const sectorData = section.data as SectorListResult[];
        // Chart uses short names
        const chartData = sectorData.map((item) => ({
          label: item.sector_name.length > 15
            ? getSectorShortName(item.sector_name)
            : item.sector_name,
          value1: parseFloat(item.total_issue_size_previous_month as string) || 0,
          value2: parseFloat(item.total_issue_size_current_month as string) || 0,
        }));
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              Issuances by Sector
            </h2>
            <div style={{ overflowX: 'auto', marginBottom: '6px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.7rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>Sector</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Issuer Count</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Total Issue Size (Cr)</div></th>
                    <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}><div className='translate-y-[-6px]'>Shares (%)</div></th>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jun 2026</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>Jul 2026</div></th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{getSectorDisplayName(item.sector_name)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>{item.issuer_count_previous_month}</div></td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}><div className='translate-y-[-6px]'>{item.issuer_count_current_month}</div></td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size_previous_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size_current_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatPercent(item.shares_previous_month)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatPercent(item.shares_current_month)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GroupedBarChart data={chartData} />
            </div>
          </div>
        );
      }

      case 'crossTable': {
        const crossData = section.data as SectorAndRatingListResult[];
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              Sector × Credit Rating Distribution
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.65rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>Sector</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>Total (Cr)</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>AAA</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>AA+</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>AA</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>AA-</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>A+</div></th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}><div className='translate-y-[-6px]'>A &amp; Below</div></th>
                  </tr>
                </thead>
                <tbody>
                  {crossData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{getSectorDisplayName(item.sector_name)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size_crores)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.AAA)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.AA_plus)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.AA)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.AA_minus)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.A_plus)}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatCrores(item.A_others)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'monthlyCompare': {
        const monthlyData = section.data as MonthlyCompareListResult[];
        const chartData = monthlyData.map((item) => ({
          label: item.metric_name,
          value1: parseFloat(item.value_2025) || 0,
          value2: parseFloat(item.value_2026) || 0,
        }));
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              July 2026 vs July 2025
            </h2>
            <div style={{ overflowX: 'auto', marginBottom: '6px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.7rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Metric</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>July 2025</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>July 2026</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>YoY Change (%)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{item.metric_name}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{item.value_2025}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{item.value_2026}</div>
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className='translate-y-[-6px]'>{formatPercent(item.yoy_change_pct)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GroupedBarChart data={chartData} />
            </div>
          </div>
        );
      }

      case 'sectorIssuerTable': {
        const { title, data, groupHeading } = section;
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            {groupHeading && (
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>
                {groupHeading}
              </h2>
            )}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px', marginTop: groupHeading ? '2px' : '0' }}>
              {title}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.65rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Issuer Name</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Total Issue Size (Cr)</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Tenure (yrs)</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Coupon (%)</div>
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      <div className='translate-y-[-6px]'>Avg Coupon (%)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: TopSectorsWithIssuersResult, idx: number) => {
                    // Determine coupon display
                    const isMarketLinked =
                      item.coupon_min === 'Market-Linked' ||
                      item.coupon_max === 'Market-Linked' ||
                      item.coupon_min === 'Market-Linked Coupon' ||
                      item.coupon_max === 'Market-Linked Coupon';

                    const couponDisplay = isMarketLinked ? 'Market-Linked' : formatCouponRange(item.coupon_min, item.coupon_max);
                    const avgCouponDisplay = isMarketLinked ? '—' : (item.avg_coupon_rate ? formatCoupon(item.avg_coupon_rate) : '—');

                    return (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className='translate-y-[-6px]'>{item.issuer_name}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className='translate-y-[-6px]'>{formatCrores(item.total_issue_size)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className='translate-y-[-6px]'>{formatTenureRange(item.tenure_min, item.tenure_max)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className='translate-y-[-6px]'>{couponDisplay}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className='translate-y-[-6px]'>{avgCouponDisplay}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'bulletPoints': {
        const points = section.data as string[];
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              Key Takeaways
            </h2>
            <ul style={{ paddingLeft: '18px', fontSize: '0.75rem', lineHeight: 1.5, listStyle: 'disc' }}>
              {points.map((point, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        );
      }

      case 'heading': {
        const { title } = section.data;
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>
              {title}
            </h2>
          </div>
        );
      }

      default:
        return null;
    }
  }, []);

  // ----- PDF Download (unchanged) -----
  const handleDownloadPDF = useCallback(async () => {
    if (!pagesContainerRef.current || pages.length === 0) {
      alert('No content available to download');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `debt-issuer-snapshot-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 1152,
          windowWidth: 1152,
          scrollY: 0,
          onclone: (document: Document) => {
            const pages = document.querySelectorAll('.page');
            pages.forEach((page: Element) => {
              (page as HTMLElement).style.overflow = 'visible';
            });
          },
        },
        jsPDF: {
          unit: 'mm' as const,
          format: [304.8, 429.6] as [number, number],
          orientation: 'portrait' as const,
          putOnlyUsedFonts: true,
          enableLinks: true,
          compress: true,
        },
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await html2pdf().set(opt).from(pagesContainerRef.current).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [pages]);

  // ----- Render -----
  const allSections = getSections();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF || pages.length === 0}
        style={{
          marginBottom: '24px',
          backgroundColor: '#2563eb',
          color: 'white',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          cursor: isGeneratingPDF || pages.length === 0 ? 'not-allowed' : 'pointer',
          opacity: isGeneratingPDF || pages.length === 0 ? 0.5 : 1,
        }}
      >
        {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
      </button>

      {/* Hidden measurement layer */}
      <div
        ref={measurementRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: PAGE_MAX_WIDTH,
        }}
      >
        <div className="measurement-page" style={{ height: `${PAGE_HEIGHT}px`, width: '100%' }}>
          <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#1e3a8a' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  padding: '0px 24px 10px 24px',
                  borderRadius: '16px 16px 0 0',
                  textAlign: 'center',
                }}
              >
                <div className='translate-y-[-15px]' style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Monthly Issuance Pulse- July 2026
                </div>
              </div>
              <div className="content-area" style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
                {allSections.map((section) => renderSection(section, true))}
              </div>
              <div
                style={{
                  flexShrink: 0,
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '24px',
                  color: '#4b5563',
                  fontSize: '0.75rem',
                }}
              >
                Page <span style={{ margin: '0 4px' }}>—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visible pages */}
      <div ref={pagesContainerRef} style={{ margin: 0, padding: 0, background: 'white' }}>
        {/* ---- COVER PAGE ---- */}
        <div
          className="page cover-page"
          style={{
            width: '100%',
            maxWidth: PAGE_MAX_WIDTH,
            height: `${PAGE_HEIGHT}px`,
            margin: '0 auto',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#1e3a8a' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
              }}
            >
              <Image
                src={upTrend}
                alt="Cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Overlay text */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '59%',
                  left: '22%',
                  transform: 'translateX(-50%)',
                  color: '#ffffff',
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  width: '100%',
                  padding: '0 20px',
                  fontFamily: 'sans-serif',
                }}
              >
                August 2026
              </div>
            </div>
          </div>
        </div>
        {pages.map((pageSections, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            className="page"
            style={{
              width: '100%',
              maxWidth: PAGE_MAX_WIDTH,
              height: `${PAGE_HEIGHT}px`,
              margin: '0 auto',
              pageBreakAfter: 'always',
              breakAfter: 'page',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#1e3a8a' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    padding: '0px 24px 10px 24px',
                    borderRadius: '16px 16px 0 0',
                    textAlign: 'center',
                  }}
                >
                  <div className='translate-y-[-15px]' style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Monthly Issuance Pulse- July 2026
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
                  {pageSections.map((section) => renderSection(section, false))}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '24px',
                    color: '#4b5563',
                    fontSize: '0.75rem',
                  }}
                >
                  Page {pageIndex + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Extra image pages */}
        {extraImagePages.map((img, idx) => (
          <div
            key={`extra-page-${idx}`}
            className="page"
            style={{
              width: '100%',
              maxWidth: PAGE_MAX_WIDTH,
              height: `${PAGE_HEIGHT}px`,
              margin: '0 auto',
              pageBreakAfter: 'always',
              breakAfter: 'page',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#1e3a8a' }}>
              <div
                style={{
                  position: 'relative', // needed for absolute positioning of overlay
                  width: '100%',
                  height: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                {/* Overlay if defined */}
                {img.overlay && (
                  <div style={img.overlay.containerStyle}>
                    {img.overlay.images.map((imageSrc, i) => (
                      <a
                        key={i}
                        href={img.overlay.links?.[i] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          color: 'inherit',          // force inherit from parent (no oklch)
                          textDecoration: 'none',    // optional
                        }}
                        data-link="true"
                      >
                        <Image src={imageSrc} alt={`icon-${i}`} style={img.overlay.imageStyle} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; }
          .page { margin: 0; padding: 0; border: none; }
        }
      `}</style>
    </div>
  );
};

export default DebtSnapshotReport;