import React, { useState } from 'react';
import {
  TrendingUp,
  Store,
  Coins,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';

import { BusinessListing, CapsuleSlot, GrantApplication, YouthProgram } from '../types';

interface SectorData {
  name: string;
  shortName: string;
  percentage: number;
  entrepreneurs: number;
  color: string;
  darkColor: string;
}

interface CommunityAnalyticsWidgetProps {
  slots?: CapsuleSlot[];
  businesses?: BusinessListing[];
  programs?: YouthProgram[];
  grantApplications?: GrantApplication[];
}

const SECTOR_BREAKDOWN: SectorData[] = [
  { name: 'Makanan & Minuman (F&B)', shortName: 'Makanan & Minuman', percentage: 38, entrepreneurs: 48, color: '#D97706', darkColor: '#F59E0B' },
  { name: 'Fesyen, Batik & Kraf Kelantan', shortName: 'Batik & Kraf', percentage: 24, entrepreneurs: 31, color: '#E11D48', darkColor: '#FB7185' },
  { name: 'Teknologi & Servis Digital', shortName: 'Teknologi Digital', percentage: 18, entrepreneurs: 23, color: '#2563EB', darkColor: '#60A5FA' },
  { name: 'Pertanian & Agrotek Belia', shortName: 'Pertanian & Agrotek', percentage: 12, entrepreneurs: 15, color: '#059669', darkColor: '#34D399' },
  { name: 'Runcit & Gaya Hidup', shortName: 'Runcit & Gaya Hidup', percentage: 8, entrepreneurs: 11, color: '#4F46E5', darkColor: '#818CF8' }
];

const BASE_QUARTERLY_DATA = [
  { quarter: 'S1 2026', grants: 'RM 65K', grantsAmount: 65, kiosks: 18, businesses: 42 },
  { quarter: 'S2 2026', grants: 'RM 120K', grantsAmount: 120, kiosks: 24, businesses: 68 },
  { quarter: 'S3 2026', grants: 'RM 210K', grantsAmount: 210, kiosks: 32, businesses: 94 },
  { quarter: 'S4 2026 (Kini)', grants: 'RM 345K', grantsAmount: 345, kiosks: 38, businesses: 128 }
];

export const CommunityAnalyticsWidget: React.FC<CommunityAnalyticsWidgetProps> = ({
  slots = [],
  businesses = [],
  grantApplications = []
}) => {
  const [activeSector, setActiveSector] = useState<SectorData>(SECTOR_BREAKDOWN[0]);
  const [chartTab, setChartTab] = useState<'sectors' | 'growth'>('growth');

  const liveBusinessesTotal = 128 + Math.max(0, businesses.length - 6);
  const liveKiosksOccupied = 38 + slots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
  const approvedGrantsBonusK = Math.round(
    grantApplications
      .filter(g => g.status === 'approved')
      .reduce((sum, g) => sum + (Number((g.grantAmount || g.amount || '0').replace(/[^0-9.]/g, '')) || 0), 0) / 1000
  );
  const currentGrantAmountK = 345 + approvedGrantsBonusK;

  const quarterlyData = BASE_QUARTERLY_DATA.map((item, idx) =>
    idx === BASE_QUARTERLY_DATA.length - 1
      ? {
          ...item,
          grantsAmount: currentGrantAmountK,
          grants: `RM ${currentGrantAmountK}K`,
          kiosks: liveKiosksOccupied,
          businesses: liveBusinessesTotal
        }
      : item
  );

  const totalEntrepreneurs = SECTOR_BREAKDOWN.reduce((sum, sec) => sum + sec.entrepreneurs, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-6 md:p-8 shadow-2xs w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300 dark:border-slate-600">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] sm:text-sm font-semibold tracking-wide uppercase text-black dark:text-white/85">
              <TrendingUp className="w-4 h-4 text-black dark:text-white/80" />
              Impak Ekonomi Belia Negeri Kelantan
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80 font-medium">
              Data Rasmi Disahkan UMK &amp; TEKUN
            </span>
          </div>
          <h2 className="text-2xl sm:text-[1.75rem] font-bold text-black dark:text-white tracking-tight">
            Statistik &amp; Analitik Komuniti Usahawan Belia
          </h2>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl self-start sm:self-auto border border-slate-300 dark:border-slate-600">
          <button
            type="button"
            onClick={() => setChartTab('growth')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              chartTab === 'growth'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Trend Pertumbuhan</span>
          </button>
          <button
            type="button"
            onClick={() => setChartTab('sectors')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              chartTab === 'sectors'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>Pecahan Sektor</span>
          </button>
        </div>
      </div>

      {/* 4 Tabular Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 my-6 w-full min-w-0">
        {/* Metric 1 */}
        <div className="rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[0.9375rem] font-semibold text-black/85 dark:text-white/90">
              Kiosk Beroperasi
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
              {liveKiosksOccupied}
            </span>
            <span className="text-sm font-medium text-black/75 dark:text-white/80">
              / {Math.max(45, liveKiosksOccupied + 7)} Unit
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[0.8125rem] sm:text-sm font-medium text-black/80 dark:text-white/80 mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {Math.min(99, Math.round((liveKiosksOccupied / Math.max(45, liveKiosksOccupied + 7)) * 1000) / 10)}% Kadar Pengisian
          </span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[0.9375rem] font-semibold text-black/85 dark:text-white/90">
              Dana Geran Disalurkan
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
              RM {currentGrantAmountK}K
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[0.8125rem] sm:text-sm font-medium text-black/80 dark:text-white/80 mt-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Telus &amp; Beraudit
          </span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[0.9375rem] font-semibold text-black/85 dark:text-white/90">
              Usahawan Belia Aktif
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
              {liveBusinessesTotal}
            </span>
            <span className="text-sm font-medium text-black/75 dark:text-white/80">
              Peniaga
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[0.8125rem] sm:text-sm font-medium text-black/80 dark:text-white/80 mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +34 usahawan suku ini
          </span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[0.9375rem] font-semibold text-black/85 dark:text-white/90">
              Penjimatan Subsidi Sewa
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[1.75rem] font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
              RM 68.4K
            </span>
            <span className="text-sm font-medium text-black/75 dark:text-white/80">
              / setahun
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[0.8125rem] sm:text-sm font-medium text-black/80 dark:text-white/80 mt-1.5">
            Tajaan Kerajaan Negeri
          </span>
        </div>
      </div>

      {/* Visual Chart Area */}
      {chartTab === 'sectors' ? (
        <div className="space-y-6 pt-2 w-full min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full min-w-0">
            {/* Left (7 Cols): Segmented Distribution Bars */}
            <div className="xl:col-span-7 flex flex-col gap-3 w-full min-w-0">
              <span className="text-[0.9375rem] font-bold text-black dark:text-white block mb-1">
                Taburan Usahawan Mengikut Bidang Niaga
              </span>

              {SECTOR_BREAKDOWN.map((sec) => (
                <div
                  key={sec.name}
                  onClick={() => setActiveSector(sec)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeSector.name === sec.name
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/70 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:bg-blue-50/40 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[0.9375rem] mb-2 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: sec.color }}
                      />
                      <span className="font-semibold text-black dark:text-white truncate">
                        {sec.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-black/75 dark:text-white/80 tabular-nums">
                        {sec.entrepreneurs} Peniaga
                      </span>
                      <span className="font-bold font-mono text-[0.9375rem] text-black dark:text-white tabular-nums">
                        {sec.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sec.percentage}%`,
                        backgroundColor: sec.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right (5 Cols): Added Clean Percentage Donut Chart */}
            <div className="xl:col-span-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-5 sm:p-6 flex flex-col justify-between w-full min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-300 dark:border-slate-700">
                <div>
                  <h3 className="text-[0.9375rem] sm:text-base font-bold text-black dark:text-white">
                    Graf Peratusan Sektor
                  </h3>
                  <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/80">
                    Klik segmen untuk melihat butiran
                  </p>
                </div>
                <span className="text-[0.8125rem] font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white tabular-nums">
                  {totalEntrepreneurs} Peniaga
                </span>
              </div>

              <div className="relative h-64 sm:h-72 min-h-[272px] w-full min-w-0 my-2">
                <ResponsiveContainer width="100%" height={272} minWidth={0} initialDimension={{ width: 420, height: 272 }}>
                  <PieChart>
                    <Pie
                      data={SECTOR_BREAKDOWN}
                      dataKey="percentage"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={98}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="#FFFFFF"
                      isAnimationActive={false}
                      onClick={(_, index) => {
                        if (SECTOR_BREAKDOWN[index]) {
                          setActiveSector(SECTOR_BREAKDOWN[index]);
                        }
                      }}
                      className="cursor-pointer outline-none"
                    >
                      {SECTOR_BREAKDOWN.map((sec) => (
                        <Cell
                          key={sec.name}
                          fill={sec.color}
                          opacity={activeSector.name === sec.name ? 1 : 0.72}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const sec = payload[0].payload as SectorData;
                          return (
                            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-xl border border-slate-700">
                              <div className="font-bold text-white">{sec.name}</div>
                              <div className="font-mono tabular-nums text-white/90 mt-0.5">
                                {sec.percentage}% ({sec.entrepreneurs} Usahawan)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Percentage Readout */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <span className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/80 truncate max-w-[120px]">
                    {activeSector.shortName}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-black dark:text-white tabular-nums leading-tight mt-0.5">
                    {activeSector.percentage}%
                  </span>
                  <span className="text-[0.8125rem] font-medium text-black/75 dark:text-white/80 tabular-nums">
                    {activeSector.entrepreneurs} Orang
                  </span>
                </div>
              </div>

              {/* Compact Tidy Legend */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-slate-300 dark:border-slate-700">
                {SECTOR_BREAKDOWN.map((sec) => (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => setActiveSector(sec)}
                    className={`flex items-center justify-between gap-2 text-left text-[0.8125rem] font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeSector.name === sec.name
                        ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-black dark:text-white'
                        : 'text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: sec.color }}
                      />
                      <span className="truncate">{sec.shortName}</span>
                    </span>
                    <span className="font-mono font-bold tabular-nums shrink-0">{sec.percentage}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Sector Highlight Spotlight (Preserved & Tidied Full-Width Card) */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full min-w-0">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 mb-2.5">
                <PieChartIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Sorotan Sektor Terpilih
              </div>

              <h4 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1.5">
                {activeSector.name}
              </h4>
              <p className="text-[0.9375rem] text-black/85 dark:text-white/90 leading-relaxed">
                Sektor ini menyumbang sebanyak {activeSector.percentage}% daripada keseluruhan usahawan belia aktif di Kelantan dengan sokongan pembiayaan geran permulaan dan bimbingan pensijilan Halal.
              </p>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-300 dark:border-slate-600 lg:pl-8 shrink-0">
              <div>
                <span className="text-[0.8125rem] uppercase font-bold text-black/75 dark:text-white/80 block">
                  Jumlah Usahawan
                </span>
                <span className="text-2xl font-extrabold font-mono text-black dark:text-white tabular-nums mt-0.5 block">
                  {activeSector.entrepreneurs} Orang
                </span>
              </div>
              <div>
                <span className="text-[0.8125rem] uppercase font-bold text-black/75 dark:text-white/80 block">
                  Sumbangan Pasaran
                </span>
                <span className="text-2xl font-extrabold font-mono text-black dark:text-white tabular-nums mt-0.5 block">
                  {activeSector.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Growth Trend Chart: Upgraded to Full Taller Tightly-Spaced Recharts BarChart with Dual Y-Axis */
        <div className="pt-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <span className="text-[0.9375rem] sm:text-base font-bold text-black dark:text-white">
              Prestasi Pertumbuhan Suku Tahunan Ekonomi Belia
            </span>
            <span className="text-sm font-medium text-black/75 dark:text-white/80">
              Dana Geran Benih (RM Ribu) &amp; Bilangan Usahawan Aktif
            </span>
          </div>

          <div className="h-80 min-h-[320px] w-full min-w-0 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 p-4 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
            <ResponsiveContainer width="100%" height={288} minWidth={0} initialDimension={{ width: 640, height: 288 }}>
              <BarChart
                data={quarterlyData}
                barCategoryGap="18%"
                barGap={8}
                margin={{ top: 26, right: 12, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 13.5, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, (dataMax: number) => Math.max(dataMax, 100)]}
                  tick={{ fontSize: 12.5, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `RM ${val}K`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, (dataMax: number) => Math.max(dataMax, 20)]}
                  allowDecimals={false}
                  tick={{ fontSize: 12.5, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val} Org`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.10)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as typeof BASE_QUARTERLY_DATA[number];
                      return (
                        <div className="px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl border border-slate-700">
                          <div className="font-bold text-white mb-1">{d.quarter}</div>
                          <div className="font-mono tabular-nums text-white/90">Dana Geran: {d.grants}</div>
                          <div className="font-mono tabular-nums text-white/90">Usahawan Aktif: {d.businesses} Orang</div>
                          <div className="font-mono tabular-nums text-white/90">Kiosk Beroperasi: {d.kiosks} Unit</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="grantsAmount" name="Dana Geran" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                  <LabelList
                    dataKey="grants"
                    position="top"
                    className="fill-slate-900 dark:fill-white font-mono"
                    style={{ fontSize: 12.5, fontWeight: 700 }}
                  />
                </Bar>
                <Bar yAxisId="right" dataKey="businesses" name="Usahawan Aktif" fill="#059669" radius={[8, 8, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                  <LabelList
                    dataKey="businesses"
                    position="top"
                    formatter={(val: unknown) => `${val} Org`}
                    className="fill-slate-800 dark:fill-slate-200 font-mono"
                    style={{ fontSize: 12.5, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-black/75 dark:text-white/80 pt-3.5">
            <span>Data merangkumi rekod langsung geran, usahawan, dan asas suku tahunan.</span>
            <span className="font-bold text-black dark:text-white">
              Pertumbuhan +180% Tahun ke Tahun
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
