import React, { useState } from 'react';
import { 
  Network, 
  Megaphone,
  Send,
  MessageCircle, 
  MapPin, 
  Search, 
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Tag,
  Share2,
  PackageCheck,
  Building2,
  X
} from 'lucide-react';
import { B2BListing, KelantanDistrict } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from './ToastNotification';
import confetti from 'canvas-confetti';

const INITIAL_B2B_LISTINGS: B2BListing[] = [
  {
    id: 'b2b-1',
    authorName: 'Nik Faris',
    authorBusiness: 'Kopi Tok Bali Kiosk',
    district: 'Pasir Puteh',
    type: 'demand',
    title: 'Mencari Pembekal Biji Kopi Sangai Tempatan',
    description: 'Memerlukan bekalan tetap 15-20kg biji kopi gred premium setiap minggu untuk 2 cawangan kiosk belia.',
    whatsapp: '60123456781',
    date: 'Hari ini'
  },
  {
    id: 'b2b-2',
    authorName: 'Siti Sarah',
    authorBusiness: 'Agro Kelulut Jeli',
    district: 'Jeli',
    type: 'supply',
    title: 'Membekal Madu Kelulut Asli & Jar Kiosk',
    description: 'Sedia membekal botol kaca 100ml / 250ml siap label taweez dengan harga borong margin 40% kepada usahawan kiosk.',
    whatsapp: '60123456782',
    date: 'Semalam'
  },
  {
    id: 'b2b-3',
    authorName: 'Wan Ammar',
    authorBusiness: 'Warisan Serunding Kg Laut',
    district: 'Tumpat',
    type: 'supply',
    title: 'Membekal Serunding Daging & Ayam Pek Mini Kiosk',
    description: 'Pek zip lock mesra rak kiosk. Tahan 6 bulan, pensijilan Halal JAKIM, minimum pesanan borong serendah 20 pek.',
    whatsapp: '60123456783',
    date: '2 hari lepas'
  },
  {
    id: 'b2b-4',
    authorName: 'Ahmad Faizul',
    authorBusiness: 'Keropok Lekor Crispy Kota Bharu',
    district: 'Kota Bharu',
    type: 'demand',
    title: 'Mencari Pembekal Kotak Pembungkusan & Biodegradable Cup',
    description: 'Perlu 1,000 unit kotak kustom bertemakan kraftangan Kelantan untuk produk kudapan belia.',
    whatsapp: '60199123456',
    date: '3 hari lepas'
  }
];

export const B2BMarketSection: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [listings, setListings] = useState<B2BListing[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_b2b_listings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_B2B_LISTINGS;
  });

  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);

  // New Listing Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'supply' | 'demand'>('demand');
  const [newBusiness, setNewBusiness] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDistrict, setNewDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [newDesc, setNewDesc] = useState('');
  const [newWhatsApp, setNewWhatsApp] = useState('');

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBusiness.trim() || !newWhatsApp.trim()) {
      showToast(isEn ? 'Please fill in all required fields!' : 'Sila lengkapkan semua ruangan wajib!');
      return;
    }

    const cleanPhone = newWhatsApp.replace(/\D/g, '');
    const item: B2BListing = {
      id: `b2b-${Date.now()}`,
      authorName: newAuthor.trim() || 'Usahawan Belia',
      authorBusiness: newBusiness.trim(),
      district: newDistrict,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      whatsapp: cleanPhone.startsWith('60') ? cleanPhone : `60${cleanPhone.replace(/^0/, '')}`,
      date: 'Baru sahaja'
    };

    const updated = [item, ...listings];
    setListings(updated);
    try {
      localStorage.setItem('kbelia_b2b_listings', JSON.stringify(updated));
    } catch (err) {
      // ignore
    }

    confetti({ particleCount: 30, spread: 50 });
    setIsPostingModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewBusiness('');
    showToast(isEn ? 'Advertisement published successfully!' : 'Iklan perniagaan belia berjaya disiarkan!');
  };

  const filteredListings = listings.filter((item) => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchDist = filterDistrict === 'all' || item.district === filterDistrict;
    const matchSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorBusiness.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchDist && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-800 via-red-900 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-white/10">
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isEn ? 'Youth Ads & Commercial Opportunities' : 'Ruang Iklan & Peluang Niaga Belia'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isEn ? 'Youth Commercial Ads & Business Opportunities' : 'Pemandangan Belia & Siarkan Iklan Niaga'}
          </h1>
          <p className="text-xs sm:text-sm text-red-100/90 mt-2 leading-relaxed">
            {isEn
              ? 'A dedicated platform for youth entrepreneurs to advertise commercial offers, find local business supplies, and explore trade partnerships across 10 Kelantan districts.'
              : 'Platform khas untuk usahawan belia menyiarkan iklan perniagaan, tawaran produk, mencari bekalan tempatan dan memupuk kerjasama niaga di seluruh 10 jajahan Kelantan.'}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#24303F] rounded-2xl p-4 border border-slate-200 dark:border-[#2E3A47] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isEn ? 'Search supplies, ingredients, packaging...' : 'Cari bekalan, ramuan, pembungkusan...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-[#1A222C] p-1 border border-slate-200 dark:border-[#2E3A47]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#24303F] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isEn ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'demand'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isEn ? 'Seeking / Demand' : 'Mencari'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'supply'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isEn ? 'Supplying / Wholesale' : 'Membekal'}
            </button>
          </div>

          {/* District Select */}
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
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
            onClick={() => setIsPostingModalOpen(true)}
            className="interactive-press interactive-lift px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span>{isEn ? 'Post Advertisement' : 'Siarkan Iklan'}</span>
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="interactive-card bg-white dark:bg-[#24303F] rounded-3xl p-5 border border-slate-200 dark:border-[#2E3A47] hover:border-amber-400/40 dark:hover:border-amber-400/40 shadow-xs flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    item.type === 'supply'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/40'
                  }`}
                >
                  {item.type === 'supply' ? (isEn ? 'Supplying / Wholesale' : 'Membekal (Tawaran)') : (isEn ? 'Seeking Supply' : 'Mencari Bekalan')}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {item.date}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200">
                  {item.title}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.authorBusiness}</span>
                  <span>•</span>
                  <span>{item.authorName}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {item.description}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-amber-400 shrink-0" />
                <span>{item.district}</span>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#2E3A47]">
              <a
                href={`https://wa.me/${item.whatsapp}?text=Salam%20${encodeURIComponent(item.authorName)},%20saya%20melihat%20iklan%20B2B%20anda%20di%20Portal%20KBELIA:%20${encodeURIComponent(item.title)}`}
                target="_blank"
                rel="noreferrer"
                className="interactive-press interactive-lift w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isEn ? 'Connect via WhatsApp' : 'Hubungi Rakan Niaga'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* New Listing Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsPostingModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-red-600 dark:text-amber-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isEn ? 'Post Youth Business Advertisement' : 'Siarkan Iklan Perniagaan Belia'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPostingModalOpen(false)}
                className="interactive-press p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:rotate-90 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Notice Category' : 'Jenis Iklan'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('demand')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      newType === 'demand'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-[#1A222C] dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isEn ? 'Seeking Supply' : 'Mencari Pembekal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('supply')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      newType === 'supply'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-[#1A222C] dark:text-slate-400 dark:border-slate-700'
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'District' : 'Jajahan Operasi'}
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'WhatsApp Phone' : 'Nombor WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Nombor telefon"
                    value={newWhatsApp}
                    onChange={(e) => setNewWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs"
                >
                  {isEn ? 'Publish Notice' : 'Siarkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
