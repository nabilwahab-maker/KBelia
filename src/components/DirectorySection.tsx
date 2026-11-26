import React, { useState } from 'react';
import { 
  Store, 
  MessageCircle, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { BusinessListing, KelantanDistrict, formatBusinessCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from './ToastNotification';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { AcronymText } from './TypographyPrimitives';

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
  onSelectBusiness
}) => {
  const { t, language } = useLanguage();
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedDistrict, setSelectedDistrict] = useState<KelantanDistrict>('Semua Jajahan');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);

  const sortOptions = buildStandardSortOptions(
    [
      { value: 'featured_first', label: language === 'en' ? 'Featured & SSM Verified' : 'Pilihan Utama & Disahkan SSM' }
    ],
    language === 'en'
  );

  const filteredBusinesses = sortRecords(
    (businesses || []).filter((biz) => {
      const q = (searchQuery || '').trim().toLowerCase();
      const matchesSearch = !q || 
        (biz.businessName || '').toLowerCase().includes(q) ||
        (biz.tagline || '').toLowerCase().includes(q) ||
        (biz.description || '').toLowerCase().includes(q);
      
      const matchesCat = selectedCategory === 'Semua Kategori' || biz.category === selectedCategory;
      const matchesDist = selectedDistrict === 'Semua Jajahan' || biz.district === selectedDistrict;

      return matchesSearch && matchesCat && matchesDist && biz.isApproved !== false;
    }),
    {
      sortBy,
      getName: (biz) => biz.businessName || biz.ownerName || '',
      customCompare: (a, b, mode) => {
        if (mode === 'featured_first') {
          const scoreA = (a.isFeatured ? 2 : 0) + (a.ssmNumber ? 1 : 0);
          const scoreB = (b.isFeatured ? 2 : 0) + (b.ssmNumber ? 1 : 0);
          return scoreB - scoreA;
        }
        return null;
      }
    }
  );

  const pagination = usePagination(filteredBusinesses, 7, [
    searchQuery,
    selectedCategory,
    selectedDistrict,
    sortBy,
    filteredBusinesses.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'Semua Kategori' ? 1 : 0) +
    (selectedDistrict !== 'Semua Jajahan' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  return (
    <div className="w-full space-y-4">
      
      {/* Section Header */}
      <div>
        <h1 className="font-display text-fluid-portal font-extrabold text-black dark:text-white tracking-tight kbelia-trim">
          {t('directory_title')}
        </h1>
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
            setSortBy(DEFAULT_SORT_VALUE);
          }}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={language === 'en' ? 'Sort By' : 'Susun Mengikut'}
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
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
                      className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer text-left border ${
                        selectedCategory === cat
                          ? `${roleTheme.segmentedActiveClass} border-transparent`
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {language === 'en' ? 'Category' : 'Kategori'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Semua Kategori' ? t('all_categories') : formatBusinessCategory(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
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
                  ? `Hello ${biz.businessName}, I am a fellow Belia entrepreneur from the Kelantan Youth Portal and would like to connect.`
                  : `Assalamualaikum ${biz.businessName}, saya rakan usahawan Belia dari Portal KBelia Kelantan dan ingin berhubung dengan perniagaan anda.`;
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
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            title={biz.businessName}
                            className="font-bold text-black dark:text-white text-sm sm:text-base kbelia-clamp-1 kbelia-trim"
                          >
                            {biz.businessName}
                          </h3>
                          {biz.ssmNumber ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-300 dark:border-emerald-700 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              <span>
                                <span className="kbelia-acro">SSM</span> Sah
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-slate-100 dark:bg-zinc-800 text-black dark:text-white border border-slate-200 dark:border-zinc-700 shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums kbelia-prose">
                          <AcronymText
                            text={`${formatBusinessCategory(biz.category)} · ${biz.district}, Kelantan${biz.tagline ? ` · ${biz.tagline}` : ''}`}
                          />
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
                        className={`py-2 px-3.5 text-sm inline-flex items-center gap-1.5 shadow-xs ${roleTheme.primaryButtonClass}`}
                      >
                        <span>{language === 'en' ? 'Catalog' : 'Katalog'}</span>
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
                        className={roleTheme.iconButtonClass}
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
            />
          </>
        )}
      </div>

    </div>
  );
};
