'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import FinanceTable from '../../../components/Financetable';
import DualAxisChart from '../../../components/charts/DualAxisChart';
import { fetchCreditRatingsData, fetchCurrentYearRedemptionData, fetchissuePageTableData, fetchNextYearRedemptionData, fetchOutstandingData, fetchTopSectorsData } from '../../../features/issuers/services';



const formatData = (data) => {
  return data?.map(item => {
    return {
      name: item.name,
      issueSize: Number(item.currentSize) || 0,
      deals: Number(item.currentDeals) || 0,
      mktShare: Number(item.currentMarketShare) || 0,
      rank: Number(item.rank) || 0,
      prevSize: Number(item.previousSize) || 0,
      prevDeals: Number(item.previousDeals) || 0,
      prevMkt: Number(item.previousMarketShare) || 0,
      prevRank: Number(item.previousRank) || 0,
      yoy: item.yoyChange ? Number(item.yoyChange) : 0
    }
  })
}
const formatSectorData = (data) => {
  return data?.map(item => {
    return {
      sector: item.name,
      cy: Number(item.value) || 0,
      py: Number(item.previousValue) || 0
    }
  })
}

const formatOutstandingData = (data) => {
  return data?.map(item => {
    return {
      month: item.month,
      issue: Number(item.issue) || 0,
      outstanding: Number(item.outstanding) || 0,
      redemption: Number(item.redemption) || 0
    }
  })
}
const formatDebtData = (data) => {
  return data?.map(item => {
    return {
      month: item.label,
      noOfIssues: Number(item.isin_count) || 0,
      issueSize: Number(item.issue_size) || 0,
    }
  })
}



function formatMarketShareData(data, issueType) {
  const key = issueType === "size" ? "currentSize" : "currentDeals";

  // Calculate total
  const total = data.reduce((sum, item) => {
    return sum + Number(item[key] || 0);
  }, 0);

  const generateColor = (index, totalItems) => {
    const hue = Math.round((360 / totalItems) * index); // evenly spaced colors
    return `hsl(${hue}, 60%, 50%)`;
  };

  return data.map((item, index) => {
    const value = Number(item[key] || 0);
    const percent = total ? (value / total) * 100 : 0;

    return {
      name:
        item.name.length > 25
          ? item.name.slice(0, 25) + "..."
          : item.name,
      value: Number(percent.toFixed(2)),
      color: generateColor(index, data.length)
    };
  });
}


const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-3 ${className}`}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const getFinancialYears = () => {
  const today = new Date();
  const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();

  return Array.from({ length: 5 }, (_, i) => {
    const start = year - i;
    const end = start + 1;

    return {
      label: `FY ${start}-${String(end).slice(-2)}`,
      value: `${start}-${end}`,
      startYear: start
    };
  });
};

const formatDate = (year, month, day, time = "00:00:00") => {
  const date = new Date(year, month, day);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${time}`;
};

const getFinancialYearRange = (fy) => {
  const startYear = Number(fy.split("-")[0]);
  const endYear = startYear + 1;

  return {
    startDate: formatDate(startYear, 3, 1),
    endDate: formatDate(endYear, 2, 31, "23:59:59")
  };
};

const getDateRange = ({ fy, frequency, period }) => {
  const startYear = Number(fy.split("-")[0]);
  const endYear = startYear + 1;

  if (frequency === "Yearly") {
    return getFinancialYearRange(fy);
  }

  if (frequency === "Half-Yearly") {
    return period === "H1"
      ? {
        startDate: formatDate(startYear, 3, 1),
        endDate: formatDate(startYear, 8, 30, "23:59:59")
      }
      : {
        startDate: formatDate(startYear, 9, 1),
        endDate: formatDate(endYear, 2, 31, "23:59:59")
      };
  }

  if (frequency === "Quarterly") {
    const quarters = {
      Q1: [3, 5],
      Q2: [6, 8],
      Q3: [9, 11],
      Q4: [0, 2]
    };

    const [startMonth, endMonth] = quarters[period];
    const year = period === "Q4" ? endYear : startYear;

    return {
      startDate: formatDate(year, startMonth, 1),
      endDate: formatDate(year, endMonth + 1, 0, "23:59:59")
    };
  }

  if (frequency === "Monthly" && period !== null) {
    const monthIndex = Number(period);
    const year = monthIndex <= 2 ? endYear : startYear;

    return {
      startDate: formatDate(year, monthIndex, 1),
      endDate: formatDate(year, monthIndex + 1, 0, "23:59:59")
    };
  }

  return null;
};

const creditRatingAgencyOptions = [
  { label: 'All', id: '0' },
  { label: 'INDIA RATING', id: '1' },
  { label: 'CRISIL', id: '2' },
  { label: 'ICRA', id: '3' },
  { label: 'Acuite Ratings', id: '4' },
  { label: 'CARE', id: '5' },
  { label: 'BRICKWORK RATINGS', id: '6' },
  { label: 'Infomerics Valuation and Rating', id: '7' }
];


export default function IssuerSummary() {
  const fyOptions = useMemo(() => getFinancialYears(), []);

  const [selectedFY, setSelectedFY] = useState(fyOptions[0]?.value);
  const [frequency, setFrequency] = useState("Yearly");
  const [period, setPeriod] = useState(null);
  const [issueType, setIssueType] = useState('size');

  const [valueConvention, setValueConvention] = useState('Crores');
  const [creditRatingAgency, setCreditRatingAgency] = useState(0);
  const [issueTableData, setIssueTableData] = useState([]);
  const [topSectorsData, setTopSectorsData] = useState([]);
  const [outstandingData, setOutstandingData] = useState([]);
  const [marketShareData, setMarketShareData] = useState([]);
  const [debtScheduleCurrentData, setDebtScheduleCurrentData] = useState([]);
  const [debtScheduleNextData, setDebtScheduleNextData] = useState([]);
  const [ratingData, setRatingData] = useState([]);

  const selectedYearsDateRange = useMemo(() => {
    return getDateRange({
      fy: selectedFY,
      frequency,
      period
    });
  }, [selectedFY, frequency, period]);


  const handleFYChange = (e) => {
    setSelectedFY(e.target.value);
  };

  const handleFrequencyChange = (e) => {
    const value = e.target.value;

    setFrequency(value);

    if (value === "Half-Yearly") setPeriod("H1");
    else if (value === "Quarterly") setPeriod("Q1");
    else if (value === "Monthly") setPeriod(3);
    else setPeriod(null);
  };

  const handleReset = () => {
    setSelectedFY(fyOptions[0]?.value);
    setFrequency("Yearly");
    setPeriod(null);
    setValueConvention('Crores');
  };

  const formatRatingsData = (data) => {
    const generateColor = (index, totalItems) => {
      const hue = Math.round((360 / totalItems) * index); // evenly spaced colors
      return `hsl(${hue}, 60%, 50%)`;
    };

    return data?.map((item, index) => {
      return {
        name: creditRatingAgency > 0 ? item.name : item.label,
        value: Number(item.rating_no) || 0,
        color: generateColor(index, data.length)
      }
    })
  }


  useEffect(() => {

    if (!selectedYearsDateRange) return;

    const fetchData = async () => {

      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate,
        issueType
      };

      try {

        console.log("Fetching top sectors data with date range:", selectedYearsDateRange);

        const table = await fetchissuePageTableData(query);
        const sectors = await fetchTopSectorsData(query);
        const outstandings = await fetchOutstandingData(query);
        const marketShare = await formatMarketShareData(table, issueType);
        const currentRedemptions = await fetchCurrentYearRedemptionData();
        const nextRedemptions = await fetchNextYearRedemptionData();


        setIssueTableData(formatData(table));
        setTopSectorsData(formatSectorData(sectors));
        setOutstandingData(formatOutstandingData(outstandings));
        setMarketShareData(marketShare);
        setDebtScheduleCurrentData(formatDebtData(currentRedemptions));
        setDebtScheduleNextData(formatDebtData(nextRedemptions));

      } catch (err) {
        console.error("API Error:", err);
      }

    };

    fetchData();

  }, [selectedYearsDateRange, issueType]);


  useEffect(() => {

    if (!selectedYearsDateRange) return;

    const fetchData = async () => {

      const query = {
        startDate: selectedYearsDateRange.startDate,
        endDate: selectedYearsDateRange.endDate,
        id: Number(creditRatingAgency) || 0
      };

      try {

        console.log("Fetching agencies data with date range:", selectedYearsDateRange);
        const Ratings = await fetchCreditRatingsData(query);

        setRatingData(formatRatingsData(Ratings));

        console.log("Ratings data:", Ratings);

      } catch (err) {
        console.error("API Error:", err);
      }

    };

    fetchData();

  }, [selectedYearsDateRange, creditRatingAgency]);



  const selectClass =
    'text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer';

  return (
    <div className="min-h-full space-y-4 font-sans text-gray-800 dark:text-gray-100">

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issuer Summary</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 mt-1">Issuer &gt; Summary</p>
      </div>

      {/* ── Financial Year Filter ── */}
      <SectionCard>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100">Financial Year: {selectedFY}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="w-full sm:w-auto">
              <label className="text-[9px] text-gray-400 block mb-1">Financial Year</label>
              <select
                value={selectedFY}
                onChange={handleFYChange}
                className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] w-full sm:w-[7rem] px-3 py-1.5 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-200"
              >
                {fyOptions.map((fy) => (
                  <option className='bg-white dark:bg-[var(--color-surface)]' key={fy.value} value={fy.value}>
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Frequency */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500">Frequency</label>
              <select
                value={frequency}
                onChange={handleFrequencyChange}
                className="border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 text-xs md:text-[9px] text-gray-700 dark:text-gray-200 dark:bg-slate-700 outline-none cursor-pointer w-full sm:min-w-[110px]"
              >
                <option className="dark:bg-slate-700 dark:text-gray-200">Yearly</option>
                <option className="dark:bg-slate-700 dark:text-gray-200">Half-Yearly</option>
                <option className="dark:bg-slate-700 dark:text-gray-200">Quarterly</option>
                <option className="dark:bg-slate-700 dark:text-gray-200">Monthly</option>
              </select>
            </div>

            {/* Dynamic Period Selector */}
            {frequency === "Half-Yearly" && (
              <div className="flex gap-2 mt-2">
                {["H1", "H2"].map((h) => (
                  <button
                    key={h}
                    onClick={() => setPeriod(h)}
                    className={`px-3 py-1 rounded-full text-xs ${period === h
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                      }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}

            {frequency === "Quarterly" && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setPeriod(q)}
                    className={`px-3 py-1 rounded-full text-xs ${period === q
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                      }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {frequency === "Monthly" && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-xs md:text-[9px] text-gray-400 dark:text-gray-500">Months</label>

                <select
                  value={period ?? ""}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="border border-gray-200 dark:border-slate-600 rounded-[12px] px-3 h-10 md:h-6 text-xs md:text-[9px] text-gray-700 dark:text-gray-200 dark:bg-slate-700 outline-none cursor-pointer w-full sm:min-w-[110px]"
                >
                  <option value="">Select Month</option>
                  {[
                    "April", "May", "June", "July", "August", "September",
                    "October", "November", "December", "January", "February", "March"
                  ].map((month, index) => {
                    const actualIndex = index + 3 > 11 ? index - 9 : index + 3;
                    return (
                      <option key={month} value={actualIndex}>
                        {month}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-transparent">.</label>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-[12px] px-5 h-10 md:h-6 text-xs md:text-[9px] transition-colors duration-150 cursor-pointer w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4 md:w-3.5 md:h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Top 10 Issuers Table ── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Top 10 Issuers by {issueType == 'size' ? 'Issue size' : 'No of Issues'} (Rupees in Crores)</h2>
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
        </div>

        {/* Tab Toggle */}
        <div className='flex flex-row justify-center items-center'>
          <div className="flex flex-row justify-center mb-4 rounded-full border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800 p-0.5 w-fit">
            <button
              onClick={() => setIssueType('size')}
              className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${issueType === 'size' ? 'bg-[#5b21b6] text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              ISSUE SIZE
            </button>
            <button
              onClick={() => setIssueType('count')}
              className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${issueType === 'count' ? 'bg-[#5b21b6] text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              NO. OF ISSUES
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <FinanceTable data={issueTableData} selectedFY={selectedFY} valueConvention={valueConvention} />
        </div>
      </SectionCard>

      {/* ── Sector + Market Share Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Top 10 Business Sectors */}
        <SectionCard>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Top 10 Business Sectors by Issue Size</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={topSectorsData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
              <defs>
                <linearGradient id="cyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fill: '#9ca3af' }} interval={0} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cy" name={issueType === 'count' ? 'CY Issue Count' : 'CY Issue Size'} stroke="#7c3aed" strokeWidth={2} fill="url(#cyGrad)" dot={{ r: 3, fill: '#7c3aed' }} />
              <Area type="monotone" dataKey="py" name={issueType === 'count' ? 'PY Issue Count' : 'PY Issue Size'} stroke="#ec4899" strokeWidth={2} fill="url(#pyGrad)" dot={{ r: 3, fill: '#ec4899' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block"></span>CY Issue Size</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#ec4899] inline-block"></span>PY Issue Size</span>
          </div>
        </SectionCard>

        {/* Market Share Pie */}
        <SectionCard>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Market Share Among Top 10 Issuers<br /><span className="font-normal text-gray-500 dark:text-gray-400">(By Size)</span></h2>
          <div className="flex flex-col items-center gap-4">
            <div style={{ flex: '0 0 180px' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={marketShareData} cx="50%" cy="50%" innerRadius={35} outerRadius={85} dataKey="value" startAngle={90} endAngle={-270}>
                    {marketShareData?.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ fontSize: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {marketShareData?.map((d, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="text-[9px] text-gray-600 dark:text-gray-400 leading-tight">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Corporate Bond Trend ── */}
      <SectionCard>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Corporate Bond Outstanding Trends Analysis : {selectedFY}</h2>
        <DualAxisChart data={outstandingData} />
      </SectionCard>

      {/* ── Debt Redemption Schedules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current FY */}
        <SectionCard>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Debt Redemption Schedule - Current Financial Year</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Note: Click or any bar in the graph to view the redemption list for that particular period.</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={debtScheduleCurrentData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />

              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} />

              {/* Left Axis */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
              />

              {/* Right Axis */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                yAxisId="left"
                dataKey="noOfIssues"
                name="No. of Issues"
                fill="#7c3aed"
                radius={[2, 2, 0, 0]}
              />

              <Bar
                yAxisId="right"
                dataKey="issueSize"
                name="Issue Size"
                fill="#a5b4fc"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block"></span>No. of Issues</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#a5b4fc] inline-block"></span>Issue Size</span>
          </div>
        </SectionCard>

        {/* Next FY */}
        <SectionCard>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Debt Redemption Schedule - Next Financial Year</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Note: Click or any bar in the graph to view the redemption list for that particular period.</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={debtScheduleNextData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />

              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} />

              {/* Left Axis */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
              />

              {/* Right Axis */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                yAxisId="left"
                dataKey="noOfIssues"
                name="No. of Issues"
                fill="#7c3aed"
                radius={[2, 2, 0, 0]}
              />

              <Bar
                yAxisId="right"
                dataKey="issueSize"
                name="Issue Size"
                fill="#a5b4fc"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block"></span>No. of Issues</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-[#a5b4fc] inline-block"></span>Issue Size</span>
          </div>
        </SectionCard>
      </div>

      {/* ── Credit Ratings ── */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Credit Ratings</h2>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-gray-500 dark:text-gray-400">Credit Rating Agency</label>
            <select value={creditRatingAgency} onChange={e => { setCreditRatingAgency(e.target.value); console.log(e.target.value) }} className={selectClass}>
              {creditRatingAgencyOptions?.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 flex-wrap">
          <div className="relative">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie data={ratingData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} dataKey="value" startAngle={90} endAngle={-270}>
                  {ratingData?.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ fontSize: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {ratingData?.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                <span className="text-[10px] text-gray-600 dark:text-gray-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

    </div>
  );
}