import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Store,
  Check
} from 'lucide-react';
import { CapsuleSlot, BusinessCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { createCapsuleBooking } from '../services/dataService';
import confetti from 'canvas-confetti';
import { showToast } from './ToastNotification';
import { 
  validateMyKad, 
  validateMalaysianPhone, 
  saveFormDraft, 
  loadFormDraft, 
  clearFormDraft,
  maskMyKad 
} from '../utils/securityUtils';

interface BookingModalProps {
  slot?: CapsuleSlot | null;
  selectedSlot?: CapsuleSlot | null;
  allSlots: CapsuleSlot[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onBookingSuccess?: () => void;
}

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

export const BookingModal: React.FC<BookingModalProps> = ({
  slot,
  selectedSlot,
  allSlots = [],
  isOpen,
  onClose,
  onSuccess,
  onBookingSuccess
}) => {
  const activeSlot = selectedSlot !== undefined ? selectedSlot : slot;
  const handleSuccess = onBookingSuccess || onSuccess;
  const { user, userProfile, openLoginModal } = useAuth();
  const safeAllSlots = allSlots || [];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(slot?.id || (safeAllSlots[0]?.id || ''));
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(userProfile?.category || 'Makanan & Minuman (F&B)');
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pitchNotes, setPitchNotes] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [icNumber, setIcNumber] = useState(userProfile?.icNumber || '');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Restore draft if available and reset submission on new open
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setStep(1);
      setError(null);
      setFieldErrors({});

      const draft = loadFormDraft<any>('kiosk_booking');
      if (draft && draft.data && !hasDraftRestored) {
        if (draft.data.businessName) setBusinessName(draft.data.businessName);
        if (draft.data.businessCategory) setBusinessCategory(draft.data.businessCategory);
        if (draft.data.phone) setPhone(draft.data.phone);
        if (draft.data.icNumber) setIcNumber(draft.data.icNumber);
        if (draft.data.pitchNotes) setPitchNotes(draft.data.pitchNotes);
        setHasDraftRestored(true);
      }
    }
  }, [isOpen, hasDraftRestored]);

  // Auto-save form draft on change
  useEffect(() => {
    if (isOpen && businessName) {
      saveFormDraft('kiosk_booking', {
        businessName,
        businessCategory,
        phone,
        icNumber,
        pitchNotes,
        selectedSlotId
      });
    }
  }, [isOpen, businessName, businessCategory, phone, icNumber, pitchNotes, selectedSlotId]);

  // Sync selected slot if prop changes or when modal is opened
  useEffect(() => {
    if (isOpen) {
      if (activeSlot && activeSlot.status === 'available') {
        setSelectedSlotId(activeSlot.id);
      } else if (safeAllSlots.length > 0) {
        const firstAvailable = safeAllSlots.find(s => s && s.status === 'available');
        if (firstAvailable) {
          setSelectedSlotId(firstAvailable.id);
        } else if (activeSlot) {
          setSelectedSlotId(activeSlot.id);
        } else if (safeAllSlots[0]) {
          setSelectedSlotId(safeAllSlots[0].id);
        }
      }
    }
  }, [activeSlot, safeAllSlots, isOpen]);

  if (!isOpen) return null;

  const currentSlot = safeAllSlots.find(s => s && s.id === selectedSlotId) || activeSlot || safeAllSlots[0];

  const handleNextStep = () => {
    setError(null);
    setFieldErrors({});

    if (step === 1) {
      if (!currentSlot) {
        setError('Sila pilih lokasi kiosk yang sah.');
        return;
      }
      if (currentSlot.status !== 'available') {
        setError(`Kapsul ${currentSlot.code} (${currentSlot.name}) sedang beroperasi oleh penyewa berdaftar. Permohonan baharu tidak dibuka bagi unit ini. Sila pilih unit berstatus Tersedia.`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const errors: Record<string, string> = {};

      if (!businessName.trim()) {
        errors.businessName = 'Sila masukkan nama perniagaan atau jenama anda.';
      }

      if (!phone.trim()) {
        errors.phone = 'Sila masukkan nombor telefon untuk dihubungi.';
      } else if (!validateMalaysianPhone(phone)) {
        errors.phone = 'Sila masukkan nombor telefon yang sah.';
      }

      if (icNumber.trim()) {
        const icValidation = validateMyKad(icNumber);
        if (!icValidation.isValid) {
          errors.icNumber = icValidation.errorMessage || 'Sila masukkan nombor MyKad 12 digit yang sah.';
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Sila periksa dan betulkan maklumat yang bertanda merah di bawah.');
        return;
      }

      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Sila log masuk dengan akaun Google terlebih dahulu untuk memohon.');
      return;
    }

    if (!pdpaConsent) {
      setError('Sila tandakan persetujuan pemprosesan data peribadi (PDPA) sebelum meneruskan.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createCapsuleBooking({
        slotId: currentSlot.id,
        slotCode: currentSlot.code,
        slotName: currentSlot.name,
        hubLocation: currentSlot.hubLocation,
        applicantId: user.uid,
        applicantName: user.displayName || userProfile?.fullName || 'Usahawan Belia',
        applicantEmail: user.email || '',
        applicantPhone: phone || userProfile?.phone || '+60',
        businessName,
        businessCategory,
        durationMonths,
        startDate: startDate || new Date().toISOString().split('T')[0],
        pitchNotes
      });

      confetti({ particleCount: 70, spread: 60 });
      clearFormDraft('kiosk_booking');
      setSubmitted(true);
      showToast({
        type: 'success',
        title: 'Permohonan Kiosk Berjaya Dihantar!',
        message: `Permohonan kiosk ${currentSlot?.name || 'Kapsul Niaga'} telah direkodkan. Pegawai penyelaras UMK akan menyemak profil anda.`
      });
      if (handleSuccess) handleSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghantar permohonan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError(null);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#24303F] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 scale-100 transition-all max-h-[90vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        
        {/* TailAdmin Card Header - STICKY & SHRINK-0 */}
        <div className="border-b border-slate-200 dark:border-slate-800 py-4 px-6 sm:px-7 flex items-center justify-between bg-white dark:bg-[#24303F] shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Permohonan Kapsul Niaga Modular
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Universiti Malaysia Kelantan (UMK) & Kerajaan Negeri Kelantan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer interactive-press hover:rotate-90 duration-200"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Stepper */}
        {!submitted && (
          <div className="bg-slate-50 dark:bg-[#1A222C] px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto">
              
              {/* Step 1 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className="w-full h-0.5 opacity-0" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step > 1 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : step === 1 
                        ? 'bg-red-700 text-white ring-4 ring-red-100 dark:ring-red-950/70 shadow-xs' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:border-slate-700'
                  }`} />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 1 ? 'text-red-700 dark:text-red-400 font-extrabold' : step > 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                }`}>
                  Pakej & Lokasi
                </span>
              </div>

              {/* Step 2 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:border-slate-700'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step > 2 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : step === 2 
                        ? 'bg-red-700 text-white ring-4 ring-red-100 dark:ring-red-950/70 shadow-xs' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:border-slate-700'
                  }`} />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 2 ? 'text-red-700 dark:text-red-400 font-extrabold' : step > 2 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                }`}>
                  Profil Usahawan
                </span>
              </div>

              {/* Step 3 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:border-slate-700'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step === 3 
                      ? 'bg-red-700 text-white ring-4 ring-red-100 dark:ring-red-950/70 shadow-xs' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    3
                  </div>
                  <div className="w-full h-0.5 opacity-0" />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 3 ? 'text-red-700 dark:text-red-400 font-extrabold' : 'text-slate-400'
                }`}>
                  Prapapar & Sah
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user ? (
            <div className="text-center py-8">
              <LogIn className="w-10 h-10 text-red-700 dark:text-red-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Log Masuk Diperlukan untuk Memohon
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                Sila log masuk dengan akaun Google anda terlebih dahulu supaya status permohonan dan surat tawaran dapat dipautkan terus ke akaun anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-sm"
              >
                Log Masuk dengan Google
              </button>
            </div>
          ) : submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Permohonan Kiosk Berjaya Dihantar!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
                Pegawai penyelaras UMK sedang menyemak butiran anda. Sila pantau kad penjejak di papan pemuka anda. Sebaik diluluskan, Surat Tawaran Digital rasmi berkod QR akan dijana secara automatik.
              </p>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 mb-6 max-w-sm mx-auto">
                No. Rujukan Anda: <strong>KBN-{currentSlot?.code}-{new Date().getFullYear()}</strong>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          ) : (
            <div>
              {/* STEP 1: LOKASI & PILIHAN PAKEJ KAPSUL */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                      Pilih Hub Kiosk Kapsul: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all cursor-pointer"
                    >
                      {safeAllSlots.map((s) => (
                        <option key={s.id} value={s.id} className="dark:bg-[#1A222C]">
                          {s.code} — {s.name} ({s.hubLocation}, {s.district}) {s.status === 'available' ? '· [Tersedia]' : '· [Sedang Beroperasi]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSlot && (
                    <div className="p-4.5 rounded-xl bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">
                            {currentSlot.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {currentSlot.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                            {currentSlot.hubLocation} ({currentSlot.district})
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Tersedia untuk Belia
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-2.5 border-t border-slate-200 dark:border-slate-700">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#24303F] border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 text-[10px] font-medium block">Kadar Pasaran Biasa:</span>
                          <span className="line-through text-slate-400 font-semibold text-xs">RM 300 / bulan</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                          <span className="text-red-800 dark:text-red-300 text-[10px] font-bold block">Kadar Subsidi Belia (50%):</span>
                          <span className="text-sm sm:text-base font-black text-red-700 dark:text-red-400">
                            RM 150 / bulan
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Kemudahan Termasuk:</strong> {currentSlot.amenities?.join(', ') || 'Elektrik, Wi-Fi Jalur Lebar & Kawalan Keselamatan'}
                      </div>
                    </div>
                  )}

                  {/* Duration Cards */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                      Pilih Pakej Tempoh Sewaan Kiosk: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          months: 3,
                          title: '3 Bulan',
                          subtitle: 'Pakej Permulaan',
                          total: 'RM 450',
                          badge: 'Uji Pasaran',
                          badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        },
                        {
                          months: 6,
                          title: '6 Bulan',
                          subtitle: 'Pakej Semester UMK',
                          total: 'RM 900',
                          badge: 'Paling Popular',
                          badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold'
                        },
                        {
                          months: 12,
                          title: '12 Bulan',
                          subtitle: 'Pakej Tahunan Penuh',
                          total: 'RM 1,800',
                          badge: 'Jimat & Stabil',
                          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }
                      ].map((pkg) => {
                        const isSelected = durationMonths === pkg.months;
                        return (
                          <button
                            key={pkg.months}
                            type="button"
                            onClick={() => setDurationMonths(pkg.months)}
                            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-red-700 bg-red-50/70 dark:bg-red-950/20 ring-1 ring-red-700/30 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${pkg.badgeColor}`}>
                                {pkg.badge}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected 
                                  ? 'border-red-700 bg-red-700 text-white' 
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {pkg.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {pkg.subtitle}
                              </div>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-baseline justify-between">
                              <span className="text-[10px] text-slate-400">Jumlah:</span>
                              <span className="text-xs font-black text-red-700 dark:text-red-400">{pkg.total}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                      Tarikh Dijangka Mula Berniaga: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-11 pr-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* TailAdmin Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Seterusnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFIL USAHAWAN (TailAdmin 2-Column Form Layout) */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Row 1: Nama Perniagaan + Kategori */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                        Nama Perniagaan / Jenama <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama perniagaan anda"
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                        }}
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border ${
                          fieldErrors.businessName 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-red-600'
                        } text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 transition-all`}
                      />
                      {fieldErrors.businessName && (
                        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.businessName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                        Kategori Perniagaan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                        className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="dark:bg-[#1A222C]">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: No Telefon + No MyKad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                        No. Telefon (WhatsApp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Nombor telefon"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border ${
                          fieldErrors.phone 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-red-600'
                        } text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-all`}
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                          No. Kad Pengenalan MyKad:
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">12 Digit</span>
                      </div>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="Masukkan No. Kad Pengenalan"
                        value={icNumber}
                        onChange={(e) => {
                          setIcNumber(e.target.value);
                          if (fieldErrors.icNumber) setFieldErrors(prev => ({ ...prev, icNumber: '' }));
                        }}
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border ${
                          fieldErrors.icNumber 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-red-600'
                        } text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-all`}
                      />
                      {fieldErrors.icNumber ? (
                        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.icNumber}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1.5">
                          Enkripsi selamat di bawah Akta PDPA 2010.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Ringkasan Operasi Full Width */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                      Ringkasan Produk & Cadangan Waktu Operasi:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Penerangan ringkas produk dan operasi kiosk..."
                      value={pitchNotes}
                      onChange={(e) => setPitchNotes(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* TailAdmin Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Seterusnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PRAPAPAR RINGKASAN & PERSETUJUAN PDPA */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Ringkasan Pakej Permohonan Kiosk
                        </h4>
                        <p className="text-[11px] text-slate-500">Sila semak maklumat sebelum pengesahan akhir</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        Pakej {durationMonths} Bulan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Premis Kiosk:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{currentSlot?.code} — {currentSlot?.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Lokasi Hab:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentSlot?.hubLocation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Nama Perniagaan:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{businessName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Kategori Bisnes:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{businessCategory}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Kadar Sewa Bersubsidi:</span>
                        <span className="font-bold text-red-700 dark:text-red-400 text-base">RM 150 / bulan</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block font-medium">Tarikh Mula:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{startDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* TailAdmin Checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] cursor-pointer hover:border-red-600 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={pdpaConsent}
                      onChange={(e) => setPdpaConsent(e.target.checked)}
                      className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer shrink-0"
                    />
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">
                        Persetujuan Rasmi PDPA & Integriti Belia:
                      </strong>
                      Saya mengesahkan semua maklumat perniagaan dan peribadi di atas adalah benar serta bersetuju dengan pemprosesan data di bawah Akta Perlindungan Data Peribadi 2010 (PDPA) bagi permohonan kiosk negeri Kelantan.
                    </div>
                  </label>

                  {/* TailAdmin Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 interactive-press interactive-lift group"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading || !pdpaConsent}
                      onClick={handleSubmit}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer interactive-press interactive-lift group"
                    >
                      <CheckCircle2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      <span>{loading ? 'Menghantar Permohonan...' : 'Hantar Permohonan Sewaan (RM150/bln)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
