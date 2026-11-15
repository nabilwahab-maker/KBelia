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
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-program-modal-title" className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                Edit Program &amp; Geran Belia
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Ubah suai tajuk, kategori, tarikh, lokasi, jumlah bantuan dan penerangan program.
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
                Tajuk Program <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan tajuk program atau geran"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori Program</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as YouthProgram['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer"
              >
                <option value="Geran & Dana">Geran &amp; Dana</option>
                <option value="Bengkel & Latihan">Bengkel &amp; Latihan</option>
                <option value="Pameran & Ekspo">Pameran &amp; Ekspo</option>
                <option value="Pitching & Inkubasi">Pitching &amp; Bengkel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nilai Bantuan</label>
              <input
                type="text"
                maxLength={100}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="Masukkan nilai bantuan atau yuran"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh Pelaksanaan</label>
              <input
                type="text"
                maxLength={100}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Masukkan tarikh atau tempoh"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Lokasi</label>
              <input
                type="text"
                maxLength={150}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Masukkan lokasi program"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Penganjur</label>
              <input
                type="text"
                maxLength={120}
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Masukkan nama penganjur"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Pautan Pendaftaran</label>
              <input
                type="text"
                maxLength={500}
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="Masukkan pautan pendaftaran"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Keterangan Program</label>
              <textarea
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan maklumat dan syarat program"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={`w-full min-h-[42px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isFeatured
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-black dark:text-white'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black dark:text-white'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>{isFeatured ? 'Pilihan Utama (Ya)' : 'Program Pilihan'}</span>
          </button>

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
