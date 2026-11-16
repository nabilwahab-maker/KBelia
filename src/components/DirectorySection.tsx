import React, { useState } from 'react';
import { 
  Store, 
  MessageCircle, 
  ShieldCheck, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { BusinessListing, KelantanDistrict } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from './ToastNotification';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';

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

  const pagination = usePagination(filteredBusinesses, 7, [
    searchQuery,
    selectedCategory,
    selectedDistrict,
    filteredBusinesses.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'Semua Kategori' ? 1 : 0) +
    (selectedDistrict !== 'Semua Jajahan' ? 1 : 0);

  return (
    <div className="w-full space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            {t('directory_title')}
          </h1>
          <p className="text-black/75 dark:text-white/75 text-[0.9375rem] mt-1 max-w-2xl leading-relaxed">
            {t('directory_subtitle')}
          </p>
        </div>

        {isMentor ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white rounded-xl text-sm font-bold border border-teal-200 dark:border-teal-800/70 shrink-0">
            <GraduationCap className="w-4 h-4 text-black dark:text-white/75" />
            <span>{t('mentor_review_mode_title')}</span>
          </div>
        ) : isAdmin ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-black dark:text-white rounded-xl text-sm font-bold border border-amber-200 dark:border-amber-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-black dark:text-white/75" />
            <span>{language === 'en' ? 'Directory Audit Mode (Admin)' : 'Mod Audit Direktori & SSM (Pentadbir)'}</span>
          </div>
        ) : isYouth ? (
          <button
            type="button"
            onClick={handleRegister}
            className="interactive-press interactive-lift inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 cursor-pointer dark:bg-blue-600"
            title={language === 'en' ? 'Open Merchant Business Management' : 'Buka Dashboard Pengurusan Bisnes Usahawan'}
          >
            <Store className="w-4 h-4" />
            <span>{t('manage_business_btn')}</span>
          </button>
        ) : null}
      </div>

      {/* Ringkasan Statistik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-fit items-start">
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Jumlah Usahawan</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{(businesses || []).filter(b => b.isApproved !== false).length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">SSM Disahkan</span>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{(businesses || []).filter(b => b.isApproved !== false && Boolean(b.ssmNumber)).length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Jajahan Aktif</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{new Set((businesses || []).filter(b => b.isApproved !== false).map(b => b.district).filter(Boolean)).size}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Hasil Carian</span>
          <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 tabular-nums">{filteredBusinesses.length}</span>
        </div>
      </div>

      {/* Direktori Usahawan: Carian, Penapis Bersepadu, Senarai Baris & Halaman Bernombor */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('search_business_ph')}
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setSelectedCategory('Semua Kategori');
            setSelectedDistrict('Semua Jajahan');
          }}
          filterContent={
            <>
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {t('popular_categories_label')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.slice(1, 5).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setSelectedCategory((prev) => (prev === cat ? 'Semua Kategori' : cat))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left border ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {language === 'en' ? 'Category' : 'Kategori'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Semua Kategori' ? t('all_categories') : c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {language === 'en' ? 'District' : 'Jajahan'}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d === 'Semua Jajahan' ? (language === 'en' ? 'Across Kelantan' : 'Seluruh Kelantan') : d}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Store className="w-12 h-12 text-black/35 dark:text-white/35 mx-auto mb-3" />
            <h3 className="text-base font-bold text-black dark:text-white">{t('no_businesses_found')}</h3>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">{t('no_businesses_desc')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map((biz) => {
                const rawPhone = biz.whatsapp || biz.ownerPhone || '';
                const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/[^0-9]/g, '') : '';
                const waGreeting = language === 'en'
                  ? `Hello ${biz.businessName}, I saw your business profile on the Kelantan Youth Portal.`
                  : `Assalamualaikum ${biz.businessName}, saya melihat perniagaan anda di Portal NiagaBelia Kelantan.`;
                const waLink = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}`
                  : '#';

                return (
                  <div
                    key={biz.id}
                    id={`business-card-${biz.id}`}
                    onClick={() => onSelectBusiness(biz)}
                    className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={biz.logoUrl || biz.bannerUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                        alt={biz.businessName}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-bold text-black dark:text-white text-sm sm:text-base truncate">
                            {biz.businessName}
                          </h3>
                          {biz.ssmNumber ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-300 dark:border-emerald-700 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              <span>SSM Sah</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-black dark:text-white border border-slate-200 dark:border-zinc-700 shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                          {biz.category} · {biz.district}, Kelantan · ★ {biz.rating || 5.0}{biz.tagline ? ` · ${biz.tagline}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBusiness(biz);
                        }}
                        className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        <span>{language === 'en' ? 'View Profile & Catalog' : 'Katalog & Profil'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={waLink}
                        target={cleanPhone ? '_blank' : undefined}
                        rel={cleanPhone ? 'noopener noreferrer' : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!cleanPhone) {
                            e.preventDefault();
                            showToast(
                              language === 'en'
                                ? 'This business has not added a WhatsApp number yet.'
                                : 'Perniagaan ini belum mendaftarkan nombor WhatsApp.',
                              'warning'
                            );
                          }
                        }}
                        title={language === 'en' ? 'Direct WhatsApp' : 'WhatsApp Terus'}
                        className="p-2 bg-indigo-50 hover:bg-amber-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-600 dark:text-indigo-400 dark:border-indigo-800/70 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel={language === 'en' ? 'businesses' : 'perniagaan'}
              accent="blue"
            />
          </>
        )}
      </div>

    </div>
  );
};
