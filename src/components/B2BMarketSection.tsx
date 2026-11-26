import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  MapPin,
  Megaphone,
  MessageCircle,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { B2BListing } from '../types';
import { INITIAL_B2B_LISTINGS } from '../data/b2bData';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  getDeletedIds,
  isProductionAuthenticated
} from '../services/dataService';
import {
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from '../services/realtimeSync';
import { PortalImage } from './PortalImage';
import { resolveB2BImage } from '../utils/visualAssets';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { AcronymText } from './TypographyPrimitives';

const ITEMS_PER_PAGE = 6;
const SPOTLIGHT_ROTATE_MS = 6000;

export const B2BMarketSection: React.FC = () => {
  const { language } = useLanguage();
  const { user, isDemoSession, isAdmin, isMentor } = useAuth();
  const isEn = language === 'en';
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));

  const [listings, setListings] = useState<B2BListing[]>(() => {
    try {
      const deletedSet = new Set(getDeletedIds());
      const saved = localStorage.getItem('kbelia_b2b_listings');
      if (saved) {
        return (JSON.parse(saved) as B2BListing[]).filter((x) => !deletedSet.has(x.id));
      }
    } catch {
      // ignore
    }
    return INITIAL_B2B_LISTINGS;
  });

  useEffect(() => {
    const loadLocalB2B = (): B2BListing[] => {
      try {
        const saved = localStorage.getItem('kbelia_b2b_listings');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    };

    let firestoreItems: B2BListing[] = [];
    let demoSyncItems: B2BListing[] = [];
    let demoDeletedIds: string[] = [];

    const recomputeListings = () => {
      const deleted = [...getDeletedIds(), ...demoDeletedIds];
      const localItems = loadLocalB2B();
      const prodAuth = isProductionAuthenticated();
      const lists = prodAuth
        ? [firestoreItems, demoSyncItems, localItems, INITIAL_B2B_LISTINGS]
        : [demoSyncItems, localItems, firestoreItems, INITIAL_B2B_LISTINGS];
      setListings(mergeUniqueById<B2BListing>(lists, deleted));
    };

    recomputeListings();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'b2b' || entity === 'deleted') {
        recomputeListings();
      }
    });

    const unsubscribe = onSnapshot(
      collection(db, 'b2b_listings'),
      (snap) => {
        const remote: B2BListing[] = [];
        snap.forEach((docSnap) => remote.push({ id: docSnap.id, ...docSnap.data() } as B2BListing));
        firestoreItems = remote;
        recomputeListings();
      },
      (err) => {
        console.debug('Ruang Niaga listener notice:', err?.message || err);
        recomputeListings();
      }
    );

    const unsubDemoSync = subscribeDemoSyncCollection<B2BListing>('b2b', (items, delIds) => {
      demoSyncItems = items;
      demoDeletedIds = delIds;
      recomputeListings();
    });

    return () => {
      unsubCrossTab();
      unsubscribe();
      unsubDemoSync();
    };
  }, [user?.uid, isDemoSession]);

  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState<boolean>(false);
  const [detailListing, setDetailListing] = useState<B2BListing | null>(null);

  const spotlightCount = listings.length;
  const safeSpotlightIndex = spotlightCount > 0 ? spotlightIndex % spotlightCount : 0;
  const spotlightListing = spotlightCount > 0 ? listings[safeSpotlightIndex] : null;

  useEffect(() => {
    if (spotlightCount <= 1 || isSpotlightPaused || detailListing) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightCount);
    }, SPOTLIGHT_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [spotlightCount, isSpotlightPaused, detailListing]);

  useEffect(() => {
    if (!detailListing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailListing(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detailListing]);

  const buildWhatsAppHref = (item: B2BListing) =>
    `https://wa.me/${item.whatsapp}?text=Salam%20${encodeURIComponent(item.authorName)},%20saya%20melihat%20iklan%20Ruang%20Niaga%20anda%20di%20Portal%20KBelia:%20${encodeURIComponent(item.title)}`;

  const sortOptions = buildStandardSortOptions(
    [
      { value: 'supply_first', label: isEn ? 'Type (Supplying First)' : 'Jenis (Membekal Dahulu)' },
      { value: 'demand_first', label: isEn ? 'Type (Seeking First)' : 'Jenis (Mencari Dahulu)' },
      { value: 'district_asc', label: isEn ? 'District (A - Z)' : 'Daerah (A - Z)' }
    ],
    isEn,
    {
      asc: isEn ? 'Ad Title (A - Z)' : 'Tajuk Iklan (A - Z)',
      desc: isEn ? 'Ad Title (Z - A)' : 'Tajuk Iklan (Z - A)'
    }
  );

  const filteredListings = sortRecords(
    listings.filter((item) => {
      const matchType = filterType === 'all' || item.type === filterType;
      const matchDist = filterDistrict === 'all' || item.district === filterDistrict;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.authorBusiness.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q);
      return matchType && matchDist && matchSearch;
    }),
    {
      sortBy,
      getName: (item) => item.title || item.authorBusiness || '',
      customCompare: (a, b, mode) => {
        if (mode === 'supply_first') return (a.type === 'supply' ? 0 : 1) - (b.type === 'supply' ? 0 : 1);
        if (mode === 'demand_first') return (a.type === 'demand' ? 0 : 1) - (b.type === 'demand' ? 0 : 1);
        if (mode === 'district_asc') return compareText(a.district, b.district);
        return null;
      }
    }
  );

  const pagination = usePagination(filteredListings, ITEMS_PER_PAGE, [
    searchQuery,
    filterType,
    filterDistrict,
    sortBy,
    filteredListings.length
  ]);

  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    (filterDistrict !== 'all' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-fluid-portal font-extrabold text-black dark:text-white tracking-tight kbelia-trim">
          {isEn ? 'B2B & Supplier Network' : 'Rangkaian Pembekal & B2B'}
        </h1>
        <p className="text-sm text-black/65 dark:text-white/70 mt-1 max-w-2xl kbelia-prose">
          <AcronymText
            text={
              isEn
                ? 'Connect directly with Kelantan youth wholesale suppliers, local makers, and kiosk partners.'
                : 'Cari pembekal borong, bahan mentah kiosk, dan rakan niaga belia di seluruh Kelantan.'
            }
          />
        </p>
      </div>

      {/* Rotating Featured Spotlight Carousel */}
      {spotlightListing && (
        <section
          aria-label={isEn ? 'Featured Supply Spotlight' : 'Sorotan Pilihan Utama'}
          onMouseEnter={() => setIsSpotlightPaused(true)}
          onMouseLeave={() => setIsSpotlightPaused(false)}
          onFocus={() => setIsSpotlightPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsSpotlightPaused(false);
            }
          }}
          className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-2xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div
              onClick={() => setDetailListing(spotlightListing)}
              className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] bg-slate-100 dark:bg-zinc-800 overflow-hidden cursor-pointer group"
            >
              <PortalImage
                key={spotlightListing.id}
                src={resolveB2BImage(spotlightListing)}
                alt={spotlightListing.title}
                fallbackType="b2b"
                fallbackLabel={spotlightListing.authorBusiness}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
              />
            </div>

            <div className="lg:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-3" aria-live="polite">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <span className={`inline-flex items-center gap-1 ${roleTheme.accentTextClass}`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? 'Featured Spotlight' : 'Sorotan Pilihan Utama'}</span>
                  </span>
                  <span className="text-black/30 dark:text-white/30">·</span>
                  <span
                    className={
                      spotlightListing.type === 'supply'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }
                  >
                    {spotlightListing.type === 'supply'
                      ? (isEn ? 'Supplying' : 'Membekal')
                      : (isEn ? 'Seeking' : 'Mencari')}
                  </span>
                </div>

                <h2
                  onClick={() => setDetailListing(spotlightListing)}
                  title={spotlightListing.title}
                  className="font-display text-fluid-title font-extrabold text-black dark:text-white tracking-tight text-balance kbelia-trim cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <AcronymText text={spotlightListing.title} />
                </h2>

                <p className="text-sm sm:text-base text-black/70 dark:text-white/75 leading-relaxed line-clamp-3 kbelia-prose">
                  <AcronymText text={spotlightListing.description} />
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppHref(spotlightListing)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-2.5 px-4 text-sm inline-flex items-center justify-center gap-2 ${roleTheme.primaryButtonClass}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setDetailListing(spotlightListing)}
                    className={`py-2 px-3.5 text-sm inline-flex items-center gap-1.5 ${roleTheme.secondaryButtonClass}`}
                  >
                    <span>{isEn ? 'Details' : 'Butiran'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {spotlightCount > 1 && (
                  <div
                    className="flex items-center gap-1.5"
                    role="tablist"
                    aria-label={isEn ? 'Spotlight slides' : 'Slaid sorotan'}
                  >
                    {listings.map((item, idx) => {
                      const isActiveSlide = idx === safeSpotlightIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={isActiveSlide}
                          aria-label={`${isEn ? 'Show listing' : 'Papar iklan'} ${idx + 1}: ${item.title}`}
                          onClick={() => setSpotlightIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            isActiveSlide
                              ? `w-6 ${roleTheme.progressFillClass}`
                              : 'w-2.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Ruang Niaga: Single Integrated Toolbar + 3-Column Visual Card Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={isEn ? 'Search ad or district...' : 'Cari iklan atau daerah...'}
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setFilterType('all');
            setFilterDistrict('all');
            setSortBy(DEFAULT_SORT_VALUE);
          }}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={isEn ? 'Sort By' : 'Susun Mengikut'}
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'Listing Type' : 'Jenis Iklan'}
                </label>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-1.5 text-[0.8125rem] font-bold rounded-xl transition-colors cursor-pointer ${
                      filterType === 'all'
                        ? roleTheme.segmentedActiveClass
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'All' : 'Semua'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('demand')}
                    className={`px-2 py-1.5 text-[0.8125rem] font-bold rounded-xl transition-colors cursor-pointer ${
                      filterType === 'demand'
                        ? roleTheme.segmentedActiveClass
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'Seeking' : 'Mencari'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('supply')}
                    className={`px-2 py-1.5 text-[0.8125rem] font-bold rounded-xl transition-colors cursor-pointer ${
                      filterType === 'supply'
                        ? roleTheme.segmentedActiveClass
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'Supplying' : 'Membekal'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'District' : 'Daerah'}
                </label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">{isEn ? 'Across Kelantan' : 'Seluruh Kelantan'}</option>
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
            </>
          }
        />

        {/* Grid Kad Visual 3-Lajur Ruang Niaga */}
        {filteredListings.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Megaphone className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
            <p className="text-sm font-bold text-black dark:text-white">
              {isEn ? 'No Ruang Niaga listings match your filter' : 'Tiada iklan Ruang Niaga sepadan dengan carian anda'}
            </p>
            {(searchQuery.trim() !== '' || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterDistrict('all');
                  setSortBy(DEFAULT_SORT_VALUE);
                }}
                className={`mt-3 ${roleTheme.compactSecondaryButtonClass}`}
              >
                {isEn ? 'Reset' : 'Set Semula'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {pagination.paginatedItems.map((item) => (
                <article
                  key={item.id}
                  onClick={() => setDetailListing(item)}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-teal-500 dark:hover:border-zinc-500 transition-colors flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div>
                    <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 overflow-hidden">
                      <PortalImage
                        src={resolveB2BImage(item)}
                        alt={item.title}
                        fallbackType="b2b"
                        fallbackLabel={item.authorBusiness}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>

                    <div className="p-4 sm:p-5 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={`uppercase tracking-wider font-bold ${
                            item.type === 'supply'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.type === 'supply'
                            ? (isEn ? 'Supplying' : 'Membekal')
                            : (isEn ? 'Seeking' : 'Mencari')}
                        </span>
                        <span className="text-black/30 dark:text-white/30">·</span>
                        <span className="text-black/65 dark:text-white/70 truncate">
                          {item.authorBusiness}
                        </span>
                      </div>

                      <h3
                        title={item.title}
                        className="text-base sm:text-lg font-bold text-black dark:text-white leading-snug kbelia-clamp-2 kbelia-trim mt-1.5 group-hover:opacity-85 transition-opacity"
                      >
                        <AcronymText text={item.title} />
                      </h3>

                      <p className="text-sm text-black/65 dark:text-white/70 leading-relaxed kbelia-clamp-2 kbelia-prose mt-1.5">
                        <AcronymText text={item.description} />
                      </p>

                      <div className="mt-3 text-xs text-black/60 dark:text-white/65 truncate tabular-nums">
                        {item.district} · {item.date}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: View Details + Direct WhatsApp CTA */}
                  <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2.5">
                    <span className={`text-xs font-semibold inline-flex items-center gap-1 group-hover:underline whitespace-nowrap ${roleTheme.accentTextClass}`}>
                      <span>{isEn ? 'Details' : 'Butiran'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <a
                      href={buildWhatsAppHref(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={roleTheme.compactPrimaryButtonClass}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Contact' : 'Hubungi'}</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'listings' : 'iklan ruang niaga'}
            />
          </>
        )}
      </div>

      {/* B2B Listing Full Details Modal */}
      {detailListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setDetailListing(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="b2b-detail-modal-title"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 shrink-0 overflow-hidden">
              <PortalImage
                src={resolveB2BImage(detailListing)}
                alt={detailListing.title}
                fallbackType="b2b"
                fallbackLabel={detailListing.authorBusiness}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDetailListing(null)}
                aria-label={isEn ? 'Close details' : 'Tutup butiran'}
                className={`absolute top-3 right-3 ${roleTheme.iconButtonClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <span
                    className={
                      detailListing.type === 'supply'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }
                  >
                    {detailListing.type === 'supply'
                      ? (isEn ? 'Supplying Wholesale' : 'Membekal Borong')
                      : (isEn ? 'Seeking Supplier' : 'Mencari Pembekal')}
                  </span>
                  <span className="text-black/30 dark:text-white/30">·</span>
                  <span className="text-black/60 dark:text-white/65">
                    {detailListing.district}
                  </span>
                </div>
                <h2
                  id="b2b-detail-modal-title"
                  className="font-display text-fluid-title font-extrabold text-black dark:text-white tracking-tight mt-1.5 text-balance kbelia-trim"
                >
                  <AcronymText text={detailListing.title} />
                </h2>
              </div>

              {/* Structured Business Facts Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-y border-slate-200 dark:border-zinc-700 py-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Business Name' : 'Nama Perniagaan'}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {detailListing.authorBusiness}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Contact Person' : 'Rakan Niaga'}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {detailListing.authorName}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'District' : 'Daerah Operasi'}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {detailListing.district}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Posted' : 'Tarikh Siaran'}
                    </span>
                    <span className="font-semibold text-black dark:text-white tabular-nums">
                      {detailListing.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/60">
                  {isEn ? 'Supply & Trade Details' : 'Huraian Bekalan & Permintaan'}
                </h3>
                <p className="text-sm sm:text-base text-black/75 dark:text-white/80 leading-relaxed whitespace-pre-line">
                  {detailListing.description}
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailListing(null)}
                className={`py-2 px-4 text-sm ${roleTheme.secondaryButtonClass}`}
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>

              <a
                href={buildWhatsAppHref(detailListing)}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2.5 px-4 text-sm inline-flex items-center justify-center gap-2 ${roleTheme.primaryButtonClass}`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
