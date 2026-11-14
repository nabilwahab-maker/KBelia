import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { CapsuleSlot, KelantanDistrict, SlotStatus } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { saveCapsuleSlot } from '../services/dataService';

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

interface EditSlotModalProps {
  isOpen: boolean;
  slot: CapsuleSlot | null;
  onClose: () => void;
  onSaved: (updated: CapsuleSlot) => void;
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  isOpen,
  slot,
  onClose,
  onSaved
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hubLocation, setHubLocation] = useState('');
  const [district, setDistrict] = useState<KelantanDistrict>('Bachok');
  const [size, setSize] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('150');
  const [dailyRate, setDailyRate] = useState('15');
  const [status, setStatus] = useState<SlotStatus>('available');
  const [currentTenantBusinessName, setCurrentTenantBusinessName] = useState('');
  const [amenities, setAmenities] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/generated/kiosk_modular_kbelia.jpg');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && slot) {
      setCode(slot.code || '');
      setName(slot.name || '');
      setHubLocation(slot.hubLocation || '');
      setDistrict(slot.district || 'Bachok');
      setSize(slot.size || '10ft x 10ft Kiosk Pintar');
      setMonthlyRate(String(slot.monthlyRate ?? 150));
      setDailyRate(String(slot.dailyRate ?? 15));
      setStatus(slot.status || 'available');
      setCurrentTenantBusinessName(slot.currentTenantBusinessName || '');
      setAmenities(Array.isArray(slot.amenities) ? slot.amenities.join(', ') : '');
      setImageUrl(slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, slot]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const parsedMonthly = parseFloat(monthlyRate);
    const parsedDaily = parseFloat(dailyRate);

    if (!trimmedCode || !trimmedName) {
      setError('Sila masukkan kod dan nama kiosk.');
      return;
    }
    if (isNaN(parsedMonthly) || parsedMonthly < 0) {
      setError('Sila masukkan kadar sewa bulanan yang sah.');
      return;
    }

    try {
      setIsSaving(true);
      const amenitiesList = amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await saveCapsuleSlot({
        ...slot,
        id: slot.id,
        code: trimmedCode,
        name: trimmedName,
        hubLocation: hubLocation.trim() || slot.hubLocation,
        district,
        size: size.trim() || '10ft x 10ft Kiosk Pintar',
        monthlyRate: parsedMonthly,
        dailyRate: isNaN(parsedDaily) ? Math.round(parsedMonthly / 10) : parsedDaily,
        status,
        currentTenantBusinessName: status === 'available' ? '' : currentTenantBusinessName.trim(),
        currentTenantId: status === 'available' ? '' : (slot.currentTenantId || ''),
        amenities: amenitiesList.length > 0 ? amenitiesList : ['Elektrik', 'WiFi'],
        imageUrl: imageUrl.trim() || '/assets/generated/kiosk_modular_kbelia.jpg',
        createdAt: slot.createdAt
      });
      onSaved(updated);
    } catch (err) {
      console.error('Gagal mengemas kini slot kiosk:', err);
      setError('Gagal menyimpan perubahan slot kiosk. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-slot-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl border border-slate-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-slot-modal-title" className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Edit Maklumat Slot Kiosk
              </h3>
              <p className="text-[11px] text-slate-600 truncate">
                Ubah suai kod, nama kiosk, lokasi, kadar sewa bulanan dan status semasa.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup tetingkap edit"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Kod Kiosk <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Nama Kiosk <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Lokasi Tapak / Hub</label>
              <input
                type="text"
                maxLength={150}
                value={hubLocation}
                onChange={(e) => setHubLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Jajahan</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 cursor-pointer"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Sewa Bulanan (RM) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Saiz Unit</label>
              <input
                type="text"
                maxLength={50}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Status Semasa</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SlotStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 cursor-pointer"
              >
                <option value="available">Kosong (Boleh Mohon)</option>
                <option value="occupied">Sedang Beroperasi</option>
                <option value="reserved">Ditempah</option>
                <option value="maintenance">Dalam Selenggaraan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Nama Penyewa (Jika Ada)</label>
              <input
                type="text"
                maxLength={150}
                disabled={status === 'available'}
                value={status === 'available' ? '' : currentTenantBusinessName}
                onChange={(e) => setCurrentTenantBusinessName(e.target.value)}
                placeholder={status === 'available' ? 'Tiada penyewa (kosong)' : 'cth. Kopi & Kuih Bachok'}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Kemudahan (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="Palam Elektrik, WiFi 500Mbps, Rak Paparan"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageDropzone
                label="Gambar Kiosk"
                value={imageUrl}
                onChange={(val) => setImageUrl(val)}
                aspectRatio="16:9"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-300">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[42px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
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
