import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  MessageCircle,
  MapPin,
  Search,
  X
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { B2BListing, KelantanDistrict } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { saveB2BListingRecord } from '../services/dataService';
import { showToast } from './ToastNotification';

const INITIAL_B2B_LISTINGS: B2BListing[] = [
  {
    id: 'b2b-1',
    ownerId: 'demo-tenant-1',
    authorName: 'Ahmad Faizul',
    authorBusiness: "D'Kelate Artisan Coffee & Akok Tart",
    district: 'Bachok',
    type: 'demand',
    title: 'Mencari Pembekal Biji Kopi Sangai Tempatan',
    description: 'Memerlukan bekalan tetap 15-20kg biji kopi gred premium setiap minggu untuk operasi kiosk belia.',
    whatsapp: '60123456781',
    date: 'Hari ini'
  },
  {
    id: 'b2b-2',
    ownerId: 'demo-tenant-3',
    authorName: 'Harith Iskandar',
    authorBusiness: 'Aroma Dapur Pantai',
    district: 'Tumpat',
    type: 'supply',
    title: 'Membekal Pes Masakan & Sambal Siap Pek Kiosk',
    description: 'Sedia membekal pek borong sambal bilis dan pes masakan Pantai Timur dengan margin 35% kepada pengusaha kiosk.',
    whatsapp: '60123456782',
    date: 'Semalam'
  },
  {
    id: 'b2b-3',
    ownerId: 'demo-tenant-2',
    authorName: 'Nur Syafiqah',
    authorBusiness: 'Batik Belia Kontemporari',
    district: 'Kota Bharu',
    type: 'supply',
    title: 'Tempahan Seragam Batik & Totebag Korporat Belia',
    description: 'Menerima tempahan borong apron kiosk, baju seragam pasukan niaga dan cenderamata batik Kelantan.',
    whatsapp: '60123456783',
    date: '2 hari lepas'
  }
];

export const B2BMarketSection: React.FC = () => {
  const { language } = useLanguage();
  const { user, userProfile, isDemoSession } = useAuth();
  const isEn = language === 'en';

  const [listings, setListings] = useState<B2BListing[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_b2b_listings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_B2B_LISTINGS;
  });

  useEffect(() => {
    if (!user || isDemoSession || !auth.currentUser) {
      try {
        const saved = localStorage.getItem('kbelia_b2b_listings');
        if (saved) setListings(JSON.parse(saved));
        else setListings(INITIAL_B2B_LISTINGS);
      } catch {
        setListings(INITIAL_B2B_LISTINGS);
      }
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'b2b_listings'),
      (snap) => {
        const remote: B2BListing[] = [];
        snap.forEach((docSnap) => remote.push(docSnap.data() as B2BListing));
        if (remote.length > 0) {
          const merged = [
            ...remote,
            ...INITIAL_B2B_LISTINGS.filter((init) => !remote.some((r) => r.id === init.id))
          ];
          setListings(merged);
        } else {
          setListings(INITIAL_B2B_LISTINGS);
        }
      },
      () => {
        // Silent fallback to defaults if collection empty or rules restrict
      }
    );

    return () => unsubscribe();
  }, [user, isDemoSession]);

  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Listing Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'supply' | 'demand'>('demand');
  const [newBusiness, setNewBusiness] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDistrict, setNewDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [newDesc, setNewDesc] = useState('');
  const [newWhatsApp, setNewWhatsApp] = useState('');

  const openModalWithPrefill = () => {
    setNewAuthor((prev) => prev || userProfile?.fullName || '');
    setNewBusiness((prev) => prev || userProfile?.businessName || '');
    setNewWhatsApp((prev) => prev || userProfile?.whatsapp || userProfile?.phone || '');
    if (userProfile?.district && userProfile.district !== 'Semua Jajahan') {
      setNewDistrict(userProfile.district as KelantanDistrict);
    }
    setIsPostingModalOpen(true);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBusiness.trim() || !newWhatsApp.trim()) {
      showToast({
        type: 'error',
        title: isEn ? 'Incomplete Form' : 'Maklumat Tidak Lengkap',
        message: isEn ? 'Please fill in all required fields.' : 'Sila lengkapkan semua ruangan wajib.'
      });
      return;
    }

    const cleanPhone = newWhatsApp.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      showToast({
        type: 'error',
        title: isEn ? 'Invalid Phone Number' : 'Nombor Telefon Tidak Sah',
        message: isEn ? 'Please enter a valid WhatsApp number.' : 'Sila masukkan nombor WhatsApp yang sah.'
      });
      return;
    }

    setIsSubmitting(true);
    const item: B2BListing = {
      id: `b2b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ownerId: user?.uid || 'guest',
      authorName: newAuthor.trim() || userProfile?.fullName || 'Usahawan Belia',
      authorBusiness: newBusiness.trim(),
      district: newDistrict,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      whatsapp: cleanPhone.startsWith('60') ? cleanPhone : `60${cleanPhone.replace(/^0/, '')}`,
      date: isEn ? 'Just now' : 'Baru sahaja'
    };

    try {
      await saveB2BListingRecord(item);
      setListings((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
      setIsPostingModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      showToast({
        type: 'success',
        title: isEn ? 'Advertisement Published' : 'Iklan Berjaya Disiarkan',
        message: item.title
      });
    } catch {
      showToast({
        type: 'error',
        title: isEn ? 'Failed to Publish' : 'Gagal Menyiarkan Iklan',
        message: isEn ? 'Please try again shortly.' : 'Sila cuba sebentar lagi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-1.5">
            {isEn ? 'Youth B2B Ads & Commercial Opportunities' : 'Ruang Iklan B2B & Peluang Niaga Belia'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            {isEn ? 'Youth Commercial Ads & Supply Network' : 'Rangkaian Bekalan & Iklan Niaga Belia'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {isEn
              ? 'A dedicated platform for youth entrepreneurs to advertise commercial offers, find local business supplies, and explore trade partnerships across 10 Kelantan districts.'
              : 'Platform khas untuk usahawan belia menyiarkan iklan perniagaan, tawaran bekalan borong, mencari bahan mentah tempatan, dan memupuk kerjasama niaga di seluruh 10 jajahan Kelantan.'}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isEn ? 'Search supplies, ingredients, packaging...' : 'Cari bekalan, ramuan, pembungkusan...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Toggle */}
          <div className="flex rounded-lg bg-slate-50 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'demand'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Seeking / Demand' : 'Mencari'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                filterType === 'supply'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Supplying / Wholesale' : 'Membekal'}
            </button>
          </div>

          {/* District Select */}
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="all">{isEn ? 'All Districts' : 'Semua Jajahan'}</option>
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

          {/* Post New Listing Button */}
          <button
            type="button"
            onClick={openModalWithPrefill}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Megaphone className="w-3.5 h-3.5 text-sky-100" />
            <span>{isEn ? 'Post Advertisement' : 'Siarkan Iklan'}</span>
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-14 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'No B2B listings match your filter' : 'Tiada iklan B2B sepadan dengan carian anda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-sky-400 shadow-xs flex flex-col justify-between group transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      item.type === 'supply'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40'
                    }`}
                  >
                    {item.type === 'supply'
                      ? (isEn ? 'Supplying / Wholesale' : 'Membekal (Tawaran)')
                      : (isEn ? 'Seeking Supply' : 'Mencari Bekalan')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {item.date}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.authorBusiness}</span>
                    <span>·</span>
                    <span>{item.authorName}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>{item.district}</span>
                </div>
              </div>

              {/* Direct WhatsApp Call to Action */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <a
                  href={`https://wa.me/${item.whatsapp}?text=Salam%20${encodeURIComponent(item.authorName)},%20saya%20melihat%20iklan%20B2B%20anda%20di%20Portal%20KBelia:%20${encodeURIComponent(item.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isEn ? 'Connect via WhatsApp' : 'Hubungi Rakan Niaga'}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Listing Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsPostingModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl z-10 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  {isEn ? 'Post Youth Business Advertisement' : 'Siarkan Iklan Perniagaan Belia'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPostingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label={isEn ? 'Close modal' : 'Tutup modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Notice Category' : 'Jenis Iklan'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('demand')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      newType === 'demand'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isEn ? 'Seeking Supply' : 'Mencari Pembekal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('supply')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      newType === 'supply'
                        ? 'bg-sky-600 text-white border-sky-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isEn ? 'Supplying / Wholesale' : 'Tawarkan Bekalan Borong'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Title / What do you offer or need?' : 'Tajuk Iklan / Apa yang anda tawar atau cari?'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'State listing title...' : 'Tajuk tawaran atau keperluan bekalan...'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Business Name' : 'Nama Perniagaan'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama perniagaan anda"
                    value={newBusiness}
                    onChange={(e) => setNewBusiness(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'District' : 'Jajahan Operasi'}
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Contact Person' : 'Nama Wakil'}
                  </label>
                  <input
                    type="text"
                    placeholder="Nama anda"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'WhatsApp Phone' : 'Nombor WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0123456789"
                    value={newWhatsApp}
                    onChange={(e) => setNewWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Details / Specifications' : 'Penerangan Terperinci'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isEn ? 'State volume, price terms, delivery location...' : 'Nyatakan kuantiti, harga anggaran borong, syarat penghantaran...'}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white resize-none focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting
                    ? (isEn ? 'Publishing...' : 'Menyiarkan...')
                    : (isEn ? 'Publish Notice' : 'Siarkan Sekarang')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
