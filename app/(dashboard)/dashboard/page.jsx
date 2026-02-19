'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { LineChart } from '../../../components/charts/LineChart';
import { AreaChart } from '../../../components/charts/AreaChart';
import { BarChart } from '../../../components/charts/BarChart';
import { RadarChart } from '../../../components/charts/RadarChart';
import { DoughnutChart } from '../../../components/charts/DoughnutChart';
import { StatCard, MiniChart } from '../../../components/charts/StatCard';
import {
  lineChartData,
  areaChartData,
  barChartData,
  radarChartData,
  doughnutChartData,
  horizontalBarData,
  miniChartData,
  statsData,
  walletData,
  percentileData,
  circularStats,
} from '../../../lib/data';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Activity,
  Target
} from 'lucide-react';

// Stat Card Component
function DashboardStatCard({ title, value, change, trend, icon: Icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-[var(--color-foreground)] mt-2 tracking-tight">
              {value}
            </h3>
            <div className={cn(
              'inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-lg text-sm font-semibold',
              trend === 'up' 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}>
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {change}
            </div>
          </div>
          <div className={cn(
            'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            colorClasses[color]
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { cn } from '../../../lib/utils';

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your finances today.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200">
          <Plus className="w-5 h-5" />
          Add Widget
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Total Revenue"
          value="$48,250"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="blue"
        />
        <DashboardStatCard
          title="Active Users"
          value="2,420"
          change="+8.2%"
          trend="up"
          icon={Users}
          color="green"
        />
        <DashboardStatCard
          title="Conversion Rate"
          value="3.24%"
          change="-2.1%"
          trend="down"
          icon={Target}
          color="purple"
        />
        <DashboardStatCard
          title="Avg. Order Value"
          value="$85.40"
          change="+5.7%"
          trend="up"
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader 
            title="Revenue Overview" 
            subtitle="Track your revenue growth over time"
            action={
              <button className="p-2 hover:bg-[var(--color-accent)] rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-[var(--color-muted)]" />
              </button>
            }
          />
          <CardContent>
            <LineChart data={lineChartData} height={280} />
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card>
          <CardHeader 
            title="Performance" 
            subtitle="Last 3 months"
          />
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-32">
                <DoughnutChart
                  data={doughnutChartData}
                  height={120}
                  showCenterText
                  centerText="82%"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-[var(--color-muted)]">Completed</span>
                </div>
                <span className="text-sm font-semibold text-[var(--color-foreground)]">82%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm text-[var(--color-muted)]">Remaining</span>
                </div>
                <span className="text-sm font-semibold text-[var(--color-foreground)]">18%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <Card>
          <CardHeader 
            title="Live Information" 
            subtitle="Income vs Expense"
          />
          <CardContent>
            <AreaChart data={areaChartData} height={220} />
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-sm text-[var(--color-muted)]">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-sm text-[var(--color-muted)]">Expense</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader 
            title="Spread Analysis" 
            subtitle="Multi-metric comparison"
          />
          <CardContent>
            <RadarChart data={radarChartData} height={240} />
          </CardContent>
        </Card>

        {/* Percentile Stats */}
        <Card>
          <CardHeader 
            title="Percentile Metrics" 
            subtitle="Key performance indicators"
          />
          <CardContent className="space-y-5">
            {percentileData.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    Metric {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-foreground)]">
                    {item.value}%
                  </span>
                </div>
                <div className="h-2.5 bg-[var(--color-accent)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${item.value}%`, 
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Circular Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
              {circularStats.map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-[var(--color-accent)]">
                  <div className="relative w-14 h-14 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke={stat.color}
                        strokeWidth="4"
                        strokeDasharray={`${stat.value * 1.51} 151`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--color-foreground)]">
                        {stat.value}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Balance</p>
                <h3 className="text-2xl font-bold">
                  ${walletData.total.toLocaleString()}
                </h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-200" />
                  <span className="text-sm text-white/80">Income</span>
                </div>
                <span className="font-semibold">
                  ${walletData.income.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-200" />
                  <span className="text-sm text-white/80">Losses</span>
                </div>
                <span className="font-semibold">
                  ${walletData.losses.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader 
            title="Monthly Distribution" 
            subtitle="Revenue breakdown by category"
          />
          <CardContent>
            <BarChart data={barChartData} height={200} />
            <div className="flex items-center justify-center gap-6 mt-4">
              {[
                { label: 'Series A', color: '#3b82f6' },
                { label: 'Series B', color: '#06b6d4' },
                { label: 'Series C', color: '#8b5cf6' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[var(--color-muted)]">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
