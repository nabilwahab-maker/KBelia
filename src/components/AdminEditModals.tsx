import React, { useEffect, useState } from 'react';
import {
  X,
  Save,
  Loader2,
  Edit3,
  AlertCircle,
  Building2,
  Coins,
  Wrench,
  GraduationCap,
  ShoppingBag,
  Plus,
  Trash2
} from 'lucide-react';
import {
  BookingStatus,
  BusinessCategory,
  BusinessListing,
  CapsuleBooking,
  CapsuleSlot,
  GrantApplication,
  KelantanDistrict,
  MaintenanceTicket,
  MentorProfile,
  formatBusinessCategory,
  MentorshipRegistration,
  ProductItem,
  normalizeMentorshipMode
} from '../types';
import {
  updateCapsuleBookingRecord,
  updateGrantApplicationRecord,
  saveOrUpdateMaintenanceTicket,
  saveMentorshipRegistrationRecord,
  saveProduct,
  deleteProduct
} from '../services/dataService';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { showToast } from './ToastNotification';
import { ImageDropzone } from './ImageDropzone';
import { ModernDatePicker, ModernTimePicker } from './ModernDateTimePicker';
import { getRoleTheme } from '../utils/roleTheme';

const adminTheme = getRoleTheme('admin');

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

const inputClass = `w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] focus:outline-none ${adminTheme.inputClass}`;

// =========================================================================
// 1. EDIT / CREATE CAPSULE BOOKING MODAL
// =========================================================================
interface EditBookingModalProps {
  isOpen: boolean;
  booking: CapsuleBooking | null;
  slots: CapsuleSlot[];
  onClose: () => void;
  onSaved: (saved: CapsuleBooking) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  booking,
  slots,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(booking?.id);
  const [slotId, setSlotId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('Makanan & Minuman (F&B)');
  const [durationMonths, setDurationMonths] = useState('6');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<BookingStatus>('pending');
  const [pitchNotes, setPitchNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (booking) {
      setSlotId(booking.slotId || slots[0]?.id || '');
      setApplicantName(booking.applicantName || '');
      setApplicantEmail(booking.applicantEmail || '');
      setApplicantPhone(booking.applicantPhone || '');
      setBusinessName(booking.businessName || '');
      setBusinessCategory(booking.businessCategory || 'Makanan & Minuman (F&B)');
      setDurationMonths(String(booking.durationMonths || 6));
      setStartDate(booking.startDate || new Date().toISOString().slice(0, 10));
      setStatus(booking.status || 'pending');
      setPitchNotes(booking.pitchNotes || '');
      setAdminNotes(booking.adminNotes || '');
    } else {
      const firstAvail = slots.find(s => s.status === 'available') || slots[0];
      setSlotId(firstAvail?.id || '');
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setBusinessName('');
      setBusinessCategory('Makanan & Minuman (F&B)');
      setDurationMonths('6');
      setStartDate(new Date().toISOString().slice(0, 10));
      setStatus('pending');
      setPitchNotes('');
      setAdminNotes('');
    }
    setError(null);
    setIsSaving(false);
  }, [isOpen, booking, slots]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const selectedSlot = slots.find(s => s.id === slotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!applicantName.trim() || !businessName.trim()) {
      setError('Sila lengkapkan nama pemohon dan nama perniagaan.');
      return;
    }
    if (!slotId) {
      setError('Sila pilih unit kiosk.');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await updateCapsuleBookingRecord({
        ...(booking || {}),
        id: booking?.id,
        slotId,
        slotCode: selectedSlot?.code || booking?.slotCode || 'KBN-01',
        slotName: selectedSlot?.name || booking?.slotName || 'Kapsul Niaga',
        hubLocation: selectedSlot?.hubLocation || booking?.hubLocation || 'Hab Usahawan Bachok',
        monthlyRate: selectedSlot?.monthlyRate ?? booking?.monthlyRate ?? 150,
        applicantId: booking?.applicantId,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantPhone: applicantPhone.trim(),
        businessName: businessName.trim(),
        businessCategory,
        durationMonths: Math.max(1, parseInt(durationMonths, 10) || 6),
        startDate: startDate || new Date().toISOString().slice(0, 10),
        status,
        pitchNotes: pitchNotes.trim(),
        adminNotes: adminNotes.trim()
      });
      onSaved(saved);
    } catch {
      setError('Gagal menyimpan rekod permohonan kiosk. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                {isEditing ? 'Edit Permohonan Sewaan Kapsul' : 'Tambah Permohonan Kiosk Baharu'}
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Kemas kini butiran pemohon, unit kiosk, tempoh sewaan dan status kelulusan.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Unit Kiosk / Kapsul <span className="text-black dark:text-white">*</span>
              </label>
              <select
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name} ({s.district}) - RM{s.monthlyRate}/bulan
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Perniagaan <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Masukkan nama perniagaan"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Pemohon <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Masukkan nama pemohon"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Emel Pemohon</label>
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="contoh@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Telefon Pemohon</label>
              <input
                type="text"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="01X-XXXXXXX"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori Perniagaan</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                className={`${inputClass} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{formatBusinessCategory(c)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Status Permohonan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className={`${inputClass} cursor-pointer font-semibold`}
              >
                <option value="pending">Menunggu Semakan</option>
                <option value="approved">Diluluskan</option>
                <option value="rejected">Ditolak</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tempoh Sewaan (Bulan)</label>
              <input
                type="number"
                min="1"
                max="36"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh Mula</label>
              <ModernDatePicker
                value={startDate}
                onChange={setStartDate}
                valueFormat="iso"
                accentColor="amber"
                placeholder="Pilih tarikh mula"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Cadangan Pitching</label>
              <textarea
                rows={2}
                value={pitchNotes}
                onChange={(e) => setPitchNotes(e.target.value)}
                placeholder="Ringkasan konsep jualan"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Catatan Pegawai Pentadbir</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Catatan kelulusan atau semakan"
                className={inputClass}
              />
            </div>
          </div>

          <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${adminTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Permohonan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 2. EDIT / CREATE GRANT APPLICATION MODAL
// =========================================================================
interface EditGrantModalProps {
  isOpen: boolean;
  grant: GrantApplication | null;
  onClose: () => void;
  onSaved: (saved: GrantApplication) => void;
}

export const EditGrantModal: React.FC<EditGrantModalProps> = ({
  isOpen,
  grant,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(grant?.id);
  const [programTitle, setProgramTitle] = useState('');
  const [grantAmount, setGrantAmount] = useState('RM3,000');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('Makanan & Minuman (F&B)');
  const [district, setDistrict] = useState('Kota Bharu');
  const [ssmNumber, setSsmNumber] = useState('');
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [fundPurpose, setFundPurpose] = useState('');
  const [status, setStatus] = useState<GrantApplication['status']>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (grant) {
      setProgramTitle(grant.programTitle || '');
      setGrantAmount(grant.grantAmount || grant.amount || 'RM3,000');
      setApplicantName(grant.applicantName || '');
      setApplicantEmail(grant.applicantEmail || '');
      setApplicantPhone(grant.applicantPhone || '');
      setBusinessName(grant.businessName || '');
      setBusinessCategory(grant.businessCategory || 'Makanan & Minuman (F&B)');
      setDistrict(grant.district || 'Kota Bharu');
      setSsmNumber(grant.ssmNumber || '');
      setBankName(grant.bankName || 'Maybank');
      setBankAccountNumber(grant.bankAccountNumber || '');
      setFundPurpose(grant.fundPurpose || '');
      setStatus(grant.status || 'pending');
      setAdminNotes(grant.adminNotes || '');
    } else {
      setProgramTitle('Geran Permulaan Usahawan Belia Kelantan');
      setGrantAmount('RM5,000');
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setBusinessName('');
      setBusinessCategory('Makanan & Minuman (F&B)');
      setDistrict('Kota Bharu');
      setSsmNumber('');
      setBankName('Maybank');
      setBankAccountNumber('');
      setFundPurpose('');
      setStatus('pending');
      setAdminNotes('');
    }
    setError(null);
    setIsSaving(false);
  }, [isOpen, grant]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programTitle.trim() || !applicantName.trim() || !businessName.trim()) {
      setError('Sila lengkapkan tajuk geran, nama pemohon dan nama perniagaan.');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await updateGrantApplicationRecord({
        ...(grant || {}),
        id: grant?.id,
        programTitle: programTitle.trim(),
        grantAmount: grantAmount.trim(),
        amount: grantAmount.trim(),
        applicantId: grant?.applicantId,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantPhone: applicantPhone.trim(),
        businessName: businessName.trim(),
        businessCategory,
        district,
        ssmNumber: ssmNumber.trim(),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        fundPurpose: fundPurpose.trim(),
        status,
        adminNotes: adminNotes.trim()
      });
      onSaved(saved);
    } catch {
      setError('Gagal menyimpan rekod permohonan geran.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
              <Coins className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                {isEditing ? 'Edit Permohonan Geran Belia' : 'Tambah Permohonan Geran Baharu'}
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Ubah suai maklumat dana, perniagaan, akaun bank dan status kelulusan.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Program / Geran <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={programTitle}
                onChange={(e) => setProgramTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jumlah Geran</label>
              <input
                type="text"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="RM3,000"
                className={`${inputClass} font-mono font-bold`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Status Kelulusan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GrantApplication['status'])}
                className={`${inputClass} cursor-pointer font-semibold`}
              >
                <option value="pending">Menunggu Semakan</option>
                <option value="approved">Diluluskan</option>
                <option value="rejected">Ditolak</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Pemohon <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                Nama Perniagaan <span className="text-black dark:text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Emel Pemohon</label>
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon</label>
              <input
                type="text"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value as BusinessCategory)}
                className={`${inputClass} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{formatBusinessCategory(c)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={`${inputClass} cursor-pointer`}
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
                value={ssmNumber}
                onChange={(e) => setSsmNumber(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Akaun Bank</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tujuan Penggunaan Dana</label>
              <textarea
                rows={2}
                value={fundPurpose}
                onChange={(e) => setFundPurpose(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Catatan Pegawai Pentadbir</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${adminTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Geran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 3. EDIT / CREATE MAINTENANCE TICKET MODAL
// =========================================================================
interface EditMaintenanceTicketModalProps {
  isOpen: boolean;
  ticket: MaintenanceTicket | null;
  slots: CapsuleSlot[];
  onClose: () => void;
  onSaved: (saved: MaintenanceTicket) => void;
}

const ISSUE_CATEGORIES: MaintenanceTicket['issueCategory'][] = [
  'Elektrik & Suis',
  'Paip & Air',
  'Pintu & Kunci',
  'Struktur & Bumbung',
  'Lain-lain'
];

export const EditMaintenanceTicketModal: React.FC<EditMaintenanceTicketModalProps> = ({
  isOpen,
  ticket,
  slots,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(ticket?.id);
  const [slotCode, setSlotCode] = useState('');
  const [kioskName, setKioskName] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [issueCategory, setIssueCategory] = useState<MaintenanceTicket['issueCategory']>('Elektrik & Suis');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MaintenanceTicket['status']>('received');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (ticket) {
      setSlotCode(ticket.slotCode || '');
      setKioskName(ticket.kioskName || '');
      setReporterName(ticket.reporterName || '');
      setReporterPhone(ticket.reporterPhone || '');
      setIssueCategory(ticket.issueCategory || 'Elektrik & Suis');
      setDescription(ticket.description || '');
      setStatus(ticket.status || 'received');
      setAdminNotes(ticket.adminNotes || '');
    } else {
      const firstSlot = slots[0];
      setSlotCode(firstSlot?.code || 'CAP-KB-01');
      setKioskName(firstSlot?.name || 'Kapsul Niaga');
      setReporterName('');
      setReporterPhone('');
      setIssueCategory('Elektrik & Suis');
      setDescription('');
      setStatus('received');
      setAdminNotes('');
    }
    setError(null);
    setIsSaving(false);
  }, [isOpen, ticket, slots]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!slotCode.trim() || !reporterName.trim() || !description.trim()) {
      setError('Sila lengkapkan kod kiosk, nama pelapor dan keterangan aduan.');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveOrUpdateMaintenanceTicket({
        ...(ticket || {}),
        id: ticket?.id,
        slotCode: slotCode.trim(),
        kioskName: kioskName.trim() || slotCode.trim(),
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        issueCategory,
        description: description.trim(),
        status,
        adminNotes: adminNotes.trim()
      });
      onSaved(saved);
    } catch {
      setError('Gagal menyimpan tiket penyelenggaraan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                {isEditing ? 'Edit Tiket Aduan Penyelenggaraan' : 'Tambah Tiket Aduan Baharu'}
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Kemas kini kerosakan fasiliti, status baik pulih dan catatan teknikal.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kod Kiosk *</label>
              <input
                type="text"
                required
                value={slotCode}
                onChange={(e) => setSlotCode(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Kiosk</label>
              <input
                type="text"
                value={kioskName}
                onChange={(e) => setKioskName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Pelapor *</label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon Pelapor</label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori Kerosakan</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value as MaintenanceTicket['issueCategory'])}
                className={`${inputClass} cursor-pointer`}
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Status Tiket</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceTicket['status'])}
                className={`${inputClass} cursor-pointer font-semibold`}
              >
                <option value="received">Diterima</option>
                <option value="in_progress">Sedang Dibaiki</option>
                <option value="resolved">Selesai</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Keterangan Masalah *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Catatan Teknikal / Pentadbir</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${adminTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Tiket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 4. EDIT / CREATE MENTORSHIP REGISTRATION MODAL
// =========================================================================
interface EditMentorshipModalProps {
  isOpen: boolean;
  registration: MentorshipRegistration | null;
  mentors: MentorProfile[];
  onClose: () => void;
  onSaved: (saved: MentorshipRegistration) => void;
}

export const EditMentorshipModal: React.FC<EditMentorshipModalProps> = ({
  isOpen,
  registration,
  mentors,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(registration?.id);
  const [mentorId, setMentorId] = useState('');
  const [entrepreneurName, setEntrepreneurName] = useState('');
  const [entrepreneurPhone, setEntrepreneurPhone] = useState('');
  const [entrepreneurEmail, setEntrepreneurEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [businessCategory, setBusinessCategory] = useState('Makanan & Minuman (F&B)');
  const [topic, setTopic] = useState('');
  const [challenges, setChallenges] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 PG');
  const [mode, setMode] = useState<MentorshipRegistration['mode']>('Bersemuka di Kampus');
  const [status, setStatus] = useState<MentorshipRegistration['status']>('pending');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (registration) {
      setMentorId(registration.mentorId || mentors[0]?.id || '');
      setEntrepreneurName(registration.entrepreneurName || '');
      setEntrepreneurPhone(registration.entrepreneurPhone || '');
      setEntrepreneurEmail(registration.entrepreneurEmail || '');
      setBusinessName(registration.businessName || '');
      setDistrict(registration.district || 'Kota Bharu');
      setBusinessCategory(registration.businessCategory || 'Makanan & Minuman (F&B)');
      setTopic(registration.topic || '');
      setChallenges(registration.challenges || '');
      setPreferredDate(registration.preferredDate || new Date().toISOString().slice(0, 10));
      setPreferredTime(registration.preferredTime || '10:00 PG');
      setMode(normalizeMentorshipMode(registration.mode));
      setStatus(registration.status || 'pending');
      setMeetingLink(registration.meetingLink || '');
      setNotes(registration.notes || '');
    } else {
      setMentorId(mentors[0]?.id || 'mentor-1');
      setEntrepreneurName('');
      setEntrepreneurPhone('');
      setEntrepreneurEmail('');
      setBusinessName('');
      setDistrict('Kota Bharu');
      setBusinessCategory('Makanan & Minuman (F&B)');
      setTopic('');
      setChallenges('');
      setPreferredDate(new Date().toISOString().slice(0, 10));
      setPreferredTime('10:00 PG');
      setMode('Bersemuka di Kampus');
      setStatus('pending');
      setMeetingLink('');
      setNotes('');
    }
    setError(null);
    setIsSaving(false);
  }, [isOpen, registration, mentors]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const selectedMentor = mentors.find(m => m.id === mentorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!entrepreneurName.trim() || !businessName.trim() || !topic.trim()) {
      setError('Sila lengkapkan nama usahawan, nama perniagaan dan topik bimbingan.');
      return;
    }

    try {
      setIsSaving(true);
      const id = registration?.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const saved = await saveMentorshipRegistrationRecord({
        ...(registration || {}),
        id,
        mentorId,
        mentorName: selectedMentor?.name || registration?.mentorName || 'Mentor KBelia',
        entrepreneurName: entrepreneurName.trim(),
        entrepreneurPhone: entrepreneurPhone.trim(),
        entrepreneurEmail: entrepreneurEmail.trim(),
        businessName: businessName.trim(),
        district,
        businessCategory,
        topic: topic.trim(),
        challenges: challenges.trim(),
        preferredDate: preferredDate || new Date().toISOString().slice(0, 10),
        preferredTime: preferredTime.trim(),
        mode,
        status,
        meetingLink: meetingLink.trim(),
        notes: notes.trim(),
        createdAt: registration?.createdAt || new Date().toISOString()
      });
      onSaved(saved);
    } catch {
      setError('Gagal menyimpan rekod sesi bimbingan mentor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                {isEditing ? 'Edit Sesi Bimbingan Usahawan' : 'Tambah Sesi Bimbingan Baharu'}
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Tugaskan mentor, tetapkan tarikh, mod pertemuan dan status sesi.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Mentor Ditugaskan</label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.agency.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Usahawan *</label>
              <input
                type="text"
                required
                value={entrepreneurName}
                onChange={(e) => setEntrepreneurName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nama Perniagaan *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor Telefon</label>
              <input
                type="text"
                value={entrepreneurPhone}
                onChange={(e) => setEntrepreneurPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Emel</label>
              <input
                type="email"
                value={entrepreneurEmail}
                onChange={(e) => setEntrepreneurEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                className={`${inputClass} cursor-pointer`}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Status Sesi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MentorshipRegistration['status'])}
                className={`${inputClass} cursor-pointer font-semibold`}
              >
                <option value="pending">Menunggu</option>
                <option value="confirmed">Disahkan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh Sesi</label>
              <ModernDatePicker
                value={preferredDate}
                onChange={setPreferredDate}
                valueFormat="iso"
                accentColor="amber"
                placeholder="Pilih tarikh sesi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Masa Sesi</label>
              <ModernTimePicker
                value={preferredTime}
                onChange={setPreferredTime}
                mode="single"
                allowRangeToggle
                formatStyle="12h-pg"
                defaultDurationMinutes={60}
                accentColor="amber"
                placeholder="Pilih masa sesi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Mod Pertemuan</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as MentorshipRegistration['mode'])}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="Bersemuka di Kampus">Bersemuka di Hab Usahawan</option>
                <option value="Google Meet">Google Meet</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Topik Bimbingan *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Cabaran / Catatan</label>
              <textarea
                rows={2}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Pautan Mesyuarat / Nota Mentor</label>
              <input
                type="text"
                value={meetingLink || notes}
                onChange={(e) => {
                  setMeetingLink(e.target.value);
                  setNotes(e.target.value);
                }}
                placeholder="Pautan Google Meet atau nota bimbingan"
                className={inputClass}
              />
            </div>
          </div>

          <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${adminTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Sesi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 5. MANAGE BUSINESS PRODUCTS MODAL (ADMIN CRUD ON STORE CATALOG)
// =========================================================================
interface ManageBusinessProductsModalProps {
  isOpen: boolean;
  business: BusinessListing | null;
  products: ProductItem[];
  onClose: () => void;
  onRefresh: () => void;
}

export const ManageBusinessProductsModal: React.FC<ManageBusinessProductsModalProps> = ({
  isOpen,
  business,
  products,
  onClose,
  onRefresh
}) => {
  const { confirmDelete } = useConfirmDelete();
  const [editingProd, setEditingProd] = useState<ProductItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Makanan & Minuman');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/generated/product_kelantan_delights_1793924253401.jpg');
  const [inStock, setInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowForm(false);
      setEditingProd(null);
    }
  }, [isOpen]);

  if (!isOpen || !business) return null;

  const businessProducts = products.filter(p => p.businessId === business.id);

  const openAdd = () => {
    setEditingProd(null);
    setName('');
    setPrice('15');
    setCategory(business.category || 'Produk Belia');
    setDescription('');
    setImageUrl('/assets/generated/product_kelantan_delights_1793924253401.jpg');
    setInStock(true);
    setShowForm(true);
  };

  const openEdit = (prod: ProductItem) => {
    setEditingProd(prod);
    setName(prod.name);
    setPrice(String(prod.price));
    setCategory(prod.category || 'Produk Belia');
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg');
    setInStock(prod.inStock);
    setShowForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await saveProduct({
        ...(editingProd || {}),
        id: editingProd?.id,
        businessId: business.id,
        ownerId: business.ownerId,
        name: name.trim(),
        price: parseFloat(price) || 0,
        category: category.trim() || 'Produk Belia',
        description: description.trim(),
        imageUrl,
        inStock
      });
      showToast(editingProd ? 'Produk berjaya dikemas kini!' : 'Produk baharu berjaya ditambah!', 'success');
      setShowForm(false);
      setEditingProd(null);
      onRefresh();
    } catch {
      showToast('Gagal menyimpan maklumat produk.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProd = async (prodId: string) => {
    try {
      await deleteProduct(prodId);
      showToast('Produk telah dipadam daripada katalog kedai.', 'info');
      onRefresh();
    } catch {
      showToast('Gagal memadam produk.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#F5F2EC] truncate">
                Katalog Produk: {business.businessName}
              </h3>
              <p className="text-[0.875rem] text-stone-600 dark:text-stone-300 truncate">
                Tambah, sunting atau padam produk jualan usahawan ini.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                type="button"
                onClick={openAdd}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {showForm ? (
            <form onSubmit={handleSaveProduct} className={`space-y-4 p-4 rounded-2xl border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-black dark:text-white">
                  {editingProd ? 'Sunting Produk' : 'Tambah Produk Baharu'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm font-semibold text-black/70 dark:text-white/75 hover:underline cursor-pointer"
                >
                  Kembali ke Senarai
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1">Harga (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1">Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1">Status Stok</label>
                  <select
                    value={inStock ? 'yes' : 'no'}
                    onChange={(e) => setInStock(e.target.value === 'yes')}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="yes">Ada Stok</option>
                    <option value="no">Kehabisan Stok</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1">Keterangan</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageDropzone
                    label="Gambar Produk"
                    value={imageUrl}
                    onChange={(val) => setImageUrl(val)}
                    aspectRatio="1:1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${adminTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 ${adminTheme.primaryButtonClass}`}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          ) : businessProducts.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed text-sm text-stone-600 dark:text-stone-300 ${adminTheme.dividerClass}`}>
              Tiada produk didaftarkan bagi perniagaan ini. Klik &quot;Tambah Produk&quot; untuk memulakan katalog.
            </div>
          ) : (
            <div className={`divide-y rounded-2xl border overflow-hidden ${adminTheme.dividerClass} ${adminTheme.surfaceClass}`}>
              {businessProducts.map((prod) => (
                <div key={prod.id} className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${adminTheme.rowHoverClass}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.imageUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                      alt={prod.name}
                      className={`w-14 h-14 rounded-xl object-cover border shrink-0 ${adminTheme.dividerClass}`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-stone-900 dark:text-[#F5F2EC] truncate">{prod.name}</div>
                      <div className="text-sm text-stone-600 dark:text-stone-300 tabular-nums">
                        RM{Number(prod.price).toFixed(2)} · {prod.inStock ? 'Ada Stok' : 'Habis'}
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(prod)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[0.8125rem] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${adminTheme.activeMiniBtnClass}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sunting</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete({
                          itemName: prod.name,
                          itemType: 'Produk Perniagaan',
                          onConfirm: () => handleDeleteProd(prod.id)
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold inline-flex items-center gap-1 whitespace-nowrap ${adminTheme.dangerOutlineButtonClass}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Padam</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
