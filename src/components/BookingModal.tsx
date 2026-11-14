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
import { CapsuleSlot, BusinessCategory, PortalSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { createCapsuleBooking } from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
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
  portalSettings?: PortalSettings;
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
  portalSettings,
  isOpen,
  onClose,
  onSuccess,
  onBookingSuccess
}) => {
  const activeSlot = selectedSlot !== undefined ? selectedSlot : slot;
  const handleSuccess = onBookingSuccess || onSuccess;
  const { user, userProfile, openLoginModal } = useAuth();
  const safeAllSlots = allSlots || [];
  const subsidyRate = portalSettings?.portalSubsidyRate ?? 50;
  const maxLeaseDuration = portalSettings?.maxLeaseDurationMonths ?? 12;
  const isMaintenanceMode = portalSettings?.systemStatus === 'maintenance';
  const todayISO = new Date().toISOString().split('T')[0];

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
      const isSlotFree = (s?: CapsuleSlot | null) => Boolean(s && s.status === 'available' && !s.currentTenantBusinessName);
      if (isSlotFree(activeSlot)) {
        setSelectedSlotId(activeSlot!.id);
      } else if (safeAllSlots.length > 0) {
        const firstAvailable = safeAllSlots.find(s => isSlotFree(s));
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
  const isCurrentSlotAvailable = Boolean(currentSlot && currentSlot.status === 'available' && !currentSlot.currentTenantBusinessName);
  const monthlyRate = Number(currentSlot?.monthlyRate) || 150;
  const marketRate = subsidyRate > 0 && subsidyRate < 100
    ? Math.round(monthlyRate / (1 - subsidyRate / 100))
    : monthlyRate * 2;

  const handleNextStep = () => {
    setError(null);
    setFieldErrors({});

    if (step === 1) {
      if (!currentSlot) {
        setError('Sila pilih lokasi kiosk yang sah.');
        return;
      }
      if (!isCurrentSlotAvailable) {
        setError(`Kapsul ${currentSlot.code} (${currentSlot.name}) telah berdaftar / sedang beroperasi. Permohonan baharu tidak dibuka bagi unit ini. Sila pilih unit berstatus Tersedia.`);
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
      setError('Sila log masuk terlebih dahulu untuk memohon.');
      return;
    }

    if (isMaintenanceMode) {
      setError('Sistem permohonan baharu sedang diselenggara buat sementara waktu. Sila cuba sebentar lagi.');
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
        applicantName: userProfile?.fullName || user.displayName || 'Usahawan Belia',
        applicantEmail: user.email || '',
        applicantPhone: phone || userProfile?.phone || '+60',
        applicantMyKad: icNumber.trim() || undefined,
        businessName,
        businessCategory,
        durationMonths,
        startDate: startDate || todayISO,
        monthlyRate,
        pitchNotes
      });

      confetti({ particleCount: 70, spread: 60 });
      clearFormDraft('kiosk_booking');
      setSubmitted(true);
      emitAdminOrMentorNotification({
        title: `Permohonan Kiosk Baharu: ${currentSlot.code}`,
        message: `${businessName} (${userProfile?.fullName || user.displayName || 'Usahawan Belia'}) telah memohon unit ${currentSlot.name}.`,
        senderRole: 'user',
        targetRole: 'admin',
        targetUserId: '',
        sender: userProfile?.fullName || user.displayName || 'Usahawan Belia',
        type: 'kiosk',
        actionTab: 'admin'
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 scale-100 transition-all max-h-[90vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header - STICKY & SHRINK-0 */}
        <div className="border-b border-slate-200 dark:border-slate-700 py-4 px-6 sm:px-7 flex items-center justify-between kbelia-important-header dark:bg-slate-800 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                Permohonan Kapsul Niaga Modular
              </h3>
              <p className="text-xs text-black dark:text-white">
                Universiti Malaysia Kelantan (UMK) & Kerajaan Negeri Kelantan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 transition-all cursor-pointer interactive-press hover:rotate-90 duration-200"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Stepper */}
        {!submitted && (
          <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto">
              
              {/* Step 1 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className="w-full h-0.5 opacity-0" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step > 1 
                      ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600' 
                      : step === 1 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 dark:ring-blue-500/30 shadow-xs dark:bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75'
                  }`}>
                    {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 1 ? 'bg-blue-600 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 1 ? 'text-black dark:text-white/75 font-extrabold' : step > 1 ? 'text-black dark:text-white' : 'text-black/70'
                }`}>
                  Pakej & Lokasi
                </span>
              </div>

              {/* Step 2 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 1 ? 'bg-blue-600 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step > 2 
                      ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600' 
                      : step === 2 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 dark:ring-blue-500/30 shadow-xs dark:bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75'
                  }`}>
                    {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 2 ? 'bg-blue-600 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 2 ? 'text-black dark:text-white/75 font-extrabold' : step > 2 ? 'text-black dark:text-white' : 'text-black/70'
                }`}>
                  Profil Usahawan
                </span>
              </div>

              {/* Step 3 Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex items-center w-full">
                  <div className={`w-full h-0.5 transition-colors ${
                    step > 2 ? 'bg-blue-600 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    step === 3 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 dark:ring-blue-500/30 shadow-xs dark:bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-800 text-black/70 dark:text-white/75'
                  }`}>
                    3
                  </div>
                  <div className="w-full h-0.5 opacity-0" />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${
                  step === 3 ? 'text-black dark:text-white/75 font-extrabold' : 'text-black/70'
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
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-black dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user ? (
            <div className="text-center py-8">
              <LogIn className="w-10 h-10 text-black dark:text-white/75 mx-auto mb-3" />
              <h4 className="text-base font-bold text-black dark:text-white mb-2">
                Log Masuk Diperlukan untuk Memohon
              </h4>
              <p className="text-xs text-black dark:text-white/75 max-w-sm mx-auto mb-6">
                Sila log masuk ke akaun KBelia anda terlebih dahulu supaya status permohonan dan surat tawaran dapat dipautkan terus ke profil anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer dark:bg-rose-600"
              >
                Log Masuk untuk Memohon
              </button>
            </div>
          ) : isMaintenanceMode ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-black/70 dark:text-white/75 mx-auto mb-3" />
              <h4 className="text-base font-bold text-black dark:text-white mb-2">
                Permohonan Kapsul Ditutup Sementara
              </h4>
              <p className="text-xs text-black dark:text-white/75 max-w-sm mx-auto mb-6">
                {portalSettings?.portalAnnouncement || 'Sistem sedang menjalani penyelenggaraan berjadual. Sila cuba sebentar lagi.'}
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          ) : submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-black dark:text-white/75 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-black dark:text-white mb-1">
                Permohonan Kiosk Berjaya Dihantar!
              </h4>
              <p className="text-xs text-black dark:text-white/75 max-w-md mx-auto leading-relaxed mb-4">
                Pegawai penyelaras UMK sedang menyemak butiran anda. Sila pantau kad penjejak di papan pemuka anda. Sebaik diluluskan, Surat Tawaran Digital rasmi berkod QR akan dijana secara automatik.
              </p>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-black dark:text-white mb-6 max-w-sm mx-auto">
                No. Rujukan Anda: <strong>KBN-{currentSlot?.code}-{new Date().getFullYear()}</strong>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer dark:bg-blue-600"
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
                    <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                      Pilih Hub Kiosk Kapsul: <span className="text-black dark:text-white">*</span>
                    </label>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:outline-none transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      {safeAllSlots.map((s) => {
                        const isFree = s.status === 'available' && !s.currentTenantBusinessName;
                        return (
                          <option key={s.id} value={s.id} disabled={!isFree} className="dark:bg-slate-900">
                            {s.code} — {s.name} ({s.hubLocation}, {s.district}) {isFree ? '· [Tersedia]' : '· [Telah Berdaftar - Penuh]'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {currentSlot && (
                    <div className="p-4.5 rounded-xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-black dark:text-white/75">
                            {currentSlot.code}
                          </span>
                          <h4 className="text-sm font-bold text-black dark:text-white mt-0.5">
                            {currentSlot.name}
                          </h4>
                          <p className="text-xs text-black dark:text-white/75 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                            {currentSlot.hubLocation} ({currentSlot.district})
                          </p>
                        </div>
                        {isCurrentSlotAvailable ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-black dark:bg-emerald-950 dark:text-white border border-emerald-200 dark:border-emerald-800">
                            Tersedia untuk Belia
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-black dark:bg-rose-950 dark:text-white border border-rose-200 dark:border-rose-800">
                            Unit Telah Berdaftar / Penuh
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-2.5 border-t border-slate-200 dark:border-slate-700">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-black/70 dark:text-white/75 text-[10px] font-medium block">Kadar Pasaran Biasa:</span>
                          <span className="line-through text-black/70 dark:text-white/75 font-semibold text-xs tabular-nums">RM {marketRate} / bulan</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                          <span className="text-black dark:text-white text-[10px] font-bold block">Kadar Subsidi Belia ({subsidyRate}%):</span>
                          <span className="text-sm sm:text-base font-black text-black dark:text-white/75 tabular-nums">
                            RM {monthlyRate} / bulan
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-black dark:text-white/75">
                        <strong className="text-black dark:text-white">Kemudahan Termasuk:</strong> {currentSlot.amenities?.join(', ') || 'Elektrik, Wi-Fi Jalur Lebar & Kawalan Keselamatan'}
                      </div>
                    </div>
                  )}

                  {/* Duration Cards */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                      Pilih Pakej Tempoh Sewaan Kiosk: <span className="text-black dark:text-white">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          months: 3,
                          title: '3 Bulan',
                          subtitle: 'Pakej Permulaan',
                          total: `RM ${(monthlyRate * 3).toLocaleString()}`,
                          badge: 'Uji Pasaran',
                          badgeColor: 'bg-slate-100 text-black border border-slate-200 dark:bg-slate-800 dark:text-white'
                        },
                        {
                          months: 6,
                          title: '6 Bulan',
                          subtitle: 'Pakej Semester UMK',
                          total: `RM ${(monthlyRate * 6).toLocaleString()}`,
                          badge: 'Paling Popular',
                          badgeColor: 'bg-amber-50 text-black border border-amber-200 dark:bg-amber-950/40 dark:text-white font-bold'
                        },
                        {
                          months: 12,
                          title: '12 Bulan',
                          subtitle: 'Pakej Tahunan Penuh',
                          total: `RM ${(monthlyRate * 12).toLocaleString()}`,
                          badge: 'Jimat & Stabil',
                          badgeColor: 'bg-blue-50 text-black border border-blue-200 dark:bg-blue-950/60 dark:text-white'
                        }
                      ].filter(pkg => pkg.months <= maxLeaseDuration).map((pkg) => {
                        const isSelected = durationMonths === pkg.months;
                        return (
                          <button
                            key={pkg.months}
                            type="button"
                            onClick={() => setDurationMonths(pkg.months)}
                            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/30 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400/70 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${pkg.badgeColor}`}>
                                {pkg.badge}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected 
                                  ? 'border-blue-600 bg-blue-600 text-white dark:bg-blue-600' 
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-black dark:text-white">
                                {pkg.title}
                              </div>
                              <div className="text-[11px] text-black/70 dark:text-white/75">
                                {pkg.subtitle}
                              </div>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
                              <span className="text-[10px] text-black/70 dark:text-white/75">Jumlah:</span>
                              <span className="text-xs font-black text-black dark:text-white/75 tabular-nums">{pkg.total}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                      Tarikh Dijangka Mula Berniaga: <span className="text-black dark:text-white">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        min={todayISO}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-11 pr-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:outline-none transition-all cursor-pointer dark:focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!isCurrentSlotAvailable}
                      onClick={handleNextStep}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2 cursor-pointer dark:bg-blue-600"
                    >
                      <span>Seterusnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFIL USAHAWAN */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Row 1: Nama Perniagaan + Kategori */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                        Nama Perniagaan / Jenama <span className="text-black dark:text-white">*</span>
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
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border ${
                          fieldErrors.businessName 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-600 focus:ring-blue-500/30 dark:focus:border-blue-500'
                        } text-black dark:text-white font-medium focus:outline-none focus:ring-2 transition-all`}
                      />
                      {fieldErrors.businessName && (
                        <p className="mt-1.5 text-[11px] text-black dark:text-white/75 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.businessName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                        Kategori Perniagaan <span className="text-black dark:text-white">*</span>
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                        className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all cursor-pointer dark:focus:border-blue-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: No Telefon + No MyKad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                        No. Telefon (WhatsApp) <span className="text-black dark:text-white">*</span>
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
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border ${
                          fieldErrors.phone 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-600 focus:ring-blue-500/30 dark:focus:border-blue-500'
                        } text-black dark:text-white focus:outline-none focus:ring-2 transition-all`}
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-[11px] text-black dark:text-white/75 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs sm:text-sm font-medium text-black dark:text-white">
                          No. Kad Pengenalan MyKad:
                        </label>
                        <span className="text-[10px] text-black/70 dark:text-white/75 font-medium">12 Digit</span>
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
                        className={`w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border ${
                          fieldErrors.icNumber 
                            ? 'border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-600 focus:ring-blue-500/30 dark:focus:border-blue-500'
                        } text-black dark:text-white focus:outline-none focus:ring-2 transition-all`}
                      />
                      {fieldErrors.icNumber ? (
                        <p className="mt-1.5 text-[11px] text-black dark:text-white/75 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.icNumber}
                        </p>
                      ) : (
                        <span className="text-[10px] text-black/70 dark:text-white/75 block mt-1.5">
                          Enkripsi selamat di bawah Akta PDPA 2010.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Ringkasan Operasi Full Width */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-black dark:text-white block mb-2">
                      Ringkasan Produk & Cadangan Waktu Operasi:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Penerangan ringkas produk dan operasi kiosk..."
                      value={pitchNotes}
                      onChange={(e) => setPitchNotes(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all dark:focus:border-blue-500"
                    />
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer dark:bg-blue-600"
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
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white">
                          Ringkasan Pakej Permohonan Kiosk
                        </h4>
                        <p className="text-[11px] text-black/70 dark:text-white/75">Sila semak maklumat sebelum pengesahan akhir</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-black border border-amber-300 dark:bg-blue-600 dark:text-white">
                        Pakej {durationMonths} Bulan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Premis Kiosk:</span>
                        <span className="font-semibold text-black dark:text-white">{currentSlot?.code} — {currentSlot?.name}</span>
                      </div>
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Lokasi Hab:</span>
                        <span className="font-semibold text-black dark:text-white">{currentSlot?.hubLocation}</span>
                      </div>
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Nama Perniagaan:</span>
                        <span className="font-semibold text-black dark:text-white">{businessName}</span>
                      </div>
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Kategori Bisnes:</span>
                        <span className="font-medium text-black dark:text-white">{businessCategory}</span>
                      </div>
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Kadar Sewa Bersubsidi:</span>
                        <span className="font-bold text-black dark:text-white/75 text-base tabular-nums">RM {monthlyRate} / bulan</span>
                      </div>
                      <div>
                        <span className="text-black/70 dark:text-white/75 text-xs block font-medium">Tarikh Mula:</span>
                        <span className="font-medium text-black dark:text-white">{startDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-amber-400 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={pdpaConsent}
                      onChange={(e) => setPdpaConsent(e.target.checked)}
                      className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30 cursor-pointer shrink-0"
                    />
                    <div className="text-xs text-black dark:text-white leading-relaxed">
                      <strong className="text-black dark:text-white font-semibold block mb-0.5">
                        Persetujuan Rasmi PDPA & Integriti Belia:
                      </strong>
                      Saya mengesahkan semua maklumat perniagaan dan peribadi di atas adalah benar serta bersetuju dengan pemprosesan data di bawah Akta Perlindungan Data Peribadi 2010 (PDPA) bagi permohonan kiosk negeri Kelantan.
                    </div>
                  </label>

                  {/* Action Buttons Footer */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading || !pdpaConsent}
                      onClick={handleSubmit}
                      className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer dark:bg-blue-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{loading ? 'Menghantar Permohonan...' : `Hantar Permohonan Sewaan (RM${monthlyRate}/bln)`}</span>
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
