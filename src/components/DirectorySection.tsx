import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Sparkles, 
  Filter, 
  MessageCircle, 
  ShieldCheck, 
  Star, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { BusinessListing, BusinessCategory, KelantanDistrict } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface DirectorySectionProps {
  businesses?: BusinessListing[];
  onSelectBusiness: (biz: BusinessListing) => void;
  onOpenRegister?: () => void;
  onRegisterBusiness?: () => void;
}

const CATEGORIES = [
  'Semua Kategori',
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

const DISTRICTS: KelantanDistrict[] = [
  'Semua Jajahan',
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

export const DirectorySection: React.FC<DirectorySectionProps> = ({
  businesses = [],
  onSelectBusiness,
  onOpenRegister,
  onRegisterBusiness
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedDistrict, setSelectedDistrict] = useState<KelantanDistrict>('Semua Jajahan');

  const handleRegister = onOpenRegister || onRegisterBusiness || (() => {});

  const filteredBusinesses = (businesses || []).filter((biz) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q || 
      (biz.businessName || '').toLowerCase().includes(q) ||
      (biz.tagline || '').toLowerCase().includes(q) ||
      (biz.description || '').toLowerCase().includes(q);
    
    const matchesCat = selectedCategory === 'Semua Kategori' || biz.category === selectedCategory;
    const matchesDist = selectedDistrict === 'Semua Jajahan' || biz.district === selectedDistrict;

    return matchesSearch && matchesCat && matchesDist && biz.isApproved !== false;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {t('directory_title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            {t('directory_subtitle')}
          </p>
        </div>

        {isMentor ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-bold border border-sky-200 dark:border-sky-800 shrink-0">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>{t('mentor_review_mode_title')}</span>
          </div>
        ) : isAdmin ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{language === 'en' ? 'Directory Audit Mode (Admin)' : 'Mod Audit Direktori & SSM (Pentadbir)'}</span>
          </div>
        ) : isYouth ? (
          <button
            type="button"
            onClick={handleRegister}
            className="interactive-press interactive-lift inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            title={language === 'en' ? 'Open Merchant Business Management' : 'Buka Papan Pemuka Pengurusan Bisnes Usahawan'}
          >
            <Store className="w-4 h-4" />
            <span>{t('manage_business_btn')}</span>
          </button>
        ) : null}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mb-8 space-y-4 transition-colors">
        <div className="grid md:grid-cols-12 gap-3">
          
          {/* Search input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('search_business_ph')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none font-medium text-slate-700 dark:text-white transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'Semua Kategori' ? t('all_categories') : c}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as KelantanDistrict)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none font-medium text-slate-700 dark:text-white transition-colors"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d === 'Semua Jajahan' ? (language === 'en' ? 'All Districts' : 'Semua Jajahan') : d}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">{t('popular_categories_label')}</span>
          {CATEGORIES.slice(1, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`interactive-press px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Businesses Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">{t('no_businesses_found')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('no_businesses_desc')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((biz) => {
            const rawPhone = biz.whatsapp || biz.ownerPhone || '';
            const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
            const waGreeting = language === 'en'
              ? `Hello ${biz.businessName}, I saw your business profile on the Kelantan Youth Portal.`
              : `Assalamualaikum ${biz.businessName}, saya melihat perniagaan anda di Portal NiagaBelia Kelantan.`;
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}`;

            return (
              <div
                key={biz.id}
                id={`business-card-${biz.id}`}
                className="interactive-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500/50 overflow-hidden shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                {/* Banner & Logo */}
                <div>
                  <div className="relative h-36 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={biz.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg'}
                      alt={biz.businessName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>

                    {/* Category kicker */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-xs text-white">
                      {biz.category}
                    </div>

                    {/* Verified SSM mark */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {biz.ssmNumber && (
                        <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-900 shadow-xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>SSM Sah</span>
                        </div>
                      )}
                    </div>

                    {/* Logo avatar floating */}
                    <img
                      src={biz.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                      alt={biz.businessName}
                      className="absolute -bottom-3 left-4 w-12 h-12 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm object-cover bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Content Info */}
                  <div className="pt-4 p-5 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                        {biz.businessName}
                      </h3>
                      
                      <p className="text-xs text-sky-700 dark:text-sky-400 font-medium line-clamp-1 mt-0.5">
                        {biz.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{biz.district}, Kelantan</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold text-xs tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{biz.rating || 5.0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
                  <button
                    onClick={() => onSelectBusiness(biz)}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{language === 'en' ? 'View Profile & Catalog' : 'Katalog & Profil'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'en' ? 'Direct WhatsApp' : 'WhatsApp Terus'}
                    className="interactive-press p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 dark:border-sky-800 rounded-xl transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
