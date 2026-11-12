import React, { useState } from 'react';
import { 
  Shield, 
  Building2, 
  Users, 
  Store, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  DollarSign, 
  TrendingUp, 
  Database, 
  AlertCircle,
  MessageCircle,
  Filter,
  Search,
  Sparkles,
  Settings,
  Sliders,
  UserCheck,
  RefreshCw,
  Save,
  Phone,
  Mail,
  FileText,
  GraduationCap,
  Eye
} from 'lucide-react';
import { 
  BusinessListing, 
  CapsuleBooking, 
  CapsuleSlot, 
  YouthProgram, 
  BusinessCategory, 
  KelantanDistrict, 
  SlotStatus,
  MentorshipRegistration,
  MentorProfile,
  AdminSubTab
} from '../types';
import { 
  updateBookingStatus, 
  saveCapsuleSlot, 
  deleteCapsuleSlot, 
  saveProgram, 
  deleteProgram, 
  deleteBusinessListing,
  saveBusinessListing,
  seedInitialData,
  updateGrantApplicationStatus
} from '../services/dataService';
import { GrantApplication } from '../types';
import { AdminApprovalQueue } from './AdminApprovalQueue';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { ImageDropzone } from './ImageDropzone';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  slots: CapsuleSlot[];
  businesses: BusinessListing[];
  bookings: CapsuleBooking[];
  programs: YouthProgram[];
  grantApplications?: GrantApplication[];
  mentorshipRegistrations?: MentorshipRegistration[];
  mentors?: MentorProfile[];
  onUpdateMentor?: (updatedMentor: MentorProfile) => void;
  onRefresh: () => void;
  activeSubTab?: AdminSubTab;
  onSelectSubTab?: (tab: AdminSubTab) => void;
}

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  slots = [],
  businesses = [],
  bookings = [],
  programs = [],
  grantApplications = [],
  mentorshipRegistrations = [],
  mentors = INITIAL_MENTOR_PROFILES,
  onUpdateMentor,
  onRefresh,
  activeSubTab,
  onSelectSubTab
}) => {
  const [internalTab, setInternalTab] = useState<AdminSubTab>('queue');

  // Synchronize internal tab state with external activeSubTab prop
  React.useEffect(() => {
    if (activeSubTab) {
      setInternalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const adminTab = activeSubTab || internalTab;
  const setAdminTab = (tab: AdminSubTab) => {
    setInternalTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab);
    }
  };

  const [selectedMentorForEdit, setSelectedMentorForEdit] = useState<MentorProfile | null>(null);

  // Admin Settings State
  const [adminOfficerName, setAdminOfficerName] = useState(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).adminOfficerName || 'Pentadbir Nabil (Urusetia KBelia)';
    } catch (e) {
      // ignore
    }
    return 'Pentadbir Nabil (Urusetia KBelia)';
  });
  const [adminHelpdeskPhone, setAdminHelpdeskPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).adminHelpdeskPhone || '+6011-23456789';
    } catch (e) {
      // ignore
    }
    return '+6011-23456789';
  });
  const [portalSubsidyRate, setPortalSubsidyRate] = useState(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).portalSubsidyRate || '50';
    } catch (e) {
      // ignore
    }
    return '50';
  });
  const [maxLeaseDurationMonths, setMaxLeaseDurationMonths] = useState(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).maxLeaseDurationMonths || '12';
    } catch (e) {
      // ignore
    }
    return '12';
  });
  const [systemStatus, setSystemStatus] = useState<'active' | 'maintenance'>(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).systemStatus || 'active';
    } catch (e) {
      // ignore
    }
    return 'active';
  });
  const [portalAnnouncement, setPortalAnnouncement] = useState(() => {
    try {
      const saved = localStorage.getItem('kbelia_admin_settings');
      if (saved) return JSON.parse(saved).portalAnnouncement || 'Permohonan Kapsul Niaga & Geran Belia Kelantan 2026 Kini Dibuka!';
    } catch (e) {
      // ignore
    }
    return 'Permohonan Kapsul Niaga & Geran Belia Kelantan 2026 Kini Dibuka!';
  });
  const [savingAdminSettings, setSavingAdminSettings] = useState(false);
  const [adminSettingsSuccess, setAdminSettingsSuccess] = useState<string | null>(null);

  const handleSaveAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdminSettings(true);
    setAdminSettingsSuccess(null);
    try {
      const payload = {
        adminOfficerName,
        adminHelpdeskPhone,
        portalSubsidyRate,
        maxLeaseDurationMonths,
        systemStatus,
        portalAnnouncement,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('kbelia_admin_settings', JSON.stringify(payload));
      confetti({ particleCount: 50, spread: 60 });
      setAdminSettingsSuccess('Tetapan sistem pentadbir & operasi portal berjaya disimpan!');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAdminSettings(false);
    }
  };

  const handleClearLocalSessionCache = () => {
    try {
      const adminSession = localStorage.getItem('niagabelia_auth_session');
      localStorage.removeItem('niagabelia_last_activity');
      localStorage.removeItem('kbelia_active_tab');
      if (adminSession) {
        localStorage.setItem('niagabelia_auth_session', adminSession);
      }
      setAdminSettingsSuccess('Cache sesi tempatan telah dibersihkan!');
    } catch (err) {
      console.error(err);
    }
  };

  const safeSlots = slots || [];
  const safeBusinesses = businesses || [];
  const safeBookings = bookings || [];
  const safePrograms = programs || [];

  // Filter states
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewNoteInput, setReviewNoteInput] = useState<{ [bookingId: string]: string }>({});

  // Slot modal / form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotCode, setSlotCode] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotHub, setSlotHub] = useState('Hub UMK Kampus Bachok');
  const [slotDistrict, setSlotDistrict] = useState<KelantanDistrict>('Bachok');
  const [slotSize, setSlotSize] = useState('10ft x 10ft Smart Pod');
  const [slotMonthlyRate, setSlotMonthlyRate] = useState('150');
  const [slotStatus, setSlotStatus] = useState<SlotStatus>('available');
  const [slotAmenities, setSlotAmenities] = useState('Palam Elektrik 13A, WiFi 500Mbps, Rak Paparan Bertingkat');
  const [slotImageUrl, setSlotImageUrl] = useState('/public/assets/generated/kiosk_modular_kbelia.jpg');

  // Program form state
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [progTitle, setProgTitle] = useState('');
  const [progCategory, setProgCategory] = useState<YouthProgram['category']>('Geran & Dana');
  const [progDate, setProgDate] = useState('');
  const [progLocation, setProgLocation] = useState('Hub Keusahawanan Belia Kelantan');
  const [progAmount, setProgAmount] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progOrganizer, setProgOrganizer] = useState('Unit Belia & Keusahawanan Kelantan');
  const [progImageUrl, setProgImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats calculation
  const pendingBookingsCount = safeBookings.filter(b => b && b.status === 'pending').length;
  const occupiedSlotsCount = safeSlots.filter(s => s && s.status === 'occupied').length;
  const occupancyRate = safeSlots.length > 0 ? Math.round((occupiedSlotsCount / safeSlots.length) * 100) : 0;

  // Handle Booking Approval
  const handleApproveBooking = async (booking: CapsuleBooking) => {
    const notes = reviewNoteInput[booking.id] || 'Permohonan diluluskan. Sila hadir ke pejabat pentadbiran hab untuk penerimaan kunci dan orientasi premis.';
    try {
      setLoading(true);
      await updateBookingStatus(
        booking.id, 
        'approved', 
        notes, 
        booking.slotId, 
        booking.businessName, 
        booking.applicantId
      );
      confetti({ particleCount: 50 });
      setMessage({ type: 'success', text: `Permohonan bagi ${booking.businessName} berjaya diluluskan!` });
      emitAdminOrMentorNotification({
        title: `Kelulusan Kiosk: ${booking.slotCode}`,
        message: `Permohonan sewaan kiosk bagi ${booking.businessName} telah diluluskan rasmi oleh Urusetia Pentadbir Negeri.`,
        type: 'kiosk',
        senderRole: 'admin',
        sender: 'Pentadbir Urusetia KBelia'
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengemaskini status permohonan.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Booking Rejection
  const handleRejectBooking = async (booking: CapsuleBooking) => {
    const reason = reviewNoteInput[booking.id] || 'Maaf, permohonan tidak dapat diluluskan kerana kekosongan slot tidak mencukupi atau kriteria perniagaan belum lengkap.';
    try {
      setLoading(true);
      await updateBookingStatus(booking.id, 'rejected', reason);
      setMessage({ type: 'success', text: `Permohonan ${booking.businessName} ditolak.` });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menolak permohonan.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCode.trim() || !slotName.trim()) {
      setMessage({ type: 'error', text: 'Sila lengkapkan kod dan nama kapsul.' });
      return;
    }

    try {
      setLoading(true);
      const amenitiesList = slotAmenities.split(',').map(s => s.trim()).filter(Boolean);

      await saveCapsuleSlot({
        code: slotCode,
        name: slotName,
        hubLocation: slotHub,
        district: slotDistrict,
        size: slotSize,
        monthlyRate: parseFloat(slotMonthlyRate),
        dailyRate: Math.round(parseFloat(slotMonthlyRate) / 10),
        status: slotStatus,
        amenities: amenitiesList,
        imageUrl: slotImageUrl
      });

      emitAdminOrMentorNotification({
        title: `Slot Kiosk Baharu: ${slotCode}`,
        message: `${slotName} di jajahan ${slotDistrict} kini dibuka untuk permohonan sewaan usahawan (RM${slotMonthlyRate}/bln).`,
        type: 'kiosk',
        senderRole: 'admin',
        sender: 'Pentadbir Urusetia KBelia'
      });

      setShowSlotForm(false);
      setSlotCode('');
      setSlotName('');
      setMessage({ type: 'success', text: 'Slot kapsul berjaya ditambah!' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan slot kapsul.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await deleteCapsuleSlot(id);
      setMessage({ type: 'success', text: 'Slot kapsul telah berjaya dipadam.' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Ralat ketika memadam slot.' });
    }
  };

  // Handle Save Program
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      setMessage({ type: 'error', text: 'Sila lengkapkan tajuk program.' });
      return;
    }

    try {
      setLoading(true);
      await saveProgram({
        title: progTitle,
        category: progCategory,
        date: progDate || 'Sepanjang Bulan',
        location: progLocation,
        grantAmount: progAmount,
        description: progDesc,
        organizer: progOrganizer,
        isFeatured: true
      });

      emitAdminOrMentorNotification({
        title: `Program Baharu: ${progTitle}`,
        message: `${progTitle} (${progAmount || 'Percuma'}) kini diterbitkan untuk penyertaan usahawan belia Kelantan.`,
        type: 'grant',
        senderRole: 'admin',
        sender: 'Pentadbir Urusetia KBelia'
      });

      setShowProgramForm(false);
      setProgTitle('');
      setProgDesc('');
      setMessage({ type: 'success', text: 'Program geran / latihan baharu berjaya diterbitkan!' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan program.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProg = async (id: string) => {
    try {
      await deleteProgram(id);
      setMessage({ type: 'success', text: 'Program telah berjaya dipadam.' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memadam program.' });
    }
  };

  // Toggle Featured Business
  const handleToggleFeatured = async (biz: BusinessListing) => {
    try {
      await saveBusinessListing({
        ...biz,
        isFeatured: !biz.isFeatured
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Business
  const handleDeleteBusiness = async (id: string, name?: string) => {
    try {
      await deleteBusinessListing(id);
      setMessage({ type: 'success', text: `Penyenaraian perniagaan ${name ? `"${name}"` : ''} telah berjaya dipadam.` });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memadam penyenaraian perniagaan.' });
    }
  };

  // Seed Data
  const handleSeedDatabase = async () => {
    try {
      setLoading(true);
      const ok = await seedInitialData();
      if (ok) {
        confetti({ particleCount: 60 });
        setMessage({ type: 'success', text: 'Data awal berjaya dimuatkan ke pangkalan data Firestore!' });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: 'Ralat memuat data awal.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = safeBookings.filter(b => {
    if (!b) return false;
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  return (
    <div className="w-full px-1 sm:px-3 py-4">
      
      {/* Admin Subheader & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2E3A47] mb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Pusat Kawalan & Pengurusan Pentadbiran</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel Pengurusan & Kelulusan Hab KBelia
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-0.5">
            Semak dan luluskan permohonan sewaan kapsul, geran pembiayaan, profil usahawan dan program belia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedDatabase}
          disabled={loading}
          className="interactive-press interactive-lift px-4 py-2.5 bg-slate-900 dark:bg-[#2E3A47] hover:bg-slate-800 dark:hover:bg-[#384556] text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-xs shrink-0 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>{loading ? 'Sedang Memproses...' : 'Sync / Isi Data Permulaan'}</span>
        </button>
      </div>

      {/* KPI Cards (TailAdmin wireframe layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="interactive-card group bg-white dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-1 hover:border-amber-400/50 dark:hover:border-amber-400/50 cursor-default">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#8A99AD] text-xs">
            <span className="font-medium">Permohonan Menunggu</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left">{pendingBookingsCount}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Menunggu tindakan semakan pegawai</div>
        </div>

        <div className="interactive-card group bg-white dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-1 hover:border-emerald-400/50 dark:hover:border-emerald-400/50 cursor-default">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#8A99AD] text-xs">
            <span className="font-medium">Usahawan Belia Berdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-400 tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left">{businesses.length}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Direktori komersil belia sah SSM</div>
        </div>

        <div className="interactive-card group bg-white dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-1 hover:border-teal-400/50 dark:hover:border-teal-400/50 cursor-default">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#8A99AD] text-xs">
            <span className="font-medium">Kadar Terisi Kapsul</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900/40 text-teal-700 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400 tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left">{occupancyRate}%</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">{occupiedSlotsCount} drpd {slots.length} unit beroperasi</div>
        </div>

        <div className="interactive-card group bg-white dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-1 hover:border-indigo-400/50 dark:hover:border-indigo-400/50 cursor-default">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#8A99AD] text-xs">
            <span className="font-medium">Program & Geran Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-800 dark:text-indigo-400 tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left">{programs.length}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Dana & latihan keusahawanan aktif</div>
        </div>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="interactive-press text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer">×</button>
        </div>
      )}



      {/* TAB 0: ADVANCED 1-CLICK APPROVAL QUEUE & AUDIT EXPORTS */}
      {adminTab === 'queue' && (
        <AdminApprovalQueue
          bookings={safeBookings}
          grantApplications={grantApplications || []}
          slots={safeSlots}
          onApproveBooking={async (bId, notes) => {
            const b = safeBookings.find(x => x.id === bId);
            if (b) await handleApproveBooking({ ...b, adminNotes: notes });
          }}
          onRejectBooking={async (bId, notes) => {
            const b = safeBookings.find(x => x.id === bId);
            if (b) await handleRejectBooking({ ...b, adminNotes: notes });
          }}
          onApproveGrant={async (gId, notes) => {
            await updateGrantApplicationStatus(gId, 'approved', notes);
            confetti({ particleCount: 50 });
            onRefresh();
          }}
          onRejectGrant={async (gId, notes) => {
            await updateGrantApplicationStatus(gId, 'rejected', notes);
            onRefresh();
          }}
          onUpdateSlotStatus={async (sId, newStatus) => {
            const slot = safeSlots.find(s => s.id === sId);
            if (slot) {
              await saveCapsuleSlot({ ...slot, status: newStatus });
              onRefresh();
            }
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* TAB 1: BOOKINGS MANAGEMENT */}
      {adminTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Senarai Permohonan Sewaan Kapsul</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Semak cadangan perniagaan dan sahkan kelulusan peruntukan kiosk.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 dark:text-[#8A99AD]">Tapis:</span>
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    bookingFilter === filter
                      ? 'bg-emerald-800 dark:bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1A222C] text-slate-600 dark:text-[#8A99AD] hover:bg-slate-200 dark:hover:bg-[#2E3A47] dark:hover:text-white'
                  }`}
                >
                  {filter === 'pending' ? 'Menunggu' : filter === 'approved' ? 'Diluluskan' : filter === 'rejected' ? 'Ditolak' : 'Semua'}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47]">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tiada Permohonan Dalam Kategori Ini</h4>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-4 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 dark:bg-[#1A222C] text-white font-mono text-xs font-bold border border-transparent dark:border-[#2E3A47]">
                          {b.slotCode}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{b.businessName}</h4>
                        <span className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold">({b.businessCategory})</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-1">
                        Kapsul Dipohon: <strong className="text-slate-700 dark:text-slate-200">{b.slotName}</strong> ({b.hubLocation})
                      </p>
                    </div>

                    <div>
                      {b.status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Menunggu Kelulusan
                        </span>
                      )}
                      {b.status === 'approved' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Diluluskan
                        </span>
                      )}
                      {b.status === 'rejected' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Applicant Details */}
                  <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#1A222C] p-3.5 rounded-xl text-xs text-slate-600 dark:text-[#8A99AD] border border-slate-100 dark:border-[#2E3A47]">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Pemohon:</span>
                      <strong className="text-slate-900 dark:text-white">{b.applicantName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">E-mel / Telefon:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{b.applicantEmail} • {b.applicantPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Tempoh & Tarikh Mula:</span>
                      <span className="text-slate-700 dark:text-slate-300">{b.durationMonths} Bulan (Mulai {b.startDate})</span>
                    </div>
                  </div>

                  {/* Pitch Notes */}
                  {b.pitchNotes && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                      <span className="font-bold text-emerald-950 dark:text-emerald-300 block mb-0.5">Cadangan Pitching Usahawan:</span>
                      <p>{b.pitchNotes}</p>
                    </div>
                  )}

                  {/* Admin Notes & Actions */}
                  {b.status === 'pending' && (
                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Catatan Pentadbir / Arahan Lanjut:
                        </label>
                        <input
                          type="text"
                          placeholder="cth. Diluluskan. Sila hadir ke Pejabat Hab UMK Bachok pada hari Isnin untuk serah kunci."
                          value={reviewNoteInput[b.id] || ''}
                          onChange={(e) => setReviewNoteInput({ ...reviewNoteInput, [b.id]: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-300 dark:border-[#2E3A47] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleRejectBooking(b)}
                          disabled={loading}
                          className="px-4 py-2 bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Tolak Permohonan
                        </button>
                        <button
                          onClick={() => handleApproveBooking(b)}
                          disabled={loading}
                          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Luluskan Permohonan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {b.adminNotes && b.status !== 'pending' && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1A222C] p-2.5 rounded-xl border border-slate-200 dark:border-[#2E3A47]">
                      <strong className="text-slate-900 dark:text-white">Catatan Pentadbir:</strong> {b.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUSINESSES DIRECTORY MANAGEMENT */}
      {adminTab === 'businesses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pengurusan Direktori Usahawan</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Kawal status penyerapan dan promosi jenama belia di portal.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#1C2434] border-b border-slate-200 dark:border-[#2E3A47] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#8A99AD] font-bold">
                  <tr>
                    <th className="p-4">Perniagaan & Pengasas</th>
                    <th className="p-4">Kategori & Jajahan</th>
                    <th className="p-4">SSM</th>
                    <th className="p-4">Pilihan Utama (Featured)</th>
                    <th className="p-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2E3A47]">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2434]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={biz.logoUrl || '/public/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-[#2E3A47] bg-white dark:bg-[#1A222C]"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-sm">{biz.businessName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-[#8A99AD]">{biz.ownerName} ({biz.ownerEmail})</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{biz.category}</span>
                        <div className="text-slate-400 dark:text-slate-400">{biz.district}</div>
                      </td>
                      <td className="p-4">
                        {biz.ssmNumber ? (
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{biz.ssmNumber}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Tiada</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(biz)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                            biz.isFeatured
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-[#1A222C] text-slate-500 dark:text-[#8A99AD] hover:bg-slate-200 dark:hover:bg-[#2E3A47]'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{biz.isFeatured ? 'Featured (Ya)' : 'Jadikan Featured'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          id={`btn-delete-business-${biz.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBusiness(biz.id, biz.businessName);
                          }}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/50 shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1 font-bold text-xs"
                          title={`Padam Perniagaan ${biz.businessName}`}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-[11px]">Padam</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAPSULE SLOTS MANAGEMENT */}
      {adminTab === 'slots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Inventori & Pengurusan Kapsul Jajahan</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Urus pendaftaran slot kapsul niaga, tetapkan kadar sewa bulanan, dan padam unit yang ditamatkan perkhidmatan.</p>
            </div>

            <button
              type="button"
              id="btn-admin-add-slot-toggle"
              onClick={() => setShowSlotForm(!showSlotForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>{showSlotForm ? 'Tutup Borang' : 'Daftar Kapsul Niaga'}</span>
            </button>
          </div>

          {/* New Slot Form */}
          {showSlotForm && (
            <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Borang Daftar Kapsul Niaga Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSlotForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Kod Kapsul: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. CAP-UMK-05"
                      value={slotCode}
                      onChange={(e) => setSlotCode(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Nama Kapsul: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Kapsul F&B Kafe Belia A5"
                      value={slotName}
                      onChange={(e) => setSlotName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Kadar Sewa (RM/Bulan): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="150"
                      value={slotMonthlyRate}
                      onChange={(e) => setSlotMonthlyRate(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Lokasi Hab:
                    </label>
                    <input
                      type="text"
                      placeholder="cth. Hub UMK Kampus Bachok"
                      value={slotHub}
                      onChange={(e) => setSlotHub(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Jajahan:
                    </label>
                    <select
                      value={slotDistrict}
                      onChange={(e) => setSlotDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d} className="dark:bg-[#1A222C]">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Status Ketersediaan:
                    </label>
                    <select
                      value={slotStatus}
                      onChange={(e) => setSlotStatus(e.target.value as SlotStatus)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                    >
                      <option value="available" className="dark:bg-[#1A222C]">Tersedia (Kosong)</option>
                      <option value="occupied" className="dark:bg-[#1A222C]">Sedang Beroperasi</option>
                      <option value="reserved" className="dark:bg-[#1A222C]">Dalam Tempahan</option>
                      <option value="maintenance" className="dark:bg-[#1A222C]">Penyelenggaraan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Kemudahan (Pisahkan dengan koma):
                  </label>
                  <input
                    type="text"
                    placeholder="Palam Elektrik 13A, WiFi 500Mbps, Rak Paparan Kaca"
                    value={slotAmenities}
                    onChange={(e) => setSlotAmenities(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Gambar Kapsul:
                  </label>
                  <ImageDropzone
                    value={slotImageUrl}
                    onChange={(val) => setSlotImageUrl(val)}
                    label="Tarik fail atau klik untuk muat naik gambar kiosk"
                    aspectRatio="16:9"
                  />
                </div>

                {/* TailAdmin Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSlotForm(false)}
                    className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Menyimpan...' : 'Simpan Kapsul'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Slots Table */}
          <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#1C2434] border-b border-slate-200 dark:border-[#2E3A47] text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#8A99AD] font-bold">
                  <tr>
                    <th className="p-4">Kod & Nama Kapsul</th>
                    <th className="p-4">Hab & Jajahan</th>
                    <th className="p-4">Kadar Sewaan</th>
                    <th className="p-4">Status & Penyewa</th>
                    <th className="p-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2E3A47]">
                  {slots.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2434]/50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{s.code}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{s.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400">{s.size}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{s.hubLocation}</div>
                        <div className="text-slate-400 dark:text-slate-400">{s.district}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-400">RM{s.monthlyRate}/bln</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          s.status === 'available' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' :
                          s.status === 'occupied' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        }`}>
                          {s.status}
                        </span>
                        {s.currentTenantBusinessName && (
                          <div className="text-[11px] text-slate-600 dark:text-[#8A99AD] mt-1 font-semibold">
                            {s.currentTenantBusinessName}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          id={`btn-delete-slot-${s.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlot(s.id);
                          }}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/50 shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1 font-bold text-xs"
                          title="Padam Slot"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-[11px]">Padam</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAMS MANAGEMENT */}
      {adminTab === 'programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pengurusan Inisiatif Geran & Program Belia</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Terbit, kemas kini dan padam hebahan rasmi program latihan serta geran usahawan belia Kelantan.</p>
            </div>

            <button
              type="button"
              id="btn-admin-add-prog-toggle"
              onClick={() => setShowProgramForm(!showProgramForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>{showProgramForm ? 'Tutup Borang' : 'Terbitkan Program Baharu'}</span>
            </button>
          </div>

          {/* New Program Form */}
          {showProgramForm && (
            <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Borang Terbit Program Keusahawanan Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProgram} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Tajuk Program / Geran: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Geran Inovasi Belia Kelantan RM5,000"
                      value={progTitle}
                      onChange={(e) => setProgTitle(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Kategori Program: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={progCategory}
                      onChange={(e) => setProgCategory(e.target.value as YouthProgram['category'])}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                    >
                      <option value="Geran & Dana" className="dark:bg-[#1A222C]">Geran & Dana</option>
                      <option value="Bengkel & Latihan" className="dark:bg-[#1A222C]">Bengkel & Latihan</option>
                      <option value="Pameran & Ekspo" className="dark:bg-[#1A222C]">Pameran & Ekspo</option>
                      <option value="Pitching & Inkubasi" className="dark:bg-[#1A222C]">Pitching & Inkubasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Tarikh / Tempoh:
                    </label>
                    <input
                      type="text"
                      placeholder="cth. Permohonan dibuka setiap bulan"
                      value={progDate}
                      onChange={(e) => setProgDate(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Lokasi:
                    </label>
                    <input
                      type="text"
                      placeholder="cth. Hub UMK Bachok / Atas Talian"
                      value={progLocation}
                      onChange={(e) => setProgLocation(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Nilai Geran / Yuran:
                    </label>
                    <input
                      type="text"
                      placeholder="cth. RM3,000 / Percuma"
                      value={progAmount}
                      onChange={(e) => setProgAmount(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-bold text-red-700 dark:text-red-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Penerangan Program:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Syarat kelayakan, objektif bengkel, dan maklumat pendaftaran..."
                    value={progDesc}
                    onChange={(e) => setProgDesc(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Poster / Gambar Hebahan:
                  </label>
                  <ImageDropzone
                    value={progImageUrl}
                    onChange={(val) => setProgImageUrl(val)}
                    label="Tarik poster program atau klik untuk pilih fail"
                    aspectRatio="16:9"
                  />
                </div>

                {/* TailAdmin Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowProgramForm(false)}
                    className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Menerbitkan...' : 'Terbitkan Program'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safePrograms.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs flex flex-col justify-between transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-[10px] font-bold">
                      {p.category}
                    </span>
                    <button
                      type="button"
                      id={`btn-delete-prog-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProg(p.id);
                      }}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 p-1.5 rounded-lg border border-rose-200/60 dark:border-rose-900/50 transition-colors cursor-pointer"
                      title="Padam Program"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-[#8A99AD] line-clamp-2">{p.description}</p>
                  {p.grantAmount && (
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 p-2 rounded-lg">
                      Bantuan: {p.grantAmount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MENTOR & MENTEE MONITORING HUB */}
      {adminTab === 'mentors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-800/80 text-purple-200 text-[11px] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Hab Pengurusan Bimbingan & Inkubasi UMK</span>
              </div>
              <h3 className="text-xl font-bold text-white">Pemantauan Mentor & Usahawan Negeri Kelantan</h3>
              <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
                Pemantauan sesi temujanji bimbingan usahawan belia bersama mentor UMK dan jurulatih industri.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold border border-white/20">
                {mentorshipRegistrations.length} Pendaftaran Bimbingan
              </span>
            </div>
          </div>

          {/* Mentor Management Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Senarai Panel Mentor Bertauliah Negeri ({mentors.length})</span>
              </h4>
              <span className="text-xs text-slate-500">Klik "Sunting Profil" untuk mengurus maklumat & PIN</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {mentors.map((m) => {
                const menteeCount = mentorshipRegistrations.filter(r => r.mentorId === m.id).length;
                return (
                  <div 
                    key={m.id}
                    className="p-4 bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={m.avatarUrl || '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg'} 
                          alt={m.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {m.name}
                          </h5>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                            {m.agency.split('(')[0].trim()}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {m.title}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-[#2E3A47] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Usahawan Berdaftar:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{menteeCount} Usahawan</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">PIN Akses:</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{m.pin || '1234'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMentorForEdit(m)}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-800 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sunting Profil & PIN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mentee List Table */}
          <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-[#2E3A47] flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Senarai Usahawan Berdaftar Mengikut Mentor
              </h4>
              <span className="text-xs text-slate-500">10 Jajahan Kelantan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#1A222C] text-slate-500 border-b border-slate-200 dark:border-[#2E3A47] text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Usahawan & Perniagaan</th>
                    <th className="py-3 px-4">Mentor Ditugaskan</th>
                    <th className="py-3 px-4">Topik Bimbingan</th>
                    <th className="py-3 px-4">Jajahan</th>
                    <th className="py-3 px-4">Tarikh & Mod</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {mentorshipRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tiada pendaftaran bimbingan ditemui.
                      </td>
                    </tr>
                  ) : (
                    mentorshipRegistrations.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{m.entrepreneurName}</div>
                          <div className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">{m.businessName}</div>
                          <div className="text-[10px] text-slate-400">{m.entrepreneurPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{m.mentorName}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{m.topic}</div>
                          {m.challenges && (
                            <div className="text-[10px] text-slate-500 truncate">{m.challenges}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-600 dark:text-slate-400">{m.district}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{m.preferredDate}</div>
                          <div className="text-[10px] text-slate-500">{m.mode}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : m.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {m.status === 'confirmed' ? 'Disahkan' : m.status === 'completed' ? 'Selesai' : 'Menunggu'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN & SYSTEM SETTINGS */}
      {adminTab === 'settings' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-800/80 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Pengurusan Sistem Pentadbir</span>
              </div>
              <h3 className="text-xl font-bold text-white">Tetapan Sistem & Profil Pentadbir</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Kawalan menyeluruh untuk parameter sewaan kiosk kapsul, pengurusan perhubungan urusetia, pembersihan cache sesi dan penyelarasan data usahawan belia.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Super Admin Berkuasa Penuh
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {adminSettingsSuccess && (
            <div className="p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs bg-emerald-50 text-emerald-900 border border-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminSettingsSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminSettingsSuccess(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 px-2 py-0.5"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-6">
            {/* Section 1: Profil Urusetia Pentadbir */}
            <div className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Profil Urusetia & Saluran Sokongan Rasmi</h4>
                  <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Maklumat pentadbir yang mengurus portal dan kelulusan usahawan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Pentadbir */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nama Pegawai / Urusetia Pentadbir <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminOfficerName}
                      onChange={(e) => setAdminOfficerName(e.target.value)}
                      placeholder="Nama penuh"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Emel Pentadbir */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Emel
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value="nabilwahab03020302@gmail.com"
                      placeholder="Emel"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-[#1C2434] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Akaun Pentadbir Utama Firestore & Auth.</span>
                </div>

                {/* Talian Sokongan WhatsApp Urusetia */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Talian Khidmat Pelanggan / WhatsApp Pentadbiran <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={adminHelpdeskPhone}
                      onChange={(e) => setAdminHelpdeskPhone(e.target.value)}
                      placeholder="Talian Khidmat Pelanggan / WhatsApp Pentadbiran"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                    />
                  </div>
                </div>

                {/* Tahap Akses */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Tahap Kuasa Akses Sistem
                  </label>
                  <div className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Super Admin Pentadbiran (Level 1)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tetapan & Parameter Portal */}
            <div className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tetapan & Parameter Operasi Portal KBelia</h4>
                  <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Konfigurasi subsidi sewaan, had tempoh dan status pelayan portal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kadar Subsidi Sewaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Kadar Subsidi Sewaan Kiosk Bulanan (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={portalSubsidyRate}
                    onChange={(e) => setPortalSubsidyRate(e.target.value)}
                    placeholder="Kadar subsidi"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Peratusan potongan kos sewa untuk usahawan belia.</span>
                </div>

                {/* Had Tempoh Sewaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Had Maksimum Tempoh Sewaan Kapsul (Bulan)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={maxLeaseDurationMonths}
                    onChange={(e) => setMaxLeaseDurationMonths(e.target.value)}
                    placeholder="Tempoh sewaan"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Tempoh maksimum satu kitaran sewaan kiosk.</span>
                </div>

                {/* Status Mod Sistem */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Status Operasi Portal
                  </label>
                  <select
                    value={systemStatus}
                    onChange={(e) => setSystemStatus(e.target.value as 'active' | 'maintenance')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                  >
                    <option value="active">Portal Aktif & Permohonan Dibuka</option>
                    <option value="maintenance">Mod Penyelenggaraan Sistem (Sementara)</option>
                  </select>
                </div>

                {/* Pengumuman Khas Banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Teks Pengumuman Khas Portal
                  </label>
                  <input
                    type="text"
                    value={portalAnnouncement}
                    onChange={(e) => setPortalAnnouncement(e.target.value)}
                    placeholder="Pengumuman portal"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1C2434] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Ringkasan Pengguna & Kawalan Pangkalan Data */}
            <div className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kawalan Pangkalan Data & Penyelenggaraan Sesi</h4>
                  <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Tindakan kecemasan untuk menyegerakkan data dan memadam cache sistem.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-[#1A222C] rounded-xl border border-slate-200 dark:border-[#2E3A47]">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{safeBusinesses.length}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8A99AD] font-medium">Usahawan Berdaftar</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#1A222C] rounded-xl border border-slate-200 dark:border-[#2E3A47]">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{safeBookings.length}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8A99AD] font-medium">Jumlah Permohonan Kapsul</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#1A222C] rounded-xl border border-slate-200 dark:border-[#2E3A47]">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{safeSlots.length}</div>
                  <div className="text-xs text-slate-500 dark:text-[#8A99AD] font-medium">Slot Kiosk Terkawal</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={loading}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Database className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                  <span>{loading ? 'Sedang Memproses...' : 'Segerak Semula Data Permulaan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLocalSessionCache}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-[#1A222C] hover:bg-slate-200 dark:hover:bg-[#2E3A47] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-[#2E3A47] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Kosongkan Cache Sesi Tempatan</span>
                </button>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className="bg-slate-50 dark:bg-[#1C2434] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Pengesahan Tetapan Pentadbir</div>
                <p className="text-[11px] text-slate-500 dark:text-[#8A99AD]">
                  Semua parameter yang disimpan akan berkuat kuasa serta-merta pada sistem portal usahawan.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingAdminSettings}
                className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{savingAdminSettings ? 'Menyimpan...' : 'Simpan Tetapan Pentadbir'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedMentorForEdit && (
        <MentorProfileEditModal
          isOpen={Boolean(selectedMentorForEdit)}
          onClose={() => setSelectedMentorForEdit(null)}
          mentor={selectedMentorForEdit}
          isAdminEditing={true}
          onSave={(updated) => {
            onUpdateMentor?.(updated);
            setSelectedMentorForEdit(null);
          }}
        />
      )}

    </div>
  );
};
