import React, { useEffect, useState } from 'react';
import { 
  Network, 
  X, 
  Megaphone, 
  MessageCircle, 
  MapPin
} from 'lucide-react';
import { B2BListing, KelantanDistrict } from '../types';
import { INITIAL_B2B_LISTINGS } from '../data/b2bData';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getDeletedIds, saveB2BListingRecord } from '../services/dataService';
import { mergeUniqueById, subscribeCrossTabSync, subscribeDemoSyncCollection } from '../services/realtimeSync';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { showToast } from './ToastNotification';

interface YouthB2BNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YouthB2BNetworkModal: React.FC<YouthB2BNetworkModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useLanguage();
  const { user, userProfile, isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const [listings, setListings] = useState<B2BListing[]>(INITIAL_B2B_LISTINGS);
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'supply' | 'demand'>('demand');
  const [newDistrict, setNewDistrict] = useState<KelantanDistrict>(
    (userProfile?.district as KelantanDistrict) || 'Kota Bharu'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let prodItems: B2BListing[] = [];
    let demoSyncItems: B2BListing[] = [];
    let demoDeletedIds: string[] = [];

    const recompute = () => {
      let localItems: B2BListing[] = [];
      try {
        const saved = localStorage.getItem('kbelia_b2b_listings');
        if (saved) localItems = JSON.parse(saved);
      } catch {
        // ignore
      }
      const deleted = [...getDeletedIds(), ...demoDeletedIds];
      const merged = mergeUniqueById<B2BListing>(
        [prodItems, demoSyncItems, localItems, INITIAL_B2B_LISTINGS],
        deleted
      );
      setListings(merged);
    };

    recompute();
    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'b2b' || entity === 'deleted') recompute();
    });

    const unsubProd = onSnapshot(
      collection(db, 'b2b_listings'),
      (snap) => {
        prodItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as B2BListing));
        recompute();
      },
      () => {
        recompute();
      }
    );

    const unsubDemo = subscribeDemoSyncCollection<B2BListing>('b2b', (items, delIds) => {
      demoSyncItems = items;
      demoDeletedIds = delIds;
      recompute();
    });

    return () => {
      unsubCrossTab();
      unsubProd();
      unsubDemo();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const cleanContact = (userProfile?.phone || '').replace(/[^0-9]/g, '');
    const formattedWhatsapp = cleanContact
      ? (cleanContact.startsWith('6') ? cleanContact : `6${cleanContact}`)
      : '';

    const item: B2BListing = {
      id: `b2b-${Date.now()}`,
      ownerId: user?.uid || 'guest',
      authorName: userProfile?.fullName || user?.displayName || (language === 'en' ? 'Youth Entrepreneur' : 'Usahawan Belia'),
      authorBusiness: userProfile?.businessName || (language === 'en' ? 'Youth Business Kiosk' : 'Perniagaan Belia KBelia'),
      district: newDistrict,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      whatsapp: formattedWhatsapp,
      date: language === 'en' ? 'Just now' : 'Baru sahaja'
    };

    try {
      setSaving(true);
      const saved = await saveB2BListingRecord(item);
      setListings(prev => [saved, ...prev.filter(x => x.id !== saved.id)]);
      setIsAdding(false);
      setNewTitle('');
      setNewDesc('');
      showToast(language === 'en' ? 'B2B listing published!' : 'Siaran padanan B2B berjaya diterbitkan!', 'success');
    } catch {
      try {
        const existing: B2BListing[] = JSON.parse(localStorage.getItem('kbelia_b2b_listings') || '[]');
        localStorage.setItem('kbelia_b2b_listings', JSON.stringify([item, ...existing.filter(x => x.id !== item.id)]));
        setListings(prev => [item, ...prev.filter(x => x.id !== item.id)]);
        setIsAdding(false);
        setNewTitle('');
        setNewDesc('');
        showToast(language === 'en' ? 'B2B listing saved locally.' : 'Siaran padanan B2B berjaya disimpan.', 'success');
      } catch {
        showToast(language === 'en' ? 'Failed to save listing.' : 'Gagal menyimpan siaran B2B.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = listings.filter(l => filterType === 'all' || l.type === filterType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1E2530] rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-black dark:text-white/75 flex items-center justify-center border border-amber-300/40 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {language === 'en' ? 'Youth Ruang Niaga Supplier & Matchmaking Board' : 'Papan Rangkaian Pembekal & Padanan Ruang Niaga Belia'}
              </h3>
              <span className="text-[0.8125rem] font-semibold text-black dark:text-white/75">
                {language === 'en' ? 'Circular Economy Among Kelantan Entrepreneurs' : 'Ekonomi Pusingan Sesama Usahawan Kelantan'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'en' ? 'Close' : 'Tutup'}
            className={roleTheme.iconButtonClass}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#242D3B] rounded-xl text-sm">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'all' ? `${roleTheme.segmentedActiveClass} shadow-xs` : 'text-black/70 dark:text-white/75'
              }`}
            >
              {language === 'en' ? `All (${listings.length})` : `Semua (${listings.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'demand' ? `${roleTheme.segmentedActiveClass} shadow-xs` : 'text-black/70 dark:text-white/75'
              }`}
            >
              {language === 'en' ? 'Seeking' : 'Mencari'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'supply' ? `${roleTheme.segmentedActiveClass} shadow-xs` : 'text-black/70 dark:text-white/75'
              }`}
            >
              {language === 'en' ? 'Supplying' : 'Membekal'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className={roleTheme.compactPrimaryButtonClass}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isAdding ? (language === 'en' ? 'Close' : 'Tutup') : (language === 'en' ? 'Post' : 'Siar')}</span>
          </button>
        </div>

        {/* Add Listing Form */}
        {isAdding && (
          <form onSubmit={handleAddListing} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#242D3B] border border-slate-300 dark:border-slate-750 mb-5 space-y-3 text-sm animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-black dark:text-white">
                  {language === 'en' ? 'Listing Type' : 'Jenis Padanan'}
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                >
                  <option value="demand">{language === 'en' ? 'Seeking Supplies / Materials' : 'Mencari Bahan / Pembekal'}</option>
                  <option value="supply">{language === 'en' ? 'Supplying Stock / Products' : 'Membekal Stok / Produk'}</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-black dark:text-white">
                  {language === 'en' ? 'District' : 'Daerah'}
                </label>
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                >
                  <option value="Kota Bharu">Kota Bharu</option>
                  <option value="Bachok">Bachok</option>
                  <option value="Pasir Mas">Pasir Mas</option>
                  <option value="Tumpat">Tumpat</option>
                  <option value="Jeli">Jeli</option>
                  <option value="Gua Musang">Gua Musang</option>
                  <option value="Machang">Machang</option>
                  <option value="Pasir Puteh">Pasir Puteh</option>
                  <option value="Tanah Merah">Tanah Merah</option>
                  <option value="Kuala Krai">Kuala Krai</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-black dark:text-white">
                {language === 'en' ? 'Listing Title' : 'Tajuk Iklan'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'Enter listing title' : 'Masukkan tajuk iklan'}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-300 dark:border-slate-600 text-black dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-black dark:text-white">
                {language === 'en' ? 'Description' : 'Keterangan'}
              </label>
              <textarea
                rows={2}
                required
                placeholder={language === 'en' ? 'Enter description' : 'Masukkan keterangan'}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-300 dark:border-slate-600 text-black dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={roleTheme.compactSecondaryButtonClass}
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className={roleTheme.compactPrimaryButtonClass}
              >
                {saving ? (language === 'en' ? 'Publishing...' : 'Menghantar...') : (language === 'en' ? 'Publish' : 'Siar')}
              </button>
            </div>
          </form>
        )}

        {/* Listings Cards */}
        <div className="flex flex-col gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1E2530] hover:border-amber-300 dark:hover:border-slate-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[0.8125rem] font-bold uppercase tracking-wider ${
                    item.type === 'supply'
                      ? 'bg-emerald-100 text-black dark:bg-emerald-950/80 dark:text-white'
                      : 'bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white'
                  }`}>
                    {item.type === 'supply' 
                      ? (language === 'en' ? 'Supplying Stock' : 'Membekal Stok') 
                      : (language === 'en' ? 'Seeking Supplies' : 'Mencari Pembekal')}
                  </span>
                  <span className="text-[0.8125rem] text-black/70 dark:text-white/75 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.district} · {item.date}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-sm">
                <span className="text-black/70 dark:text-white/75 font-medium">
                  {item.authorBusiness} ({item.authorName})
                </span>

                <a
                  href={item.whatsapp ? `https://wa.me/${item.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    language === 'en'
                      ? `Hi ${item.authorName}, I saw your Ruang Niaga matchmaking post "${item.title}" on the Kelantan Youth Business Portal.`
                      : `Salam ${item.authorName}, saya melihat siaran padanan Ruang Niaga anda "${item.title}" di Portal Niaga Belia Kelantan.`
                  )}` : '#'}
                  target={item.whatsapp ? '_blank' : undefined}
                  rel={item.whatsapp ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    if (!item.whatsapp || !item.whatsapp.replace(/[^0-9]/g, '')) {
                      e.preventDefault();
                      showToast(
                        language === 'en'
                          ? 'No WhatsApp phone number listed for this entrepreneur.'
                          : 'Tiada nombor WhatsApp didaftarkan bagi siaran ini.',
                        'warning'
                      );
                    }
                  }}
                  className={roleTheme.compactPrimaryButtonClass}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
