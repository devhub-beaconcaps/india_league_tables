'use client';

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const statsCards = [
  { label: 'Total Volume', value: '₹955,950Cr', change: '+8%', color: '#7C3AED', icon: '📊' },
  { label: 'Total Issues', value: '5337', change: '+5%', color: '#7C3AED', icon: '📋' },
  { label: 'Avg Issue Size', value: '₹955,950Cr', change: '+8%', color: '#EC4899', icon: '📈' },
  { label: 'Total Volume', value: '₹955,950Cr', change: '+8%', color: '#06B6D4', icon: '💰' },
  { label: 'Total Volume', value: '₹955,950Cr', change: '+8%', color: '#F97316', icon: '🏦' },
  { label: 'Total Volume', value: '₹955,950Cr', change: '+8%', color: '#10B981', icon: '📦' },
];

const issuerData = [
  { name: 'BAJAJ FINANCE LIMITED', issues: 41, size: '₹87,210.00CR.' },
  { name: 'JIO DIGITAL FIBRE PRIVATE LIMITED', issues: 24, size: '₹67,000.00CR.' },
  { name: 'L&T FINANCE LIMITED', issues: 136, size: '₹55,269.00CR.', active: true },
  { name: 'SMALL INDUSTRIES DEVELOPMENT BANK OF INDIA', issues: 25, size: '₹27,526.00CR.' },
  { name: 'STATE BANK OF INDIA', issues: 26, size: '₹27,276.00CR.' },
  { name: 'HDFC BANK LIMITED', issues: 61, size: '₹23,819.00CR.' },
  { name: 'PORTEAST INVESTMENT PRIVATE LIMITED', issues: 17, size: '₹22,568.00CR.' },
  { name: 'INDIAN RAILWAY FINANCE CORPORATION LIMITED', issues: 17, size: '₹22,568.00CR.' },
  { name: 'NATIONAL BANK FOR AGRICULTURE AND RURAL DEVELOPMENT', issues: 17, size: '₹22,568.00CR.' },
  { name: 'HOUSING DEVELOPMENT FINANCE CORPORATION LTD', issues: 17, size: '₹22,568.00CR.' },
];

const volumeTrendData = [
  { year: '1988-89', issueSize: 2199680, noOfIssue: 400 },
  { year: '1989-90', issueSize: 2399680, noOfIssue: 800 },
  { year: '1990-91', issueSize: 2799680, noOfIssue: 1200 },
  { year: '1991-92', issueSize: 2599680, noOfIssue: 1600 },
  { year: '1993-94', issueSize: 2999680, noOfIssue: 2400 },
  { year: '1995-96', issueSize: 3199680, noOfIssue: 5600 },
];

const barData = [
  { month: 'April', py: 700, cy: 900 },
  { month: 'May', py: 600, cy: 1000 },
  { month: 'June', py: 500, cy: 750 },
  { month: 'July', py: 800, cy: 1050 },
  { month: 'August', py: 650, cy: 900 },
  { month: 'September', py: 550, cy: 750 },
  { month: 'October', py: 700, cy: 600 },
];

const sectorPieData = [
  { name: 'India Rating', value: 22.5, color: '#EC4899' },
  { name: 'CRISIL', value: 17.5, color: '#F59E0B' },
  { name: 'ACUITE RATINGS', value: 30, color: '#06B6D4' },
  { name: 'BRICKWORK RATINGS', value: 30, color: '#7C3AED' },
];

const creditPieData = [
  { name: 'India Rating', value: 25, color: '#3B82F6' },
  { name: 'CRISIL', value: 25, color: '#06B6D4' },
  { name: 'ACUITE RATINGS', value: 25, color: '#7C3AED' },
  { name: 'BRICKWORK RATINGS', value: 25, color: '#F59E0B' },
];

const tabs = ['ISSUERS', 'ARRANGERS', 'TRUSTEES', 'REGISTRARS', 'RATING AGENCIES'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, change, color, icon }) {
  return (
    <div
      className="bg-white dark:bg-[var(--color-surface)] border-l-4 rounded-2xl px-4 py-2 flex items-start gap-3 flex-1 min-w-0 drop-shadow-md"
      style={{ borderLeftColor: color }}
    >
      {/* Added border-solid to ensure it renders correctly on all elements */}

      <div className="min-w-0">
        <div
          className="w-6 h-6 mb-2 rounded-full flex items-center justify-center text-white text-sm shrink-0"
          style={{ background: color }}
        >
          {/* Using the icon prop instead of hardcoded SVG */}
          <span>{icon}</span>
        </div>
        <p className="text-[9px] mb-1 text-gray-400 dark:text-gray-500 font-medium truncate">{label}</p>
        <p className="text-[14px] font-bold text-gray-800 dark:text-white leading-tight mt-0.5">{value}</p>
        <p className="text-[9px] text-green-500 font-medium mt-0.5">{change}</p>
      </div>
    </div>
  );
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[var(--color-surface)] rounded-2xl drop-shadow-md ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('ISSUERS');
  const [barView, setBarView] = useState('ISSUE SIZE');

  return (
    <div className="space-y-5">

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

      {/* ── Stats Row ── */}
      <div className="flex gap-3">
        {statsCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-[1fr_400px] gap-5">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* Financial Year Table */}
          <SectionCard className="p-5">
            <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-4">
              Financial Year: 2015-2016
            </h2>

            {/* Filters */}
            <div className="flex justify-between gap-3 mb-4">
              <div>
                <label className="text-[9px] text-gray-400 block mb-1">Value Convention</label>
                <select className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] px-1 w-[7rem] py-1.5 bg-white dark:bg-[var(--color-surface)] text-gray-700 dark:text-gray-200">
                  <option>Crores</option>
                </select>
              </div>
              <div className='flex items-center gap-3 mb-4'>
                <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Financial Year</label>
                  <select className="text-[9px] border border-gray-200 dark:border-gray-600 rounded-[12px] w-[7rem] px-3 py-1.5 bg-white dark:bg-[var(--color-surface)] text-gray-700 dark:text-gray-200">
                    <option>FY2024-25</option>
                  </select>
                </div>
                <button className="mt-4 flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-medium px-4 py-1.5 rounded-[12px] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-[9px] uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-semibold">Issuers</th>
                  <th className="pb-2 font-semibold text-right">No. of Issues</th>
                  <th className="pb-2 font-semibold text-right">Issue Size</th>
                </tr>
              </thead>
              <tbody>
                {issuerData.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 text-[9px] dark:border-gray-700/50 last:border-0 ${row.active
                      ? 'bg-[#7C3AED] text-white rounded-lg'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                      }`}
                  >
                    <td className={`py-2.5 px-2 font-medium rounded-l-lg ${row.active ? 'text-white' : 'text-[#7C3AED]'}`}>
                      {row.name}
                    </td>
                    <td className={`py-2.5 text-right  ${row.active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {row.issues}
                    </td>
                    <td className={`py-2.5 text-right pr-2 rounded-r-lg ${row.active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {row.size}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          {/* Issue Volume Trends */}
          <SectionCard className="p-5">
            <h2 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Issue Volume Trends</h2>
            <div className="flex justify-between text-[9px] text-gray-400 mb-2">
              <span>Issue Size</span>
              <span>No of Issue</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={volumeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                <XAxis dataKey="year" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area yAxisId="left" type="monotone" dataKey="issueSize" stroke="#06B6D4" fill="url(#gradSize)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="noOfIssue" stroke="#EC4899" fill="url(#gradIssue)" strokeWidth={2} />
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
        <div className="space-y-5">
          <SectionCard className='p-5'>
            {/* L&T Finance Card */}
            <div className="py-2 px-1 mb-2">
              <div className='flex gap-4'>
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  L&T
                </div>
                <div className="flex flex-col items-start mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Issuers</p>
                  <p className="font-bold text-gray-800 dark:text-white text-[14px] leading-tight mb-4" >L&T FINANCE LIMITED</p>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[15px] font-bold text-[#7C3AED]">136</p>
                      <p className="text-[10px] text-gray-400  uppercase">No. of Issues</p>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[#7C3AED]">₹55,269.00CR.</p>
                      <p className="text-[10px] text-gray-400  uppercase">Issue Size</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Top 10 Issuer Volume Bar Chart */}
            <div className="p-5 mb-6 border-1 border-gray-200 dark:border-gray-700 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase">Top 10 Issuer Volume (Crores)</h3>
              </div>
              <div className="flex gap-2 justify-end mb-3">
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
                <BarChart data={barData} barSize={10} barGap={2}>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="py" fill="#7C3AED" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cy" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" /> Previous Year (PY)
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Current Year (PY)
                </span>
              </div>
            </div>

            {/* Top 10 Issuers By Sector */}
            <div className="p-5 mb-6 border-1 border-gray-200 dark:border-gray-700 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Top 10 Issuers by Sector</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sectorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sectorPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                {sectorPieData.map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Credit Rating Agencies */}
            <div className="p-5 mb-6 border-1 border-gray-200 dark:border-gray-700 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-3">Credit Rating Agencies</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={creditPieData}
                    cx="50%"
                    cy="50%"
                    // innerRadius={45} <-- Removed this line
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {creditPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                {creditPieData.map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    {item.name}
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