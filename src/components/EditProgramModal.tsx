import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Edit3, AlertCircle, Star } from 'lucide-react';
import { YouthProgram } from '../types';
import { saveProgram } from '../services/dataService';

interface EditProgramModalProps {
  isOpen: boolean;
  program: YouthProgram | null;
  onClose: () => void;
  onSaved: (updated: YouthProgram) => void;
}

export const EditProgramModal: React.FC<EditProgramModalProps> = ({
  isOpen,
  program,
  onClose,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<YouthProgram['category']>('Geran & Dana');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && program) {
      setTitle(program.title || '');
      setCategory(program.category || 'Geran & Dana');
      setDate(program.date || '');
      setLocation(program.location || '');
      setOrganizer(program.organizer || '');
      setGrantAmount(program.grantAmount || '');
      setRegistrationLink(program.registrationLink || '');
      setDescription(program.description || '');
      setIsFeatured(Boolean(program.isFeatured));
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, program]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !program) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Sila masukkan tajuk program atau geran.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await saveProgram({
        ...program,
        id: program.id,
        title: trimmedTitle,
        category,
        date: date.trim() || 'Sepanjang Bulan',
        location: location.trim() || 'Kelantan',
        organizer: organizer.trim() || 'KBelia Kelantan',
        grantAmount: grantAmount.trim(),
        registrationLink: registrationLink.trim() || '#',
        description: description.trim(),
        isFeatured,
        createdAt: program.createdAt
      });
      onSaved(updated);
    } catch (err) {
      console.error('Gagal mengemas kini program:', err);
      setError('Gagal menyimpan perubahan program. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-program-modal-title"
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
              <h3 id="edit-program-modal-title" className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Edit Program &amp; Geran Belia
              </h3>
              <p className="text-[11px] text-slate-600 truncate">
                Ubah suai tajuk, kategori, tarikh, lokasi, jumlah bantuan dan penerangan program.
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Tajuk Program / Geran <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as YouthProgram['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 cursor-pointer"
              >
                <option value="Geran & Dana">Geran &amp; Dana</option>
                <option value="Bengkel & Latihan">Bengkel &amp; Latihan</option>
                <option value="Pameran & Ekspo">Pameran &amp; Ekspo</option>
                <option value="Pitching & Inkubasi">Pitching &amp; Bengkel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Nilai Bantuan / Yuran</label>
              <input
                type="text"
                maxLength={100}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="cth. RM3,000 / Percuma"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Tarikh / Tempoh</label>
              <input
                type="text"
                maxLength={100}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="cth. Dibuka setiap bulan"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Lokasi</label>
              <input
                type="text"
                maxLength={150}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Penganjur</label>
              <input
                type="text"
                maxLength={120}
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Pautan Pendaftaran</label>
              <input
                type="text"
                maxLength={500}
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="cth. # atau https://..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Info &amp; Syarat Program</label>
              <textarea
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={`w-full min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isFeatured
                ? 'bg-amber-50 border-amber-400 text-amber-800'
                : 'bg-slate-50 border-slate-300 text-slate-600'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>{isFeatured ? 'Program Pilihan Utama (Ya)' : 'Tandakan Sebagai Program Pilihan'}</span>
          </button>

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
