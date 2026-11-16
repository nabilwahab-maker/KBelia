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
  Eye,
  BarChart3,
  Wrench,
  ChevronRight,
  Activity,
  Newspaper,
  ChevronDown,
  ChevronUp,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { 
  BusinessListing, 
  CapsuleBooking, 
  CapsuleSlot, 
  YouthProgram, 
  KelantanDistrict, 
  SlotStatus,
  MentorshipRegistration,
  MentorProfile,
  AdminSubTab,
  MaintenanceTicket,
  PortalSettings,
  GrantApplication,
  PortalNews,
  CommunityPost,
  ProductItem,
  BookingStatus
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
  updateGrantApplicationStatus,
  updateMaintenanceTicketStatus,
  savePortalSettingsRecord,
  loadLocalPortalSettings,
  deleteCapsuleBooking,
  deleteMentorProfileRecord,
  deleteMentorshipRegistrationRecord,
  saveMentorshipRegistrationRecord
} from '../services/dataService';
import { AdminApprovalQueue } from './AdminApprovalQueue';
import { AdminNewsManager } from './AdminNewsManager';
import { AdminB2BManager } from './AdminB2BManager';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminEventsManager } from './AdminEventsManager';
import { EditBookingModal, EditMentorshipModal, ManageBusinessProductsModal } from './AdminEditModals';
import { MentorProfileEditModal } from './MentorProfileEditModal';
import { EditBusinessModal } from './EditBusinessModal';
import { EditSlotModal } from './EditSlotModal';
import { EditProgramModal } from './EditProgramModal';
import { ImageDropzone } from './ImageDropzone';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
import { INITIAL_COMMUNITY_POSTS } from '../data/communityData';
import { UserTypeReportSection } from './UserTypeReportSection';
import { SaaSKpiCard } from './SaaSKpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import confetti from 'canvas-confetti';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage, resolveSlotImage, resolveProgramImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';

interface AdminDashboardProps {
  slots: CapsuleSlot[];
  businesses: BusinessListing[];
  products?: ProductItem[];
  bookings: CapsuleBooking[];
  programs: YouthProgram[];
  grantApplications?: GrantApplication[];
  mentorshipRegistrations?: MentorshipRegistration[];
  mentors?: MentorProfile[];
  maintenanceTickets?: MaintenanceTicket[];
  portalSettings?: PortalSettings;
  newsItems?: PortalNews[];
  communityPosts?: CommunityPost[];
  onUpdateMentor?: (updatedMentor: MentorProfile) => void;
  onRefresh: () => void;
  activeSubTab?: AdminSubTab;
  onSelectSubTab?: (tab: AdminSubTab) => void;
}

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
  products = [],
  bookings = [],
  programs = [],
  grantApplications = [],
  mentorshipRegistrations = [],
  mentors = INITIAL_MENTOR_PROFILES,
  maintenanceTickets = [],
  portalSettings,
  newsItems = [],
  communityPosts = INITIAL_COMMUNITY_POSTS,
  onUpdateMentor,
  onRefresh,
  activeSubTab,
  onSelectSubTab
}) => {
  const { user, isAdmin } = useAuth();
  const { confirmDelete } = useConfirmDelete();
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
  const [isCreatingMentor, setIsCreatingMentor] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessListing | null>(null);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [managingProductsBusiness, setManagingProductsBusiness] = useState<BusinessListing | null>(null);
  const [editingSlot, setEditingSlot] = useState<CapsuleSlot | null>(null);
  const [editingProgram, setEditingProgram] = useState<YouthProgram | null>(null);
  const [editingBooking, setEditingBooking] = useState<CapsuleBooking | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [editingMentorship, setEditingMentorship] = useState<MentorshipRegistration | null>(null);
  const [isCreatingMentorship, setIsCreatingMentorship] = useState(false);

  const resolvedInitialSettings = portalSettings || loadLocalPortalSettings();

  // Admin Settings State
  const [adminOfficerName, setAdminOfficerName] = useState(
    resolvedInitialSettings.adminOfficerName || 'Pentadbir Nabil (Admin KBelia)'
  );
  const [adminHelpdeskPhone, setAdminHelpdeskPhone] = useState(
    resolvedInitialSettings.adminHelpdeskPhone || '+6011-23456789'
  );
  const [portalSubsidyRate, setPortalSubsidyRate] = useState(
    String(resolvedInitialSettings.portalSubsidyRate ?? 50)
  );
  const [maxLeaseDurationMonths, setMaxLeaseDurationMonths] = useState(
    String(resolvedInitialSettings.maxLeaseDurationMonths ?? 12)
  );
  const [systemStatus, setSystemStatus] = useState<'operational' | 'maintenance'>(
    resolvedInitialSettings.systemStatus === 'maintenance' ? 'maintenance' : 'operational'
  );
  const [portalAnnouncement, setPortalAnnouncement] = useState(
    resolvedInitialSettings.portalAnnouncement || 'Permohonan Kiosk & Geran Belia Kelantan 2026 Kini Dibuka!'
  );
  const [savingAdminSettings, setSavingAdminSettings] = useState(false);
  const [adminSettingsSuccess, setAdminSettingsSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (!portalSettings) return;
    if (portalSettings.adminOfficerName) setAdminOfficerName(portalSettings.adminOfficerName);
    if (portalSettings.adminHelpdeskPhone) setAdminHelpdeskPhone(portalSettings.adminHelpdeskPhone);
    setPortalSubsidyRate(String(portalSettings.portalSubsidyRate ?? 50));
    setMaxLeaseDurationMonths(String(portalSettings.maxLeaseDurationMonths ?? 12));
    setSystemStatus(portalSettings.systemStatus === 'maintenance' ? 'maintenance' : 'operational');
    if (portalSettings.portalAnnouncement) setPortalAnnouncement(portalSettings.portalAnnouncement);
  }, [portalSettings]);

  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdminSettings(true);
    setAdminSettingsSuccess(null);
    try {
      await savePortalSettingsRecord({
        id: 'global',
        adminOfficerName: adminOfficerName.trim(),
        adminHelpdeskPhone: adminHelpdeskPhone.trim(),
        portalSubsidyRate: Math.min(100, Math.max(0, Number(portalSubsidyRate) || 50)),
        maxLeaseDurationMonths: Math.min(36, Math.max(1, Number(maxLeaseDurationMonths) || 12)),
        systemStatus,
        portalAnnouncement: portalAnnouncement.trim()
      });
      confetti({ particleCount: 50, spread: 60 });
      setAdminSettingsSuccess('Tetapan sistem pentadbir & operasi portal berjaya disimpan!');
      showToast('Tetapan sistem & parameter operasi portal disimpan!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan tetapan portal.', 'error');
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
      showToast('Cache sesi tempatan telah dibersihkan.', 'info');
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
  const [adminChartMode, setAdminChartMode] = useState<'districts' | 'pipeline'>('districts');
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
  const [slotImageUrl, setSlotImageUrl] = useState('/assets/generated/kiosk_modular_kbelia.jpg');

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
        booking.applicantId,
        booking
      );
      confetti({ particleCount: 50 });
      setMessage({ type: 'success', text: `Permohonan bagi ${booking.businessName} berjaya diluluskan!` });
      emitAdminOrMentorNotification({
        title: `Kelulusan Kiosk: ${booking.slotCode}`,
        message: `Permohonan sewaan kiosk bagi ${booking.businessName} telah diluluskan secara rasmi oleh Admin KBelia.`,
        type: 'kiosk',
        senderRole: 'admin',
        targetRole: 'youth',
        targetUserId: booking.applicantId,
        sender: 'Admin KBelia',
        actionTab: 'merchant'
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
    const reason = reviewNoteInput[booking.id] || booking.adminNotes || 'Maaf, permohonan tidak dapat diluluskan kerana kekosongan slot tidak mencukupi atau kriteria perniagaan belum lengkap.';
    try {
      setLoading(true);
      await updateBookingStatus(
        booking.id,
        'rejected',
        reason,
        booking.slotId,
        booking.businessName,
        booking.applicantId,
        booking
      );
      setMessage({ type: 'success', text: `Permohonan ${booking.businessName} ditolak.` });
      emitAdminOrMentorNotification({
        title: `Status Permohonan Kiosk: ${booking.slotCode}`,
        message: `Permohonan sewaan kiosk bagi ${booking.businessName} tidak diluluskan. Catatan: ${reason}`,
        type: 'kiosk',
        senderRole: 'admin',
        targetRole: 'youth',
        targetUserId: booking.applicantId,
        sender: 'Admin KBelia',
        actionTab: 'merchant'
      });
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
        targetRole: 'youth',
        sender: 'Admin KBelia',
        actionTab: 'academic'
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
        imageUrl: progImageUrl,
        isFeatured: true
      });

      emitAdminOrMentorNotification({
        title: `Program Baharu: ${progTitle}`,
        message: `${progTitle} (${progAmount || 'Percuma'}) kini diterbitkan untuk penyertaan usahawan belia Kelantan.`,
        type: 'grant',
        senderRole: 'admin',
        targetRole: 'youth',
        sender: 'Admin KBelia',
        actionTab: 'ceed'
      });

      setShowProgramForm(false);
      setProgTitle('');
      setProgDesc('');
      setProgImageUrl('');
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

  // Toggle Business Approval / Directory Visibility
  const handleToggleApprovedBusiness = async (biz: BusinessListing) => {
    try {
      await saveBusinessListing({
        ...biz,
        isApproved: !biz.isApproved
      });
      showToast(
        !biz.isApproved
          ? `${biz.businessName} kini dipaparkan dalam direktori.`
          : `${biz.businessName} disembunyikan daripada direktori awam.`,
        'info'
      );
      onRefresh();
    } catch {
      showToast('Gagal menukar status paparan perniagaan.', 'error');
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

  const handleDirectAdminBookingStatus = async (booking: CapsuleBooking, nextStatus: BookingStatus) => {
    try {
      setLoading(true);
      await updateBookingStatus(
        booking.id,
        nextStatus,
        booking.adminNotes || '',
        booking.slotId,
        booking.businessName,
        booking.applicantId,
        booking
      );
      showToast(`Status tempahan ${booking.businessName} ditukar.`, 'success');
      onRefresh();
    } catch {
      showToast('Gagal menukar status tempahan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminBooking = async (booking: CapsuleBooking) => {
    try {
      await deleteCapsuleBooking(booking);
      showToast(`Permohonan sewaan ${booking.businessName} telah dipadam.`, 'info');
      onRefresh();
    } catch {
      showToast('Gagal memadam permohonan sewaan.', 'error');
    }
  };

  const handleDirectSlotStatusChange = async (slot: CapsuleSlot, nextStatus: SlotStatus) => {
    try {
      await saveCapsuleSlot({ ...slot, status: nextStatus });
      showToast(`Status slot ${slot.code} dikemas kini.`, 'success');
      onRefresh();
    } catch {
      showToast('Gagal menukar status slot kiosk.', 'error');
    }
  };

  const handleDeleteMentor = async (mentor: MentorProfile) => {
    try {
      await deleteMentorProfileRecord(mentor.id);
      showToast(`Profil mentor ${mentor.name} telah dipadam.`, 'info');
      onRefresh();
    } catch {
      showToast('Gagal memadam profil mentor.', 'error');
    }
  };

  const handleDirectMentorshipStatus = async (reg: MentorshipRegistration, nextStatus: MentorshipRegistration['status']) => {
    try {
      await saveMentorshipRegistrationRecord({ ...reg, status: nextStatus });
      showToast(`Status sesi bimbingan ${reg.entrepreneurName} dikemas kini.`, 'success');
      onRefresh();
    } catch {
      showToast('Gagal menukar status sesi bimbingan.', 'error');
    }
  };

  const handleDeleteMentorship = async (reg: MentorshipRegistration) => {
    try {
      await deleteMentorshipRegistrationRecord(reg.id);
      showToast(`Sesi bimbingan ${reg.entrepreneurName} telah dipadam.`, 'info');
      onRefresh();
    } catch {
      showToast('Gagal memadam sesi bimbingan.', 'error');
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

  const [expandedAdminBookingIds, setExpandedAdminBookingIds] = useState<string[]>([]);
  const toggleAdminBookingExpand = (id: string) => {
    setExpandedAdminBookingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredBookings = safeBookings.filter(b => {
    if (!b) return false;
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  const adminBookingOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => (adminBookingOrder[a.status] ?? 3) - (adminBookingOrder[b.status] ?? 3)
  );
  const mentorStatusOrder: Record<string, number> = { pending: 0, confirmed: 1, completed: 2 };
  const sortedMentorships = [...mentorshipRegistrations].sort(
    (a, b) => (mentorStatusOrder[a.status] ?? 3) - (mentorStatusOrder[b.status] ?? 3)
  );

  const adminBookingsPagination = usePagination(sortedBookings, 5, [
    bookingFilter,
    sortedBookings.length
  ]);
  const businessesPagination = usePagination(safeBusinesses, 5, [safeBusinesses.length]);
  const slotsPagination = usePagination(safeSlots, 5, [safeSlots.length]);
  const programsPagination = usePagination(safePrograms, 5, [safePrograms.length]);
  const adminMentorshipsPagination = usePagination(sortedMentorships, 5, [sortedMentorships.length]);

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center space-y-4 border border-slate-300 dark:border-slate-600">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-black dark:text-white">
          Akses Khusus Pentadbir Sistem Sahaja
        </h3>
        <p className="text-[0.9375rem] text-black dark:text-white max-w-md mx-auto">
          Modul kawalan pentadbiran dan kelulusan permohonan hanya dibenarkan untuk akaun Pentadbir Sistem yang disahkan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      
      {/* Admin Subheader & Quick Action Bar */}
      <div className="relative overflow-hidden kbelia-ambient-sheen rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Autonomous Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-56 h-56 rounded-full bg-indigo-500/14 dark:bg-indigo-500/16 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-52 h-52 rounded-full bg-rose-500/12 dark:bg-rose-500/14 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            Panel Pengurusan &amp; Kelulusan <span className="kbelia-title-shimmer">Hab KBelia</span>
          </h1>
          <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1 max-w-2xl">
            Semak dan luluskan permohonan sewaan kapsul, geran pembiayaan, profil usahawan dan program belia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedDatabase}
          disabled={loading}
          className="relative z-10 interactive-press interactive-lift px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shrink-0 transition-all cursor-pointer self-start sm:self-auto dark:bg-indigo-600"
        >
          <Database className="w-4 h-4 text-white" />
          <span>{loading ? 'Sync...' : 'Sync'}</span>
        </button>
      </div>

      {/* 4 Compact Summary KPI Cards */}
      {(() => {
        const approvedBookingsCount = safeBookings.filter(b => b && b.status === 'approved').length;
        const availableSlotsCount = safeSlots.filter(s => s && s.status === 'available').length;
        const pendingGrantsCount = (grantApplications || []).filter(g => g.status === 'pending').length;
        const approvedGrantsCount = (grantApplications || []).filter(g => g.status === 'approved').length;
        const openTicketsCount = (maintenanceTickets || []).filter(t => t.status !== 'resolved').length;

        // District data for Recharts BarChart (All 10 Kelantan districts, real slots + starter baseline for unseeded districts)
        const districtShortLabel = (d: KelantanDistrict) =>
          d === 'Kota Bharu' ? 'K. Bharu'
            : d === 'Tanah Merah' ? 'T. Merah'
            : d === 'Pasir Puteh' ? 'P. Puteh'
            : d === 'Pasir Mas' ? 'P. Mas'
            : d === 'Kuala Krai' ? 'K. Krai'
            : d === 'Gua Musang' ? 'G. Musang'
            : d;

        const districtChartData = DISTRICTS.map((d) => {
          const districtSlots = safeSlots.filter(s => s.district === d);
          const realOccupied = districtSlots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
          const realAvailable = districtSlots.filter(s => s.status === 'available').length;
          return {
            district: districtShortLabel(d),
            fullName: d,
            beroperasi: realOccupied,
            tersedia: realAvailable
          };
        });

        // Pipeline data for Recharts BarChart (strictly from live application/ticket counts)
        const pipelineChartData = [
          { label: 'Kapsul Mohon', jumlah: safeBookings.length },
          { label: 'Kapsul Lulus', jumlah: approvedBookingsCount },
          { label: 'Geran Mohon', jumlah: (grantApplications || []).length },
          { label: 'Geran Lulus', jumlah: approvedGrantsCount },
          { label: 'Sesi Mentor', jumlah: mentorshipRegistrations.length },
          { label: 'Aduan Aktif', jumlah: openTicketsCount }
        ];

        const bookingApprovalRate = safeBookings.length > 0 ? Math.round((approvedBookingsCount / safeBookings.length) * 100) : 0;
        const totalGrantsCount = (grantApplications || []).length;
        const grantApprovalRate = totalGrantsCount > 0 ? Math.round((approvedGrantsCount / totalGrantsCount) * 100) : 0;
        const activeDistrictsCount = districtChartData.filter(d => d.beroperasi > 0).length;
        const availableDistricts = districtChartData.filter(d => d.tersedia > 0);

        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SaaSKpiCard
                title="Permohonan Menunggu"
                value={pendingBookingsCount}
                subtitle="Menunggu tindakan semakan pegawai"
                icon={Clock}
                trendLabel={pendingBookingsCount > 0 ? `${pendingBookingsCount} Segera` : 'Selesai'}
                trendDirection={pendingBookingsCount > 0 ? 'down' : 'up'}
                accentColor="amber"
                isLive
                onClick={() => setAdminTab('bookings')}
              />

              <SaaSKpiCard
                title="Usahawan Belia Berdaftar"
                value={businesses.length}
                subtitle="Direktori komersil belia sah SSM"
                icon={Store}
                trendLabel={`${safeBusinesses.filter(b => b.isFeatured).length} Pilihan`}
                trendDirection="up"
                accentColor="blue"
                onClick={() => setAdminTab('businesses')}
              />

              <SaaSKpiCard
                title="Kadar Terisi Kapsul"
                value={`${occupancyRate}%`}
                subtitle={`${occupiedSlotsCount} drpd ${slots.length} unit beroperasi`}
                icon={Building2}
                trendLabel={`${availableSlotsCount} Kosong`}
                trendDirection={occupancyRate >= 50 ? 'up' : 'neutral'}
                accentColor="emerald"
                isLive
                onClick={() => setAdminTab('slots')}
              />

              <SaaSKpiCard
                title="Program & Geran Aktif"
                value={programs.length}
                subtitle="Dana & latihan keusahawanan aktif"
                icon={Award}
                trendLabel={`${(grantApplications || []).length} Permohonan`}
                trendDirection="up"
                accentColor="violet"
                onClick={() => setAdminTab('programs')}
              />
            </div>

            {/* Asymmetric Bento Analytics Section inside Queue / Overview */}
            {adminTab === 'queue' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* Left Bento Stack (7 Cols): Compact Chart Card + Separate Standalone Metrics/Availability Card Below */}
                <div className="lg:col-span-7 min-w-0 flex flex-col gap-4 h-fit">
                  {/* KOTAK 1: Compact Chart Card (Natural tight height, zero stretching) */}
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="px-5 py-4 border-b border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-black dark:text-white/80" />
                          <h3 className="text-base font-bold text-black dark:text-white">
                            Analitik Infrastruktur &amp; Permohonan Negeri
                          </h3>
                        </div>
                        <p className="text-[0.9375rem] text-black/75 dark:text-white/80 mt-0.5">
                          Statistik langsung hab kapsul seluruh Kelantan dan aliran kelulusan
                        </p>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-600 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setAdminChartMode('districts')}
                          className={`px-3 py-1.5 rounded-md text-[0.8125rem] font-semibold transition-all cursor-pointer ${
                            adminChartMode === 'districts'
                              ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600'
                              : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          Kapsul Seluruh Kelantan
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminChartMode('pipeline')}
                          className={`px-3 py-1.5 rounded-md text-[0.8125rem] font-semibold transition-all cursor-pointer ${
                            adminChartMode === 'pipeline'
                              ? 'bg-indigo-600 text-white shadow-2xs dark:bg-indigo-600'
                              : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          Aliran Permohonan
                        </button>
                      </div>
                    </div>

                    <div className="p-0 pt-2 pb-1 min-w-0">
                      <div className="relative h-[235px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
                        <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 235 }}>
                          {adminChartMode === 'districts' ? (
                            <BarChart
                              data={districtChartData}
                              barCategoryGap="8%"
                              barGap={3}
                              margin={{ top: 18, right: 4, left: 0, bottom: 2 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                              <XAxis dataKey="district" height={24} tickMargin={4} tick={{ fontSize: 11.5, fontWeight: 600 }} interval={0} padding={{ left: 0, right: 0 }} axisLine={false} tickLine={false} />
                              <YAxis width={24} tickMargin={2} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                cursor={{ fill: 'rgba(37, 99, 235, 0.10)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload as { fullName: string; beroperasi: number; tersedia: number };
                                    return (
                                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700">
                                        <div className="font-bold text-white mb-1">{d.fullName}</div>
                                        <div className="text-white/90">Beroperasi / Ditempah: {d.beroperasi}</div>
                                        <div className="text-white/90">Slot Kosong Sedia: {d.tersedia}</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="beroperasi"
                                name="Beroperasi"
                                fill="#2563EB"
                                radius={[5, 5, 0, 0]}
                                maxBarSize={64}
                                minPointSize={(val) => (Number(val) > 0 ? 4 : 0)}
                                isAnimationActive={false}
                              >
                                <LabelList
                                  dataKey="beroperasi"
                                  position="top"
                                  formatter={(val: unknown) => (Number(val) > 0 ? String(val) : '')}
                                  className="fill-slate-900 dark:fill-slate-100 font-mono"
                                  style={{ fontSize: 11.5, fontWeight: 700 }}
                                />
                              </Bar>
                              <Bar
                                dataKey="tersedia"
                                name="Tersedia"
                                fill="#10B981"
                                radius={[5, 5, 0, 0]}
                                maxBarSize={64}
                                minPointSize={(val) => (Number(val) > 0 ? 4 : 0)}
                                isAnimationActive={false}
                              >
                                <LabelList
                                  dataKey="tersedia"
                                  position="top"
                                  formatter={(val: unknown) => (Number(val) > 0 ? String(val) : '')}
                                  className="fill-slate-900 dark:fill-slate-100 font-mono"
                                  style={{ fontSize: 11.5, fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          ) : (
                            <BarChart
                              data={pipelineChartData}
                              barCategoryGap="10%"
                              margin={{ top: 18, right: 4, left: 0, bottom: 2 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                              <XAxis dataKey="label" height={24} tickMargin={4} tick={{ fontSize: 12, fontWeight: 600 }} interval={0} padding={{ left: 0, right: 0 }} axisLine={false} tickLine={false} />
                              <YAxis width={24} tickMargin={2} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                cursor={{ fill: 'rgba(79, 70, 229, 0.10)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload as { label: string; jumlah: number };
                                    return (
                                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700">
                                        <div className="text-white/80 text-[0.8125rem]">{d.label}</div>
                                        <div className="font-bold text-white">{d.jumlah} Rekod</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="jumlah"
                                name="Jumlah Rekod"
                                fill="#4F46E5"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={110}
                                minPointSize={(val) => (Number(val) > 0 ? 4 : 0)}
                                isAnimationActive={false}
                              >
                                <LabelList
                                  dataKey="jumlah"
                                  position="top"
                                  formatter={(val: unknown) => (Number(val) > 0 ? String(val) : '0')}
                                  className="fill-slate-900 dark:fill-slate-100 font-mono"
                                  style={{ fontSize: 12.5, fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-2 text-sm">
                      {adminChartMode === 'districts' ? (
                        <>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-black dark:text-white">
                              <span className="w-3 h-3 rounded-xs bg-blue-600 shrink-0" />
                              <span>Beroperasi / Ditempah</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-black dark:text-white">
                              <span className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
                              <span>Slot Tersedia</span>
                            </span>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-black/80 dark:text-white/85">
                            {occupiedSlotsCount + availableSlotsCount} Unit Kapsul
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 font-semibold text-black dark:text-white">
                            <span className="w-3 h-3 rounded-xs bg-indigo-600 shrink-0" />
                            <span>Jumlah Rekod Aliran Semasa</span>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-black/80 dark:text-white/85">
                            {pipelineChartData.reduce((sum, item) => sum + item.jumlah, 0)} Jumlah Aktiviti
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* KOTAK 2: Separate Standalone Card Outside & Below Chart Box */}
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 shadow-sm overflow-hidden p-4 flex flex-col gap-3 h-fit">
                    {/* Baris 1: 3 Kolum Metrik Prestasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700">
                        <div className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/75">
                          Kadar Lulus Kapsul
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-extrabold font-mono text-black dark:text-white tabular-nums">
                            {bookingApprovalRate}%
                          </span>
                          <span className="text-[0.8125rem] font-mono text-black/70 dark:text-white/75 tabular-nums">
                            {approvedBookingsCount}/{safeBookings.length}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700">
                        <div className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/75">
                          Kadar Lulus Geran
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-extrabold font-mono text-black dark:text-white tabular-nums">
                            {grantApprovalRate}%
                          </span>
                          <span className="text-[0.8125rem] font-mono text-black/70 dark:text-white/75 tabular-nums">
                            {approvedGrantsCount}/{totalGrantsCount}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700">
                        <div className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/75">
                          Liputan Daerah Aktif
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-extrabold font-mono text-black dark:text-white tabular-nums">
                            {activeDistrictsCount}/10
                          </span>
                          <span className="text-[0.8125rem] font-mono text-black/70 dark:text-white/75 tabular-nums">
                            {occupiedSlotsCount} unit aktif
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Baris 2: 2 Kolum Operasi Daerah & Tindakan Segera */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 flex flex-col gap-2 h-fit">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-black dark:text-white">
                            Daerah Ada Kekosongan ({availableSlotsCount})
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdminTab('slots')}
                            className="text-[0.8125rem] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            <span>Urus Slot</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {availableDistricts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {availableDistricts.map((d) => (
                              <button
                                key={d.fullName}
                                type="button"
                                onClick={() => setAdminTab('slots')}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-500 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>{d.fullName}</span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                  {d.tersedia}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[0.8125rem] text-black/75 dark:text-white/80">
                            Kesemua 10 jajahan telah penuh ditempah buat masa ini.
                          </p>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 flex flex-col gap-2 h-fit">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-black dark:text-white">
                            Pengisian &amp; Tindakan Semakan
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdminTab('bookings')}
                            className="text-[0.8125rem] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            <span>Semak</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[0.8125rem] text-black/80 dark:text-white/85">
                            <span>Kadar Pengisian Keseluruhan</span>
                            <span className="font-mono font-bold text-black dark:text-white tabular-nums">{occupancyRate}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                            />
                          </div>
                          <p className="text-[0.8125rem] text-black/75 dark:text-white/80 tabular-nums">
                            {pendingBookingsCount + pendingGrantsCount} permohonan menunggu tindakan pegawai.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Bento (5 Cols): Ringkasan Tindakan & Barisan Semakan */}
                <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 shadow-sm overflow-hidden flex flex-col h-fit">
                  <div className="px-5 py-4 border-b border-slate-300 dark:border-zinc-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-black dark:text-white/75" />
                      <h3 className="text-base font-bold text-black dark:text-white">
                        Ringkasan Semakan & Operasi
                      </h3>
                    </div>
                    <span className="text-[0.8125rem] font-mono font-bold text-black dark:text-white bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 px-2.5 py-0.5 rounded">
                      Langsung
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <button
                      type="button"
                      onClick={() => setAdminTab('bookings')}
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-sm font-bold text-black dark:text-white leading-snug break-words">Permohonan Sewaan Kapsul</div>
                          <div className="text-sm text-black/75 dark:text-white/75 leading-relaxed break-words">Menunggu kelulusan rasmi hab</div>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-[0.8125rem] font-black px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-black dark:text-white shrink-0">
                        {pendingBookingsCount}
                      </span>
                    </button>

                    <div className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-sm font-bold text-black dark:text-white leading-snug break-words">Permohonan Geran Belia</div>
                          <div className="text-sm text-black/75 dark:text-white/75 leading-relaxed break-words">{approvedGrantsCount} telah diluluskan</div>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-[0.8125rem] font-black px-2.5 py-1 rounded-md bg-amber-100 dark:bg-emerald-600 text-black dark:text-white shrink-0">
                        {pendingGrantsCount}
                      </span>
                    </div>

                    <div className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-sm font-bold text-black dark:text-white leading-snug break-words">Tiket Aduan Fasiliti</div>
                          <div className="text-sm text-black/75 dark:text-white/75 leading-relaxed break-words">Penyelenggaraan &amp; teknikal kiosk</div>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-[0.8125rem] font-black px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 text-black dark:text-white shrink-0">
                        {openTicketsCount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAdminTab('mentors')}
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-sm font-bold text-black dark:text-white leading-snug break-words">Panel &amp; Sesi Bimbingan Mentor</div>
                          <div className="text-sm text-black/75 dark:text-white/75 leading-relaxed break-words">{mentors.length} mentor aktif bertauliah</div>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-[0.8125rem] font-black px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-950 text-black dark:text-white shrink-0">
                        {mentorshipRegistrations.length}
                      </span>
                    </button>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdminTab('news')}
                        className="text-black dark:text-white hover:text-black dark:hover:text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Newspaper className="w-3.5 h-3.5 text-black dark:text-white/75" />
                        <span>Urus Berita ({newsItems.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('b2b')}
                        className="text-black dark:text-white font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ruang Niaga</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminTab('slots')}
                      className="text-black dark:text-white/75 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Slot Kapsul</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Organized Report Section Across All User Types */}
            {adminTab === 'queue' && (
              <UserTypeReportSection
                businesses={safeBusinesses}
                bookings={safeBookings}
                grantApplications={grantApplications || []}
                mentors={mentors}
                mentorshipRegistrations={mentorshipRegistrations}
                maintenanceTickets={maintenanceTickets || []}
                programs={safePrograms}
                newsItems={newsItems}
                communityPosts={communityPosts}
                portalSettings={portalSettings}
              />
            )}
          </>
        );
      })()}

      {message && (
        <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/50 text-black dark:text-white border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-sm font-bold opacity-60 hover:opacity-100 px-2 py-0.5 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB 0: ADVANCED 1-CLICK APPROVAL QUEUE & AUDIT EXPORTS */}
      {(adminTab === 'queue' || adminTab === 'sync') && (
        <AdminApprovalQueue
          bookings={safeBookings}
          grantApplications={grantApplications || []}
          slots={safeSlots}
          maintenanceTickets={maintenanceTickets || []}
          onApproveBooking={async (bId, notes) => {
            const b = safeBookings.find(x => x.id === bId);
            if (b) await handleApproveBooking({ ...b, adminNotes: notes });
          }}
          onRejectBooking={async (bId, notes) => {
            const b = safeBookings.find(x => x.id === bId);
            if (b) await handleRejectBooking({ ...b, adminNotes: notes });
          }}
          onApproveGrant={async (gId, notes) => {
            const targetGrant = (grantApplications || []).find(g => g.id === gId);
            await updateGrantApplicationStatus(gId, 'approved', notes, targetGrant);
            if (targetGrant) {
              emitAdminOrMentorNotification({
                title: `Geran Belia Diluluskan: ${targetGrant.grantAmount}`,
                message: `Tahniah! Permohonan ${targetGrant.programTitle} bagi ${targetGrant.businessName} telah diluluskan rasmi.`,
                type: 'grant',
                senderRole: 'admin',
                targetRole: 'youth',
                targetUserId: targetGrant.applicantId,
                sender: 'Admin KBelia',
                actionTab: 'merchant'
              });
            }
            confetti({ particleCount: 50 });
            onRefresh();
          }}
          onRejectGrant={async (gId, notes) => {
            const targetGrant = (grantApplications || []).find(g => g.id === gId);
            await updateGrantApplicationStatus(gId, 'rejected', notes, targetGrant);
            if (targetGrant) {
              emitAdminOrMentorNotification({
                title: `Status Permohonan Geran: ${targetGrant.businessName}`,
                message: `Permohonan ${targetGrant.programTitle} tidak dapat diluluskan. Catatan: ${notes || 'Dokumen sokongan tidak lengkap.'}`,
                type: 'grant',
                senderRole: 'admin',
                targetRole: 'youth',
                targetUserId: targetGrant.applicantId,
                sender: 'Admin KBelia',
                actionTab: 'merchant'
              });
            }
            onRefresh();
          }}
          onUpdateSlotStatus={async (sId, newStatus) => {
            const slot = safeSlots.find(s => s.id === sId);
            if (slot) {
              await saveCapsuleSlot({ ...slot, status: newStatus });
              onRefresh();
            }
          }}
          onUpdateTicketStatus={async (ticketId, status, adminNotes) => {
            const targetTicket = (maintenanceTickets || []).find(t => t.id === ticketId);
            await updateMaintenanceTicketStatus(ticketId, status, adminNotes, targetTicket);
            if (targetTicket?.ownerId) {
              const statusText = status === 'resolved' ? 'Diselesaikan' : status === 'in_progress' ? 'Sedang Dibaiki' : 'Diterima';
              emitAdminOrMentorNotification({
                title: `Kemas Kini Aduan ${targetTicket.slotCode}: ${statusText}`,
                message: `Tiket aduan fasiliti anda bagi ${targetTicket.kioskName} kini berstatus ${statusText}.`,
                type: 'kiosk',
                senderRole: 'admin',
                targetRole: 'youth',
                targetUserId: targetTicket.ownerId,
                sender: 'Unit Teknikal & Fasiliti KBelia',
                actionTab: 'merchant'
              });
            }
            showToast('Status aduan fasiliti dikemaskini!', 'success');
            onRefresh();
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* TAB 1: BOOKINGS MANAGEMENT */}
      {adminTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Senarai Permohonan Sewaan Kapsul</h3>
              <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Semak cadangan perniagaan dan sahkan kelulusan peruntukan kiosk.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-black/70 dark:text-white/75">Tapis:</span>
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize transition-all cursor-pointer ${
                    bookingFilter === filter
                      ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter === 'pending' ? 'Menunggu' : filter === 'approved' ? 'Diluluskan' : filter === 'rejected' ? 'Ditolak' : 'Semua'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setEditingBooking(null);
                  setIsCreatingBooking(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Permohonan</span>
              </button>
            </div>
          </div>

          {sortedBookings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600">
              <Clock className="w-12 h-12 text-black/35 dark:text-white/35 mx-auto mb-2" />
              <h4 className="font-bold text-black dark:text-white text-sm">Tiada Permohonan Dalam Kategori Ini</h4>
            </div>
          ) : (
            <div className="space-y-3 h-fit">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden shadow-xs transition-colors h-fit">
                {adminBookingsPagination.paginatedItems.map((b) => {
                  const isExpanded = expandedAdminBookingIds.includes(b.id);
                  return (
                    <div key={b.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shrink-0">
                            <PortalImage
                              src={resolveBookingKioskImage(b, safeSlots)}
                              alt={`Reka bentuk kiosk ${b.slotName}`}
                              fallbackType="kiosk"
                              fallbackLabel={b.slotCode}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="text-sm sm:text-base font-extrabold text-black dark:text-white truncate">
                                {b.slotCode} · {b.businessName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[0.75rem] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white shrink-0">
                                {b.businessCategory}
                              </span>
                            </div>
                            <p className="text-sm text-black/70 dark:text-white/75 mt-0.5 truncate tabular-nums">
                              {b.applicantName} · {b.slotName} ({b.hubLocation}) · {b.durationMonths} bln
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
                          <select
                            aria-label={`Status permohonan ${b.businessName}`}
                            disabled={loading}
                            value={b.status}
                            onChange={(e) => handleDirectAdminBookingStatus(b, e.target.value as BookingStatus)}
                            className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-bold border cursor-pointer ${
                              b.status === 'approved'
                                ? 'bg-emerald-100 border-emerald-300 text-black dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-white'
                                : b.status === 'rejected'
                                  ? 'bg-rose-100 border-rose-300 text-black dark:bg-rose-950/80 dark:border-rose-800 dark:text-white'
                                  : b.status === 'cancelled'
                                    ? 'bg-slate-100 border-slate-300 text-black dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                                    : 'bg-amber-100 border-amber-300 text-black dark:bg-amber-950/80 dark:border-amber-800 dark:text-white'
                            }`}
                          >
                            <option value="pending">Menunggu Kelulusan</option>
                            <option value="approved">Diluluskan</option>
                            <option value="rejected">Ditolak</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingBooking(false);
                              setEditingBooking(b);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: `${b.businessName} (${b.slotCode})`,
                                itemType: 'Permohonan Sewaan Kiosk',
                                onConfirm: () => handleDeleteAdminBooking(b)
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleAdminBookingExpand(b.id)}
                            aria-expanded={isExpanded}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                          {/* Applicant Details */}
                          <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl text-sm text-black dark:text-white/75 border border-slate-300 dark:border-slate-600">
                            <div>
                              <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Pemohon:</span>
                              <strong className="text-black dark:text-white">{b.applicantName}</strong>
                            </div>
                            <div>
                              <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">E-mel / Telefon:</span>
                              <span className="font-mono text-black dark:text-white">{b.applicantEmail} • {b.applicantPhone}</span>
                            </div>
                            <div>
                              <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Tempoh & Tarikh Mula:</span>
                              <span className="text-black dark:text-white tabular-nums">{b.durationMonths} Bulan (Mulai {b.startDate})</span>
                            </div>
                          </div>

                          {/* Pitch Notes */}
                          {b.pitchNotes && (
                            <div className="text-sm text-black dark:text-white bg-indigo-50 dark:bg-indigo-950/60 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/70">
                              <span className="font-bold text-black dark:text-white block mb-0.5">Cadangan Pitching Usahawan:</span>
                              <p>{b.pitchNotes}</p>
                            </div>
                          )}

                          {/* Admin Notes & Actions */}
                          {b.status === 'pending' && (
                            <div className="pt-1 space-y-3">
                              <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-1">
                                  Catatan Pentadbir
                                </label>
                                <input
                                  type="text"
                                  placeholder="Masukkan catatan pentadbir"
                                  value={reviewNoteInput[b.id] || ''}
                                  onChange={(e) => setReviewNoteInput({ ...reviewNoteInput, [b.id]: e.target.value })}
                                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 focus:outline-none dark:focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleRejectBooking(b)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-black dark:text-white border border-rose-200 dark:border-rose-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                                >
                                  Tolak Permohonan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveBooking(b)}
                                  disabled={loading}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Luluskan Permohonan</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {b.adminNotes && b.status !== 'pending' && (
                            <div className="text-sm text-black dark:text-white bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-300 dark:border-slate-600">
                              <strong className="text-black dark:text-white">Catatan Pentadbir:</strong> {b.adminNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                currentPage={adminBookingsPagination.currentPage}
                totalItems={adminBookingsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={adminBookingsPagination.setCurrentPage}
                itemLabel="permohonan sewaan"
                accent="rose"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUSINESSES DIRECTORY MANAGEMENT */}
      {adminTab === 'businesses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white">Senarai Kedai &amp; Usahawan</h3>
              <p className="text-sm text-black/75 dark:text-white/80">Urus, tambah, edit, kawal produk atau padam senarai perniagaan belia dalam direktori portal.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBusiness(null);
                setIsCreatingBusiness(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perniagaan</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs transition-colors h-fit">
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
              {businessesPagination.paginatedItems.map((biz) => {
                const bizProductCount = products.filter(p => p.businessId === biz.id).length;
                return (
                  <div
                    key={biz.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={biz.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                        alt={biz.businessName}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-extrabold text-black dark:text-white text-sm sm:text-base truncate">
                            {biz.businessName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleToggleApprovedBusiness(biz)}
                            className={`px-2 py-0.5 rounded font-bold text-[0.75rem] border cursor-pointer shrink-0 ${
                              biz.isApproved
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-black dark:text-white'
                                : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black/70 dark:text-white/70'
                            }`}
                          >
                            {biz.isApproved ? 'Aktif' : 'Tersembunyi'}
                          </button>
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5 tabular-nums">
                          {biz.ownerName} · {biz.category} · {biz.district} · SSM: {biz.ssmNumber || 'Tiada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(biz)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[0.8125rem] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                          biz.isFeatured
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-black dark:text-white border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-black dark:text-white/75" />
                        <span>{biz.isFeatured ? 'Pilihan' : 'Jadikan Pilihan'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingProductsBusiness(biz);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title={`Urus Produk ${biz.businessName}`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>Produk ({bizProductCount})</span>
                      </button>
                      <button
                        type="button"
                        id={`btn-edit-business-${biz.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreatingBusiness(false);
                          setEditingBusiness(biz);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title={`Edit Perniagaan ${biz.businessName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-business-${biz.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete({
                            itemName: biz.businessName,
                            itemType: 'Senarai Perniagaan',
                            onConfirm: () => handleDeleteBusiness(biz.id, biz.businessName)
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title={`Padam Perniagaan ${biz.businessName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 pb-3 border-t border-slate-200 dark:border-slate-700">
              <PaginationBar
                currentPage={businessesPagination.currentPage}
                totalItems={businessesPagination.totalItems}
                itemsPerPage={5}
                onPageChange={businessesPagination.setCurrentPage}
                itemLabel="perniagaan"
                accent="rose"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAPSULE SLOTS MANAGEMENT */}
      {adminTab === 'slots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Inventori & Pengurusan Kapsul Jajahan</h3>
              <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Urus pendaftaran slot kiosk, tetapkan kadar sewa bulanan, atau padam unit yang tidak lagi beroperasi.</p>
            </div>

            <button
              type="button"
              id="btn-admin-add-slot-toggle"
              onClick={() => setShowSlotForm(!showSlotForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0 dark:bg-blue-600"
            >
              <Building2 className="w-4 h-4" />
              <span>{showSlotForm ? 'Tutup Borang' : 'Tambah Kiosk Baharu'}</span>
            </button>
          </div>

          {/* New Slot Form */}
          {showSlotForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-sm sm:text-[0.9375rem] text-black dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-black dark:text-white/75" />
                  <span>Borang Tambah Kiosk Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSlotForm(false)}
                  className="p-1 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Kod Kiosk <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan kod kiosk"
                      value={slotCode}
                      onChange={(e) => setSlotCode(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Nama Kiosk <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama kiosk"
                      value={slotName}
                      onChange={(e) => setSlotName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Kadar Sewa Bulanan <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Masukkan kadar sewa bulanan"
                      value={slotMonthlyRate}
                      onChange={(e) => setSlotMonthlyRate(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all font-bold dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Lokasi Hab
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan lokasi hab"
                      value={slotHub}
                      onChange={(e) => setSlotHub(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Daerah
                    </label>
                    <select
                      value={slotDistrict}
                      onChange={(e) => setSlotDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Status Kiosk
                    </label>
                    <select
                      value={slotStatus}
                      onChange={(e) => setSlotStatus(e.target.value as SlotStatus)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-rose-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      <option value="available" className="dark:bg-slate-900">Tersedia (Kosong)</option>
                      <option value="occupied" className="dark:bg-slate-900">Sedang Beroperasi</option>
                      <option value="reserved" className="dark:bg-slate-900">Dalam Tempahan</option>
                      <option value="maintenance" className="dark:bg-slate-900">Penyelenggaraan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                    Kemudahan Disediakan
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan senarai kemudahan"
                    value={slotAmenities}
                    onChange={(e) => setSlotAmenities(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <ImageDropzone
                    value={slotImageUrl}
                    onChange={(val) => setSlotImageUrl(val)}
                    label="Gambar Kiosk"
                    aspectRatio="16:9"
                  />
                </div>

                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setShowSlotForm(false)}
                    className="py-2.5 px-5 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-blue-600"
                  >
                    <span>{loading ? 'Menyimpan...' : 'Simpan Kapsul'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Slots List View */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs transition-colors h-fit">
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
              {slotsPagination.paginatedItems.map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shrink-0">
                      <PortalImage
                        src={resolveSlotImage(s)}
                        alt={s.name}
                        fallbackType="kiosk"
                        fallbackLabel={s.code}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold text-black dark:text-white text-sm sm:text-base truncate">
                          {s.code} · {s.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[0.75rem] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white shrink-0 tabular-nums">
                          RM{s.monthlyRate}/bln
                        </span>
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5 tabular-nums">
                        {s.hubLocation} ({s.district}) · {s.size}{s.currentTenantBusinessName ? ` · Penyewa: ${s.currentTenantBusinessName}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <select
                      aria-label={`Tukar status slot ${s.code}`}
                      value={s.status}
                      onChange={(e) => handleDirectSlotStatusChange(s, e.target.value as SlotStatus)}
                      className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-bold border cursor-pointer ${
                        s.status === 'available'
                          ? 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-800 text-black dark:text-white'
                          : s.status === 'occupied'
                            ? 'bg-indigo-100 border-indigo-300 dark:bg-indigo-600 dark:border-indigo-500 text-black dark:text-white'
                            : 'bg-amber-100 border-amber-300 dark:bg-amber-950/80 dark:border-amber-800 text-black dark:text-white'
                      }`}
                    >
                      <option value="available">Tersedia (available)</option>
                      <option value="occupied">Beroperasi (occupied)</option>
                      <option value="reserved">Ditempah (reserved)</option>
                      <option value="maintenance">Selenggara (maintenance)</option>
                    </select>
                    <button
                      type="button"
                      id={`btn-edit-slot-${s.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlot(s);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                      title="Edit Slot Kiosk"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-delete-slot-${s.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete({
                          itemName: `${s.code} · ${s.name}`,
                          itemType: 'Slot Kiosk',
                          onConfirm: () => handleDeleteSlot(s.id)
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
                      title="Padam Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Padam</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-3 border-t border-slate-200 dark:border-slate-700">
              <PaginationBar
                currentPage={slotsPagination.currentPage}
                totalItems={slotsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={slotsPagination.setCurrentPage}
                itemLabel="slot kapsul"
                accent="rose"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAMS MANAGEMENT */}
      {adminTab === 'programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Pengurusan Inisiatif Geran & Program Belia</h3>
              <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Terbit, kemas kini dan padam hebahan rasmi program latihan serta geran usahawan belia Kelantan.</p>
            </div>

            <button
              type="button"
              id="btn-admin-add-prog-toggle"
              onClick={() => setShowProgramForm(!showProgramForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0 dark:bg-blue-600"
            >
              <Award className="w-4 h-4" />
              <span>{showProgramForm ? 'Tutup Borang' : 'Terbitkan Program Baharu'}</span>
            </button>
          </div>

          {/* New Program Form */}
          {showProgramForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-sm sm:text-[0.9375rem] text-black dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-black dark:text-white/75" />
                  <span>Borang Terbit Program Keusahawanan Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="p-1 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProgram} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Tajuk Program <span className="text-black dark:text-white">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan tajuk program"
                      value={progTitle}
                      onChange={(e) => setProgTitle(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all font-bold dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Kategori Program <span className="text-black dark:text-white">*</span>
                    </label>
                    <select
                      value={progCategory}
                      onChange={(e) => setProgCategory(e.target.value as YouthProgram['category'])}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all cursor-pointer dark:focus:border-blue-500"
                    >
                      <option value="Geran & Dana" className="dark:bg-slate-900">Geran & Dana</option>
                      <option value="Bengkel & Latihan" className="dark:bg-slate-900">Bengkel & Latihan</option>
                      <option value="Pameran & Ekspo" className="dark:bg-slate-900">Pameran & Ekspo</option>
                      <option value="Pitching & Inkubasi" className="dark:bg-slate-900">Pitching & Inkubasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Tarikh Pelaksanaan
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan tarikh pelaksanaan"
                      value={progDate}
                      onChange={(e) => setProgDate(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan lokasi"
                      value={progLocation}
                      onChange={(e) => setProgLocation(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Nilai Bantuan
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nilai bantuan"
                      value={progAmount}
                      onChange={(e) => setProgAmount(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all font-bold text-black dark:text-white dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                    Keterangan Program
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan keterangan program"
                    value={progDesc}
                    onChange={(e) => setProgDesc(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <ImageDropzone
                    value={progImageUrl}
                    onChange={(val) => setProgImageUrl(val)}
                    label="Poster Program"
                    aspectRatio="16:9"
                  />
                </div>

                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setShowProgramForm(false)}
                    className="py-2.5 px-5 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-blue-600"
                  >
                    <span>{loading ? 'Menerbitkan...' : 'Terbitkan Program'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3 h-fit">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs overflow-hidden flex flex-col divide-y divide-slate-200 dark:divide-slate-700 transition-colors h-fit">
              {programsPagination.paginatedItems.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 shrink-0">
                      <PortalImage
                        src={resolveProgramImage(p)}
                        alt={p.title}
                        fallbackType="program"
                        fallbackLabel={p.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold text-black dark:text-white text-sm sm:text-base truncate">
                          {p.title}
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200 dark:border-indigo-800/70 rounded text-[0.75rem] font-bold shrink-0">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5">
                        {p.grantAmount ? `Bantuan: ${p.grantAmount} · ` : ''}{p.description}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      id={`btn-edit-prog-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProgram(p);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      title="Edit Program"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-delete-prog-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete({
                          itemName: p.title,
                          itemType: 'Program & Geran',
                          onConfirm: () => handleDeleteProg(p.id)
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      title="Padam Program"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Padam</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <PaginationBar
              currentPage={programsPagination.currentPage}
              totalItems={programsPagination.totalItems}
              itemsPerPage={5}
              onPageChange={programsPagination.setCurrentPage}
              itemLabel="program"
              accent="rose"
            />
          </div>
        </div>
      )}

      {/* TAB: MENTOR & MENTEE MONITORING HUB */}
      {adminTab === 'mentors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="kbelia-important-header p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-300 dark:border-slate-600">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white border border-blue-200 dark:border-blue-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Pusat Bimbingan Mentor UMK</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Pemantauan Mentor &amp; Usahawan Kelantan</h3>
              <p className="text-[0.9375rem] text-black dark:text-white max-w-2xl leading-relaxed">
                Pantau sesi janji temu bimbingan usahawan belia bersama mentor UMK dan pakar industri.
              </p>
            </div>
          </div>

          {/* Mentor Management Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-black dark:text-white/75" />
                <span>Senarai Mentor ({mentors.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedMentorForEdit(null);
                  setIsCreatingMentor(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mentor Baharu</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs overflow-hidden flex flex-col divide-y divide-slate-200 dark:divide-slate-700 h-fit">
              {mentors.map((m) => {
                const menteeCount = mentorshipRegistrations.filter(r => r.mentorId === m.id).length;
                return (
                  <div
                    key={m.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={m.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg'}
                        alt={m.name}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h5 className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                            {m.name}
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[0.75rem] font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-black dark:text-white shrink-0 tabular-nums">
                            {menteeCount} Usahawan
                          </span>
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5">
                          {m.agency.split('(')[0].trim()} · {m.title} · {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingMentor(false);
                          setSelectedMentorForEdit(m);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-black dark:text-white border border-blue-200 dark:border-blue-800/70 rounded-lg text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: m.name,
                            itemType: 'Profil Mentor',
                            onConfirm: () => handleDeleteMentor(m)
                          })
                        }
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-black dark:text-white border border-rose-200 dark:border-rose-800/70 rounded-lg text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        title={`Padam Mentor ${m.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mentee List View */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs overflow-hidden h-fit">
            <div className="p-4 sm:p-5 border-b border-slate-300 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-black dark:text-white">
                  Senarai Usahawan Berdaftar Mengikut Mentor
                </h4>
                <span className="text-sm text-black/70 dark:text-white/75">Seluruh Kelantan · Urus jadual, status dan rekod sesi</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMentorship(null);
                  setIsCreatingMentorship(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sesi Bimbingan</span>
              </button>
            </div>

            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700 text-black dark:text-white">
              {sortedMentorships.length === 0 ? (
                <div className="text-center py-8 text-sm text-black/70 dark:text-white/75">
                  Tiada pendaftaran bimbingan ditemui.
                </div>
              ) : (
                adminMentorshipsPagination.paginatedItems.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-lg shrink-0 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h5 className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                            {m.entrepreneurName} · {m.businessName}
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[0.75rem] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white shrink-0">
                            {m.district}
                          </span>
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5 tabular-nums">
                          Mentor: {m.mentorName} · {m.topic} · {m.preferredDate} ({m.mode})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      <select
                        aria-label={`Status sesi ${m.entrepreneurName}`}
                        value={m.status}
                        onChange={(e) => handleDirectMentorshipStatus(m, e.target.value as MentorshipRegistration['status'])}
                        className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-bold border cursor-pointer ${
                          m.status === 'confirmed'
                            ? 'bg-indigo-100 border-indigo-300 text-black dark:bg-indigo-600 dark:border-indigo-500 dark:text-white'
                            : m.status === 'completed'
                              ? 'bg-emerald-100 border-emerald-300 text-black dark:bg-emerald-950 dark:border-emerald-800 dark:text-white'
                              : m.status === 'cancelled'
                                ? 'bg-slate-200 border-slate-300 text-black dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                                : 'bg-amber-100 border-amber-300 text-black dark:bg-amber-950 dark:border-amber-800 dark:text-white'
                        }`}
                      >
                        <option value="pending">Menunggu</option>
                        <option value="confirmed">Disahkan</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingMentorship(false);
                          setEditingMentorship(m);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: `${m.entrepreneurName} (${m.topic})`,
                            itemType: 'Sesi Bimbingan Mentor',
                            onConfirm: () => handleDeleteMentorship(m)
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 pb-3 border-t border-slate-200 dark:border-slate-700">
              <PaginationBar
                currentPage={adminMentorshipsPagination.currentPage}
                totalItems={adminMentorshipsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={adminMentorshipsPagination.setCurrentPage}
                itemLabel="pendaftaran bimbingan"
                accent="rose"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: PORTAL NEWS MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'news' && (
        <div className="animate-in fade-in duration-200">
          <AdminNewsManager
            newsItems={newsItems}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* TAB: RUANG NIAGA VISUAL AD MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'b2b' && (
        <div className="animate-in fade-in duration-200">
          <AdminB2BManager />
        </div>
      )}

      {/* TAB: EVENTS & BOOKINGS MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'events' && (
        <div className="animate-in fade-in duration-200">
          <AdminEventsManager onRefresh={onRefresh} />
        </div>
      )}

      {/* TAB: USER ACCOUNT MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'users' && (
        <div className="animate-in fade-in duration-200">
          <AdminUsersManager onRefresh={onRefresh} />
        </div>
      )}

      {/* TAB 5: ADMIN & SYSTEM SETTINGS */}
      {adminTab === 'settings' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="kbelia-important-header p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-300 dark:border-slate-600">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-200 dark:border-rose-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Pengurusan Sistem Pentadbir</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Tetapan Sistem & Profil Pentadbir</h3>
              <p className="text-[0.9375rem] text-black dark:text-white max-w-2xl leading-relaxed">
                Kawalan menyeluruh untuk parameter sewaan kiosk kapsul, pengurusan perhubungan urusetia, pembersihan cache sesi dan penyelarasan data usahawan belia.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-black dark:text-white/75" />
                Super Admin Berkuasa Penuh
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {adminSettingsSuccess && (
            <div className="p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs bg-emerald-50 text-black border border-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                <span>{adminSettingsSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminSettingsSuccess(null)}
                className="text-[0.8125rem] font-bold opacity-60 hover:opacity-100 px-2 py-0.5"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-6">
            {/* Section 1: Profil Pentadbir */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black dark:text-white">Profil Pentadbir &amp; Saluran Sokongan Rasmi</h4>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Maklumat pentadbir yang mengurus portal dan kelulusan usahawan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Pentadbir */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Nama Pegawai Pentadbir <span className="text-black dark:text-white">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminOfficerName}
                      onChange={(e) => setAdminOfficerName(e.target.value)}
                      placeholder="Masukkan nama penuh"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Emel Pentadbir */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Alamat Emel
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'nabilwahab03020302@gmail.com'}
                      placeholder="Masukkan alamat emel"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-[0.9375rem] font-medium text-black/70 dark:text-white/75 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Talian Sokongan WhatsApp Urusetia */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Nombor Telefon Pentadbiran <span className="text-black dark:text-white">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={adminHelpdeskPhone}
                      onChange={(e) => setAdminHelpdeskPhone(e.target.value)}
                      placeholder="Masukkan nombor telefon pentadbiran"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 font-mono dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tahap Akses */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Tahap Akses Sistem
                  </label>
                  <div className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-black dark:text-white/75 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-black dark:text-white/75" />
                    <span>Super Admin Pentadbiran (Level 1)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tetapan & Parameter Portal */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-black dark:text-white border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black dark:text-white">Tetapan &amp; Parameter Operasi Portal KBelia</h4>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Konfigurasi subsidi sewaan, had tempoh dan status pelayan portal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kadar Subsidi Sewaan */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Kadar Subsidi Sewaan
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={portalSubsidyRate}
                    onChange={(e) => setPortalSubsidyRate(e.target.value)}
                    placeholder="Masukkan peratusan subsidi"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 dark:focus:border-blue-500"
                  />
                </div>

                {/* Had Tempoh Sewaan */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Tempoh Maksimum Sewaan
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={maxLeaseDurationMonths}
                    onChange={(e) => setMaxLeaseDurationMonths(e.target.value)}
                    placeholder="Masukkan tempoh dalam bulan"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 dark:focus:border-blue-500"
                  />
                </div>

                {/* Status Mod Sistem */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Status Operasi Portal
                  </label>
                  <select
                    value={systemStatus}
                    onChange={(e) => setSystemStatus(e.target.value as 'operational' | 'maintenance')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-rose-600 transition-all text-black dark:text-white dark:focus:border-blue-500"
                  >
                    <option value="operational">Portal Aktif &amp; Permohonan Dibuka</option>
                    <option value="maintenance">Mod Penyelenggaraan Sistem (Sementara)</option>
                  </select>
                </div>

                {/* Pengumuman Khas Banner */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Teks Pengumuman Portal
                  </label>
                  <input
                    type="text"
                    value={portalAnnouncement}
                    onChange={(e) => setPortalAnnouncement(e.target.value)}
                    placeholder="Masukkan teks pengumuman portal"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 dark:focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Ringkasan Pengguna & Kawalan Pangkalan Data */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black dark:text-white">Kawalan Pangkalan Data & Penyelenggaraan Sesi</h4>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Tindakan kecemasan untuk menyegerakkan data dan memadam cache sistem.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600">
                  <div className="text-xl font-bold text-black dark:text-white">{safeBusinesses.length}</div>
                  <div className="text-sm text-black/70 dark:text-white/75 font-medium">Usahawan Berdaftar</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600">
                  <div className="text-xl font-bold text-black dark:text-white">{safeBookings.length}</div>
                  <div className="text-sm text-black/70 dark:text-white/75 font-medium">Jumlah Permohonan Kiosk</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600">
                  <div className="text-xl font-bold text-black dark:text-white">{safeSlots.length}</div>
                  <div className="text-sm text-black/70 dark:text-white/75 font-medium">Slot Kiosk Terkawal</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={loading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs dark:bg-indigo-600"
                >
                  <Database className="w-4 h-4 text-white" />
                  <span>{loading ? 'Sedang Memproses...' : 'Muat Semula'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLocalSessionCache}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-black dark:text-white/75" />
                  <span>Kosongkan Cache Tempatan</span>
                </button>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="text-sm font-bold text-black dark:text-white">Simpan Tetapan Pentadbir</div>
                <p className="text-[0.875rem] text-black/70 dark:text-white/75">
                  Semua perubahan akan terus aktif pada portal usahawan.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingAdminSettings}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 disabled:opacity-50 cursor-pointer dark:bg-indigo-600"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{savingAdminSettings ? 'Menyimpan...' : 'Simpan Tetapan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {(selectedMentorForEdit || isCreatingMentor) && (
        <MentorProfileEditModal
          isOpen={Boolean(selectedMentorForEdit) || isCreatingMentor}
          onClose={() => {
            setSelectedMentorForEdit(null);
            setIsCreatingMentor(false);
          }}
          mentor={isCreatingMentor ? null : selectedMentorForEdit}
          isAdminEditing={true}
          onSave={(updated) => {
            onUpdateMentor?.(updated);
            setSelectedMentorForEdit(null);
            setIsCreatingMentor(false);
            showToast(isCreatingMentor ? 'Mentor baharu berjaya didaftarkan!' : 'Profil mentor berjaya dikemas kini!', 'success');
            onRefresh();
          }}
        />
      )}

      <EditBusinessModal
        isOpen={Boolean(editingBusiness) || isCreatingBusiness}
        business={isCreatingBusiness ? null : editingBusiness}
        isCreating={isCreatingBusiness}
        onClose={() => {
          setEditingBusiness(null);
          setIsCreatingBusiness(false);
        }}
        onSaved={() => {
          const created = isCreatingBusiness;
          setEditingBusiness(null);
          setIsCreatingBusiness(false);
          showToast(created ? 'Perniagaan baharu berjaya ditambah!' : 'Maklumat perniagaan berjaya dikemas kini!', 'success');
          onRefresh();
        }}
      />

      <EditBookingModal
        isOpen={Boolean(editingBooking) || isCreatingBooking}
        booking={isCreatingBooking ? null : editingBooking}
        slots={safeSlots}
        onClose={() => {
          setEditingBooking(null);
          setIsCreatingBooking(false);
        }}
        onSaved={() => {
          const created = isCreatingBooking;
          setEditingBooking(null);
          setIsCreatingBooking(false);
          showToast(created ? 'Permohonan kiosk baharu ditambah!' : 'Permohonan kiosk dikemas kini!', 'success');
          onRefresh();
        }}
      />

      <EditMentorshipModal
        isOpen={Boolean(editingMentorship) || isCreatingMentorship}
        registration={isCreatingMentorship ? null : editingMentorship}
        mentors={mentors}
        onClose={() => {
          setEditingMentorship(null);
          setIsCreatingMentorship(false);
        }}
        onSaved={() => {
          const created = isCreatingMentorship;
          setEditingMentorship(null);
          setIsCreatingMentorship(false);
          showToast(created ? 'Sesi bimbingan baharu ditambah!' : 'Sesi bimbingan dikemas kini!', 'success');
          onRefresh();
        }}
      />

      <ManageBusinessProductsModal
        isOpen={Boolean(managingProductsBusiness)}
        business={managingProductsBusiness}
        products={products}
        onClose={() => setManagingProductsBusiness(null)}
        onRefresh={onRefresh}
      />

      <EditSlotModal
        isOpen={Boolean(editingSlot)}
        slot={editingSlot}
        onClose={() => setEditingSlot(null)}
        onSaved={() => {
          setEditingSlot(null);
          showToast('Maklumat slot kiosk berjaya dikemas kini!', 'success');
          onRefresh();
        }}
      />

      <EditProgramModal
        isOpen={Boolean(editingProgram)}
        program={editingProgram}
        onClose={() => setEditingProgram(null)}
        onSaved={() => {
          setEditingProgram(null);
          showToast('Maklumat program berjaya dikemas kini!', 'success');
          onRefresh();
        }}
      />

    </div>
  );
};
