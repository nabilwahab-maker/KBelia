import React, { useState } from 'react';
import { 
  TrendingUp, 
  Store, 
  Coins, 
  Users, 
  PieChart, 
  BarChart3, 
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface SectorData {
  name: string;
  percentage: number;
  entrepreneurs: number;
  color: string;
  darkColor: string;
}

const SECTOR_BREAKDOWN: SectorData[] = [
  { name: 'Makanan & Minuman (F&B)', percentage: 38, entrepreneurs: 48, color: '#D97706', darkColor: '#F59E0B' },
  { name: 'Fesyen, Batik & Kraf Kelantan', percentage: 24, entrepreneurs: 31, color: '#E11D48', darkColor: '#FB7185' },
  { name: 'Teknologi & Servis Digital', percentage: 18, entrepreneurs: 23, color: '#0284C7', darkColor: '#38BDF8' },
  { name: 'Pertanian & Agrotek Belia', percentage: 12, entrepreneurs: 15, color: '#059669', darkColor: '#34D399' },
  { name: 'Runcit & Gaya Hidup', percentage: 8, entrepreneurs: 11, color: '#0EA5E9', darkColor: '#7DD3FC' }
];

const QUARTERLY_DATA = [
  { quarter: 'S1 2025', grants: 'RM 65K', kiosks: 18, businesses: 42, heightPct: 45 },
  { quarter: 'S2 2025', grants: 'RM 120K', kiosks: 24, businesses: 68, heightPct: 60 },
  { quarter: 'S3 2025', grants: 'RM 210K', kiosks: 32, businesses: 94, heightPct: 80 },
  { quarter: 'S4 2025 (Kini)', grants: 'RM 345K', kiosks: 38, businesses: 128, heightPct: 100 }
];

export const CommunityAnalyticsWidget: React.FC = () => {
  const [activeSector, setActiveSector] = useState<SectorData>(SECTOR_BREAKDOWN[0]);
  const [chartTab, setChartTab] = useState<'sectors' | 'growth'>('sectors');

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-2xs w-full min-w-0 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-sky-700 dark:text-sky-400">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Impak Ekonomi Belia Negeri Kelantan
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Data Rasmi Disahkan UMK & TEKUN
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Statistik & Analitik Komuniti Usahawan Belia
          </h2>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setChartTab('sectors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartTab === 'sectors'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Pecahan Sektor
          </button>
          <button
            type="button"
            onClick={() => setChartTab('growth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartTab === 'growth'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Trend Pertumbuhan
          </button>
        </div>
      </div>

      {/* 4 Tabular Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 my-6 w-full min-w-0">
        {/* Metric 1 */}
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kiosk Beroperasi
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white tabular-nums tracking-tight">
              38
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / 45 Unit
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            84.4% Kadar Pengisian
          </span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Dana Geran Disalurkan
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white tabular-nums tracking-tight">
              RM 345K
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-1">
            <ShieldCheck className="w-3 h-3" />
            100% Telus & Beraudit
          </span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Usahawan Belia Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-700 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white tabular-nums tracking-tight">
              128
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Peniaga
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            +34 usahawan suku ini
          </span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Penjimatan Subsidi Sewa
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-700 dark:text-sky-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white tabular-nums tracking-tight">
              RM 68.4K
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / setahun
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-400 mt-1">
            Tajaan Kerajaan Negeri
          </span>
        </div>
      </div>

      {/* Visual Chart Area */}
      {chartTab === 'sectors' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center pt-2 w-full min-w-0">
          {/* Segmented Distribution Bars */}
          <div className="xl:col-span-7 flex flex-col gap-3 w-full min-w-0">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Taburan Usahawan Mengikut Bidang Niaga
            </span>
            
            {SECTOR_BREAKDOWN.map((sec) => (
              <div 
                key={sec.name}
                onClick={() => setActiveSector(sec)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeSector.name === sec.name
                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700/80 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-sky-50/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {sec.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {sec.entrepreneurs} Peniaga
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                      {sec.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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

          {/* Active Sector Highlight Spotlight */}
          <div className="xl:col-span-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between h-full w-full min-w-0">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 mb-3">
                <PieChart className="w-3.5 h-3.5" />
                Sorotan Sektor Terpilih
              </div>

              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {activeSector.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sektor ini menyumbang sebanyak {activeSector.percentage}% daripada keseluruhan usahawan belia aktif di Kelantan dengan sokongan pembiayaan geran permulaan dan bimbingan pensijilan Halal.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Jumlah Usahawan
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                  {activeSector.entrepreneurs} Orang
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Sumbangan Pasaran
                </span>
                <span className="text-xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                  {activeSector.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Growth Trend Chart */
        <div className="pt-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-4">
            Prestasi Pertumbuhan Suku Tahunan Ekonomi Belia
          </span>

          <div className="grid grid-cols-4 gap-3 sm:gap-6 items-end h-56 pt-6 pb-2 border-b border-slate-200 dark:border-slate-700 px-2 sm:px-6">
            {QUARTERLY_DATA.map((q) => (
              <div key={q.quarter} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums mb-2 group-hover:-translate-y-0.5 transition-transform">
                  {q.grants}
                </span>

                <div className="w-full max-w-[56px] bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-t-xl overflow-hidden h-36 flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-700 group-hover:to-sky-500 rounded-t-xl transition-all duration-500"
                    style={{ height: `${q.heightPct}%` }}
                  />
                </div>

                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2 text-center">
                  {q.quarter}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {q.businesses} Usahawan
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3">
            <span>Data merangkumi permohonan dana geran benih dan pengisian kiosk.</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Pertumbuhan +180% Tahun ke Tahun
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
