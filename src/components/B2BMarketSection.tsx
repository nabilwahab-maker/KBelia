import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  MessageCircle,
  MapPin,
  Search
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

    const recomputeListings = () => {
      const deletedSet = new Set(getDeletedIds());
      const localItems = loadLocalB2B();
      const prodAuth = isProductionAuthenticated();
      const lists = prodAuth
        ? [firestoreItems, demoSyncItems, localItems, INITIAL_B2B_LISTINGS]
        : [demoSyncItems, localItems, firestoreItems, INITIAL_B2B_LISTINGS];
      setListings(
        mergeUniqueById<B2BListing>(lists).filter((x) => !deletedSet.has(x.id))
      );
    };

    recomputeListings();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'b2b') {
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

    const unsubDemoSync = subscribeDemoSyncCollection<B2BListing>('b2b', (items) => {
      demoSyncItems = items;
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

  const filteredListings = listings.filter((item) => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchDist = filterDistrict === 'all' || item.district === filterDistrict;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.authorBusiness.toLowerCase().includes(q);
    return matchType && matchDist && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Compact Standardized Module Header */}
      <div className="p-4 rounded-xl kbelia-important-header border border-slate-300 dark:border-zinc-600">
        <div className="flex items-center gap-2 text-black dark:text-white/75 text-xs font-bold uppercase tracking-wider mb-1">
          <Megaphone className="w-4 h-4" />
          <span>{isEn ? 'Commercial & Supply Hub' : 'Ruang Niaga & Bekalan'}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">
          {isEn ? 'Supply Network & Commercial Ads' : 'Rangkaian Bekalan & Ruang Niaga'}
        </h1>
        <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
          {isEn
            ? 'Browse verified local products, source wholesale supplies, and connect with partner merchants across Kelantan.'
            : 'Teroka produk tempatan, dapatkan bekalan borong, dan hubungi rakan niaga di seluruh Kelantan.'}
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isEn ? 'Search supplies, ingredients, packaging...' : 'Cari bekalan, ramuan, pembungkusan...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Toggle */}
          <div className="flex rounded-lg bg-slate-50 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-xs border border-slate-300 dark:border-slate-600'
                  : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              {isEn ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'demand'
                  ? 'bg-teal-600 text-white shadow-xs dark:bg-teal-600'
                  : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              {isEn ? 'Seeking / Demand' : 'Mencari'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'supply'
                  ? 'bg-teal-600 text-white shadow-xs dark:bg-teal-600'
                  : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              {isEn ? 'Supplying / Wholesale' : 'Membekal'}
            </button>
          </div>

          {/* District Select */}
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
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
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 py-14 text-center">
          <Megaphone className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
          <p className="text-sm font-bold text-black dark:text-white">
            {isEn ? 'No Ruang Niaga listings match your filter' : 'Tiada iklan Ruang Niaga sepadan dengan carian anda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-teal-500/70 shadow-xs overflow-hidden flex flex-col justify-between group transition-colors"
            >
              <div>
                <div className="aspect-4/3 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-300 dark:border-slate-600">
                  <PortalImage
                    src={resolveB2BImage(item)}
                    alt={item.title}
                    fallbackType="b2b"
                    fallbackLabel={item.authorBusiness}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        item.type === 'supply'
                          ? 'bg-emerald-50 text-black border-emerald-200 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-900/40'
                          : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/50 dark:text-white dark:border-amber-800/40'
                      }`}
                    >
                      {item.type === 'supply'
                        ? (isEn ? 'Supplying / Wholesale' : 'Membekal (Tawaran)')
                        : (isEn ? 'Seeking Supply' : 'Mencari Bekalan')}
                    </span>
                    <span className="text-[11px] text-black/70 dark:text-white/75 font-mono tabular-nums">
                      {item.date}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <div className="text-[11px] text-black/70 dark:text-white/75 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="font-semibold text-black dark:text-white">{item.authorBusiness}</span>
                      <span>·</span>
                      <span>{item.authorName}</span>
                    </div>
                  </div>

                  <p className="text-xs text-black/85 dark:text-white/85 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-black/70 dark:text-white/75 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                    <span>{item.district}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Call to Action */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <a
                  href={`https://wa.me/${item.whatsapp}?text=Salam%20${encodeURIComponent(item.authorName)},%20saya%20melihat%20iklan%20Ruang%20Niaga%20anda%20di%20Portal%20KBelia:%20${encodeURIComponent(item.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 dark:bg-teal-600"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isEn ? 'Connect via WhatsApp' : 'Hubungi Rakan Niaga'}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
