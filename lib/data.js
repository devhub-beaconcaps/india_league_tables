// Dashboard Chart Data

export const lineChartData = {
  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [
    {
      label: 'Revenue',
      data: [65, 78, 90, 81, 86, 95, 100],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

export const areaChartData = {
  labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  datasets: [
    {
      label: 'Income',
      data: [45, 55, 48, 62, 58, 70, 65, 75, 68, 80, 72, 85],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.3)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Expense',
      data: [30, 35, 32, 40, 38, 45, 42, 48, 44, 52, 48, 55],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
      fill: true,
      tension: 0.4,
    },
  ],
};

export const barChartData = {
  labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  datasets: [
    {
      label: 'Series A',
      data: [45, 52, 38, 65, 48, 72, 58, 68, 55, 75, 62, 80],
      backgroundColor: '#3b82f6',
    },
    {
      label: 'Series B',
      data: [35, 42, 28, 55, 38, 62, 48, 58, 45, 65, 52, 70],
      backgroundColor: '#06b6d4',
    },
    {
      label: 'Series C',
      data: [25, 32, 18, 45, 28, 52, 38, 48, 35, 55, 42, 60],
      backgroundColor: '#8b5cf6',
    },
  ],
};

export const radarChartData = {
  labels: ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5', 'Metric 6'],
  datasets: [
    {
      label: 'Dataset A',
      data: [80, 90, 70, 85, 75, 95],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      label: 'Dataset B',
      data: [70, 80, 85, 75, 90, 80],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      label: 'Dataset C',
      data: [60, 70, 75, 80, 85, 70],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
    },
  ],
};

export const doughnutChartData = {
  labels: ['Completed', 'Remaining'],
  datasets: [
    {
      data: [82, 18],
      backgroundColor: ['#3b82f6', '#e2e8f0'],
      borderWidth: 0,
    },
  ],
};

export const horizontalBarData = {
  labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'],
  datasets: [
    {
      label: 'Progress',
      data: [85, 72, 68, 90, 75, 82],
      backgroundColor: '#06b6d4',
    },
  ],
};

export const miniChartData = {
  labels: ['1', '2', '3', '4', '5', '6', '7'],
  datasets: [
    {
      data: [30, 45, 35, 50, 40, 55, 45],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

// Stats Data
export const statsData = [
  { label: 'Total Revenue', value: 642, change: '+12%', trend: 'up' },
  { label: 'Active Users', value: 847, change: '+5%', trend: 'up' },
  { label: 'New Signups', value: 351, change: '-2%', trend: 'down' },
  { label: 'Conversion', value: 642, change: '+8%', trend: 'up' },
];

export const walletData = {
  total: 6543210123,
  income: 3987654321,
  losses: 2321345789,
};

export const percentileData = [
  { label: 'Metric A', value: 38, color: '#3b82f6' },
  { label: 'Metric B', value: 76, color: '#06b6d4' },
  { label: 'Metric C', value: 47, color: '#10b981' },
];

export const circularStats = [
  { label: 'Stat 1', value: 46, color: '#10b981' },
  { label: 'Stat 2', value: 37, color: '#ef4444' },
  { label: 'Stat 3', value: 61, color: '#06b6d4' },
  { label: 'Stat 4', value: 42, color: '#3b82f6' },
];

// Table Data
export const issuersData = [
  { id: 1, name: 'Global Finance Corp', type: 'Corporate', country: 'USA', totalIssuances: 45, status: 'Active' },
  { id: 2, name: 'Euro Investments Ltd', type: 'Corporate', country: 'UK', totalIssuances: 32, status: 'Active' },
  { id: 3, name: 'Asia Pacific Holdings', type: 'Sovereign', country: 'Singapore', totalIssuances: 28, status: 'Active' },
  { id: 4, name: 'Middle East Finance', type: 'Corporate', country: 'UAE', totalIssuances: 19, status: 'Pending' },
  { id: 5, name: 'Latin America Group', type: 'Municipal', country: 'Brazil', totalIssuances: 15, status: 'Active' },
  { id: 6, name: 'African Development Bank', type: 'Sovereign', country: 'South Africa', totalIssuances: 22, status: 'Active' },
  { id: 7, name: 'Nordic Investment Co', type: 'Corporate', country: 'Sweden', totalIssuances: 18, status: 'Active' },
  { id: 8, name: 'Pacific Rim Ventures', type: 'Corporate', country: 'Australia', totalIssuances: 25, status: 'Pending' },
];

export const arrangersData = [
  { id: 1, name: 'Goldman Sachs', dealsArranged: 156, volume: 45000000000, rating: 'AAA' },
  { id: 2, name: 'Morgan Stanley', dealsArranged: 142, volume: 38000000000, rating: 'AAA' },
  { id: 3, name: 'JP Morgan', dealsArranged: 189, volume: 52000000000, rating: 'AAA' },
  { id: 4, name: 'Bank of America', dealsArranged: 128, volume: 31000000000, rating: 'AA+' },
  { id: 5, name: 'Citigroup', dealsArranged: 115, volume: 28000000000, rating: 'AA+' },
  { id: 6, name: 'Barclays', dealsArranged: 98, volume: 24000000000, rating: 'AA' },
  { id: 7, name: 'Deutsche Bank', dealsArranged: 87, volume: 21000000000, rating: 'AA' },
  { id: 8, name: 'Credit Suisse', dealsArranged: 76, volume: 18000000000, rating: 'AA-' },
];

export const trusteesData = [
  { id: 1, name: 'BNY Mellon', assetsUnderTrust: 89000000000, clients: 450, status: 'Active' },
  { id: 2, name: 'State Street', assetsUnderTrust: 72000000000, clients: 380, status: 'Active' },
  { id: 3, name: 'Northern Trust', assetsUnderTrust: 65000000000, clients: 320, status: 'Active' },
  { id: 4, name: 'Citi Trust', assetsUnderTrust: 54000000000, clients: 280, status: 'Active' },
  { id: 5, name: 'HSBC Trustee', assetsUnderTrust: 48000000000, clients: 250, status: 'Active' },
  { id: 6, name: 'Deutsche Trustee', assetsUnderTrust: 42000000000, clients: 210, status: 'Pending' },
  { id: 7, name: 'MUFG Trustee', assetsUnderTrust: 38000000000, clients: 190, status: 'Active' },
  { id: 8, name: 'Standard Chartered', assetsUnderTrust: 32000000000, clients: 160, status: 'Active' },
];

export const registrarsData = [
  { id: 1, name: 'Computershare', registeredEntities: 12500, region: 'Global', status: 'Active' },
  { id: 2, name: 'Equiniti', registeredEntities: 8900, region: 'Europe', status: 'Active' },
  { id: 3, name: 'Broadridge', registeredEntities: 15200, region: 'Americas', status: 'Active' },
  { id: 4, name: 'Link Group', registeredEntities: 6700, region: 'APAC', status: 'Active' },
  { id: 5, name: 'TSR Services', registeredEntities: 5400, region: 'Europe', status: 'Active' },
  { id: 6, name: 'Karvy', registeredEntities: 7800, region: 'APAC', status: 'Pending' },
  { id: 7, name: 'Catalist', registeredEntities: 4200, region: 'Americas', status: 'Active' },
  { id: 8, name: 'Boardroom', registeredEntities: 3600, region: 'APAC', status: 'Active' },
];

export const agenciesData = [
  { id: 1, name: 'Moody\'s', type: 'Credit Rating', ratingScale: 'Aaa-C', coverage: 'Global' },
  { id: 2, name: 'S&P Global', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'Global' },
  { id: 3, name: 'Fitch Ratings', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'Global' },
  { id: 4, name: 'DBRS Morningstar', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'North America/Europe' },
  { id: 5, name: 'Kroll Bond Rating', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'North America' },
  { id: 6, name: 'AM Best', type: 'Insurance Rating', ratingScale: 'A++-D', coverage: 'Global' },
  { id: 7, name: 'Scope Ratings', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'Europe' },
  { id: 8, name: 'JCR', type: 'Credit Rating', ratingScale: 'AAA-D', coverage: 'Japan' },
];
