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

// ----- Types (unchanged) -----
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
  issuer_count: string;
  total_issue_size: string;
  shares: string;
}
interface SectorListResult {
  sector_name: string;
  isin_count: string;
  issuer_count: string;
  total_issue_size: string;
  shares: string;
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
}

interface ReportData {
  totalIssuersResult: TotalIssuersResult[];
  totalIssueCountResult: TotalIssueCountResult[];
  totalIssueSizeResult: TotalIssueSizeResult[];
  AvgIssueSizeResult: AvgIssueSizeResult[];
  totalUniqueIssuersResult: TotalUniqueIssuersResult[];
  topIssuerByIssueSizeResult: TopIssuerByIssueSizeResult[];
  topIssuerByIssuerNumberResult: TopIssuerByIssuerNumberResult[];
  topRatingResult: TopRatingResult[];
  issuerListResult: IssuerListResult[];
  ratingsListResult: RatingsListResult[];
  sectorListResult: SectorListResult[];
  sectorAndRatingListResult: SectorAndRatingListResult[];
  monthlyCompareListResult: MonthlyCompareListResult[];
  topSectorsWithIssuersResult: TopSectorsWithIssuersResult[];
}

// ----- Default Data (same as before) -----
const defaultData: ReportData = {
  totalIssuersResult: [{ total_issuers: '150' }],
  totalIssueCountResult: [{ total_isins: '150' }],
  totalIssueSizeResult: [{ total_issue_size: '84303' }],
  AvgIssueSizeResult: [{ avg_issue_size: '562' }],
  totalUniqueIssuersResult: [{ total_issuers: '112' }],
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
      issuer_name: 'NATIONAL BANK FOR AGRICULTURE AND RURAL DEVELOPMENT',
      isin_count: '1',
      total_issue_size: '8000',
      latest_rating: 'AAA',
      sector: 'Financial Institution',
    },
    {
      issuer_name: 'SMALL INDUSTRIES DEVELOPMENT BANK OF INDIA',
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
    { rating_label: 'AAA', issuer_count: '23', total_issue_size: '23593', shares: '40.35' },
    { rating_label: 'BBB-', issuer_count: '5', total_issue_size: '556', shares: '8.77' },
    { rating_label: 'BB', issuer_count: '4', total_issue_size: '3466', shares: '7.02' },
    { rating_label: 'AA+', issuer_count: '4', total_issue_size: '1248', shares: '7.02' },
    { rating_label: 'WITHDRAWN', issuer_count: '4', total_issue_size: '491', shares: '7.02' },
    { rating_label: 'BB+ & rest', issuer_count: '17', total_issue_size: '9039', shares: '29.82' },
  ],
  sectorListResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      isin_count: '65',
      issuer_count: '65',
      total_issue_size: '21875',
      shares: '51.18',
    },
    {
      sector_name: 'Financial Institution',
      isin_count: '8',
      issuer_count: '8',
      total_issue_size: '16121',
      shares: '6.3',
    },
    {
      sector_name: 'Housing Finance Company',
      isin_count: '8',
      issuer_count: '8',
      total_issue_size: '9610',
      shares: '6.3',
    },
    {
      sector_name: 'Stockbroking & Allied',
      isin_count: '8',
      issuer_count: '8',
      total_issue_size: '356',
      shares: '6.3',
    },
    {
      sector_name: 'Residential, Commercial Projects',
      isin_count: '7',
      issuer_count: '7',
      total_issue_size: '601',
      shares: '5.51',
    },
    {
      sector_name: 'Other Financial Services',
      isin_count: '6',
      issuer_count: '6',
      total_issue_size: '343',
      shares: '4.72',
    },
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
    {
      sector_name: 'Residential, Commercial Projects',
      total_issue_size_crores: '325',
      AAA: '270',
      AA_plus: '0',
      AA: '0',
      AA_minus: '0',
      A_plus: '0',
      A_others: '55',
    },
    {
      sector_name: 'Other Financial Services',
      total_issue_size_crores: '310.6',
      AAA: '300',
      AA_plus: '0',
      AA: '10.6',
      AA_minus: '0',
      A_plus: '0',
      A_others: '0',
    },
    {
      sector_name: 'Iron & Steel',
      total_issue_size_crores: '200',
      AAA: '0',
      AA_plus: '0',
      AA: '0',
      AA_minus: '0',
      A_plus: '0',
      A_others: '200',
    },
    {
      sector_name: 'Stockbroking & Allied',
      total_issue_size_crores: '115',
      AAA: '0',
      AA_plus: '0',
      AA: '0',
      AA_minus: '0',
      A_plus: '50',
      A_others: '65',
    },
  ],
  monthlyCompareListResult: [
    { metric_name: 'Issuers', value_2025: '623', value_2026: '150', yoy_change_pct: '-75.92' },
    { metric_name: 'Issue Size', value_2025: '84413', value_2026: '84303', yoy_change_pct: '-0.13' },
    { metric_name: 'ISINs', value_2025: '623', value_2026: '150', yoy_change_pct: '-75.92' },
  ],
  topSectorsWithIssuersResult: [
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'BAJAJ FINANCE LIMITED',
      total_issue_size: '4000',
      isin_count: '1',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'MUTHOOT FINCORP LIMITED',
      total_issue_size: '2888',
      isin_count: '13',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'HDB FINANCIAL SERVICES LIMITED',
      total_issue_size: '2350',
      isin_count: '3',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'INDIA INFRASTRUCTURE FINANCE COMPANY LIMITED',
      total_issue_size: '1848',
      isin_count: '1',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'POONAWALLA FINCORP LIMITED',
      total_issue_size: '1250',
      isin_count: '2',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'NIIF INFRASTRUCTURE FINANCE LIMITED',
      total_issue_size: '1050',
      isin_count: '2',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'SHRIRAM FINANCE LIMITED',
      total_issue_size: '1000',
      isin_count: '1',
    },
    {
      sector_name: 'Non-Banking Financial Company (NBFC)',
      issuer_name: 'JIO CREDIT LIMITED',
      total_issue_size: '965',
      isin_count: '1',
    },
    {
      sector_name: 'Financial Institution',
      issuer_name: 'SMALL INDUSTRIES DEVELOPMENT BANK OF INDIA',
      total_issue_size: '8000',
      isin_count: '1',
    },
    {
      sector_name: 'Financial Institution',
      issuer_name: 'NATIONAL BANK FOR AGRICULTURE AND RURAL DEVELOPMENT',
      total_issue_size: '8000',
      isin_count: '1',
    },
    {
      sector_name: 'Housing Finance Company',
      issuer_name: 'SAMMAAN CAPITAL LIMITED',
      total_issue_size: '4510',
      isin_count: '2',
    },
    {
      sector_name: 'Housing Finance Company',
      issuer_name: 'BAJAJ HOUSING FINANCE LIMITED',
      total_issue_size: '2500',
      isin_count: '1',
    },
    {
      sector_name: 'Investment Company',
      issuer_name: 'TATA CAPITAL LIMITED',
      total_issue_size: '4780',
      isin_count: '2',
    },
    {
      sector_name: 'Diversified',
      issuer_name: 'NTPC GREEN ENERGY LIMITED',
      total_issue_size: '2500',
      isin_count: '1',
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

// ----- Chart Components using Recharts -----

interface VerticalBarChartProps {
  data: Array<{ label: string; value: number }>;
  valueSuffix?: string;
}

import { Cell } from 'recharts'; // we need to import Cell

// ----- Updated Chart Components -----

const VerticalBarChartWithColors: React.FC<VerticalBarChartProps> = ({ data, valueSuffix = '' }) => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
  const chartData = data.map((item) => ({ name: item.label, value: item.value }));

  return (
    <div style={{ width: '50%', height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />

          <Bar dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
            {/* Added LabelList to show values over the bars */}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => `${v.toFixed(1)}${valueSuffix}`}
              style={{ fontSize: 9, fill: '#6b7280' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface HorizontalBarChartProps {
  data: Array<{ label: string; value: number }>;
  valueSuffix?: string;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ data, valueSuffix = '' }) => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
  const chartData = data.map((item) => ({ name: item.label, value: item.value }));

  return (
    <div style={{ width: '60%', height: 180 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 20, bottom: 5 }} // Increased right margin from 30 to 40 for labels
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />

          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={180}
            interval={0}
          />

          <Tooltip formatter={(v: number) => `${v.toFixed(1)}${valueSuffix}`} />

          <Bar dataKey="value" barSize={16}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}

            {/* Added LabelList to show values at the end of the horizontal bars */}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: number) => `${v.toFixed(1)}${valueSuffix}`}
              style={{ fontSize: 9, fill: '#6b7280' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

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
    <div style={{ width: '50%', height: 210 }}> {/* Slightly increased height for padding */}
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 25, right: 10, left: 0, bottom: 20 }} // Increased top margin to 25
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />
          <Tooltip />
          <Legend />

          {/* First Bar with its own LabelList */}
          <Bar dataKey="value2025" fill="#3b82f6" name="2025">
            <LabelList
              dataKey="value2025"
              position="top"
              formatter={(v: number) => v.toFixed(1)}
              style={{ fontSize: 8, fill: '#6b7280' }}
            />
          </Bar>

          {/* Second Bar with its own LabelList */}
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
        avg_issue_size: d.AvgIssueSizeResult?.[0]?.avg_issue_size || '0',
        unique_issuers: d.totalUniqueIssuersResult?.[0]?.total_issuers || '0',
        top_issuer_size: d.topIssuerByIssueSizeResult?.[0]?.issuer_name || '—',
        top_issuer_count: d.topIssuerByIssuerNumberResult?.[0]?.issuer_name || '—',
        top_rating: d.topRatingResult?.[0]?.rating || '—',
      },
    });

    if (d.issuerListResult?.length) {
      sections.push({
        id: 'issuances-by-issuer',
        type: 'table',
        title: 'Issuances by Issuer',
        columns: ['Issuer Name', 'ISIN Count', 'Total Issue Size (Cr)', 'Latest Rating', 'Sector'],
        data: d.issuerListResult,
        rowRenderer: (item: IssuerListResult) => [
          item.issuer_name,
          item.isin_count,
          formatCrores(item.total_issue_size),
          item.latest_rating || '—',
          item.sector || '—',
        ],
      });
    }

    if (d.ratingsListResult?.length) {
      sections.push({
        id: 'credit-rating-distribution',
        type: 'ratingDistribution',
        data: d.ratingsListResult,
      });
    }

    if (d.sectorListResult?.length) {
      sections.push({
        id: 'issuances-by-sector',
        type: 'sectorDistribution',
        data: d.sectorListResult,
      });
    }

    if (d.sectorAndRatingListResult?.length) {
      sections.push({
        id: 'sector-rating-cross',
        type: 'crossTable',
        data: d.sectorAndRatingListResult,
      });
    }

    if (d.monthlyCompareListResult?.length) {
      sections.push({
        id: 'monthly-compare',
        type: 'monthlyCompare',
        data: d.monthlyCompareListResult,
      });
    }

    if (d.topSectorsWithIssuersResult?.length) {
      const grouped = d.topSectorsWithIssuersResult.reduce((acc, item) => {
        if (!acc[item.sector_name]) acc[item.sector_name] = [];
        acc[item.sector_name].push(item);
        return acc;
      }, {} as Record<string, TopSectorsWithIssuersResult[]>);

      Object.entries(grouped).forEach(([sector, issuers]) => {
        sections.push({
          id: `sector-${sector.replace(/\s/g, '-')}`,
          type: 'sectorIssuerTable',
          title: sector,
          data: issuers,
        });
      });
    }

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

  // ----- Pagination via measurement -----
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
          unique_issuers,
          top_issuer_size,
          top_issuer_count,
          top_rating,
        } = section.data;
        const cards = [
          { label: 'Total Issuers', value: total_issuers },
          { label: 'Total ISINs', value: total_isins },
          { label: 'Total Issue Size (Cr)', value: formatCrores(total_issue_size) },
          { label: 'Avg Issue Size (Cr)', value: formatCrores(avg_issue_size) },
          { label: 'Unique Issuers', value: unique_issuers },
          { label: 'Top Issuer (Size)', value: top_issuer_size },
          { label: 'Top Issuer (Count)', value: top_issuer_count },
          { label: 'Top Rating', value: top_rating },
        ];
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
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
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{card.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>{card.value}</div>
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
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
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
                        {col}
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
                            {cell}
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
          value: parseFloat(item.total_issue_size) || 0,
        }));
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
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
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Rating</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Issuer Count</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      Total Issue Size (Cr)
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Shares (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.rating_label}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.issuer_count}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        {formatCrores(item.total_issue_size)}
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatPercent(item.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <VerticalBarChartWithColors data={chartData} valueSuffix=" Cr" />

            </div>
          </div>
        );
      }

      case 'sectorDistribution': {
        const sectorData = section.data as SectorListResult[];
        const chartData = sectorData.map((item) => ({
          label: item.sector_name,
          value: parseFloat(item.total_issue_size) || 0,
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
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Sector</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>ISIN Count</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Issuer Count</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      Total Issue Size (Cr)
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Shares (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.sector_name}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.isin_count}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.issuer_count}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        {formatCrores(item.total_issue_size)}
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatPercent(item.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HorizontalBarChart data={chartData} valueSuffix=" Cr" />

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
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Sector</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Total (Cr)</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>AAA</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>AA+</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>AA</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>AA-</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>A+</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>A (others)</th>
                  </tr>
                </thead>
                <tbody>
                  {crossData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.sector_name}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        {formatCrores(item.total_issue_size_crores)}
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.AAA)}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.AA_plus)}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.AA)}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.AA_minus)}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.A_plus)}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{formatCrores(item.A_others)}</td>
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
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Metric</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Value 2025</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Value 2026</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      YoY Change (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.metric_name}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.value_2025}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.value_2026}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        {formatPercent(item.yoy_change_pct)}
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
        const { title, data } = section;
        return (
          <div key={key} id={id} className="section-item" style={sectionStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>
              {title}
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
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>Issuer Name</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>
                      Total Issue Size (Cr)
                    </th>
                    <th style={{ border: '1px solid #d1d5db', padding: '3px 6px', textAlign: 'left' }}>ISIN Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: TopSectorsWithIssuersResult, idx: number) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.issuer_name}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>
                        {formatCrores(item.total_issue_size)}
                      </td>
                      <td style={{ border: '1px solid #d1d5db', padding: '3px 6px' }}>{item.isin_count}</td>
                    </tr>
                  ))}
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

      default:
        return null;
    }
  }, []);

  // ----- PDF Download -----
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
                  padding: '10px 24px',
                  borderRadius: '16px 16px 0 0',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  July 2026 | India Debt Issuer &amp; Issuance Snapshot
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
                    padding: '10px 24px',
                    borderRadius: '16px 16px 0 0',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    July 2026 | India Debt Issuer &amp; Issuance Snapshot
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