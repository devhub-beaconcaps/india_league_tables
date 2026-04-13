'use client'

import { useState, useMemo, useEffect, useRef, ReactNode, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  PieLabelRenderProps
} from 'recharts';
import { fetchDashboardIssueVolumeTrendsData, fetchDashboardMonthlyVolumeData, fetchDashboardRatingAgencyData, fetchDashboardSectorsData, fetchDashboardStatsData, fetchDashboardTablesData } from '../../../features/dashboard/services';
import CustomDropdown from '@/components/CustomDropdown';
import { useUser } from '@clerk/nextjs'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Import types
import {
  FinancialYear,
  StatCardData,
  TableRow,
  SectorData,
  AgencyData,
  MonthlyVolumeData,
  IssueTrendData,
  StatsApiResponse,
  SectorsApiResponse,
  AgencyApiResponse,
  DateRange,
  StatCardProps,
  SectionCardProps,
  TabType
} from './types';

const tabs: TabType[] = ['issuers', 'arrangers', 'trustees', 'registrars', 'rating agency'];

// ─── Helper Functions ────────────────────────────────────────────────────────

const getFinancialYears = (): FinancialYear[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  if (currentMonth < 3) {
    currentYear -= 1;
  }

  const years: FinancialYear[] = [];
  for (let i = 0; i < 5; i++) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    years.push({
      label: `FY ${startYear}-${endYear.toString().slice(-2)}`,
      value: `${startYear}-${endYear}`,
      startYear: startYear
    });
  }
  return years;
};

const handleFinancialYearSelection = (financialYear: string): DateRange => {
  console.log("handleFinancialYearSelection called with FY:", financialYear);

  const firstYear = parseInt(financialYear.split('-')[0]);

  const startDate = new Date(firstYear, 3, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(firstYear + 1, 2, 31);
  endDate.setHours(0, 0, 0, 0);

  const now = new Date();
  if (endDate > now) {
    endDate.setTime(now.getTime());
  }

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const startDateStr = formatDateTime(startDate);
  const endDateStr = formatDateTime(endDate);

  console.log(`startDate: ${startDateStr}, endDate: ${endDateStr}`);

  return { startDate: startDateStr, endDate: endDateStr };
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ─── Empty State Component ───────────────────────────────────────────────────

function NoDataState({ message = "No data available", subMessage }: { message?: string; subMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-gray-400 dark:text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
        {message}
      </h3>
      {subMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
          {subMessage}
        </p>
      )}
    </div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1a2e] border-l-4 border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 flex items-start gap-3 flex-1 min-w-0 drop-shadow-md w-full sm:w-auto">
      <div className="min-w-0 w-full">
        <Skeleton circle width={24} height={24} className="mb-2" />
        <Skeleton width="60%" height={10} className="mb-1" />
        <Skeleton width="80%" height={16} className="mt-0.5" />
        <Skeleton width="30%" height={9} className="mt-0.5" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50">
      <td className="py-2.5 px-2">
        <Skeleton width="80%" height={12} />
      </td>
      <td className="py-2.5 text-right">
        <Skeleton width="40%" height={12} inline />
      </td>
      <td className="py-2.5 text-right pr-2">
        <Skeleton width="50%" height={12} inline />
      </td>
    </tr>
  );
}

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <Skeleton height="100%" width="100%" />
    </div>
  );
}

function PieChartSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton circle width={140} height={140} className="mb-4" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton circle width={10} height={10} />
            <Skeleton width={60} height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, change, color, icon }: StatCardProps) {
  return (
    <div
      className="bg-white dark:bg-[#1a1a2e] border-l-4 rounded-2xl px-4 py-2 flex items-start gap-3 flex-1 min-w-0 drop-shadow-md w-full sm:w-auto"
      style={{ borderLeftColor: color }}
    >
      <div className="min-w-0 w-full">
        <div
          className="w-6 h-6 mb-2 rounded-full flex items-center justify-center text-white text-sm shrink-0"
          style={{ background: color }}
        >
          <span>{icon}</span>
        </div>
        <p className="text-[9px] mb-1 text-gray-400 dark:text-gray-500 font-medium truncate">{label}</p>
        <p title={value} className="text-[14px] font-bold text-gray-800 dark:text-white leading-tight mt-0.5">{label === 'Top Sector' ? truncateText(value, 7) : value}</p>
        <p className="text-[9px] text-green-500 font-medium mt-0.5">{change}</p>
      </div>
    </div>
  );
}

function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-2xl drop-shadow-md ${className}`}>
      {children}
    </div>
  );
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps): ReactNode => {
  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof midAngle !== 'number' ||
    typeof innerRadius !== 'number' || typeof outerRadius !== 'number' || typeof percent !== 'number') {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={500}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const fyOptions = useMemo(() => getFinancialYears(), []);
  const { isSignedIn, user, isLoaded } = useUser();

  const valueConventionOptions = [
    { label: "Crores", value: "Crores" },
    { label: "Lakhs", value: "Lakhs" }
  ];

  const dateRange = useMemo(() => handleFinancialYearSelection(fyOptions[0]?.value || ''), [fyOptions]);

  const [selectedFY, setSelectedFY] = useState<string>(fyOptions[0]?.value || '');
  const [activeTab, setActiveTab] = useState<TabType>('issuers');
  const [barView, setBarView] = useState<'ISSUE SIZE' | 'NO. OF ISSUES'>('ISSUE SIZE');
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [statsData, setStatsData] = useState<StatCardData[] | null>(null);
  const [SpecificSectorsData, setSpecificSectorsData] = useState<SectorData[] | null>(null);
  const [SpecificAgencyData, setSpecificAgencyData] = useState<AgencyData[] | null>(null);
  const [monthlyVolumeData, setMonthlyVolumeData] = useState<MonthlyVolumeData[]>([]);
  const [issueTrendsData, setIssueTrendsData] = useState<IssueTrendData[]>([]);
  const [valueConvention, setValueConvention] = useState<'Crores' | 'Lakhs'>('Crores');
  const [yearDropdownopen, setYearDropdownopen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedYearsDateRange, setSelectedYearsDateRange] = useState<DateRange>(dateRange || { startDate: '', endDate: '' });

  // Loading states
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isSectorsLoading, setIsSectorsLoading] = useState(true);
  const [isAgencyLoading, setIsAgencyLoading] = useState(true);
  const [isMonthlyVolumeLoading, setIsMonthlyVolumeLoading] = useState(true);
  const [isIssueTrendsLoading, setIsIssueTrendsLoading] = useState(true);

  const sanitizedAgencyData = useMemo((): AgencyData[] => {
    if (!SpecificAgencyData) return [];
    return SpecificAgencyData.map(item => ({
      ...item,
      rating_no: parseFloat(String(item.rating_no)) || 0,
      percentage: parseFloat(String(item.percentage)) || 0
    }));
  }, [SpecificAgencyData]);

  const sanitizedSectorsData = useMemo((): SectorData[] => {
    if (!SpecificSectorsData) return [];
    return SpecificSectorsData.map(item => ({
      ...item,
      issue_size: parseFloat(String(item.issue_size)) || 0,
      no_of_issue: parseFloat(String(item.no_of_issue)) || 0,
    }));
  }, [SpecificSectorsData]);

  const sanitizedIssuersVolumeData = useMemo((): MonthlyVolumeData[] => {
    if (!monthlyVolumeData) return [];
    return monthlyVolumeData.map(item => ({
      ...item,
      current_year_issue_count: parseFloat(String(item?.current_year_issue_count)) || 0,
      current_year_issue_size: parseFloat(String(item?.current_year_issue_size)) || 0,
      previous_year_issue_count: parseFloat(String(item?.previous_year_issue_count)) || 0,
      previous_year_issue_size: parseFloat(String(item?.previous_year_issue_size)) || 0,
    }));
  }, [monthlyVolumeData]);

  const sanitizedIssuersTrendsData = useMemo((): IssueTrendData[] => {
    if (!issueTrendsData) return [];
    return issueTrendsData.map(item => ({
      ...item,
      total_issue_size_cr: parseFloat(String(item?.total_issue_size_cr)) || 0,
      total_no_of_issues: parseFloat(String(item?.total_no_of_issues)) || 0,
    }));
  }, [issueTrendsData]);

  const fetchTableData = useCallback(async (tab: TabType): Promise<void> => {
    if (!selectedFY) return;
    setIsTableLoading(true);
    try {
      let endpoint: string;

      switch (tab) {
        case 'issuers':
          endpoint = 'dashboard_issuer_table_data';
          break;
        case 'arrangers':
          endpoint = 'dashboard_arranger_table_data';
          break;
        case 'trustees':
          endpoint = 'dashboard_trustee_table_data';
          break;
        case 'registrars':
          endpoint = 'dashboard_registrar_table_data';
          break;
        case 'rating agency':
          endpoint = 'dashboard_agency_table_data';
          break;
        default:
          endpoint = 'dashboard_issuer_table_data';
      }

      const query: DateRange = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const data = await fetchDashboardTablesData(query, endpoint) as TableRow[];
      console.log(`Fetched ${tab} data:`, data);
      setTableData(data || []);
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, (error as Error).message);
      setTableData([]);
    } finally {
      setIsTableLoading(false);
    }
  }, [selectedFY, selectedYearsDateRange]);

  const getDashboardStatsData = useCallback(async (): Promise<StatsApiResponse | null> => {
    if (!selectedYearsDateRange) return null;
    setIsStatsLoading(true);
    try {
      const query: DateRange = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const data = await fetchDashboardStatsData(query) as StatsApiResponse[];
      if (Array.isArray(data) && data.length > 0) {
        const statsCards: StatCardData[] = [
          { label: 'Largest Issue Size', value: Number(data[0]?.largest_issue_size || 0).toLocaleString('en-IN'), change: '+8%', color: '#7C3AED', icon: '📊' },
          { label: 'Total Issues', value: Number(data[0]?.total_issues || 0).toLocaleString('en-IN'), change: '+5%', color: '#7C3AED', icon: '📋' },
          { label: 'Avg Issue Size', value: Number(data[0]?.avg_issue_size_in_cr || 0).toLocaleString('en-IN'), change: '+8%', color: '#EC4899', icon: '📈' },
          { label: 'Total Volume', value: Number(data[0]?.total_volume_in_cr || 0).toLocaleString('en-IN'), change: '+8%', color: '#06B6D4', icon: '💰' },
          { label: 'Total Issue Size', value: Number(data[0]?.total_issue_size_in_cr || 0).toLocaleString('en-IN'), change: '+8%', color: '#F97316', icon: '🏦' },
          { label: 'Top Sector', value: data[0]?.top_sector_by_volume || 'N/A', change: '+8%', color: '#10B981', icon: '📦' },
        ];
        setStatsData(statsCards);
        console.log("Fetched stats data:", data[0]);
        return data[0];
      } else {
        setStatsData([]);
        console.log("Stats data is empty or not an array.");
        return null;
      }
    } catch (error) {
      console.error(`Error fetching stats data:`, (error as Error).message);
      setStatsData([]);
      return null;
    } finally {
      setIsStatsLoading(false);
    }
  }, [selectedYearsDateRange]);

  const getDashboardSectorsData = useCallback(async (tab: TabType): Promise<SectorData[] | undefined> => {
    if (!selectedYearsDateRange) return;
    setIsSectorsLoading(true);
    try {
      const query: DateRange = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardSectorsData(query) as SectorsApiResponse;
      console.log("DASHBOARD SECTORS DATA.....", res);

      let currentSectorsData: SectorData[] = [];

      switch (tab) {
        case 'issuers':
          currentSectorsData = res?.issuers || [];
          break;
        case 'arrangers':
          currentSectorsData = res?.arrangers || [];
          break;
        case 'trustees':
          currentSectorsData = res?.trustees || [];
          break;
        case 'registrars':
          currentSectorsData = res?.registrars || [];
          break;
        case 'rating agency':
          currentSectorsData = res?.ratingAgencies || [];
          break;
        default:
          currentSectorsData = res?.issuers || [];
      }
      setSpecificSectorsData(currentSectorsData);
      console.log("Current Sectors Data:", currentSectorsData);

      return currentSectorsData;
    } catch (error) {
      console.log(`error of :${(error as Error).message} `);
      setSpecificSectorsData([]);
    } finally {
      setIsSectorsLoading(false);
    }
  }, [selectedYearsDateRange]);

  const getDashboardAgencyData = useCallback(async (tab: TabType): Promise<AgencyData[] | undefined> => {
    if (!selectedYearsDateRange) return;
    setIsAgencyLoading(true);
    try {
      const query: DateRange = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardRatingAgencyData(query) as AgencyApiResponse;
      console.log("DASHBOARD AGENCY DATA.....", res);

      let currentAgencyData: AgencyData[] = [];

      switch (tab) {
        case 'issuers':
          currentAgencyData = res?.issuers || [];
          break;
        case 'arrangers':
          currentAgencyData = res?.arrangers || [];
          break;
        case 'trustees':
          currentAgencyData = res?.trustees || [];
          break;
        case 'registrars':
          currentAgencyData = res?.registrars || [];
          break;
        case 'rating agency':
          currentAgencyData = res?.ratingAgencies || [];
          break;
        default:
          currentAgencyData = res?.issuers || [];
      }
      setSpecificAgencyData(currentAgencyData);
      console.log("Current agency Data:", currentAgencyData);

      return currentAgencyData;
    } catch (error) {
      console.log(`error of :${(error as Error).message} `);
      setSpecificAgencyData([]);
    } finally {
      setIsAgencyLoading(false);
    }
  }, [selectedYearsDateRange]);

  const getDashboardMonthlyVolumeData = useCallback(async (): Promise<MonthlyVolumeData[] | undefined> => {
    if (!selectedYearsDateRange) return;
    setIsMonthlyVolumeLoading(true);
    try {
      const query: DateRange = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardMonthlyVolumeData(query) as MonthlyVolumeData[];
      console.log("DASHBOARD MONTHLY VOLUME DATA.....", res);

      setMonthlyVolumeData(res || []);
      console.log("Current monthly volume Data:", res);

      return res;
    } catch (error) {
      console.log(`error of :${(error as Error).message} `);
      setMonthlyVolumeData([]);
    } finally {
      setIsMonthlyVolumeLoading(false);
    }
  }, [selectedYearsDateRange]);

  const getDashboardIssueTrendsData = useCallback(async (): Promise<IssueTrendData[] | undefined> => {
    if (!selectedYearsDateRange) return;
    setIsIssueTrendsLoading(true);
    try {
      const res = await fetchDashboardIssueVolumeTrendsData() as IssueTrendData[];
      console.log("DASHBOARD ISSUE TRENDS DATA.....", res);

      setIssueTrendsData(res || []);
      console.log("Current issue trends Data:", res);

      return res;
    } catch (error) {
      console.log(`error of :${(error as Error).message} `);
      setIssueTrendsData([]);
    } finally {
      setIsIssueTrendsLoading(false);
    }
  }, [selectedYearsDateRange]);

  useEffect(() => {
    if (selectedFY) {
      getDashboardIssueTrendsData();
      fetchTableData(activeTab);
      getDashboardStatsData();
      getDashboardSectorsData(activeTab);
      getDashboardAgencyData(activeTab);
      getDashboardMonthlyVolumeData();
    }
  }, [activeTab, selectedFY, fetchTableData, getDashboardStatsData, getDashboardSectorsData, getDashboardAgencyData, getDashboardMonthlyVolumeData, getDashboardIssueTrendsData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setYearDropdownopen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectDate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFY(e.target.value);
    const dateRange = handleFinancialYearSelection(e.target.value);
    setSelectedYearsDateRange(dateRange);
  };

  // Handle loading state
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-[120px] h-[120px]">
            <DotLottieReact
              src="https://lottie.host/22feb182-5b2a-45b8-91bd-ffc09a0de205/dn7Bz2NCSh.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Protect the page from unauthenticated users
  if (!isSignedIn) return <div>Sign in to view this page</div>

  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9" borderRadius="0.5rem">
      <div className="space-y-5 px-4 sm:px-0">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

        {/* ── Stats Row ── */}
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2 sm:pb-0">
          {isStatsLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </>
          ) : statsData && statsData.length > 0 ? (
            statsData.map((card, i) => (
              <StatCard key={i} {...card} />
            ))
          ) : (
            <div className="w-full">
              <NoDataState message="No statistics available" subMessage="Try selecting a different financial year or check back later." />
            </div>
          )}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
          {/* LEFT COLUMN */}
          <div className="space-y-5 order-2 lg:order-1">
            {/* Financial Year Table */}
            <SectionCard className="p-5">
              <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-4">
                Financial Year: {selectedFY}
              </h2>

              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                <CustomDropdown
                  label="Value Convention"
                  options={valueConventionOptions}
                  value={valueConvention}
                  onChange={(val: string) => setValueConvention(val as 'Crores' | 'Lakhs')}
                />
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4'>
                  <CustomDropdown
                    label="Financial Year"
                    options={fyOptions}
                    value={selectedFY}
                    onChange={(val: string) => {
                      setSelectedFY(val);
                      handleSelectDate({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                  />
                  <button
                    onClick={() => {
                      const defaultFY = fyOptions[0]?.value || '';
                      setSelectedFY(defaultFY);
                      setSelectedYearsDateRange(handleFinancialYearSelection(defaultFY));
                      setValueConvention('Crores');
                      setActiveTab('issuers');
                    }}
                    className="mt-0 sm:mt-4 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-medium px-4 py-1.5 rounded-[12px] transition-colors w-full sm:w-auto"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[9px] font-medium px-4 py-1.5 rounded-full border transition-all ${activeTab === tab
                      ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white border-[#7C3AED]'
                      : 'bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-[#7C3AED] fake:text-[#7C3AED]'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  {!isTableLoading && tableData && tableData.length > 0 && (
                    <thead>
                      <tr className="text-left text-gray-400 text-[9px] uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                        <th className="pb-2 font-semibold">Issuers</th>
                        <th className="pb-2 font-semibold text-right">No. of Issues</th>
                        <th className="pb-2 font-semibold text-right">Issue Size</th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {isTableLoading ? (
                      [...Array(8)].map((_, i) => (
                        <TableRowSkeleton key={i} />
                      ))
                    ) : tableData && tableData.length > 0 ? (
                      tableData.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-gray-50 text-[9px] dark:border-gray-700/50 last:border-0 ${row.active
                            ? 'bg-[#7C3AED] text-white rounded-lg'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                            }`}
                        >
                          <td className={`py-2.5 px-2 font-medium rounded-l-lg ${row.active ? 'text-white' : 'text-[#7C3AED]'}`}>
                            {row?.name}
                          </td>
                          <td className={`py-2.5 text-right  ${row.active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {row?.noIssuer}
                          </td>
                          <td className={`py-2.5 text-right pr-2 rounded-r-lg ${row.active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {valueConvention === 'Lakhs'
                              ? (parseFloat(String(row?.issueSize || 0)) * 100).toLocaleString()
                              : parseFloat(String(row?.issueSize || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>
                          <NoDataState message={`No ${activeTab} data available`} subMessage="Try adjusting your filters or selecting a different financial year." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Issue Volume Trends */}
            <SectionCard className="p-5">
              <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Issue Volume Trends</h2>
              <div className="flex justify-between text-[9px] text-gray-400 mb-2">
                <span>Issue Size</span>
                <span>No of Issue</span>
              </div>
              {isIssueTrendsLoading ? (
                <ChartSkeleton height={240} />
              ) : sanitizedIssuersTrendsData && sanitizedIssuersTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={sanitizedIssuersTrendsData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gradSize" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradIssue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="years" angle={-30} tick={{ fontSize: 9 }} tickMargin={12} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Area yAxisId="left" type="monotone" dataKey="total_issue_size_cr" stroke="#06B6D4" fill="url(#gradSize)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="total_no_of_issues" stroke="#EC4899" fill="url(#gradIssue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <NoDataState message="No trend data available" subMessage="Historical issue volume data will appear here once available." />
              )}
              {!isIssueTrendsLoading && sanitizedIssuersTrendsData && sanitizedIssuersTrendsData.length > 0 && (
                <div className="flex justify-center gap-6 mt-3">
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-[#EC4899]" /> No of issue
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-[#06B6D4]" /> Issue Size
                  </span>
                </div>
              )}
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5 order-1 lg:order-2">
            <SectionCard className='p-5'>
              {/* Top 10 Issuer Volume Bar Chart */}
              <div className="p-5 mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase">Top 10 Issuer Volume (Crores)</h3>
                </div>
                <div className="flex gap-2 justify-start sm:justify-end mb-3 flex-wrap">
                  {(['ISSUE SIZE', 'NO. OF ISSUES'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setBarView(v)}
                      className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border transition-all ${barView === v
                        ? 'bg-gradient-to-r from-[#423CAB] to-[#653FD8] text-white border-[#7C3AED]'
                        : 'text-gray-400 border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {isMonthlyVolumeLoading ? (
                  <ChartSkeleton height={180} />
                ) : sanitizedIssuersVolumeData && sanitizedIssuersVolumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={sanitizedIssuersVolumeData}
                      barSize={10}
                      barGap={2}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="month_name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={30}
                        tick={{ fontSize: 8 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) =>
                          barView === 'ISSUE SIZE' ? `₹${value}` : String(value)
                        }
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        formatter={(value: number) =>
                          barView === 'ISSUE SIZE' ? `₹${value}` : value
                        }
                      />
                      <Bar
                        dataKey={
                          barView === 'ISSUE SIZE'
                            ? 'previous_year_issue_size'
                            : 'previous_year_issue_count'
                        }
                        fill="#423CAB"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey={
                          barView === 'ISSUE SIZE'
                            ? 'current_year_issue_size'
                            : 'current_year_issue_count'
                        }
                        fill="#06B6D4"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataState message="No volume data available" subMessage="Monthly issuer volume data will appear here once available." />
                )}
                {!isMonthlyVolumeLoading && sanitizedIssuersVolumeData && sanitizedIssuersVolumeData.length > 0 && (
                  <div className="flex justify-center gap-6 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" /> Previous Year (PY)
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Current Year (CY)
                    </span>
                  </div>
                )}
              </div>

              {/* Top 10 Issuers By Sector */}
              <div className="p-5 mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Top 10 Issuers by Sector</h3>
                {isSectorsLoading ? (
                  <PieChartSkeleton />
                ) : sanitizedSectorsData && sanitizedSectorsData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={sanitizedSectorsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={75}
                          paddingAngle={2}
                          label={renderCustomizedLabel}
                          labelLine={false}
                          dataKey={
                            barView === 'ISSUE SIZE'
                              ? 'issue_size'
                              : 'no_of_issue'
                          }
                          nameKey="business_name"
                        >
                          {sanitizedSectorsData?.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 8 }}
                          formatter={(value: number) =>
                            barView === 'ISSUE SIZE' ? `₹${value}` : value
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                      {sanitizedSectorsData?.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          {item?.business_name}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <NoDataState message="No sector data available" subMessage="Sector distribution data will appear here once available." />
                )}
              </div>

              {/* Credit Rating Agencies */}
              <div className="p-5 mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Credit Rating Agencies</h3>
                {isAgencyLoading ? (
                  <PieChartSkeleton />
                ) : sanitizedAgencyData && sanitizedAgencyData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={sanitizedAgencyData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          paddingAngle={2}
                          label={renderCustomizedLabel}
                          labelLine={false}
                          dataKey="rating_no"
                        >
                          {sanitizedAgencyData?.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                      {sanitizedAgencyData?.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          {item?.label}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <NoDataState message="No agency data available" subMessage="Credit rating agency data will appear here once available." />
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}