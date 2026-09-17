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

import upTrend from '@/public/img/ILTMonthlyReportFirstPage.png';
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

const extraImagePages: Array<{
  src: StaticImageData;
  alt: string;
  overlay: {
    containerStyle: React.CSSProperties;
    TextcontainerStyle?: React.CSSProperties;
    imageStyle: React.CSSProperties;
    images: StaticImageData[];
    links?: string[];
    textLink?: {
      text: string;
      href: string;
    };
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
          left: '30%',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '13px',
        } as React.CSSProperties,
        imageStyle: {
          width: 60,
          height: 60,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://substack.com/@debtcircle',
          'https://www.whatsapp.com/channel/0029ValOH5VLdQeW3LMm8V2G',
          'https://www.linkedin.com/company/debt-circle',
          'https://t.me/debtcircle',
          'https://x.com/DebtCircle',
          'https://www.instagram.com/debtcircle',
        ],
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
          right: '31%',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '13px',
        } as React.CSSProperties,
        imageStyle: {
          width: 60,
          height: 60,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://substack.com/@debtcircle',
          'https://www.whatsapp.com/channel/0029ValOH5VLdQeW3LMm8V2G',
          'https://www.linkedin.com/company/debt-circle',
          'https://t.me/debtcircle',
          'https://x.com/DebtCircle',
          'https://www.instagram.com/debtcircle',
        ],
        TextcontainerStyle: {
          position: 'absolute',
          bottom: '29%',
          right: '39%',
        },
        textLink: {
          text: 'https://debtcircle.in',
          href: 'https://debtcircle.in',
        },
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
          left: '32%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'row' as const,
          gap: '13px',
        } as React.CSSProperties,
        imageStyle: {
          width: 50,
          height: 50,
          objectFit: 'contain',
        } as React.CSSProperties,
        images: [substack, whatsapp, linkedIn, telegram, twitter, instagram],
        links: [
          'https://substack.com/@debtcircle',
          'https://www.whatsapp.com/channel/0029ValOH5VLdQeW3LMm8V2G',
          'https://www.linkedin.com/company/debt-circle',
          'https://t.me/debtcircle',
          'https://x.com/DebtCircle',
          'https://www.instagram.com/debtcircle',
        ],
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
  isin_count: string;
  total_issuers: string;
  total_issue_size_cr: string;
  AAA_cr: string;
  'AA+_cr': string;
  AA_cr: string;
  'AA-_cr': string;
  'A+_cr': string;
  'A & below (Rated)_cr': string;
  'A & below & (Unrated)_cr': string;
  shares: string;
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
};

const getSectorShortName = (fullName: string): string => {
  if (fullName.length <= 15) return fullName;
  if (sectorShortNameMap[fullName]) return sectorShortNameMap[fullName];
  const match = fullName.match(/\(([^)]+)\)/);
  if (match) return match[1];
  return fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const getSectorDisplayName = (fullName: string): string => {
  const match = fullName.match(/^([^(]+)\(([^)]+)\)$/);
  if (match) {
    const main = match[1].trim();
    const inside = match[2].trim();
    if (main === inside) return main;
    return fullName;
  }
  const short = getSectorShortName(fullName);
  if (short === fullName) return fullName;
  return `${fullName} (${short})`;
};

// ----- Default Data (shortened for brevity) -----
const defaultData: ReportData = {
  totalIssuersResult: [{ total_issuers: '152' }],
  totalIssueCountResult: [{ total_isins: '152' }],
  totalIssueSizeResult: [{ total_issue_size: '84588' }],
  AvgIssueSizeResult: [{ avg_issue_size: '556' }],
  totalUniqueIssuersResult: [{ total_issuers: '114' }],
  topSectorNameQueryResult: [{ sector_name: 'Non-Banking Financial Company (NBFC)' }],
  topIssuerByIssueSizeResult: [
    { issuer_name: 'EQYIZEN INVESTMENT PRIVATE LIMITED', total_issue_size: '213500000000' },
  ],
  topIssuerByIssuerNumberResult: [{ issuer_name: 'MUTHOOT FINCORP LIMITED', isin_count: '13' }],
  topRatingResult: [{ rating: 'AAA', count_entries: '55' }],
  issuerListResult: [
    {
      issuer_name: 'EQYIZEN INVESTMENT PRIVATE LIMITED',
      isin_count: '1',
      total_issue_size: '21350',
      latest_rating: null,
      sector: null,
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
  ],
  sectorAndRatingListResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      isin_count: '63',
      total_issuers: '40',
      total_issue_size_cr: '21290',
      AAA_cr: '944',
      'AA+_cr': '30',
      AA_cr: '0',
      'AA-_cr': '0',
      'A+_cr': '0',
      'A & below (Rated)_cr': '20316',
      'A & below & (Unrated)_cr': '0',
      shares: '44.94',
    },
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
    return `${fMin} - ${fMax}`;
  }
  return `${fMin} - ${fMax}`;
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
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="translate-y-[-6px]" style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#3b82f6' }}></div>
          <div className="translate-y-[-12px]" style={{ fontSize: '0.75rem', color: '#374151' }}>2025</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="translate-y-[-6px]" style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f97316' }}></div>
          <div className="translate-y-[-12px]" style={{ fontSize: '0.75rem', color: '#374151' }}>2026</div>
        </div>
      </div>
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

  const previousDateFullName = 'July';
  const currentDateFullName = 'August';
  const firstPageDisplayDate = 'August 2026';


  const measurementRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const [pageItems, setPageItems] = useState<any[][]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('DebtSnapshotReport data:', data);

  const formatRatingLabel = (rating: string): string => {
    if (rating.includes('&') && !rating.includes(' & ')) {
      return rating.replace(/&/g, ' & ').replace(/\s+/g, ' ').trim();
    }
    return rating;
  };

  // Inside DebtSnapshotReport, before getSections or useCallback
  const renderNote = (text: string) => (
    <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', marginTop: '2px', marginBottom: '6px' }}>
      Note: {text}
    </div>
  );

  // ----- Build sections from data -----
  const getSections = useCallback(() => {
    const sections: any[] = [];
    const d = data;

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
        isTable: true,
        totalRows: d.issuerListResult.length,
        hasChart: false,
      });
    }

    if (d.ratingsListResult?.length) {
      sections.push({
        id: 'credit-rating-distribution',
        type: 'ratingDistribution',
        data: d.ratingsListResult,
        isTable: true,
        totalRows: d.ratingsListResult.length,
        hasChart: true,
      });
    }

    if (d.sectorListResult?.length) {
      sections.push({
        id: 'issuances-by-sector',
        type: 'sectorDistribution',
        data: d.sectorListResult,
        isTable: true,
        totalRows: d.sectorListResult.length,
        hasChart: true,
      });
    }

    if (d.sectorAndRatingListResult?.length) {
      sections.push({
        id: 'sector-rating-cross',
        type: 'crossTable',
        data: d.sectorAndRatingListResult,
        isTable: true,
        totalRows: d.sectorAndRatingListResult.length,
        hasChart: false,
      });
    }

    if (d.monthlyCompareListResult?.length) {
      sections.push({
        id: 'monthly-compare',
        type: 'monthlyCompare',
        data: d.monthlyCompareListResult,
        isTable: true,
        totalRows: d.monthlyCompareListResult.length,
        hasChart: true,
      });
    }

    if (d.topSectorsWithIssuersResult?.length) {
      const grouped = d.topSectorsWithIssuersResult.reduce((acc, item) => {
        if (!acc[item.sector_name]) acc[item.sector_name] = [];
        acc[item.sector_name].push(item);
        return acc;
      }, {} as Record<string, TopSectorsWithIssuersResult[]>);

      Object.entries(grouped).forEach(([sector, issuers], index) => {
        const section: any = {
          id: `sector-${sector.replace(/\s/g, '-')}`,
          type: 'sectorIssuerTable',
          title: getSectorDisplayName(sector),
          data: issuers,
          isTable: true,
          totalRows: issuers.length,
          hasChart: false,
        };
        if (index === 0) section.groupHeading = 'Issuances by Sector';
        sections.push(section);
      });
      // --- ADD THIS ---
      sections.push({
        id: 'sector-note',
        type: 'note',
        data: 'The total issue size across tranches, along with the coupon range and tenure range, has been considered for each sector.',
      });
    }

    if (d.topRatingWithIssuersResult?.length) {
      const groupedByRating = d.topRatingWithIssuersResult.reduce((acc, item) => {
        if (!acc[item.rating_bucket]) acc[item.rating_bucket] = [];
        acc[item.rating_bucket].push(item);
        return acc;
      }, {} as Record<string, TopRatingWithIssuersResult[]>);

      Object.entries(groupedByRating).forEach(([rating, issuers], index) => {
        const section: any = {
          id: `rating-${rating.replace(/\s/g, '-')}`,
          type: 'sectorIssuerTable',
          title: `Rating: ${formatRatingLabel(rating)}`,
          data: issuers,
          isTable: true,
          totalRows: issuers.length,
          hasChart: false,
        };
        if (index === 0) section.groupHeading = 'Issuances by Ratings';
        sections.push(section);
      });
      // 👇 ADD THIS NOTE
      sections.push({
        id: 'rating-note',
        type: 'note',
        data: 'The total issue size across tranches, along with the coupon range and tenure range, has been considered for each Rating Scale.',
      });
    }

    sections.push({
      id: 'key-takeaways',
      type: 'bulletPoints',
      data: [
        'Debt-market activity contracted sharply, with 29 issuances worth ₹12,094 crore across 29 issuers, down 79.31% YoY in value and 88.02% in issuer participation, indicating a significantly narrower primary market.',
        'Issuance remained concentrated among large repeat borrowers, particularly NBFCs and infrastructure financiers such as Bajaj Finance, REC, PFC and HDB Financial. NBFCs and HFCs recorded the highest issuance activity by sector, highlighting the dominance of financial-sector borrowers.',
        'Higher market yields, led by the short end, emerged as the key constraint rather than liquidity. Investors remained willing to deploy funds, but demanded higher returns that issuers found unattractive, prompting several borrowers to withdraw, reprice or defer shorter-duration offerings.',
        'Alternative funding sources further reduced bond-market supply, with issuers having access to bank lines or internal accruals choosing to defer borrowing rather than lock in elevated funding costs. This contributed to the sharp decline in issuer participation, even as average ticket sizes increased.',
        'Investor preference remained firmly tilted towards high-grade paper, with AAA and AA+ emerging as the dominant rating categories. Credit quality was particularly concentrated in NBFC and HFC issuance, while Others and real-estate-related sectors showed greater rating dispersion and coupons of up to 22.00%.',
        'The RBI’s unchanged 5.25% repo rate and neutral stance did not translate into easier market conditions. The August policy minutes carried a more hawkish tone, with members open to a rate hike if inflation risks broadened, reinforcing expectations that the easing cycle was effectively over.',
        'Elevated sovereign yields and macro risks kept borrowing costs high. Heavy government borrowing and auction supply raised the base for corporate pricing, while elevated crude prices, West Asia tensions and Strait of Hormuz disruptions added to imported-inflation risks and term premia.',
        'Higher FY27 inflation expectations and continued rate uncertainty kept investors cautious on duration, with bankers expecting the debt market to remain selective and issuance volumes to stay subdued in the near term.'
      ],
    });

    return sections;
  }, [data]);

  // ----- Render content item (supports measurement, row ranges, chart-only) -----
  const renderContentItem = useCallback(
    (item: any, isMeasurement = false) => {
      const section = item.section || item;
      const id = isMeasurement ? `measure-${section.id}` : section.id;
      const key = isMeasurement ? `measure-${section.id}` : `render-${section.id}`;

      const rowRange = item.rowRange || null;
      const isChartOnly = item.isChart || false;

      const sectionStyle: React.CSSProperties = {
        padding: '6px 12px',
        marginBottom: '4px',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
      };

      // Chart-only rendering for measurement and visible
      if (isChartOnly) {
        const renderChart = () => {
          switch (section.type) {
            case 'ratingDistribution': {
              const ratingData = section.data as RatingsListResult[];
              const chartData = ratingData.map((item) => ({
                label: item.rating_label,
                value1: parseFloat(item.total_issue_size_previous_month as string) || 0,
                value2: parseFloat(item.total_issue_size_current_month as string) || 0,
              }));
              return (
                <div key={key} id={id} className="section-item" style={sectionStyle}>
                  <div className="chart-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                    <GroupedBarChart data={chartData} />
                  </div>
                </div>
              );
            }
            case 'sectorDistribution': {
              const sectorData = section.data as SectorListResult[];
              const chartData = sectorData.map((item) => ({
                label: item.sector_name.length > 15 ? getSectorShortName(item.sector_name) : item.sector_name,
                value1: parseFloat(item.total_issue_size_previous_month as string) || 0,
                value2: parseFloat(item.total_issue_size_current_month as string) || 0,
              }));
              return (
                <div key={key} id={id} className="section-item" style={sectionStyle}>
                  <div className="chart-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                    <GroupedBarChart data={chartData} />
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
                  <div className="chart-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                    <GroupedBarChart data={chartData} />
                  </div>
                </div>
              );
            }
            default:
              return null;
          }
        };
        return renderChart();
      }

      // Full section rendering (with optional rowRange for tables)
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
              <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
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
                    <div className="translate-y-[-6px]" style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                      {card.label}
                    </div>
                    <div className="translate-y-[-6px]" style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        case 'table': {
          const { title, columns, data, rowRenderer } = section;
          let rows = data;
          const isLastChunk = !rowRange || rowRange.end === data.length;
          if (rowRange) rows = data.slice(rowRange.start, rowRange.end);
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                {title}
              </h2>
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
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
                          <div className="translate-y-[-6px]">{col}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item: any, idx: number) => {
                      const row = rowRenderer(item);
                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          {row.map((cell: any, cellIdx: number) => (
                            <td key={cellIdx} style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                              <div className="translate-y-[-6px]">{cell}</div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {title === 'Top 10 Issuers' && isLastChunk && renderNote('Only the top 10 issuers have been considered.')}
            </div>
          );
        }

        case 'ratingDistribution': {
          const ratingData = section.data as RatingsListResult[];
          let tableRows = ratingData;
          const isLastChunk = !rowRange || rowRange.end === ratingData.length;
          if (rowRange) tableRows = ratingData.slice(rowRange.start, rowRange.end);
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                Credit Rating Distribution
              </h2>
              <div className="table-wrapper" style={{ overflowX: 'auto', marginBottom: '6px' }}>
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
                        <div className="translate-y-[-6px]">Rating</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">Issuer Count</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">Total Issue Size (Cr)</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">% Share of Issue Size </div>
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}></th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.rating_label}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.issuer_count_previous_month}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.issuer_count_current_month}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size_previous_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size_current_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatPercent(item.shares_previous_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatPercent(item.shares_current_month)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isLastChunk && renderNote('Only rated securities have been included. The A & Below category comprises securities rated A and below, as per the applicable credit rating scale.')}
            </div>
          );
        }

        case 'sectorDistribution': {
          const sectorData = section.data as SectorListResult[];
          let tableRows = sectorData;
          const isLastChunk = !rowRange || rowRange.end === sectorData.length;
          if (rowRange) tableRows = sectorData.slice(rowRange.start, rowRange.end);
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                Issuances by Sector
              </h2>
              <div className="table-wrapper" style={{ overflowX: 'auto', marginBottom: '6px' }}>
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
                        <div className="translate-y-[-6px]">Sector</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">Issuer Count</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">Total Issue Size (Cr)</div>
                      </th>
                      <th colSpan={2} style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'center' }}>
                        <div className="translate-y-[-6px]">% Share of Issue Size </div>
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}></th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{previousDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{getSectorDisplayName(item.sector_name)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.issuer_count_previous_month}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.issuer_count_current_month}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size_previous_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size_current_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatPercent(item.shares_previous_month)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatPercent(item.shares_current_month)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isLastChunk && renderNote('The Others category includes all sectors other than the top five sectors represented individually, including sectors classified as Others.')}
            </div>
          );
        }

        case 'crossTable': {
          const crossData = section.data as SectorAndRatingListResult[];
          let tableRows = crossData;
          const isLastChunk = !rowRange || rowRange.end === crossData.length;
          if (rowRange) tableRows = crossData.slice(rowRange.start, rowRange.end);
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                Sector × Credit Rating Distribution
              </h2>
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
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
                        <div className="translate-y-[-6px]">Sector</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Total (Cr)</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">AAA</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">AA+</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">AA</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">AA-</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">A+</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">A & Below</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Unrated</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{getSectorDisplayName(item.sector_name)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size_cr)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.AAA_cr)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item['AA+_cr'])}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.AA_cr)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item['AA-_cr'])}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item['A+_cr'])}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item['A & below (Rated)_cr'])}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item['A & below & (Unrated)_cr'])}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isLastChunk && renderNote('The Others category includes all sectors other than the top five sectors represented individually, including those classified as Others.')}
            </div>
          );
        }

        case 'monthlyCompare': {
          const monthlyData = section.data as MonthlyCompareListResult[];
          let tableRows = monthlyData;
          if (rowRange) {
            tableRows = monthlyData.slice(rowRange.start, rowRange.end);
          }
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                {currentDateFullName} 2026 vs {currentDateFullName} 2025
              </h2>
              <div className="table-wrapper" style={{ overflowX: 'auto', marginBottom: '6px' }}>
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
                        <div className="translate-y-[-6px]">Metric</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2025</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">{currentDateFullName} 2026</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">YoY Change (%)</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{item.metric_name == 'Issue Size' ? 'Issue Size( Cr )' : item.metric_name}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.value_2025)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatCrores(item.value_2026)}</div>
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                          <div className="translate-y-[-6px]">{formatPercent(item.yoy_change_pct)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        case 'sectorIssuerTable': {
          const { title, data, groupHeading } = section;
          let rows = data;
          if (rowRange) {
            rows = data.slice(rowRange.start, rowRange.end);
          }
          return (
            <div key={key} id={id} className="section-item" style={sectionStyle}>
              {groupHeading && (
                <h2 className="translate-y-[-6px]" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>
                  {groupHeading}
                </h2>
              )}
              <h3
                className="translate-y-[-6px]"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  marginBottom: '4px',
                  marginTop: groupHeading ? '2px' : '0',
                }}
              >
                {title}
              </h3>
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
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
                        <div className="translate-y-[-6px]">Issuer Name</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Total Issue Size (Cr)</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Tenure (yrs)</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Coupon (%)</div>
                      </th>
                      <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                        <div className="translate-y-[-6px]">Avg Coupon (%)</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item: TopSectorsWithIssuersResult | TopRatingWithIssuersResult, idx: number) => {
                      const isMarketLinked =
                        item.coupon_min === 'Market-Linked' ||
                        item.coupon_max === 'Market-Linked' ||
                        item.coupon_min === 'Market-Linked Coupon' ||
                        item.coupon_max === 'Market-Linked Coupon';

                      const couponDisplay = isMarketLinked ? 'Market-Linked' : formatCouponRange(item.coupon_min, item.coupon_max);
                      const avgCouponDisplay = isMarketLinked ? '—' : item.avg_coupon_rate ? formatCoupon(item.avg_coupon_rate) : '—';

                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className="translate-y-[-6px]">{item.issuer_name}</div>
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className="translate-y-[-6px]">{formatCrores(item.total_issue_size)}</div>
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className="translate-y-[-6px]">{formatTenureRange(item.tenure_min, item.tenure_max)}</div>
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className="translate-y-[-6px]">{couponDisplay}</div>
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                            <div className="translate-y-[-6px]">{avgCouponDisplay}</div>
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>Key Takeaways</h2>
              <ul style={{ paddingLeft: '0', fontSize: '0.75rem', lineHeight: 1.5, listStyle: 'none' }}>
                {points.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: '2px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ color: '#1e3a8a', fontWeight: 'bold' }}>•</div>
                    <div>{point}</div>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        case 'note':
          return (
            <div key={key} id={id} className="section-item" style={{ padding: '6px 12px', marginBottom: '4px', backgroundColor: '#ffffff', borderRadius: '6px' }}>
              {renderNote(section.data)}
            </div>
          );

        default:
          return null;
      }
    },
    []
  );

  // ----- Pagination with dynamic content height and table splitting -----
  useEffect(() => {
    const sections = getSections();
    if (sections.length === 0) {
      setPageItems([]);
      return;
    }

    if (measurementTimeoutRef.current) clearTimeout(measurementTimeoutRef.current);

    measurementTimeoutRef.current = setTimeout(() => {
      if (!measurementRef.current) return;
      const measurementPage = measurementRef.current.querySelector('.measurement-page') as HTMLElement;
      if (!measurementPage) return;

      // Force layout
      void measurementPage.offsetHeight;

      const contentArea = measurementPage.querySelector('.content-area') as HTMLElement;
      if (!contentArea) return;
      const contentHeight = contentArea.clientHeight;

      // Gather measurement data for each section
      const sectionElements = measurementPage.querySelectorAll('.section-item');
      const sectionData: {
        section: any;
        otherOverhead: number; // title, section padding, margins (excluding table wrapper and chart)
        tableOverhead: number; // padding/margins inside table wrapper
        headerHeight: number;
        rowHeight: number;
        totalRows: number;
        chartHeight: number;
        hasChart: boolean;
      }[] = [];

      sectionElements.forEach((el, idx) => {
        const section = sections[idx];
        const isTable = section.isTable || false;

        let otherOverhead = 0;
        let tableOverhead = 0;
        let headerHeight = 0;
        let rowHeight = 0;
        let totalRows = section.totalRows || 0;
        let chartHeight = 0;
        let hasChart = section.hasChart || false;

        const sectionEl = el as HTMLElement;
        const sectionTotalHeight = sectionEl.getBoundingClientRect().height;

        if (isTable) {
          const tableWrapper = el.querySelector('.table-wrapper') as HTMLElement;
          const chartWrapper = el.querySelector('.chart-wrapper') as HTMLElement;

          if (tableWrapper) {
            const tableWrapperHeight = tableWrapper.getBoundingClientRect().height;
            const thead = tableWrapper.querySelector('thead');
            const tbody = tableWrapper.querySelector('tbody');
            const firstRow = tbody?.querySelector('tr');

            headerHeight = thead ? thead.getBoundingClientRect().height : 0;
            rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 25;

            // Compute table overhead: tableWrapperHeight - headerHeight - totalRows * rowHeight
            const tableRowsTotalHeight = totalRows * rowHeight;
            tableOverhead = tableWrapperHeight - headerHeight - tableRowsTotalHeight;
            if (tableOverhead < 0) tableOverhead = 0; // safety

            // Compute other overhead: sectionTotalHeight - tableWrapperHeight - chartHeight
            if (chartWrapper) {
              chartHeight = chartWrapper.getBoundingClientRect().height;
            }
            otherOverhead = sectionTotalHeight - tableWrapperHeight - chartHeight;
            if (otherOverhead < 0) otherOverhead = 0;
          } else {
            // fallback: estimate overhead
            otherOverhead = sectionTotalHeight - totalRows * 25;
            if (otherOverhead < 0) otherOverhead = 0;
            rowHeight = 25;
          }
        } else {
          // Non-table: otherOverhead = total height, no table-specific metrics
          otherOverhead = sectionTotalHeight;
          totalRows = 0;
          rowHeight = 0;
          headerHeight = 0;
          tableOverhead = 0;
          chartHeight = 0;
          hasChart = false;
        }

        sectionData.push({
          section,
          otherOverhead,
          tableOverhead,
          headerHeight,
          rowHeight,
          totalRows,
          chartHeight,
          hasChart,
        });
      });

      // Build pages
      const pagesResult: any[][] = [];
      let currentPage: any[] = [];
      let currentPageHeight = 0;
      const BUFFER = 5; // pixels to avoid overflow

      const addItem = (item: any, height: number) => {
        if (currentPageHeight + height > contentHeight - BUFFER && currentPage.length > 0) {
          pagesResult.push(currentPage);
          currentPage = [];
          currentPageHeight = 0;
        }
        currentPage.push(item);
        currentPageHeight += height;
      };

      for (let i = 0; i < sectionData.length; i++) {
        const { section, otherOverhead, tableOverhead, headerHeight, rowHeight, totalRows, chartHeight, hasChart } =
          sectionData[i];

        if (!section.isTable) {
          // Non-table: add as a whole
          addItem({ section }, otherOverhead);
          continue;
        }

        if (totalRows === 0) {
          // Table with no rows (unlikely) – add as is
          addItem({ section }, otherOverhead + tableOverhead + headerHeight);
          continue;
        }

        // Splitting logic for tables
        const getRowsThatFit = (space: number): number => {
          const availableForRows = space - otherOverhead - tableOverhead - headerHeight;
          if (availableForRows <= 0) return 0;
          return Math.floor(availableForRows / rowHeight);
        };

        let rowStart = 0;
        let rowsLeft = totalRows;

        // Try to fit on current page
        let remainingSpace = contentHeight - currentPageHeight;
        let rowsFit = getRowsThatFit(remainingSpace);

        if (rowsFit <= 0 && currentPage.length > 0) {
          // start new page
          pagesResult.push(currentPage);
          currentPage = [];
          currentPageHeight = 0;
          remainingSpace = contentHeight;
          rowsFit = getRowsThatFit(remainingSpace);
        }

        while (rowsLeft > 0) {
          let takeRows = rowsFit;
          if (takeRows <= 0) takeRows = 1;
          if (takeRows > rowsLeft) takeRows = rowsLeft;

          const chunkHeight = otherOverhead + tableOverhead + headerHeight + takeRows * rowHeight;

          // If chunk doesn't fit on a fresh page, reduce rows
          if (chunkHeight > contentHeight - BUFFER) {
            takeRows = Math.floor((contentHeight - BUFFER - otherOverhead - tableOverhead - headerHeight) / rowHeight);
            if (takeRows <= 0) takeRows = 1;
            // Recalculate chunk height
            const adjustedChunkHeight = otherOverhead + tableOverhead + headerHeight + takeRows * rowHeight;
            addItem({ section, rowRange: { start: rowStart, end: rowStart + takeRows } }, adjustedChunkHeight);
            rowStart += takeRows;
            rowsLeft -= takeRows;
            if (rowsLeft > 0) {
              pagesResult.push(currentPage);
              currentPage = [];
              currentPageHeight = 0;
              remainingSpace = contentHeight;
              rowsFit = getRowsThatFit(remainingSpace);
            }
            continue;
          }

          addItem({ section, rowRange: { start: rowStart, end: rowStart + takeRows } }, chunkHeight);
          rowStart += takeRows;
          rowsLeft -= takeRows;

          if (rowsLeft > 0) {
            pagesResult.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
            remainingSpace = contentHeight;
            rowsFit = getRowsThatFit(remainingSpace);
          }
        }

        // Add chart if exists and has height
        if (hasChart && chartHeight > 0) {
          addItem({ section, isChart: true }, chartHeight);
        }
      }

      if (currentPage.length > 0) {
        pagesResult.push(currentPage);
      }

      setPageItems(pagesResult);
    }, 250);

    return () => {
      if (measurementTimeoutRef.current) clearTimeout(measurementTimeoutRef.current);
    };
  }, [getSections]);

  // ----- PDF Download -----
  const handleDownloadPDF = useCallback(async () => {
    if (!pagesContainerRef.current || pageItems.length === 0) {
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
  }, [pageItems]);

  // ----- Render -----
  const allSections = getSections();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF || pageItems.length === 0}
        style={{
          marginBottom: '24px',
          backgroundColor: '#2563eb',
          color: 'white',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          cursor: isGeneratingPDF || pageItems.length === 0 ? 'not-allowed' : 'pointer',
          opacity: isGeneratingPDF || pageItems.length === 0 ? 0.5 : 1,
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
                <div className="translate-y-[-15px]" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Bond Issuance Pulse- {currentDateFullName} 2026
                </div>
              </div>
              <div className="content-area" style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
                {allSections.map((section) => renderContentItem({ section }, true))}
              </div>
              <div
              className='translate-y-[-12px]'
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
        {/* Cover Page */}
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
                {firstPageDisplayDate}
              </div>
            </div>
          </div>
        </div>

        {pageItems.map((page, pageIndex) => (
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
                  <div className="translate-y-[-15px]" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Bond Issuance Pulse- {currentDateFullName} 2026
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
                  {page.map((item) => renderContentItem(item, false))}
                </div>
                <div
                className='translate-y-[-12px]'
                  style={{
                    flexShrink: 0,
                    height: '16px',
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
                  position: 'relative',
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

                {img.overlay && (
                  <>
                    <div style={img.overlay.containerStyle}>
                      {img.overlay.images.map((imageSrc, i) => (
                        <a
                          key={i}
                          href={img.overlay.links?.[i] || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-block', color: 'inherit', textDecoration: 'none' }}
                          data-link="true"
                        >
                          <Image src={imageSrc} alt={`icon-${i}`} style={img.overlay.imageStyle} />
                        </a>
                      ))}
                    </div>
                    <div style={img.overlay.TextcontainerStyle}>
                      {img.overlay.textLink && (
                        <a
                          href={img.overlay.textLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            color: '#0d1427ff',
                            fontSize: '1.9rem',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            marginLeft: '8px',
                          }}
                          data-link="true"
                        >
                          {img.overlay.textLink.text}
                        </a>
                      )}
                    </div>
                  </>
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