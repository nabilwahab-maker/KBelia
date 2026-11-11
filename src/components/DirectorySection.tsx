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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('directory_title')}
          </h2>
          <p className="text-slate-600 dark:text-[#8A99AD] text-sm mt-1 max-w-2xl leading-relaxed">
            {t('directory_subtitle')}
          </p>
        </div>

        {isMentor ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 shrink-0">
            <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
            className="interactive-press interactive-lift inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            title={language === 'en' ? 'Open Merchant Business Management' : 'Buka Papan Pemuka Pengurusan Bisnes Usahawan'}
          >
            <Store className="w-4 h-4" />
            <span>{t('manage_business_btn')}</span>
          </button>
        ) : null}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-[#24303F] p-4 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs mb-8 space-y-4 transition-colors">
        <div className="grid md:grid-cols-12 gap-3">
          
          {/* Search input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('search_business_ph')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-300 dark:border-[#2E3A47] rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-300 dark:border-[#2E3A47] rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-medium text-slate-700 dark:text-white transition-colors"
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
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-300 dark:border-[#2E3A47] rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-medium text-slate-700 dark:text-white transition-colors"
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100 dark:border-[#2E3A47]">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">{t('popular_categories_label')}</span>
          {CATEGORIES.slice(1, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`interactive-press px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold'
                  : 'bg-slate-100 dark:bg-[#1A222C] text-slate-600 dark:text-[#8A99AD] hover:bg-slate-200 dark:hover:bg-[#2E3A47] dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Businesses Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47]">
          <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">{t('no_businesses_found')}</h3>
          <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-1">{t('no_businesses_desc')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((biz) => {
            const rawPhone = biz.whatsapp || biz.phone || '';
            const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
            const waGreeting = language === 'en'
              ? `Hello ${biz.businessName}, I saw your business profile on the Kelantan Youth Portal.`
              : `Assalamualaikum ${biz.businessName}, saya melihat perniagaan anda di Portal NiagaBelia Kelantan.`;
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}`;

            return (
              <div
                key={biz.id}
                id={`business-card-${biz.id}`}
                className="interactive-card bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] hover:border-amber-400/40 dark:hover:border-amber-400/40 overflow-hidden shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                {/* Banner & Logo */}
                <div>
                  <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={biz.bannerUrl || '/public/assets/generated/banner_kelantan_landmark_1793924253242.jpg'}
                      alt={biz.businessName}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>

                    {/* Category pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white">
                      {biz.category}
                    </span>

                    {/* Featured / SSM Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {biz.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                          {t('featured_badge')}
                        </span>
                      )}
                    </div>

                    {/* Logo avatar floating */}
                    <img
                      src={biz.logoUrl || '/public/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                      alt={biz.businessName}
                      className="absolute -bottom-3 left-4 w-14 h-14 rounded-xl border-2 border-white dark:border-[#24303F] shadow-md object-cover bg-white dark:bg-[#1A222C] group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Content Info */}
                  <div className="pt-5 p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
                          {biz.businessName}
                        </h3>
                        {biz.ssmNumber && (
                          <span title={t('ssm_registered')} className="text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-red-700 dark:text-red-400 font-semibold line-clamp-1 mt-0.5">
                        {biz.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#8A99AD] line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{biz.district}, Kelantan</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{biz.rating || 5.0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50/80 dark:bg-[#1C2434] border-t border-slate-100 dark:border-[#2E3A47] flex items-center gap-2">
                  <button
                    onClick={() => onSelectBusiness(biz)}
                    className="interactive-press flex-1 py-2 px-3 bg-white dark:bg-[#24303F] hover:bg-slate-100 dark:hover:bg-[#2E3A47] text-slate-800 dark:text-white border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Catalogue & Profile' : 'Katalog & Profil'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'en' ? 'Direct WhatsApp' : 'WhatsApp Terus'}
                    className="interactive-press p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center"
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
