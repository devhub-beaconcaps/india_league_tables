'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { fetchDashboardIssueVolumeTrendsData, fetchDashboardMonthlyVolumeData, fetchDashboardRatingAgencyData, fetchDashboardSectorsData, fetchDashboardStatsData, fetchDashboardTablesData } from '../../../features/dashboard/services';


const tabs = ['issuers', 'arrangers', 'trustees', 'registrars', 'rating agency'];

// ─── Helper Functions ────────────────────────────────────────────────────────

const getFinancialYears = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 3 = April)
  let currentYear = now.getFullYear();

  // Financial year in India starts on April 1st.
  // If current month is Jan (0), Feb (1), or March (2), we are in the FY that started last calendar year.
  // Example: Feb 2025 is part of FY 2024-25.
  if (currentMonth < 3) {
    currentYear -= 1;
  }

  const years = [];
  // Generate current FY and 4 previous years (total 5 items)
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, change, color, icon }) {
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

function SectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-2xl drop-shadow-md ${className}`}>
      {children}
    </div>
  );
}

const handleFinancialYearSelection = (financialYear) => {
  console.log("handleFinancialYearSelection called with FY:", financialYear);

  // Extract the first year from the financial year string
  const firstYear = parseInt(financialYear.split('-')[0]);

  // Create start date: April 1st of the first year
  const startDate = new Date(firstYear, 3, 1); // Month is 0-indexed, so 3 = April
  startDate.setHours(0, 0, 0, 0);

  // Create end date: March 31st of the next year
  const endDate = new Date(firstYear + 1, 2, 31); // Month is 0-indexed, so 2 = March
  endDate.setHours(0, 0, 0, 0);

  // Check if end date is in the future
  const now = new Date();
  if (endDate > now) {
    // Use current date and time instead
    endDate.setTime(now.getTime());
  }

  // Format dates as strings
  const formatDateTime = (date) => {
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
  // setSelectedYearsDateRange({ startDate: startDateStr, endDate: endDateStr });

  return { startDate: startDateStr, endDate: endDateStr };
};

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const fyOptions = useMemo(() => getFinancialYears(), []);
  // console.log("fyOptions:", fyOptions);
  const dateRange = useMemo(() => handleFinancialYearSelection(fyOptions[0]?.value || ''), [fyOptions]);


  // Set the default selected year to the first option (Current Financial Year)
  const [selectedFY, setSelectedFY] = useState(fyOptions[0]?.value || '');

  const [activeTab, setActiveTab] = useState('issuers');
  const [barView, setBarView] = useState('ISSUE SIZE');
  const [tableData, setTableData] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [SpecificSectorsData, setSpecificSectorsData] = useState(null);
  const [SpecificAgencyData, setSpecificAgencyData] = useState(null);
  const [monthlyVolumeData, setMonthlyVolumeData] = useState([]);
  const [issueTrendsData, setIssueTrendsData] = useState([]);
  const [valueConvention, setValueConvention] = useState('Crores'); // default


  const [selectedYearsDateRange, setSelectedYearsDateRange] = useState(dateRange || { startDate: '', endDate: '' });

  const sanitizedAgencyData = useMemo(() => {
    if (!SpecificAgencyData) return [];
    return SpecificAgencyData.map(item => ({
      ...item,
      rating_no: parseFloat(item.rating_no) || 0, // Convert string to number
      percentage: parseFloat(item.percentage) || 0
    }));
  }, [SpecificAgencyData]);

  const sanitizedSectorsData = useMemo(() => {
    if (!SpecificSectorsData) return [];
    return SpecificSectorsData.map(item => ({
      ...item,
      issue_size: parseFloat(item.issue_size) || 0,
      no_of_issue: parseFloat(item.no_of_issue) || 0,
    }));
  }, [SpecificSectorsData]);

  const sanitizedIssuersVolumeData = useMemo(() => {
    if (!monthlyVolumeData) return [];
    return monthlyVolumeData?.map(item => ({
      ...item,
      current_year_issue_count: parseFloat(item?.current_year_issue_count) || 0,
      current_year_issue_size: parseFloat(item?.current_year_issue_size) || 0,
      previous_year_issue_count: parseFloat(item?.previous_year_issue_count) || 0,
      previous_year_issue_size: parseFloat(item?.previous_year_issue_size) || 0,
    }));
  }, [monthlyVolumeData]);
  const sanitizedIssuersTrendsData = useMemo(() => {
    if (!issueTrendsData) return [];
    return issueTrendsData?.map(item => ({
      ...item,
      total_issue_size_cr: parseFloat(item?.total_issue_size_cr) || 0,
      total_no_of_issues: parseFloat(item?.total_no_of_issues) || 0,
    }));
  }, [issueTrendsData]);

  const fetchTableData = async (tab) => {
    if (!selectedFY) return;
    try {
      let endpoint = '';

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

      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const data = await fetchDashboardTablesData(query, endpoint);
      console.log(`Fetched ${tab} data:`, data);
      setTableData(data || []);
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error.message);
    }
  };

  const getDashboardStatsData = async () => {
    if (!selectedYearsDateRange) return;

    try {
      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const data = await fetchDashboardStatsData(query);
      if (Array.isArray(data) && data.length > 0) {
        const statsCards = [
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
        setStatsData(null);
        console.log("Stats data is empty or not an array.");
        return null;
      }
    } catch (error) {
      console.error(`Error fetching stats data:`, error.message);
    }
  };

  const getDashboardSectorsData = async (tab) => {
    if (!selectedYearsDateRange) return;

    try {
      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardSectorsData(query);
      console.log("DASHBOARD SECTORS DATA.....", res);

      let currentSectorsData = [];

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
      console.log(`error of :${error.message} `)
    }
  }

  const getDashboardAgencyData = async (tab) => {
    console.log("Fetching agency data with date range:", selectedYearsDateRange);
    if (!selectedYearsDateRange) return;

    try {
      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardRatingAgencyData(query);
      console.log("DASHBOARD AGENCY DATA.....", res);

      let currentAgencyData = [];

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
      console.log(`error of :${error.message} `)
    }
  }

  const getDashboardMonthlyVolumeData = async (tab) => {
    console.log("Fetching monthly volume data with date range:", selectedYearsDateRange);
    if (!selectedYearsDateRange) return;

    try {
      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate
      };

      const res = await fetchDashboardMonthlyVolumeData(query);
      console.log("DASHBOARD MONTHLY VOLUME DATA.....", res);

      setMonthlyVolumeData(res);
      console.log("Current monthly volume Data:", res);

      return res;
    } catch (error) {
      console.log(`error of :${error.message} `)
    }
  }
  const getDashboardIssueTrendsData = async () => {
    if (!selectedYearsDateRange) return;
    try {

      const res = await fetchDashboardIssueVolumeTrendsData();
      console.log("DASHBOARD ISSUE TRENDS DATA.....", res);

      setIssueTrendsData(res);
      console.log("Current issue trends Data:", res);

      return res;
    } catch (error) {
      console.log(`error of :${error.message} `)
    }
  }

  useEffect(() => {
    if (selectedFY) {
      getDashboardIssueTrendsData();
      fetchTableData(activeTab);
      getDashboardStatsData(activeTab);
      getDashboardSectorsData(activeTab);
      getDashboardAgencyData(activeTab);
      getDashboardMonthlyVolumeData(activeTab);
    }
  }, [activeTab, selectedFY]);


  const handleSelectDate = (e) => {
    setSelectedFY(e.target.value);
    const dateRange = handleFinancialYearSelection(e.target.value);
    setSelectedYearsDateRange(dateRange);
  }

  return (
    <div className="space-y-5 px-4 sm:px-0">

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

      {/* ── Stats Row ── */}
      <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2 sm:pb-0">
        {statsData?.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">

        {/* LEFT COLUMN */}
        <div className="space-y-5 order-2 lg:order-1">

          {/* Financial Year Table */}
          <SectionCard className="p-5">
            {/* Dynamic Title based on selected dropdown */}
            <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-4">
              Financial Year: {selectedFY}
            </h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
              <div className="w-full sm:w-auto">
                <label className="text-[9px] text-gray-400 block mb-1">Value Convention</label>
                <select
                  value={valueConvention}
                  onChange={(e) => setValueConvention(e.target.value)}
                  className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] px-1 w-full sm:w-[7rem] py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200"
                >
                  <option value="Crores">Crores</option>
                  <option value="Lakhs">Lakhs</option>
                </select>
              </div>
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4'>
                <div className="w-full sm:w-auto">
                  <label className="text-[9px] text-gray-400 block mb-1">Financial Year</label>
                  <select
                    value={selectedFY}
                    onChange={handleSelectDate}
                    className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] w-full sm:w-[7rem] px-3 py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200"
                  >
                    {fyOptions.map((fy) => (
                      <option className='bg-white dark:bg-[var(--color-surface)]' key={fy.value} value={fy.value}>
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const defaultFY = fyOptions[0]?.value || '';
                    setSelectedFY(defaultFY);
                    setSelectedYearsDateRange(handleFinancialYearSelection(defaultFY));
                    setValueConvention('Crores'); // reset to default
                    setActiveTab('issuers'); // reset to default tab
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
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                    : 'bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left text-gray-400 text-[9px] uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 font-semibold">Issuers</th>
                    <th className="pb-2 font-semibold text-right">No. of Issues</th>
                    <th className="pb-2 font-semibold text-right">Issue Size</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData?.map((row, i) => (
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
                          ? (parseFloat(row?.issueSize || 0) * 100).toLocaleString()
                          : parseFloat(row?.issueSize || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
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
                <XAxis dataKey="years" angle={-30} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area yAxisId="left" type="monotone" dataKey="total_issue_size_cr" stroke="#06B6D4" fill="url(#gradSize)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="total_no_of_issues" stroke="#EC4899" fill="url(#gradIssue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-3">
              <span className="flex items-center gap-1.5 text-[9px] text-gray-500">
                <span className="w-3 h-3 rounded-full bg-[#EC4899]" /> No of issue
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-500">
                <span className="w-3 h-3 rounded-full bg-[#06B6D4]" /> Issue Size
              </span>
            </div>
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
                {['ISSUE SIZE', 'NO. OF ISSUES'].map(v => (
                  <button
                    key={v}
                    onClick={() => setBarView(v)}
                    className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border transition-all ${barView === v
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                      : 'text-gray-400 border-gray-200 dark:border-gray-600'
                      }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
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
                    tickFormatter={(value) =>
                      barView === 'ISSUE SIZE' ? `₹${value}` : value
                    }
                  />

                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(value) =>
                      barView === 'ISSUE SIZE' ? `₹${value}` : value
                    }
                  />

                  {/* Previous Year */}
                  <Bar
                    dataKey={
                      barView === 'ISSUE SIZE'
                        ? 'previous_year_issue_size'
                        : 'previous_year_issue_count'
                    }
                    fill="#7C3AED"
                    radius={[3, 3, 0, 0]}
                  />

                  {/* Current Year */}
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
              <div className="flex justify-center gap-6 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" /> Previous Year (PY)
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Current Year (CY)
                </span>
              </div>
            </div>

            {/* Top 10 Issuers By Sector */}
            <div className="p-5 mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Top 10 Issuers by Sector</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sanitizedSectorsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey={
                      barView === 'ISSUE SIZE'
                        ? 'issue_size'
                        : 'no_of_issue'
                    }
                    nameKey="business_name"
                  >
                    {sanitizedSectorsData?.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(value) =>
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
            </div>

            {/* Credit Rating Agencies */}
            <div className="p-5 mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Credit Rating Agencies</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={sanitizedAgencyData} // Use sanitized data
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="rating_no" // This matches your API key
                  >
                    {sanitizedAgencyData?.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
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
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}