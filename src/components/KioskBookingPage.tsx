import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ArrowRight,
  ArrowLeft,
  Store,
  Check,
  MapPin,
  Lock,
  XCircle,
  FileText,
  PenTool,
  History,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CapsuleSlot,
  CapsuleBooking,
  BusinessCategory,
  PortalSettings
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createCapsuleBooking, updateBookingStatus } from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveSlotImage } from '../utils/visualAssets';
import { CapsuleGrid } from './CapsuleGrid';
import {
  validateMyKad,
  validateMalaysianPhone,
  saveFormDraft,
  loadFormDraft,
  clearFormDraft
} from '../utils/securityUtils';

export type KioskPageView = 'browse' | 'book' | 'manage';

interface KioskBookingPageProps {
  slots: CapsuleSlot[];
  bookings: CapsuleBooking[];
  portalSettings?: PortalSettings;
  view: KioskPageView;
  onChangeView: (view: KioskPageView) => void;
  preselectedSlot?: CapsuleSlot | null;
  onSelectSlotForBooking: (slot: CapsuleSlot) => void;
  onViewTenantDetail?: (slot: CapsuleSlot) => void;
  selectedHub?: string;
  onSelectHub?: (hub: string) => void;
  maxBudget?: number;
  onBudgetChange?: (val: number) => void;
  onRefresh: () => void;
  onViewOfferLetter?: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
}

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

export const KioskBookingPage: React.FC<KioskBookingPageProps> = ({
  slots,
  bookings,
  portalSettings,
  view,
  onChangeView,
  preselectedSlot,
  onSelectSlotForBooking,
  onViewTenantDetail,
  selectedHub,
  onSelectHub,
  maxBudget,
  onBudgetChange,
  onRefresh,
  onViewOfferLetter,
  onOpenTenancyAgreement
}) => {
  const { user, userProfile, openLoginModal } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const safeAllSlots = useMemo(() => slots || [], [slots]);
  const availableSlots = useMemo(
    () =>
      safeAllSlots.filter((s) =>
        Boolean(s && s.status === 'available' && !s.currentTenantBusinessName)
      ),
    [safeAllSlots]
  );
  const subsidyRate = portalSettings?.portalSubsidyRate ?? 50;
  const maxLeaseDuration = portalSettings?.maxLeaseDurationMonths ?? 12;
  const isMaintenanceMode = portalSettings?.systemStatus === 'maintenance';
  const todayISO = new Date().toISOString().split('T')[0];

  // Derive user's kiosk bookings (strict 1 active booking limit)
  const myBookings = useMemo(() => {
    if (!user) return [];
    return [...(bookings || [])]
      .filter(
        (b) =>
          b.applicantId === user.uid ||
          (user.email && b.applicantEmail?.toLowerCase() === user.email.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [bookings, user]);

  const activeBooking = useMemo(
    () => myBookings.find((b) => b.status === 'pending' || b.status === 'approved') || null,
    [myBookings]
  );

  const hasActiveBooking = Boolean(activeBooking);

  const bookingHistory = useMemo(
    () => myBookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected'),
    [myBookings]
  );

  // Form states for inline dedicated booking page
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() => {
    const isFree = (s?: CapsuleSlot | null) =>
      Boolean(s && s.status === 'available' && !s.currentTenantBusinessName);
    if (preselectedSlot && isFree(preselectedSlot)) return preselectedSlot.id;
    const firstAvailable = (slots || []).find((s) => isFree(s));
    return firstAvailable?.id || '';
  });
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(
    userProfile?.category || 'Makanan & Minuman (F&B)'
  );
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [pitchNotes, setPitchNotes] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [icNumber, setIcNumber] = useState(userProfile?.icNumber || '');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Inline 2-step cancel state (no pop-up modal)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Restore draft when entering 'book' view
  useEffect(() => {
    if (view === 'book') {
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
  }, [view, hasDraftRestored]);

  // Sync user profile defaults if fields empty
  useEffect(() => {
    if (userProfile?.businessName && !businessName) setBusinessName(userProfile.businessName);
    if (userProfile?.phone && !phone) setPhone(userProfile.phone);
    if (userProfile?.icNumber && !icNumber) setIcNumber(userProfile.icNumber);
  }, [userProfile?.businessName, userProfile?.phone, userProfile?.icNumber]);

  // Auto-save draft
  useEffect(() => {
    if (view === 'book' && businessName) {
      saveFormDraft('kiosk_booking', {
        businessName,
        businessCategory,
        phone,
        icNumber,
        pitchNotes,
        selectedSlotId
      });
    }
  }, [view, businessName, businessCategory, phone, icNumber, pitchNotes, selectedSlotId]);

  // Sync preselectedSlot when explicitly selected from browse view
  useEffect(() => {
    if (
      preselectedSlot &&
      preselectedSlot.status === 'available' &&
      !preselectedSlot.currentTenantBusinessName
    ) {
      const matched = availableSlots.find((s) => s.id === preselectedSlot.id);
      if (matched) {
        setSelectedSlotId(matched.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedSlot]);

  // Keep selectedSlotId synchronized with currently available slots
  useEffect(() => {
    setSelectedSlotId((prev) => {
      if (prev && availableSlots.some((s) => s.id === prev)) {
        return prev;
      }
      return availableSlots[0]?.id || '';
    });
  }, [availableSlots]);

  const currentSlot =
    availableSlots.find((s) => s.id === selectedSlotId) || availableSlots[0] || null;
  const isCurrentSlotAvailable = Boolean(
    currentSlot && currentSlot.status === 'available' && !currentSlot.currentTenantBusinessName
  );
  const monthlyRate = Number(currentSlot?.monthlyRate) || 150;
  const marketRate =
    subsidyRate > 0 && subsidyRate < 100
      ? Math.round(monthlyRate / (1 - subsidyRate / 100))
      : monthlyRate * 2;

  const handleNextStep = () => {
    setError(null);
    setFieldErrors({});

    if (hasActiveBooking) {
      setError('Anda sudah mempunyai 1 tempahan kiosk aktif. Sila batalkan tempahan sedia ada terlebih dahulu.');
      return;
    }

    if (step === 1) {
      if (!currentSlot) {
        setError('Sila pilih lokasi kiosk yang sah.');
        return;
      }
      if (!isCurrentSlotAvailable) {
        setError(
          `Kiosk ${currentSlot.code} (${currentSlot.name}) telah disewa / sedang beroperasi. Sila pilih kiosk yang masih kosong.`
        );
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

    if (hasActiveBooking) {
      setError('Anda sudah mempunyai 1 tempahan kiosk aktif. Anda tidak boleh membuat tempahan dua kali.');
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
        message: `Permohonan kiosk ${currentSlot?.name || 'Kiosk Belia'} telah direkodkan.`
      });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghantar permohonan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!activeBooking) return;
    try {
      setCancellingBooking(true);
      await updateBookingStatus(
        activeBooking.id,
        'cancelled',
        'Tempahan dibatalkan oleh usahawan.',
        activeBooking.slotId,
        activeBooking.businessName,
        activeBooking.applicantId,
        activeBooking
      );
      setIsConfirmingCancel(false);
      showToast({
        type: 'info',
        title: 'Tempahan Kiosk Dibatalkan',
        message: `Tempahan slot ${activeBooking.slotCode} telah dibatalkan. Anda kini boleh memohon kiosk lain.`
      });
      onRefresh();
    } catch {
      showToast({
        type: 'error',
        title: 'Ralat Pembatalan',
        message: 'Gagal membatalkan tempahan kiosk. Sila cuba lagi.'
      });
    } finally {
      setCancellingBooking(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Page View Switcher (Separate Browse / Book / Manage & Cancel Pages) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-300 dark:border-zinc-600">
          <button
            type="button"
            onClick={() => onChangeView('browse')}
            className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              view === 'browse'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'text-black dark:text-white hover:bg-white dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{isEn ? 'Kiosk Directory' : 'Senarai Kiosk'}</span>
          </button>

          <button
            type="button"
            disabled={hasActiveBooking}
            onClick={() => {
              if (!hasActiveBooking) onChangeView('book');
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              hasActiveBooking
                ? 'text-black/45 dark:text-white/45 cursor-not-allowed'
                : view === 'book'
                ? 'bg-blue-600 text-white shadow-xs cursor-pointer dark:bg-blue-600'
                : 'text-black dark:text-white hover:bg-white dark:hover:bg-zinc-800 cursor-pointer'
            }`}
            title={
              hasActiveBooking
                ? 'Butang dikunci kerana anda sudah mempunyai 1 tempahan kiosk aktif'
                : 'Buka halaman borang tempahan kiosk'
            }
          >
            {hasActiveBooking ? <Lock className="w-4 h-4 shrink-0" /> : <Store className="w-4 h-4 shrink-0" />}
            <span>{isEn ? 'Book Kiosk' : 'Tempah Kiosk'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsConfirmingCancel(false);
              onChangeView('manage');
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              view === 'manage'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'text-black dark:text-white hover:bg-white dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{isEn ? 'Manage Booking' : 'Urus Tempahan'}</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* VIEW 1: SENARAI KIOSK (BROWSE)                                    */}
      {/* ================================================================= */}
      {view === 'browse' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 p-3 sm:p-4 shadow-sm transition-colors">
          <CapsuleGrid
            slots={slots}
            bookings={bookings}
            portalSettings={portalSettings}
            onSelectSlot={(slot) => {
              if (hasActiveBooking) {
                onChangeView('manage');
                return;
              }
              onSelectSlotForBooking(slot);
              onChangeView('book');
            }}
            onViewTenantDetail={onViewTenantDetail}
            onOpenNewBooking={() => {
              if (hasActiveBooking) {
                onChangeView('manage');
                return;
              }
              onChangeView('book');
            }}
            selectedHub={selectedHub}
            onSelectHub={onSelectHub}
            maxBudget={maxBudget}
            onBudgetChange={onBudgetChange}
            isReadOnly={false}
            hasActiveBooking={hasActiveBooking}
            onGoToManageBooking={() => {
              setIsConfirmingCancel(false);
              onChangeView('manage');
            }}
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: HALAMAN KHAS TEMPAH KIOSK (NO POP-UP MODAL)               */}
      {/* ================================================================= */}
      {view === 'book' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm">
          {/* Page Header */}
          <div className="border-b border-slate-300 dark:border-zinc-600 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 kbelia-important-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">
                  Permohonan Sewa Kiosk Belia
                </h1>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75">
                  Universiti Malaysia Kelantan (UMK) &amp; Kerajaan Negeri Kelantan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChangeView('browse')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-sm font-bold text-black dark:text-white transition-colors cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>

          {hasActiveBooking ? (
            <div className="p-6 sm:p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-black dark:text-white flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <h2 className="text-lg font-black text-black dark:text-white">
                  Tempahan Kiosk Dikunci (Had 1 / 1 Aktif)
                </h2>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 leading-relaxed">
                  Anda sudah mempunyai satu permohonan atau tempahan kiosk aktif ({activeBooking?.slotCode}). Hanya satu tempahan kiosk dibenarkan pada satu masa. Untuk membuat tempahan baharu, sila batalkan tempahan sedia ada terlebih dahulu.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingCancel(false);
                    onChangeView('manage');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Urus Tempahan
                </button>
                <button
                  type="button"
                  onClick={() => onChangeView('browse')}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-bold text-black dark:text-white transition-colors cursor-pointer"
                >
                  Senarai Kiosk
                </button>
              </div>
            </div>
          ) : !user ? (
            <div className="p-8 sm:p-12 text-center space-y-4">
              <LogIn className="w-10 h-10 text-black dark:text-white/75 mx-auto" />
              <h2 className="text-base font-bold text-black dark:text-white">
                Log Masuk Diperlukan untuk Memohon
              </h2>
              <p className="text-[0.9375rem] text-black/75 dark:text-white/75 max-w-md mx-auto">
                Sila log masuk ke akaun KBelia anda terlebih dahulu supaya status permohonan dan surat tawaran dapat dipautkan ke profil anda.
              </p>
              <button
                type="button"
                onClick={() => openLoginModal()}
                className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Log Masuk
              </button>
            </div>
          ) : isMaintenanceMode ? (
            <div className="p-8 sm:p-12 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-black/70 dark:text-white/75 mx-auto" />
              <h2 className="text-base font-bold text-black dark:text-white">
                Permohonan Kiosk Ditutup Sementara
              </h2>
              <p className="text-[0.9375rem] text-black/75 dark:text-white/75 max-w-md mx-auto">
                {portalSettings?.portalAnnouncement ||
                  'Sistem sedang menjalani penyelenggaraan berjadual. Sila cuba sebentar lagi.'}
              </p>
            </div>
          ) : submitted ? (
            <div className="p-8 sm:p-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h2 className="text-lg font-black text-black dark:text-white">
                Permohonan Kiosk Berjaya Dihantar!
              </h2>
              <p className="text-[0.9375rem] text-black/75 dark:text-white/75 max-w-lg mx-auto leading-relaxed">
                Pegawai penyelaras sedang menyemak permohonan anda. Sebaik diluluskan, Surat Tawaran Digital berkod QR akan tersedia di halaman Urus &amp; Batal Tempahan.
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-sm text-black dark:text-white max-w-sm mx-auto">
                No. Rujukan Anda: <strong>KBN-{currentSlot?.code}-{new Date().getFullYear()}</strong>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setIsConfirmingCancel(false);
                    onChangeView('manage');
                  }}
                  className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Urus Tempahan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    onChangeView('browse');
                  }}
                  className="py-2.5 px-5 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* 3-Step Stepper */}
              <div className="bg-slate-50 dark:bg-zinc-950 px-6 py-4 border-b border-slate-300 dark:border-zinc-600">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                  {[
                    { num: 1, title: 'Pakej & Lokasi' },
                    { num: 2, title: 'Profil Usahawan' },
                    { num: 3, title: 'Prapapar & Sah' }
                  ].map((item, idx) => (
                    <div key={item.num} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="flex items-center w-full">
                        <div
                          className={`w-full h-0.5 transition-colors ${
                            idx === 0
                              ? 'opacity-0'
                              : step >= item.num
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                        />
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.8125rem] font-bold transition-all shrink-0 ${
                            step > item.num
                              ? 'bg-blue-600 text-white shadow-xs'
                              : step === item.num
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-xs'
                              : 'bg-slate-200 dark:bg-zinc-800 text-black/70 dark:text-white/75 border border-slate-300 dark:border-zinc-600'
                          }`}
                        >
                          {step > item.num ? <Check className="w-4 h-4 stroke-[3]" /> : item.num}
                        </div>
                        <div
                          className={`w-full h-0.5 transition-colors ${
                            idx === 2
                              ? 'opacity-0'
                              : step > item.num
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[0.8125rem] font-bold text-center leading-tight ${
                          step === item.num
                            ? 'text-black dark:text-white font-extrabold'
                            : 'text-black/70 dark:text-white/75'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-6 max-w-4xl mx-auto">
                {error && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm text-black dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                        Lokasi Kiosk *
                      </label>
                      <select
                        value={availableSlots.length > 0 ? selectedSlotId : ''}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                      >
                        {availableSlots.length > 0 ? (
                          availableSlots.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} — {s.name} ({s.hubLocation}, {s.district}) · [Tersedia]
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            Tiada unit kiosk tersedia buat masa ini
                          </option>
                        )}
                      </select>
                    </div>

                    {currentSlot && (
                      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row gap-4 items-start h-fit">
                        <div className="w-full sm:w-48 shrink-0 aspect-[4/3] sm:h-36 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900">
                          <PortalImage
                            src={resolveSlotImage(currentSlot)}
                            alt={`Reka bentuk kiosk ${currentSlot.name}`}
                            fallbackType="kiosk"
                            fallbackLabel={currentSlot.code}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-3 justify-between">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[0.8125rem] font-bold text-black dark:text-white">
                                  {currentSlot.code}
                                </span>
                                {currentSlot.size && (
                                  <span className="text-[0.8125rem] text-black/70 dark:text-white/75">
                                    · {currentSlot.size}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-bold text-black dark:text-white mt-0.5">
                                {currentSlot.name}
                              </h3>
                              <p className="text-[0.9375rem] text-black/75 dark:text-white/75 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {currentSlot.hubLocation} ({currentSlot.district})
                                </span>
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-lg text-[0.8125rem] font-bold border shrink-0 ${
                                isCurrentSlotAvailable
                                  ? 'bg-emerald-50 text-black dark:bg-emerald-950 dark:text-white border-emerald-300 dark:border-emerald-700'
                                  : 'bg-rose-50 text-black dark:bg-rose-950 dark:text-white border-rose-300 dark:border-rose-700'
                              }`}
                            >
                              {isCurrentSlotAvailable ? 'Tersedia untuk Belia' : 'Unit Telah Berdaftar / Penuh'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm pt-2.5 border-t border-slate-300 dark:border-zinc-600">
                            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
                              <span className="text-black/70 dark:text-white/75 text-[0.8125rem] font-medium block">
                                Kadar Pasaran Biasa:
                              </span>
                              <span className="line-through text-black/70 dark:text-white/75 font-semibold text-sm tabular-nums">
                                RM {marketRate} / bulan
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                              <span className="text-black dark:text-white text-[0.8125rem] font-bold block">
                                Kadar Subsidi Belia ({subsidyRate}%):
                              </span>
                              <span className="text-sm sm:text-base font-black text-black dark:text-white tabular-nums">
                                RM {monthlyRate} / bulan
                              </span>
                            </div>
                          </div>

                          <div className="text-[0.8125rem] text-black/75 dark:text-white/75">
                            <strong className="text-black dark:text-white">Kemudahan Termasuk:</strong>{' '}
                            {currentSlot.amenities?.join(', ') || 'Elektrik, Wi-Fi Jalur Lebar & Kawalan Keselamatan'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Duration Cards */}
                    <div>
                      <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                        Tempoh Sewaan Kiosk *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            months: 3,
                            title: '3 Bulan',
                            subtitle: 'Pakej Permulaan',
                            total: `RM ${(monthlyRate * 3).toLocaleString()}`,
                            badge: 'Uji Pasaran'
                          },
                          {
                            months: 6,
                            title: '6 Bulan',
                            subtitle: 'Pakej Semester UMK',
                            total: `RM ${(monthlyRate * 6).toLocaleString()}`,
                            badge: 'Paling Popular'
                          },
                          {
                            months: 12,
                            title: '12 Bulan',
                            subtitle: 'Pakej Tahunan Penuh',
                            total: `RM ${(monthlyRate * 12).toLocaleString()}`,
                            badge: 'Jimat & Stabil'
                          }
                        ]
                          .filter((pkg) => pkg.months <= maxLeaseDuration)
                          .map((pkg) => {
                            const isSelected = durationMonths === pkg.months;
                            return (
                              <button
                                key={pkg.months}
                                type="button"
                                onClick={() => setDurationMonths(pkg.months)}
                                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/30 shadow-xs'
                                    : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-blue-400/70'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <span className="text-[0.8125rem] font-bold text-black/75 dark:text-white/80">
                                    {pkg.badge}
                                  </span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 dark:border-zinc-600'
                                    }`}
                                  >
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-extrabold text-sm text-black dark:text-white">
                                    {pkg.title}
                                  </div>
                                  <div className="text-[0.8125rem] text-black/70 dark:text-white/75">
                                    {pkg.subtitle}
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-slate-300 dark:border-zinc-600 flex items-baseline justify-between">
                                  <span className="text-[0.8125rem] text-black/70 dark:text-white/75">Jumlah:</span>
                                  <span className="text-sm font-black text-black dark:text-white tabular-nums">
                                    {pkg.total}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                        Tarikh Mula Operasi *
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          min={todayISO}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-zinc-600">
                      <button
                        type="button"
                        onClick={() => onChangeView('browse')}
                        className="py-2.5 px-5 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={!isCurrentSlotAvailable}
                        onClick={handleNextStep}
                        className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Seterusnya</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                          Nama Perniagaan *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama perniagaan"
                          value={businessName}
                          onChange={(e) => {
                            setBusinessName(e.target.value);
                            if (fieldErrors.businessName)
                              setFieldErrors((prev) => ({ ...prev, businessName: '' }));
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border ${
                            fieldErrors.businessName
                              ? 'border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:ring-blue-500/30'
                          } text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 font-medium focus:outline-none focus:ring-2 transition-all`}
                        />
                        {fieldErrors.businessName && (
                          <p className="mt-1.5 text-sm text-black dark:text-white/75 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.businessName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                          Kategori Perniagaan *
                        </label>
                        <select
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all cursor-pointer"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                          Nombor Telefon *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Masukkan nombor telefon"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-zinc-950 border ${
                            fieldErrors.phone
                              ? 'border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:ring-blue-500/30'
                          } text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:outline-none focus:ring-2 transition-all`}
                        />
                        {fieldErrors.phone && (
                          <p className="mt-1.5 text-sm text-black dark:text-white/75 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                          Nombor Kad Pengenalan
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          placeholder="Masukkan nombor kad pengenalan"
                          value={icNumber}
                          onChange={(e) => {
                            setIcNumber(e.target.value);
                            if (fieldErrors.icNumber)
                              setFieldErrors((prev) => ({ ...prev, icNumber: '' }));
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-zinc-950 border ${
                            fieldErrors.icNumber
                              ? 'border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:ring-blue-500/30'
                          } text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:outline-none focus:ring-2 transition-all`}
                        />
                        {fieldErrors.icNumber && (
                          <p className="mt-1.5 text-sm text-black dark:text-white/75 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.icNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                        Penerangan Produk dan Operasi
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Masukkan penerangan ringkas produk dan operasi"
                        value={pitchNotes}
                        onChange={(e) => setPitchNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-zinc-600">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-2.5 px-5 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Seterusnya</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-zinc-600">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                            Ringkasan Pakej Permohonan Kiosk
                          </h4>
                          <p className="text-sm text-black/70 dark:text-white/75">
                            Sila semak maklumat sebelum pengesahan akhir
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[0.8125rem] font-bold bg-amber-100 text-black border border-amber-300 dark:bg-blue-600 dark:text-white">
                          Pakej {durationMonths} Bulan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-[0.9375rem]">
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Premis Kiosk:
                          </span>
                          <span className="font-semibold text-black dark:text-white">
                            {currentSlot?.code} — {currentSlot?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Lokasi Hab:
                          </span>
                          <span className="font-semibold text-black dark:text-white">
                            {currentSlot?.hubLocation}
                          </span>
                        </div>
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Nama Perniagaan:
                          </span>
                          <span className="font-semibold text-black dark:text-white">{businessName}</span>
                        </div>
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Kategori Bisnes:
                          </span>
                          <span className="font-medium text-black dark:text-white">{businessCategory}</span>
                        </div>
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Kadar Sewa Bersubsidi:
                          </span>
                          <span className="font-bold text-black dark:text-white text-base tabular-nums">
                            RM {monthlyRate} / bulan
                          </span>
                        </div>
                        <div>
                          <span className="text-black/70 dark:text-white/75 text-sm block font-medium">
                            Tarikh Mula:
                          </span>
                          <span className="font-medium text-black dark:text-white">{startDate}</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 cursor-pointer hover:border-blue-500 transition-all select-none">
                      <input
                        type="checkbox"
                        checked={pdpaConsent}
                        onChange={(e) => setPdpaConsent(e.target.checked)}
                        className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30 cursor-pointer shrink-0"
                      />
                      <div className="text-sm text-black dark:text-white leading-relaxed">
                        <strong className="text-black dark:text-white font-semibold block mb-0.5">
                          Persetujuan Rasmi PDPA &amp; Integriti Belia:
                        </strong>
                        Saya mengesahkan semua maklumat perniagaan dan peribadi di atas adalah benar serta bersetuju dengan pemprosesan data di bawah Akta Perlindungan Data Peribadi 2010 (PDPA) bagi permohonan kiosk negeri Kelantan.
                      </div>
                    </label>

                    <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-zinc-600">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="py-2.5 px-5 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali</span>
                      </button>
                      <button
                        type="button"
                        disabled={loading || !pdpaConsent}
                        onClick={handleSubmit}
                        className="py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {loading
                            ? 'Menghantar...'
                            : 'Hantar Permohonan'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 3: HALAMAN BERASINGAN URUS & BATAL TEMPAHAN KIOSK            */}
      {/* ================================================================= */}
      {view === 'manage' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 kbelia-important-header">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black dark:text-white">
                  Urus &amp; Batal Tempahan Kiosk
                </h1>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75">
                  Hanya 1 tempahan kiosk aktif dibenarkan bagi setiap akaun dalam satu masa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeView('browse')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-sm font-bold text-black dark:text-white transition-colors cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            </div>

            {activeBooking ? (
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  <div className="w-full md:w-56 shrink-0 aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800">
                    <PortalImage
                      src={resolveSlotImage(
                        safeAllSlots.find(
                          (s) => s.id === activeBooking.slotId || s.code === activeBooking.slotCode
                        ) || {
                          id: activeBooking.slotId,
                          code: activeBooking.slotCode,
                          name: activeBooking.slotName,
                          hubLocation: activeBooking.hubLocation,
                          district: 'Kota Bharu',
                          size: '',
                          monthlyRate: activeBooking.monthlyRate || 150,
                          dailyRate: 10,
                          status: 'reserved',
                          amenities: []
                        }
                      )}
                      alt={activeBooking.slotName}
                      fallbackType="kiosk"
                      fallbackLabel={activeBooking.slotCode}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-4 w-full">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-black/70 dark:text-white/75">
                          {activeBooking.slotCode}
                        </span>
                        <h2 className="text-lg font-black text-black dark:text-white">
                          {activeBooking.slotName}
                        </h2>
                        <p className="text-[0.9375rem] text-black/75 dark:text-white/75 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{activeBooking.hubLocation}</span>
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold ${
                          activeBooking.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-black dark:text-white'
                            : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-black dark:text-white'
                        }`}
                      >
                        {activeBooking.status === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 shrink-0" />
                        )}
                        <span>
                          {activeBooking.status === 'approved'
                            ? 'Diluluskan & Aktif'
                            : 'Menunggu Semakan Pengurusan'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-300 dark:border-zinc-600 text-sm">
                      <div>
                        <span className="text-black/65 dark:text-white/70 font-medium block">
                          Perniagaan Didaftarkan
                        </span>
                        <span className="font-bold text-black dark:text-white">
                          {activeBooking.businessName}
                        </span>
                        <span className="block text-black/70 dark:text-white/75">
                          {activeBooking.businessCategory}
                        </span>
                      </div>
                      <div>
                        <span className="text-black/65 dark:text-white/70 font-medium block">
                          Tempoh &amp; Tarikh Mula
                        </span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          {activeBooking.durationMonths} Bulan
                        </span>
                        <span className="block text-black/70 dark:text-white/75 tabular-nums">
                          Mula: {activeBooking.startDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-black/65 dark:text-white/70 font-medium block">
                          Kadar Sewa Bersubsidi
                        </span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          RM {activeBooking.monthlyRate || 150} / bulan
                        </span>
                      </div>
                    </div>

                    {activeBooking.adminNotes && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-sm text-black dark:text-white">
                        <span className="font-bold block mb-0.5">Catatan Pengurusan:</span>
                        <p>{activeBooking.adminNotes}</p>
                      </div>
                    )}

                    {activeBooking.status === 'approved' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {onViewOfferLetter && (
                          <button
                            type="button"
                            onClick={() => onViewOfferLetter(activeBooking)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Surat Tawaran Rasmi</span>
                          </button>
                        )}
                        {onOpenTenancyAgreement && (
                          <button
                            type="button"
                            onClick={() => onOpenTenancyAgreement(activeBooking)}
                            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-black dark:text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <PenTool className="w-4 h-4" />
                            <span>Perjanjian Sewa Kiosk</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline 2-Step Cancel Confirmation (Zero Pop-up Modal) */}
                <div className="pt-4 border-t border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-black/75 dark:text-white/75">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      Untuk memilih unit kiosk lain, batalkan tempahan sedia ada ini terlebih dahulu.
                    </span>
                  </div>

                  {!isConfirmingCancel ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancel(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-black dark:text-white text-sm font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Batalkan Tempahan Kiosk</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-sm font-semibold text-black dark:text-white">
                        Sahkan pembatalan tempahan slot {activeBooking.slotCode}?
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={cancellingBooking}
                          onClick={handleConfirmCancel}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
                        >
                          {cancellingBooking ? 'Memproses...' : 'Ya, Batalkan'}
                        </button>
                        <button
                          type="button"
                          disabled={cancellingBooking}
                          onClick={() => setIsConfirmingCancel(false)}
                          className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-black dark:text-white text-sm font-semibold cursor-pointer"
                        >
                          Kekalkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <Building2 className="w-10 h-10 text-black/40 dark:text-white/40 mx-auto" />
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white">
                    Tiada Tempahan Kiosk Aktif
                  </h2>
                  <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1 max-w-md mx-auto">
                    Anda tidak mempunyai sebarang permohonan atau sewaan kiosk aktif pada masa ini (0 / 1).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeView('browse')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>{bookingHistory.some((b) => b.status === 'cancelled') ? 'Pilih & Mohon Semula Kiosk' : 'Pilih Slot Kiosk'}</span>
                </button>
              </div>
            )}
          </div>

          {bookingHistory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-300 dark:border-zinc-600 flex items-center gap-2">
                <History className="w-4 h-4 text-black/70 dark:text-white/75" />
                <h2 className="text-sm font-bold text-black dark:text-white">
                  Sejarah Permohonan &amp; Pembatalan Kiosk
                </h2>
              </div>
              <div className="divide-y divide-slate-300 dark:divide-zinc-600">
                {bookingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <div className="font-bold text-black dark:text-white">
                        {item.slotCode} — {item.slotName}
                      </div>
                      <div className="text-black/70 dark:text-white/75">
                        {item.hubLocation} · {item.businessName} · Mula: {item.startDate}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-black dark:text-white font-bold text-xs self-start sm:self-auto">
                      {item.status === 'cancelled' ? 'Dibatalkan' : 'Tidak Berjaya'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
