import React, { useState } from 'react';
import { 
  Network, 
  X, 
  Megaphone, 
  MessageCircle, 
  MapPin, 
  Search, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { B2BListing, KelantanDistrict } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface YouthB2BNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_B2B: B2BListing[] = [
  {
    id: '1',
    authorName: 'Nik Faris',
    authorBusiness: 'Kopi Tok Bali Kiosk',
    district: 'Pasir Puteh',
    type: 'demand',
    title: 'Mencari Pembekal Biji Kopi Robusta Tempatan',
    description: 'Kami memerlukan 15-20kg biji kopi sangai setiap minggu untuk bekalan 2 kiosk di pantai peranginan.',
    whatsapp: '60123456781',
    date: 'Hari ini'
  },
  {
    id: '2',
    authorName: 'Siti Sarah',
    authorBusiness: 'Agro Kelulut Jeli',
    district: 'Jeli',
    type: 'supply',
    title: 'Membekal Madu Kelulut Asli Tulen Gred Eksport',
    description: 'Sedia membekal madu kelulut dalam botol 100ml / 250ml dengan harga borong istimewa kepada peniaga kiosk belia UMK.',
    whatsapp: '60123456782',
    date: 'Semalam'
  },
  {
    id: '3',
    authorName: 'Wan Ammar',
    authorBusiness: 'Warisan Serunding Kg Laut',
    district: 'Tumpat',
    type: 'supply',
    title: 'Membekal Serunding Daging & Ayam Pek Mini Kiosk',
    description: 'Pek kedap udara mudah dipamerkan di rak kiosk. Tahan 6 bulan, disahkan Halal.',
    whatsapp: '60123456783',
    date: '2 hari lepas'
  }
];

export const YouthB2BNetworkModal: React.FC<YouthB2BNetworkModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t, language } = useLanguage();
  const [listings, setListings] = useState<B2BListing[]>(DEFAULT_B2B);
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'supply' | 'demand'>('demand');
  const [newDistrict, setNewDistrict] = useState<KelantanDistrict>('Kota Bharu');

  if (!isOpen) return null;

  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault();
    const item: B2BListing = {
      id: Date.now().toString(),
      authorName: language === 'en' ? 'Your Business' : 'Usahawan Anda',
      authorBusiness: language === 'en' ? 'Youth Business Kiosk' : 'Kiosk Niaga Belia',
      district: newDistrict,
      type: newType,
      title: newTitle,
      description: newDesc,
      whatsapp: '60111234567',
      date: language === 'en' ? 'Just now' : 'Baru sahaja'
    };
    setListings([item, ...listings]);
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
  };

  const filtered = listings.filter(l => filterType === 'all' || l.type === filterType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1E2530] rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-black dark:text-white/75 flex items-center justify-center border border-amber-300/40 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {language === 'en' ? 'Youth Ruang Niaga Supplier & Matchmaking Board' : 'Papan Rangkaian Pembekal & Padanan Ruang Niaga Belia'}
              </h3>
              <span className="text-[11px] font-semibold text-black dark:text-white/75">
                {language === 'en' ? 'Circular Economy Among Kelantan Entrepreneurs' : 'Ekonomi Pusingan Sesama Usahawan Kelantan'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#242D3B] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white dark:bg-[#1E2530] text-black dark:text-white shadow-xs' : 'text-black/70'
              }`}
            >
              {language === 'en' ? `All (${listings.length})` : `Semua (${listings.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'demand' ? 'bg-white dark:bg-[#1E2530] text-black dark:text-white/75 shadow-xs' : 'text-black/70'
              }`}
            >
              {language === 'en' ? 'Seeking Supplies' : 'Mencari Bekalan'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'supply' ? 'bg-white dark:bg-[#1E2530] text-black dark:text-white/75 shadow-xs' : 'text-black/70'
              }`}
            >
              {language === 'en' ? 'Supplying Goods' : 'Membekal Stok'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="py-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isAdding ? (language === 'en' ? 'Close' : 'Tutup') : (language === 'en' ? 'Post Listing' : 'Siar Padanan')}</span>
          </button>
        </div>

        {/* Add Listing Form */}
        {isAdding && (
          <form onSubmit={handleAddListing} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#242D3B] border border-slate-200 dark:border-slate-750 mb-5 space-y-3 text-xs animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-black dark:text-white">
                  {language === 'en' ? 'Listing Type:' : 'Jenis Padanan:'}
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-200 dark:border-slate-700 text-black dark:text-white"
                >
                  <option value="demand">{language === 'en' ? 'Seeking Supplies / Materials' : 'Mencari Bahan / Pembekal'}</option>
                  <option value="supply">{language === 'en' ? 'Supplying Stock / Products' : 'Membekal Stok / Produk'}</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-black dark:text-white">
                  {language === 'en' ? 'District:' : 'Jajahan:'}
                </label>
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-200 dark:border-slate-700 text-black dark:text-white"
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
                {language === 'en' ? 'Listing Title:' : 'Tajuk Padanan:'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'e.g. Seeking fresh organic Robusta coffee beans...' : 'Contoh: Mencari pembekal biji kopi sangai Robusta segar...'}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-200 dark:border-slate-700 text-black dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-black dark:text-white">
                {language === 'en' ? 'Description & Quantity Needed:' : 'Penerangan Kuantiti & Spesifikasi:'}
              </label>
              <textarea
                rows={2}
                required
                placeholder={language === 'en' ? 'Specify estimated quantity, target price, delivery frequency...' : 'Nyatakan anggaran kuantiti, harga sasaran, kekerapan penghantaran...'}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2530] border border-slate-200 dark:border-slate-700 text-black dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-black dark:text-white font-semibold cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors"
              >
                {language === 'en' ? 'Publish Listing' : 'Hantar Siaran'}
              </button>
            </div>
          </form>
        )}

        {/* Listings Cards */}
        <div className="flex flex-col gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1E2530] hover:border-amber-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.type === 'supply'
                      ? 'bg-emerald-100 text-black dark:bg-emerald-950/80 dark:text-white'
                      : 'bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white'
                  }`}>
                    {item.type === 'supply' 
                      ? (language === 'en' ? 'Supplying Stock' : 'Membekal Stok') 
                      : (language === 'en' ? 'Seeking Supplies' : 'Mencari Pembekal')}
                  </span>
                  <span className="text-[10px] text-black/70 dark:text-white/75 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.district} · {item.date}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-black dark:text-white leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-black/70 dark:text-white/75 font-medium">
                  {item.authorBusiness} ({item.authorName})
                </span>

                <a
                  href={`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(
                    language === 'en'
                      ? `Hi ${item.authorName}, I saw your Ruang Niaga matchmaking post "${item.title}" on the Kelantan Youth Business Portal.`
                      : `Salam ${item.authorName}, saya melihat siaran padanan Ruang Niaga anda "${item.title}" di Portal Niaga Belia Kelantan.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Discuss on WhatsApp' : 'Bincang di WhatsApp'}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
