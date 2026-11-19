import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  MessageCircle
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

export const B2BMarketSection: React.FC = () => {
  const { language } = useLanguage();
  const { user, isDemoSession } = useAuth();
  const isEn = language === 'en';

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

  const pagination = usePagination(filteredListings, 7, [
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
    <div className="w-full space-y-4">
      {/* Compact Standardized Module Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700">
        <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
          {isEn ? 'Supply Network & Commercial Ads' : 'Rangkaian Bekalan & Ruang Niaga'}
        </h1>
        <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1">
          {isEn
            ? 'Browse verified local products, source wholesale goods, and connect with partner merchants across Kelantan.'
            : 'Teroka produk tempatan, dapatkan stok borong, dan hubungi rakan niaga di seluruh Kelantan.'}
        </p>
      </div>

      {/* Ruang Niaga: Carian, Penapis Bersepadu, Senarai Baris & Halaman Bernombor */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={isEn ? 'Search ad title, business or district...' : 'Cari tajuk iklan, perniagaan atau daerah...'}
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
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'Listing Type' : 'Jenis Iklan'}
                </label>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-2xs border border-slate-200 dark:border-zinc-600'
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'All' : 'Semua'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('demand')}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterType === 'demand'
                        ? 'bg-teal-600 text-white shadow-2xs dark:bg-teal-600'
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'Seeking' : 'Mencari'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('supply')}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterType === 'supply'
                        ? 'bg-teal-600 text-white shadow-2xs dark:bg-teal-600'
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {isEn ? 'Supplying' : 'Membekal'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
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

        {/* Senarai Menegak Ruang Niaga */}
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
                }}
                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white transition-colors cursor-pointer"
              >
                {isEn ? 'Reset Filters' : 'Set Semula Penapis'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0">
                      <PortalImage
                        src={resolveB2BImage(item)}
                        alt={item.title}
                        fallbackType="b2b"
                        fallbackLabel={item.authorBusiness}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                          {item.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 ${
                            item.type === 'supply'
                              ? 'bg-emerald-50 text-black border-emerald-200 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-800'
                              : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/50 dark:text-white dark:border-amber-800'
                          }`}
                        >
                          {item.type === 'supply'
                            ? (isEn ? 'Supplying' : 'Membekal')
                            : (isEn ? 'Seeking' : 'Mencari')}
                        </span>
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                        {item.authorBusiness} ({item.authorName}) · {item.district} · {item.date} · {item.description}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${item.whatsapp}?text=Salam%20${encodeURIComponent(item.authorName)},%20saya%20melihat%20iklan%20Ruang%20Niaga%20anda%20di%20Portal%20KBelia:%20${encodeURIComponent(item.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isEn ? 'Connect via WhatsApp' : 'Hubungi Rakan Niaga'}</span>
                  </a>
                </div>
              ))}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'listings' : 'iklan ruang niaga'}
              accent="teal"
            />
          </>
        )}
      </div>
    </div>
  );
};
