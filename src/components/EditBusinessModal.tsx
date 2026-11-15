import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Edit3, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { BusinessCategory, BusinessListing, KelantanDistrict } from '../types';
import { saveBusinessListing } from '../services/dataService';

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

const DISTRICTS: KelantanDistrict[] = [
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

interface EditBusinessModalProps {
  isOpen: boolean;
  business: BusinessListing | null;
  onClose: () => void;
  onSaved: (updated: BusinessListing) => void;
}

export const EditBusinessModal: React.FC<EditBusinessModalProps> = ({
  isOpen,
  business,
  onClose,
  onSaved
}) => {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Makanan & Minuman (F&B)');
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [ssmNumber, setSsmNumber] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && business) {
      setBusinessName(business.businessName || '');
      setOwnerName(business.ownerName || '');
      setOwnerPhone(business.ownerPhone || '');
      setWhatsapp(business.whatsapp || business.ownerPhone || '');
      setCategory(business.category || 'Makanan & Minuman (F&B)');
      setDistrict(business.district || 'Kota Bharu');
      setSsmNumber(business.ssmNumber || '');
      setBusinessHours(business.businessHours || '');
      setBusinessAddress(business.businessAddress || '');
      setTagline(business.tagline || '');
      setDescription(business.description || '');
      setIsApproved(business.isApproved !== false);
      setIsFeatured(Boolean(business.isFeatured));
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, business]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !business) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setError('Sila masukkan nama perniagaan.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await saveBusinessListing({
        ...business,
        id: business.id,
        ownerId: business.ownerId,
        businessName: trimmedName,
        ownerName: ownerName.trim() || business.ownerName,
        ownerPhone: ownerPhone.trim(),
        whatsapp: whatsapp.trim() || ownerPhone.trim(),
        category,
        district,
        ssmNumber: ssmNumber.trim(),
        businessHours: businessHours.trim(),
        businessAddress: businessAddress.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        isApproved,
        isFeatured
      });
      onSaved(updated);
    } catch (err) {
      console.error('Gagal mengemas kini perniagaan:', err);
      setError('Gagal menyimpan perubahan. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-business-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-business-modal-title" className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                Edit Maklumat Perniagaan
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Ubah suai nama kedai, kategori, lokasi, nombor telefon dan status paparan.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup tetingkap edit"
            className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Perniagaan <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Masukkan nama perniagaan"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Pemilik</label>
              <input
                type="text"
                maxLength={120}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Masukkan nama pemilik"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon</label>
              <input
                type="text"
                maxLength={30}
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setOwnerPhone(e.target.value);
                }}
                placeholder="Masukkan nombor telefon"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori Perniagaan</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Pendaftaran SSM</label>
              <input
                type="text"
                maxLength={50}
                value={ssmNumber}
                onChange={(e) => setSsmNumber(e.target.value)}
                placeholder="Masukkan nombor pendaftaran SSM"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Waktu Operasi</label>
              <input
                type="text"
                maxLength={150}
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="Masukkan waktu operasi"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Alamat Premis</label>
              <input
                type="text"
                maxLength={400}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Masukkan alamat premis"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Slogan Perniagaan</label>
              <input
                type="text"
                maxLength={200}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Masukkan slogan perniagaan"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Keterangan Perniagaan</label>
              <textarea
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan keterangan ringkas mengenai perniagaan"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsApproved(!isApproved)}
              className={`min-h-[42px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isApproved
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-black dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black dark:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isApproved ? 'Status: Aktif' : 'Status: Disembunyikan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`min-h-[42px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isFeatured
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-black dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black dark:text-white'
              }`}
            >
              <Star className="w-4 h-4 shrink-0" />
              <span>{isFeatured ? 'Pilihan Utama (Ya)' : 'Kedai Pilihan'}</span>
            </button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-300 dark:border-slate-600">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[42px] px-6 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
