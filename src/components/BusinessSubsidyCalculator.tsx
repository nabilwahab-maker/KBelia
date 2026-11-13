import React, { useState } from 'react';
import { 
  Calculator, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  Landmark
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BusinessSubsidyCalculatorProps {
  onOpenBooking?: () => void;
  onOpenGrantModal?: (title?: string, amount?: string) => void;
}

export const BusinessSubsidyCalculator: React.FC<BusinessSubsidyCalculatorProps> = ({
  onOpenBooking,
  onOpenGrantModal
}) => {
  const { t, language } = useLanguage();
  const [dailySales, setDailySales] = useState<number>(250);
  const [marginPct, setMarginPct] = useState<number>(45);
  const [operatingDays, setOperatingDays] = useState<number>(26);

  // Subsidized vs Market Rent
  const marketRent = 300;
  const subsidizedRent = 150;
  const monthlySavings = marketRent - subsidizedRent;
  const annualSavings = monthlySavings * 12;

  // Revenue & Profit Math
  const monthlyRevenue = dailySales * operatingDays;
  const grossProfit = monthlyRevenue * (marginPct / 100);
  const netProfit = Math.max(0, grossProfit - subsidizedRent - 50); // RM50 misc utility
  const dailyBreakEven = Math.round((subsidizedRent + 50) / (operatingDays * (marginPct / 100)));

  // MAIK Zakat Nisab reference (~RM 25,000 yearly net working capital)
  const isZakatEligible = (netProfit * 12) >= 25000;
  const estimatedZakat = isZakatEligible ? Math.round((netProfit * 12) * 0.025) : 0;

  // Recommended Grant
  const recommendedGrant = dailySales >= 300
    ? {
        title: language === 'en' ? 'Youth Kiosk Digital Transformation Scheme' : 'Skim Transformasi Digital Kiosk Belia',
        amount: 'RM 5,000'
      }
    : {
        title: language === 'en' ? 'Kelantan Youth Entrepreneur Seed Fund' : 'Dana Benih Usahawan Belia Kelantan',
        amount: 'RM 3,000'
      };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-2xs w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-black dark:text-white/75">
              <Calculator className="w-3.5 h-3.5 text-black dark:text-white/75" />
              {t('calc_badge')}
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-xs text-black/70 dark:text-white/75 font-medium">
              {t('calc_subtitle')}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
            {t('calc_heading')}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start mt-6 w-full min-w-0">
        {/* Left Form Controls */}
        <div className="xl:col-span-7 flex flex-col gap-5 w-full min-w-0">
          {/* Daily Sales Numeric Input */}
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-black dark:text-white">
                {t('daily_sales_label')}
              </label>
              <span className="text-xs font-semibold text-black/70 dark:text-white/75">
                {t('manual_type')}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black/70 dark:text-white/75 pointer-events-none">
                RM
              </span>
              <input
                type="number"
                min="10"
                step="25"
                value={dailySales}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDailySales(val >= 0 ? val : 0);
                }}
                className="w-full pl-11 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 font-mono dark:focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
              {[150, 250, 400, 600, 1000].map((sales) => (
                <button
                  key={sales}
                  type="button"
                  onClick={() => setDailySales(sales)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                    dailySales === sales
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs dark:bg-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  RM {sales}
                </button>
              ))}
            </div>
          </div>

          {/* Margin & Days Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-black dark:text-white">
                  {t('margin_label')}
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={marginPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarginPct(val > 0 ? val : 10);
                  }}
                  className="w-full pl-3.5 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 font-mono dark:focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black/70 dark:text-white/75 pointer-events-none">
                  %
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[30, 45, 55, 70].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMarginPct(pct)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      marginPct === pct
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs dark:bg-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-black dark:text-white">
                  {t('operating_days_label')}
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={operatingDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOperatingDays(val > 0 ? val : 1);
                  }}
                  className="w-full pl-3.5 pr-14 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 font-mono dark:focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black/70 dark:text-white/75 pointer-events-none">
                  {language === 'en' ? 'Days' : 'Hari'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[20, 24, 26, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setOperatingDays(d)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      operatingDays === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs dark:bg-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d} {language === 'en' ? 'Days' : 'Hari'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subsidy Highlight Banner */}
          <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  {t('subsidy_savings_banner_title')}
                </span>
                <span className="text-xs text-black dark:text-white/75">
                  {t('subsidy_savings_banner_desc')}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-black dark:text-white tabular-nums block">
                {t('saved_per_year').replace('{amount}', annualSavings.toLocaleString())}
              </span>
              <span className="text-[10px] font-semibold text-black dark:text-white/75">
                {t('saved_subtext')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Results Spotlight */}
        <div className="xl:col-span-5 flex flex-col gap-4 w-full min-w-0">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 shadow-xs border border-emerald-200 dark:border-emerald-800/70 relative overflow-hidden">
            <span className="text-[11px] font-bold text-black dark:text-white/75 uppercase tracking-wider block mb-1">
              {t('monthly_projection_title')}
            </span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
                RM {netProfit.toLocaleString()}
              </span>
              <span className="text-xs text-black/70 dark:text-white/75 font-medium">
                {t('net_profit_subtext')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">{language === 'en' ? 'Gross Revenue:' : 'Jumlah Jualan Kasar:'}</span>
                <span className="font-bold text-black dark:text-white tabular-nums">
                  RM {monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">{t('break_even_target_label')}</span>
                <span className="font-bold text-black dark:text-white/75 tabular-nums">
                  RM {dailyBreakEven} / {language === 'en' ? 'day' : 'hari'}
                </span>
              </div>
            </div>

            {/* Zakat Estimator */}
            {isZakatEligible && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-black dark:text-white">
                <span className="flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  {t('zakat_nisab_label')}
                </span>
                <span className="font-bold tabular-nums">
                  ~RM {estimatedZakat} / {language === 'en' ? 'year' : 'tahun'}
                </span>
              </div>
            )}
          </div>

          {/* Recommended Action Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white/75 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t('grant_recommendation_title')}
              </div>
              <h4 className="text-sm font-bold text-black dark:text-white">
                {recommendedGrant.title} ({recommendedGrant.amount})
              </h4>
              <p className="text-xs text-black dark:text-white mt-1 leading-relaxed">
                {language === 'en' 
                  ? `Based on projected sales of RM${dailySales}/day, you qualify to apply for this startup capital assistance to cover raw materials or digital POS equipment.`
                  : `Berdasarkan unjuran jualan RM${dailySales}/hari, anda layak memohon bantuan modal permulaan ini untuk menampung kos bahan mentah atau sistem POS digital.`}
              </p>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              {onOpenGrantModal && (
                <button
                  type="button"
                  onClick={() => onOpenGrantModal(recommendedGrant.title, recommendedGrant.amount)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-emerald-50 hover:bg-amber-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-600 border border-emerald-200 dark:border-emerald-800/70 transition-colors text-center cursor-pointer"
                >
                  {t('apply_this_grant_btn')}
                </button>
              )}
              {onOpenBooking && (
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-1 cursor-pointer shadow-xs dark:bg-blue-600"
                >
                  {t('book_kiosk_btn')} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
