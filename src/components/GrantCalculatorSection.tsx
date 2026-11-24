import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  Building2, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { KelantanDistrict, BusinessCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

interface GrantCalculatorProps {
  onOpenGrantModal: (title: string, amount: string) => void;
  onOpenMentorship: () => void;
}

export const GrantCalculatorSection: React.FC<GrantCalculatorProps> = ({
  onOpenGrantModal,
  onOpenMentorship
}) => {
  const { language } = useLanguage();
  const { isAdmin, isMentor } = useAuth();
  const isEn = language === 'en';
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));

  const [age, setAge] = useState<number>(24);
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [category, setCategory] = useState<BusinessCategory>('Makanan & Minuman (F&B)');
  const [ssmStatus, setSsmStatus] = useState<'registered' | 'in_progress' | 'none'>('registered');
  const [monthlySales, setMonthlySales] = useState<number>(4500);
  const [fundingNeed, setFundingNeed] = useState<number>(5000);
  const [experienceMonths, setExperienceMonths] = useState<number>(12);
  const [isCalculated, setIsCalculated] = useState<boolean>(true);

  // Calculate eligibility score
  const calculateScore = () => {
    let score = 50;
    if (age >= 18 && age <= 35) score += 20;
    else if (age <= 40) score += 10;

    if (ssmStatus === 'registered') score += 15;
    else if (ssmStatus === 'in_progress') score += 8;

    if (monthlySales >= 3000) score += 10;
    else if (monthlySales >= 1000) score += 5;

    if (experienceMonths >= 6) score += 5;

    return Math.min(score, 98);
  };

  const score = calculateScore();

  // Compute dynamic scheme match percentages based on profile & funding inputs
  const starterMatch = Math.min(
    99,
    Math.max(
      45,
      score - (fundingNeed > 5000 ? 12 : 0) + (experienceMonths <= 18 ? 4 : 0) + (ssmStatus !== 'none' ? 3 : -10)
    )
  );
  const tekunMatch = Math.min(
    99,
    Math.max(
      42,
      score - (ssmStatus === 'none' ? 18 : ssmStatus === 'in_progress' ? 8 : 0) + (fundingNeed >= 5000 ? 5 : -6) + (monthlySales >= 3000 ? 4 : -5)
    )
  );

  const handleRecalculate = () => {
    setIsCalculated(true);
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 p-4 sm:p-5 border border-slate-200 dark:border-zinc-700">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black dark:text-white">
            {isEn ? 'Grant & Micro-Finance Eligibility Calculator' : 'Semak Kelayakan Geran & Bantuan Modal'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Form Input Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-300 dark:border-slate-600 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600">
            <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-black dark:text-white/75" />
              <span>{isEn ? 'Business Profile Parameters' : 'Parameter Profil Perniagaan Anda'}</span>
            </h2>
            <span className="text-[0.8125rem] font-bold text-black/70 dark:text-white/75">
              {isEn ? 'Instant Evaluation' : 'Penilaian Automatik'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Umur */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Applicant Age' : 'Umur Pemohon'}
              </label>
              <div className="relative">
                <input 
                  type="number"
                  min="18"
                  max="45"
                  value={age}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAge(val > 0 ? val : 18);
                  }}
                  className="w-full pl-3.5 pr-14 py-2 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono dark:focus:border-blue-500"
                  placeholder={isEn ? 'Enter age' : 'Masukkan umur'}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-black/70 dark:text-white/75 pointer-events-none">
                  {isEn ? 'years' : 'tahun'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                {[18, 21, 24, 28, 32, 35].map((presetAge) => (
                  <button
                    key={presetAge}
                    type="button"
                    onClick={() => setAge(presetAge)}
                    className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-bold border transition-colors cursor-pointer shrink-0 ${
                      age === presetAge
                        ? `${roleTheme.segmentedActiveClass} border-transparent`
                        : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {presetAge} {isEn ? 'years' : 'tahun'}
                  </button>
                ))}
              </div>
            </div>

            {/* Jajahan */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'District' : 'Daerah'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
              >
                <option value="Kota Bharu">Kota Bharu</option>
                <option value="Bachok">Bachok</option>
                <option value="Pasir Mas">Pasir Mas</option>
                <option value="Tumpat">Tumpat</option>
                <option value="Tanah Merah">Tanah Merah</option>
                <option value="Machang">Machang</option>
                <option value="Pasir Puteh">Pasir Puteh</option>
                <option value="Kuala Krai">Kuala Krai</option>
                <option value="Gua Musang">Gua Musang</option>
                <option value="Jeli">Jeli</option>
              </select>
            </div>

            {/* Sektor Perniagaan */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Business Category' : 'Kategori Perniagaan'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
              >
                <option value="Makanan & Minuman (F&B)">Makanan &amp; Minuman</option>
                <option value="Fesyen, Batik & Kraf Kelantan">Fesyen, Batik & Kraf Kelantan</option>
                <option value="Teknologi & Servis Digital">Teknologi & Servis Digital</option>
                <option value="Kecantikan & Kesihatan">Kecantikan & Kesihatan</option>
                <option value="Pertanian & Agrotek">Pertanian & Agrotek</option>
                <option value="Runcit & Gaya Hidup">Runcit & Gaya Hidup</option>
              </select>
            </div>

            {/* Status Pendaftaran SSM */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'SSM Registration' : 'Status Pendaftaran SSM'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSsmStatus('registered')}
                  className={`py-2 px-2 text-[0.8125rem] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ssmStatus === 'registered'
                      ? 'bg-emerald-50 text-black border-emerald-300 dark:bg-emerald-950/40 dark:text-white dark:border-emerald-800'
                      : 'bg-slate-50 text-black border-slate-300 dark:bg-slate-900 dark:text-white/75 dark:border-slate-600'
                  }`}
                >
                  {isEn ? 'Registered' : 'Ada SSM'}
                </button>
                <button
                  type="button"
                  onClick={() => setSsmStatus('in_progress')}
                  className={`py-2 px-2 text-[0.8125rem] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ssmStatus === 'in_progress'
                      ? 'bg-amber-50 text-black border-amber-300 dark:bg-amber-950/40 dark:text-white dark:border-amber-800'
                      : 'bg-slate-50 text-black border-slate-300 dark:bg-slate-900 dark:text-white/75 dark:border-slate-600'
                  }`}
                >
                  {isEn ? 'In Progress' : 'Proses'}
                </button>
                <button
                  type="button"
                  onClick={() => setSsmStatus('none')}
                  className={`py-2 px-2 text-[0.8125rem] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ssmStatus === 'none'
                      ? 'bg-slate-200 text-black border-slate-400 dark:bg-slate-700 dark:text-white'
                      : 'bg-slate-50 text-black border-slate-300 dark:bg-slate-900 dark:text-white/75 dark:border-slate-600'
                  }`}
                >
                  {isEn ? 'None Yet' : 'Belum Ada'}
                </button>
              </div>
            </div>

            {/* Tempoh Pengalaman */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Operating Duration' : 'Tempoh Operasi'}
              </label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  max="120"
                  value={experienceMonths}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setExperienceMonths(val >= 0 ? val : 0);
                  }}
                  className="w-full pl-3.5 pr-14 py-2 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono dark:focus:border-blue-500"
                  placeholder={isEn ? 'Enter duration' : 'Masukkan tempoh'}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-black/70 dark:text-white/75 pointer-events-none">
                  {isEn ? 'months' : 'bulan'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                {[3, 6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setExperienceMonths(m)}
                    className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-bold border transition-colors cursor-pointer shrink-0 ${
                      experienceMonths === m
                        ? `${roleTheme.segmentedActiveClass} border-transparent`
                        : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m} {isEn ? 'months' : 'bulan'}
                  </button>
                ))}
              </div>
            </div>

            {/* Purata Jualan Bulanan */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Monthly Sales' : 'Jualan Bulanan'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/70 dark:text-white/75 pointer-events-none">
                  RM
                </span>
                <input 
                  type="number"
                  min="0"
                  step="500"
                  value={monthlySales}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMonthlySales(val >= 0 ? val : 0);
                  }}
                  className="w-full pl-11 pr-3.5 py-2 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all font-mono dark:focus:border-blue-500"
                  placeholder={isEn ? 'Enter amount' : 'Masukkan jumlah'}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                {[1500, 3000, 5000, 10000, 20000].map((sales) => (
                  <button
                    key={sales}
                    type="button"
                    onClick={() => setMonthlySales(sales)}
                    className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      monthlySales === sales
                        ? `${roleTheme.segmentedActiveClass} border-transparent`
                        : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    RM {sales >= 1000 ? `${sales / 1000}k` : sales}
                  </button>
                ))}
              </div>
            </div>

            {/* Keperluan Modal Diperlukan */}
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                {isEn ? 'Funding Needed' : 'Jumlah Bantuan'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black dark:text-white/75 pointer-events-none">
                  RM
                </span>
                <input 
                  type="number"
                  min="500"
                  step="500"
                  value={fundingNeed}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFundingNeed(val >= 0 ? val : 1000);
                  }}
                  className="w-full pl-11 pr-3.5 py-2 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all font-mono dark:focus:border-blue-500"
                  placeholder={isEn ? 'Enter amount' : 'Masukkan jumlah'}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                {[3000, 5000, 10000, 15000, 30000].map((need) => (
                  <button
                    key={need}
                    type="button"
                    onClick={() => setFundingNeed(need)}
                    className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      fundingNeed === need
                        ? `${roleTheme.segmentedActiveClass} border-transparent`
                        : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    RM {need >= 1000 ? `${need / 1000}k` : need}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRecalculate}
              className={`w-full py-2.5 px-4 text-sm shadow-xs flex items-center justify-center gap-2 ${roleTheme.primaryButtonClass}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEn ? 'Recalculate' : 'Kira Semula'}</span>
            </button>
          </div>
        </div>

        {/* Results & Recommended Grants (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Score Badge Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-300 dark:border-slate-600 shadow-xs text-center space-y-3">
            <span className="text-[0.8125rem] font-extrabold uppercase tracking-wider text-black/70 dark:text-white/75">
              {isEn ? 'Overall Match Rating' : 'Skor Kebarangkalian Lulus'}
            </span>

            <div className="relative inline-flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-8 border-amber-200 dark:border-slate-600 flex items-center justify-center bg-amber-50/40 dark:bg-slate-900">
                <div className="text-3xl font-black text-black dark:text-white/75">
                  {score}%
                </div>
              </div>
              <div className="absolute -top-1 -right-1 p-2 bg-emerald-500 text-white rounded-full shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-black dark:text-white tracking-tight">
                {score >= 80 
                  ? (isEn ? 'High Probability (Top Tier)' : 'Potensi Sangat Tinggi (Tier Utama)')
                  : (isEn ? 'Moderate Eligibility' : 'Kelayakan Sederhana')}
              </h3>
              <p className="text-[0.9375rem] text-black dark:text-white/75 mt-1">
                {isEn 
                  ? `Based on ${age} years old founder in ${district} with active operations.`
                  : `Berdasarkan pemohon umur ${age} tahun di jajahan ${district} dan jualan bulanan RM ${monthlySales.toLocaleString()}.`}
              </p>
            </div>
          </div>

          {/* Matched Schemes List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-300 dark:border-slate-600 shadow-xs space-y-3">
            <div className="text-[0.8125rem] font-extrabold text-black dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>{isEn ? 'Recommended Schemes' : 'Skim Paling Sesuai'}</span>
              <span className="text-black dark:text-white/75 text-[0.8125rem] font-bold">
                {isEn ? 'Ready to Apply' : 'Sedia Dipohon'}
              </span>
            </div>

            {/* Scheme 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                    Geran Permulaan Hab Usahawan Belia
                  </h4>
                  <div className="text-[0.8125rem] font-extrabold text-black dark:text-white/75">
                    Geran Percuma RM3,000
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[0.8125rem] font-bold bg-emerald-100 text-black dark:bg-emerald-950/60 dark:text-white">
                  {starterMatch}% {isEn ? 'Match' : 'Padan'}
                </span>
              </div>
              <p className="text-[0.875rem] text-black dark:text-white/75">
                {isEn ? 'Zero interest grant for purchasing starter tools and stock.' : 'Bantuan modal peralatan dan stok tanpa perlu dibayar balik untuk usahawan muda.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenGrantModal(
                  'Geran Permulaan Hab Usahawan Belia',
                  `RM ${Math.min(Math.max(fundingNeed, 1000), 3000).toLocaleString('ms-MY')}`
                )}
                className={`w-full py-2 px-3 text-sm flex items-center justify-center gap-1.5 ${roleTheme.primaryButtonClass}`}
              >
                <span>{isEn ? 'Apply Grant' : 'Mohon Geran'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scheme 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                    Skim Pembiayaan Mikro &amp; Geran Digital Belia
                  </h4>
                  <div className="text-[0.8125rem] font-extrabold text-black dark:text-white/75">
                    Mikro Pembiayaan RM5,000 - RM20,000
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[0.8125rem] font-bold bg-amber-100 text-black dark:bg-amber-950/60 dark:text-white">
                  {tekunMatch}% {isEn ? 'Match' : 'Padan'}
                </span>
              </div>
              <p className="text-[0.875rem] text-black dark:text-white/75">
                {isEn ? 'Fast financing with subsidized management fee for modular kiosk tenants.' : 'Kadar pembiayaan pantas dengan subsidi caj pengurusan untuk penyewa kiosk modular.'}
              </p>
              <button
                type="button"
                onClick={onOpenMentorship}
                className={`w-full py-2 px-3 text-sm flex items-center justify-center gap-1.5 ${roleTheme.secondaryButtonClass}`}
              >
                <span>{isEn ? 'Ask Mentor' : 'Tanya Mentor'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
