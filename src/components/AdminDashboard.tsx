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
  DollarSign, 
  TrendingUp, 
  Database, 
  AlertCircle,
  MessageCircle,
  Settings,
  Sliders,
  UserCheck,
  RefreshCw,
  Save,
  Phone,
  Mail,
  FileText,
  GraduationCap,
  BarChart3,
  Wrench,
  ChevronRight,
  Activity,
  Newspaper,
  Plus,
  ArrowUpDown
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
  BookingStatus,
  normalizeMentorshipMode,
  formatBusinessCategory
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
import { ModernDatePicker } from './ModernDateTimePicker';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
import { INITIAL_COMMUNITY_POSTS } from '../data/communityData';
import { UserTypeReportSection } from './UserTypeReportSection';
import { SaaSKpiCard } from './SaaSKpiCard';
import { RoleDonutCard } from './RoleDonutCard';
import { AnimatedShimmerBar, AnimatedShimmerBarProps } from './AnimatedShimmerBar';
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
import { useLanguage } from '../context/LanguageContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage, resolveSlotImage, resolveProgramImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import {
  DEFAULT_SORT_VALUE,
  ToolbarSortOption,
  buildStandardSortOptions,
  compareText,
  getTimestampMs,
  parseNumericAmount,
  sortRecords
} from '../utils/sortUtils';
import { usePrefersReducedMotion } from '../hooks/useMotion';

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
  const { user, userProfile, isAdmin } = useAuth();
  const { language } = useLanguage();
  const isMs = language === 'ms';
  const prefersReducedMotion = usePrefersReducedMotion();
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
    resolvedInitialSettings.portalAnnouncement || 'Permohonan Kiosk & Geran Belia Kelantan Kini Dibuka!'
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
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminBookingSearch, setAdminBookingSearch] = useState('');
  const [adminBookingSort, setAdminBookingSort] = useState<{
    key: 'businessName' | 'category' | 'hubLocation' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [adminBookingSortPreset, setAdminBookingSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [bizSearch, setBizSearch] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'approved' | 'hidden' | 'featured'>('all');
  const [bizDistrictFilter, setBizDistrictFilter] = useState<string>('Semua');
  const [bizSort, setBizSort] = useState<{
    key: 'businessName' | 'category' | 'district' | 'isApproved';
    dir: 'asc' | 'desc';
  }>({ key: 'businessName', dir: 'asc' });
  const [bizSortPreset, setBizSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [adminSlotSearch, setAdminSlotSearch] = useState('');
  const [adminSlotStatusFilter, setAdminSlotStatusFilter] = useState<'all' | SlotStatus>('all');
  const [adminSlotDistrictFilter, setAdminSlotDistrictFilter] = useState<string>('Semua');
  const [adminSlotSort, setAdminSlotSort] = useState<{
    key: 'name' | 'district' | 'monthlyRate' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'name', dir: 'asc' });
  const [adminSlotSortPreset, setAdminSlotSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [progSearch, setProgSearch] = useState('');
  const [progCategoryFilter, setProgCategoryFilter] = useState<'Semua' | YouthProgram['category']>('Semua');
  const [progSort, setProgSort] = useState<{
    key: 'title' | 'category' | 'grantAmount';
    dir: 'asc' | 'desc';
  }>({ key: 'title', dir: 'asc' });
  const [progSortPreset, setProgSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [mentorListSearch, setMentorListSearch] = useState('');
  const [mentorListSort, setMentorListSort] = useState<{
    key: 'name' | 'agency' | 'menteeCount';
    dir: 'asc' | 'desc';
  }>({ key: 'name', dir: 'asc' });
  const [mentorListSortPreset, setMentorListSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [mentorshipSearch, setMentorshipSearch] = useState('');
  const [mentorshipStatusFilter, setMentorshipStatusFilter] = useState<'all' | MentorshipRegistration['status']>('all');
  const [mentorshipSort, setMentorshipSort] = useState<{
    key: 'entrepreneurName' | 'mentorName' | 'preferredDate' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [mentorshipSortPreset, setMentorshipSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const adminBookingSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'hub_asc', label: 'Hab Lokasi (A - Z)' },
    { value: 'category_asc', label: 'Kategori Perniagaan (A - Z)' }
  ]);

  const bizSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'featured_first', label: 'Perniagaan Pilihan Dahulu' },
    { value: 'district_asc', label: 'Daerah (A - Z)' },
    { value: 'category_asc', label: 'Kategori (A - Z)' },
    { value: 'status_approved', label: 'Status (Aktif Dahulu)' }
  ]);

  const adminSlotSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'rate_asc', label: 'Kadar Sewa (Terendah)' },
    { value: 'rate_desc', label: 'Kadar Sewa (Tertinggi)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' },
    { value: 'status_available', label: 'Status (Tersedia Dahulu)' }
  ]);

  const progSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'amount_desc', label: 'Nilai Bantuan (Tertinggi)' },
    { value: 'category_asc', label: 'Kategori Program (A - Z)' },
    { value: 'date_asc', label: 'Tarikh Program (Terawal)' }
  ]);

  const mentorListSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'mentees_desc', label: 'Usahawan Diselia (Tertinggi)' },
    { value: 'agency_asc', label: 'Agensi (A - Z)' },
    { value: 'title_asc', label: 'Jawatan (A - Z)' }
  ]);

  const mentorshipSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'session_date_asc', label: 'Tarikh Sesi (Terawal)' },
    { value: 'mentor_asc', label: 'Nama Mentor (A - Z)' },
    { value: 'district_asc', label: 'Daerah (A - Z)' }
  ]);

  const [adminChartMode, setAdminChartMode] = useState<'districts' | 'pipeline'>('districts');
  const [reviewNoteInput, setReviewNoteInput] = useState<{ [bookingId: string]: string }>({});

  // Slot modal / form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotCode, setSlotCode] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotHub, setSlotHub] = useState('Hab Usahawan Bachok');
  const [slotDistrict, setSlotDistrict] = useState<KelantanDistrict>('Bachok');
  const [slotSize, setSlotSize] = useState('10ft x 10ft Kapsul Standard');
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
        message: `${slotName} di jajahan ${slotDistrict} kini dibuka untuk permohonan sewaan usahawan (RM${slotMonthlyRate}/bulan).`,
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
          ? `${biz.businessName} kini dipaparkan dalam direktori portal Belia.`
          : `${biz.businessName} disembunyikan daripada direktori portal Belia.`,
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
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    const q = adminBookingSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.businessName || '').toLowerCase().includes(q) ||
      (b.applicantName || '').toLowerCase().includes(q) ||
      (b.slotCode || '').toLowerCase().includes(q) ||
      (b.hubLocation || '').toLowerCase().includes(q)
    );
  });

  const adminBookingOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 };
  const sortedBookings =
    adminBookingSortPreset === 'table_column'
      ? [...filteredBookings].sort((a, b) => {
          const dirMult = adminBookingSort.dir === 'asc' ? 1 : -1;
          if (adminBookingSort.key === 'businessName') {
            return `${a.slotCode} ${a.businessName}`.localeCompare(`${b.slotCode} ${b.businessName}`) * dirMult;
          }
          if (adminBookingSort.key === 'category') {
            return (a.businessCategory || '').localeCompare(b.businessCategory || '') * dirMult;
          }
          if (adminBookingSort.key === 'hubLocation') {
            return (a.hubLocation || '').localeCompare(b.hubLocation || '') * dirMult;
          }
          return ((adminBookingOrder[a.status] ?? 4) - (adminBookingOrder[b.status] ?? 4)) * dirMult;
        })
      : sortRecords(filteredBookings, {
          sortBy: adminBookingSortPreset,
          getName: (b) => b.businessName || b.applicantName || b.slotCode || '',
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return (adminBookingOrder[a.status] ?? 4) - (adminBookingOrder[b.status] ?? 4);
            if (mode === 'hub_asc') return compareText(a.hubLocation, b.hubLocation);
            if (mode === 'category_asc') return compareText(a.businessCategory, b.businessCategory);
            return null;
          }
        });

  const baseFilteredBusinesses = safeBusinesses.filter((biz) => {
    if (bizStatusFilter === 'approved' && !biz.isApproved) return false;
    if (bizStatusFilter === 'hidden' && biz.isApproved) return false;
    if (bizStatusFilter === 'featured' && !biz.isFeatured) return false;
    if (bizDistrictFilter !== 'Semua' && biz.district !== bizDistrictFilter) return false;
    const q = bizSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (biz.businessName || '').toLowerCase().includes(q) ||
      (biz.ownerName || '').toLowerCase().includes(q) ||
      (biz.category || '').toLowerCase().includes(q) ||
      (biz.district || '').toLowerCase().includes(q)
    );
  });

  const filteredBusinesses =
    bizSortPreset === 'table_column'
      ? [...baseFilteredBusinesses].sort((a, b) => {
          const dirMult = bizSort.dir === 'asc' ? 1 : -1;
          if (bizSort.key === 'category') return (a.category || '').localeCompare(b.category || '') * dirMult;
          if (bizSort.key === 'district') return (a.district || '').localeCompare(b.district || '') * dirMult;
          if (bizSort.key === 'isApproved') return ((a.isApproved ? 1 : 0) - (b.isApproved ? 1 : 0)) * dirMult;
          return (a.businessName || '').localeCompare(b.businessName || '') * dirMult;
        })
      : sortRecords(baseFilteredBusinesses, {
          sortBy: bizSortPreset,
          getName: (biz) => biz.businessName || biz.ownerName || '',
          customCompare: (a, b, mode) => {
            if (mode === 'featured_first') return (a.isFeatured ? 0 : 1) - (b.isFeatured ? 0 : 1);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            if (mode === 'category_asc') return compareText(a.category, b.category);
            if (mode === 'status_approved') return (a.isApproved ? 0 : 1) - (b.isApproved ? 0 : 1);
            return null;
          }
        });

  const baseFilteredAdminSlots = safeSlots.filter((s) => {
    if (adminSlotStatusFilter !== 'all' && s.status !== adminSlotStatusFilter) return false;
    if (adminSlotDistrictFilter !== 'Semua' && s.district !== adminSlotDistrictFilter) return false;
    const q = adminSlotSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.code || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.hubLocation || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q)
    );
  });

  const slotStatusOrder: Record<string, number> = { available: 0, occupied: 1, maintenance: 2 };
  const filteredAdminSlots =
    adminSlotSortPreset === 'table_column'
      ? [...baseFilteredAdminSlots].sort((a, b) => {
          const dirMult = adminSlotSort.dir === 'asc' ? 1 : -1;
          if (adminSlotSort.key === 'district') return (a.district || '').localeCompare(b.district || '') * dirMult;
          if (adminSlotSort.key === 'monthlyRate') return ((Number(a.monthlyRate) || 0) - (Number(b.monthlyRate) || 0)) * dirMult;
          if (adminSlotSort.key === 'status') return (a.status || '').localeCompare(b.status || '') * dirMult;
          return `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`) * dirMult;
        })
      : sortRecords(baseFilteredAdminSlots, {
          sortBy: adminSlotSortPreset,
          getName: (s) => `${s.code || ''} ${s.name || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'rate_asc') return (Number(a.monthlyRate) || 0) - (Number(b.monthlyRate) || 0);
            if (mode === 'rate_desc') return (Number(b.monthlyRate) || 0) - (Number(a.monthlyRate) || 0);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            if (mode === 'status_available') return (slotStatusOrder[a.status] ?? 3) - (slotStatusOrder[b.status] ?? 3);
            return null;
          }
        });

  const baseFilteredAdminPrograms = safePrograms.filter((p) => {
    if (progCategoryFilter !== 'Semua' && p.category !== progCategoryFilter) return false;
    const q = progSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  const filteredAdminPrograms =
    progSortPreset === 'table_column'
      ? [...baseFilteredAdminPrograms].sort((a, b) => {
          const dirMult = progSort.dir === 'asc' ? 1 : -1;
          if (progSort.key === 'category') return (a.category || '').localeCompare(b.category || '') * dirMult;
          if (progSort.key === 'grantAmount') {
            const numA = Number(String(a.grantAmount || '0').replace(/[^0-9.]/g, '')) || 0;
            const numB = Number(String(b.grantAmount || '0').replace(/[^0-9.]/g, '')) || 0;
            return (numA - numB) * dirMult;
          }
          return (a.title || '').localeCompare(b.title || '') * dirMult;
        })
      : sortRecords(baseFilteredAdminPrograms, {
          sortBy: progSortPreset,
          getName: (p) => p.title || '',
          customCompare: (a, b, mode) => {
            if (mode === 'amount_desc') return parseNumericAmount(b.grantAmount) - parseNumericAmount(a.grantAmount);
            if (mode === 'category_asc') return compareText(a.category, b.category);
            if (mode === 'date_asc') return getTimestampMs(a.date) - getTimestampMs(b.date);
            return null;
          }
        });

  const baseFilteredAdminMentors = mentors.filter((m) => {
    const q = mentorListSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.agency || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  });

  const filteredAdminMentors =
    mentorListSortPreset === 'table_column'
      ? [...baseFilteredAdminMentors].sort((a, b) => {
          const dirMult = mentorListSort.dir === 'asc' ? 1 : -1;
          if (mentorListSort.key === 'agency') return (a.agency || '').localeCompare(b.agency || '') * dirMult;
          if (mentorListSort.key === 'menteeCount') {
            const countA = mentorshipRegistrations.filter(r => r.mentorId === a.id).length;
            const countB = mentorshipRegistrations.filter(r => r.mentorId === b.id).length;
            return (countA - countB) * dirMult;
          }
          return (a.name || '').localeCompare(b.name || '') * dirMult;
        })
      : sortRecords(baseFilteredAdminMentors, {
          sortBy: mentorListSortPreset,
          getName: (m) => m.name || '',
          customCompare: (a, b, mode) => {
            if (mode === 'mentees_desc') {
              const countA = mentorshipRegistrations.filter(r => r.mentorId === a.id).length;
              const countB = mentorshipRegistrations.filter(r => r.mentorId === b.id).length;
              return countB - countA;
            }
            if (mode === 'agency_asc') return compareText(a.agency, b.agency);
            if (mode === 'title_asc') return compareText(a.title, b.title);
            return null;
          }
        });

  const mentorStatusOrder: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
  const baseFilteredMentorships = mentorshipRegistrations.filter((m) => {
    if (mentorshipStatusFilter !== 'all' && m.status !== mentorshipStatusFilter) return false;
    const q = mentorshipSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.entrepreneurName || '').toLowerCase().includes(q) ||
      (m.businessName || '').toLowerCase().includes(q) ||
      (m.mentorName || '').toLowerCase().includes(q) ||
      (m.topic || '').toLowerCase().includes(q) ||
      (m.district || '').toLowerCase().includes(q)
    );
  });

  const sortedMentorships =
    mentorshipSortPreset === 'table_column'
      ? [...baseFilteredMentorships].sort((a, b) => {
          const dirMult = mentorshipSort.dir === 'asc' ? 1 : -1;
          if (mentorshipSort.key === 'entrepreneurName') {
            return (a.entrepreneurName || '').localeCompare(b.entrepreneurName || '') * dirMult;
          }
          if (mentorshipSort.key === 'mentorName') {
            return (a.mentorName || '').localeCompare(b.mentorName || '') * dirMult;
          }
          if (mentorshipSort.key === 'preferredDate') {
            return (a.preferredDate || '').localeCompare(b.preferredDate || '') * dirMult;
          }
          return ((mentorStatusOrder[a.status] ?? 4) - (mentorStatusOrder[b.status] ?? 4)) * dirMult;
        })
      : sortRecords(baseFilteredMentorships, {
          sortBy: mentorshipSortPreset,
          getName: (m) => `${m.entrepreneurName || ''} ${m.businessName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return (mentorStatusOrder[a.status] ?? 4) - (mentorStatusOrder[b.status] ?? 4);
            if (mode === 'session_date_asc') return getTimestampMs(a.preferredDate) - getTimestampMs(b.preferredDate);
            if (mode === 'mentor_asc') return compareText(a.mentorName, b.mentorName);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            return null;
          }
        });

  const adminBookingsPagination = usePagination(sortedBookings, 7, [
    bookingFilter,
    adminBookingSearch,
    adminBookingSortPreset,
    adminBookingSort.key,
    adminBookingSort.dir,
    sortedBookings.length
  ]);
  const businessesPagination = usePagination(filteredBusinesses, 7, [
    bizSearch,
    bizStatusFilter,
    bizDistrictFilter,
    bizSortPreset,
    bizSort.key,
    bizSort.dir,
    filteredBusinesses.length
  ]);
  const slotsPagination = usePagination(filteredAdminSlots, 7, [
    adminSlotSearch,
    adminSlotStatusFilter,
    adminSlotDistrictFilter,
    adminSlotSortPreset,
    adminSlotSort.key,
    adminSlotSort.dir,
    filteredAdminSlots.length
  ]);
  const programsPagination = usePagination(filteredAdminPrograms, 7, [
    progSearch,
    progCategoryFilter,
    progSortPreset,
    progSort.key,
    progSort.dir,
    filteredAdminPrograms.length
  ]);
  const adminMentorsPagination = usePagination(filteredAdminMentors, 7, [
    mentorListSearch,
    mentorListSortPreset,
    mentorListSort.key,
    mentorListSort.dir,
    filteredAdminMentors.length
  ]);
  const adminMentorshipsPagination = usePagination(sortedMentorships, 7, [
    mentorshipSearch,
    mentorshipStatusFilter,
    mentorshipSortPreset,
    mentorshipSort.key,
    mentorshipSort.dir,
    sortedMentorships.length
  ]);

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
    <div className="w-full space-y-3.5">
      
      {/* Admin Hero: Indigo-Arang (Structured Operations Bar) */}
      <div className="relative overflow-hidden kbelia-ambient-sheen-soft rounded-2xl bg-gradient-to-br from-slate-100/95 via-indigo-50/45 to-zinc-100/90 dark:from-zinc-950 dark:via-slate-900/95 dark:to-indigo-950/40 border border-slate-300/80 dark:border-indigo-900/55 p-4 sm:p-5 transition-colors">
        {/* Softened Ambient Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-52 h-52 rounded-full bg-indigo-500/7 dark:bg-indigo-500/9 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-48 h-48 rounded-full bg-slate-400/8 dark:bg-slate-500/8 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        {(() => {
          const adminDisplayName = userProfile?.fullName || user?.displayName || (isMs ? 'Pentadbir Sistem' : 'System Admin');
          const pendingBookingsCount = safeBookings.filter(b => b && b.status === 'pending').length;
          const pendingGrantsCount = (grantApplications || []).filter(g => g.status === 'pending').length;
          const openTicketsCount = (maintenanceTickets || []).filter(t => t.status !== 'resolved').length;

          const adminHeaderMap: Record<AdminSubTab, { prefix: string; accent: string }> = {
            queue: {
              prefix: isMs ? 'Giliran Semakan & ' : 'Review & ',
              accent: isMs ? 'Kelulusan' : 'Approval Queue'
            },
            bookings: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Tempahan Kiosk' : 'Kiosk Bookings'
            },
            businesses: {
              prefix: isMs ? 'Direktori & Audit ' : 'Entrepreneur Directory & ',
              accent: isMs ? 'Usahawan' : 'Audit'
            },
            slots: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Slot Kiosk' : 'Kiosk Slots'
            },
            programs: {
              prefix: isMs ? 'Pengurusan Geran & ' : 'Manage Grants & ',
              accent: isMs ? 'Inisiatif' : 'Initiatives'
            },
            mentors: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Panel Mentor' : 'Mentor Panel'
            },
            news: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Berita Rasmi' : 'Official News'
            },
            b2b: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Ruang Niaga' : 'Ruang Niaga Ads'
            },
            events: {
              prefix: isMs ? 'Pengurusan Acara & ' : 'Manage Events & ',
              accent: isMs ? 'Tempahan' : 'Bookings'
            },
            users: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Pengguna Portal' : 'Portal Users'
            },
            sync: {
              prefix: isMs ? 'Penyelarasan & ' : 'Database ',
              accent: isMs ? 'Segerak Data' : 'Data Sync'
            },
            settings: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Tetapan Operasi' : 'Operations Settings'
            }
          };
          const currentAdminHeader = adminHeaderMap[adminTab] || adminHeaderMap.queue;
          const targetTab: AdminSubTab = adminTab === 'queue' ? 'users' : 'queue';
          const actionLabel =
            adminTab === 'queue'
              ? (isMs ? 'Urus Pengguna' : 'Manage Users')
              : (isMs ? 'Semak Giliran' : 'Review Queue');

          return (
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {isMs ? 'Pusat Kawalan Negeri · Kelantan' : 'State Operations Hub · Kelantan'}
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentAdminHeader.prefix}
                  <span className="text-indigo-700 dark:text-indigo-400">{currentAdminHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  {isMs ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-slate-900 dark:text-white">{adminDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{adminDisplayName}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 shrink-0">
                <div className="flex items-center divide-x divide-slate-300/80 dark:divide-zinc-700/80 tabular-nums">
                  <div className="pr-4 sm:pr-5 text-center">
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                      {pendingBookingsCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                      {isMs ? 'Tempahan' : 'Bookings'}
                    </div>
                  </div>
                  <div className="px-4 sm:px-5 text-center">
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                      {pendingGrantsCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                      {isMs ? 'Geran' : 'Grants'}
                    </div>
                  </div>
                  <div className="pl-4 sm:pl-5 text-center">
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                      {openTicketsCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                      {isMs ? 'Aduan' : 'Tickets'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminTab(targetTab)}
                  className="px-4 py-2 rounded-lg text-xs sm:text-[13px] font-semibold bg-slate-900 hover:bg-indigo-950 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })()}
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

        const capsuleOperatingCount = safeSlots.filter(s => s && s.status === 'occupied').length;
        const capsuleMaintenanceCount = safeSlots.filter(s => s && s.status === 'maintenance').length;
        const capsuleReservedCount = safeSlots.filter(s => s && s.status === 'reserved').length;
        const capsuleStatusSegments = [
          { name: 'Beroperasi', value: capsuleOperatingCount, color: '#2563EB' },
          { name: 'Kosong', value: availableSlotsCount, color: '#10B981' },
          { name: 'Selenggara', value: capsuleMaintenanceCount, color: '#F59E0B' },
          { name: 'Ditempah', value: capsuleReservedCount, color: '#4F46E5' }
        ];

        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SaaSKpiCard
                title="Permohonan Menunggu"
                value={pendingBookingsCount}
                subtitle="Menunggu tindakan semakan pegawai"
                icon={Clock}
                accentColor="amber"
                isLive
                staggerIndex={0}
                onClick={() => setAdminTab('bookings')}
              />

              <SaaSKpiCard
                title="Usahawan Belia Berdaftar"
                value={businesses.length}
                subtitle="Direktori komersil belia sah SSM"
                icon={Store}
                accentColor="blue"
                staggerIndex={1}
                onClick={() => setAdminTab('businesses')}
              />

              <SaaSKpiCard
                title="Kadar Terisi Kapsul"
                value={`${occupancyRate}%`}
                subtitle={`${occupiedSlotsCount} unit beroperasi`}
                icon={Building2}
                accentColor="emerald"
                isLive
                staggerIndex={2}
                onClick={() => setAdminTab('slots')}
              />

              <SaaSKpiCard
                title="Program & Geran Aktif"
                value={programs.length}
                subtitle="Dana & latihan keusahawanan aktif"
                icon={Award}
                accentColor="violet"
                staggerIndex={3}
                onClick={() => setAdminTab('programs')}
              />
            </div>

            {/* Ringkasan Admin: Graf Lebar Penuh -> Dua Lajur Seimbang -> Laporan Terperinci */}
            {adminTab === 'queue' && (
              <div key="queue-analytics" className="space-y-3.5 animate-dashboard-tab">
                {/* 1. Seksyen Analitik 2:1 — Graf Infrastruktur (2 Bahagian) + Donat Status Unit Kapsul (1 Bahagian) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
                <div
                  style={{ '--stagger': 4 } as React.CSSProperties}
                  className="animate-dashboard-card lg:col-span-2 h-full relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0"
                >
                  <div className="h-0.5 w-full bg-indigo-500/80 dark:bg-indigo-400/80" />
                  <div className="px-4 py-3 border-b border-slate-300 dark:border-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-5 h-5 text-black dark:text-white/80 shrink-0" />
                      <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                        Analitik Infrastruktur &amp; Permohonan Negeri
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-600 self-start sm:self-auto">
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
                    <div className="relative h-[210px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
                      <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 210 }}>
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
                              isAnimationActive={!prefersReducedMotion}
                              animationDuration={650}
                              animationEasing="ease-out"
                              shape={(barProps: unknown) => (
                                <AnimatedShimmerBar
                                  {...(barProps as AnimatedShimmerBarProps)}
                                  radius={5}
                                  reducedMotion={prefersReducedMotion}
                                />
                              )}
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
                              isAnimationActive={!prefersReducedMotion}
                              animationDuration={650}
                              animationEasing="ease-out"
                              shape={(barProps: unknown) => (
                                <AnimatedShimmerBar
                                  {...(barProps as AnimatedShimmerBarProps)}
                                  radius={5}
                                  reducedMotion={prefersReducedMotion}
                                />
                              )}
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
                              isAnimationActive={!prefersReducedMotion}
                              animationDuration={650}
                              animationEasing="ease-out"
                              shape={(barProps: unknown) => (
                                <AnimatedShimmerBar
                                  {...(barProps as AnimatedShimmerBarProps)}
                                  radius={6}
                                  reducedMotion={prefersReducedMotion}
                                />
                              )}
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

                  <div className="px-4 py-2.5 border-t border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-2 text-sm">
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

                <RoleDonutCard
                  className="lg:col-span-1 h-full"
                  title="Status Unit Kapsul"
                  icon={Building2}
                  accentBarClass="bg-blue-600/80 dark:bg-blue-500/80"
                  segments={capsuleStatusSegments}
                  centerValue={safeSlots.length}
                  centerLabel="Jumlah Unit"
                  valueUnit="unit"
                  summaryPairs={[
                    { label: 'Sedia Disewa', value: `${availableSlotsCount} unit`, dotColor: '#10B981' },
                    { label: 'Selenggara', value: `${capsuleMaintenanceCount} unit`, dotColor: '#F59E0B' }
                  ]}
                  emptyState={{
                    title: 'Tiada Unit Kapsul',
                    description: 'Tambah slot kapsul baharu untuk memantau pecahan status operasi dan penyelenggaraan.',
                    actionLabel: 'Urus Slot Kapsul',
                    onAction: () => setAdminTab('slots')
                  }}
                  staggerIndex={5}
                />
                </div>

                {/* 2. Dua Lajur Seimbang Kiri & Kanan (Ketinggian Sekata Tanpa Ruang Kosong) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
                  {/* Lajur Kiri: Metrik Prestasi & Operasi Daerah */}
                  <div
                    style={{ '--stagger': 5 } as React.CSSProperties}
                    className="animate-dashboard-card relative min-w-0 h-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-start"
                  >
                    <div className="h-0.5 w-full bg-blue-500/80 dark:bg-blue-400/80" />
                    <div className="px-4 py-3.5 border-b border-slate-300 dark:border-zinc-600">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4.5 h-4.5 text-black dark:text-white/80 shrink-0" />
                        <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                          Metrik Prestasi &amp; Operasi Daerah
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-2.5">
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
                              {approvedBookingsCount} diluluskan
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
                              {approvedGrantsCount} diluluskan
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700">
                          <div className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/75">
                            Liputan Daerah Aktif
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-2">
                            <span className="text-lg font-extrabold font-mono text-black dark:text-white tabular-nums">
                              {activeDistrictsCount} Daerah
                            </span>
                            <span className="text-[0.8125rem] font-mono text-black/70 dark:text-white/75 tabular-nums">
                              {occupiedSlotsCount} unit aktif
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Baris 2: 2 Kolum Operasi Daerah & Tindakan Segera */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 flex flex-col justify-start gap-2">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold text-black dark:text-white">
                                Daerah Ada Kekosongan
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
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 flex flex-col justify-start gap-2">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                                  className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
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
                  </div>

                  {/* Lajur Kanan: Ringkasan Semakan & Operasi */}
                  <div
                    style={{ '--stagger': 6 } as React.CSSProperties}
                    className="animate-dashboard-card relative min-w-0 h-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 hover:border-slate-400/80 dark:hover:border-zinc-500 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-start"
                  >
                    <div className="h-0.5 w-full bg-indigo-500/80 dark:bg-indigo-400/80" />
                    <div className="px-4 py-3.5 border-b border-slate-300 dark:border-zinc-600">
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-4.5 h-4.5 text-black dark:text-white/80 shrink-0" />
                        <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                          Ringkasan Semakan &amp; Operasi
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setAdminTab('bookings')}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:-translate-y-0.5 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3 transition-all duration-200 cursor-pointer text-left"
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

                      <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3">
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

                      <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3">
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
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:-translate-y-0.5 border border-slate-300 dark:border-zinc-600 flex items-start justify-between gap-3 transition-all duration-200 cursor-pointer text-left"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="text-sm font-bold text-black dark:text-white leading-snug break-words">Panel &amp; Sesi Bimbingan Mentor</div>
                            <div className="text-sm text-black/75 dark:text-white/75 leading-relaxed break-words">{mentors.length} mentor aktif</div>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-[0.8125rem] font-black px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-950 text-black dark:text-white shrink-0">
                          {mentorshipRegistrations.length}
                        </span>
                      </button>
                    </div>
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
        <div key="bookings" className="space-y-4 animate-dashboard-tab">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
                Senarai Permohonan Sewaan Kapsul
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBooking(null);
                setIsCreatingBooking(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Permohonan</span>
            </button>
          </div>

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
            <ReferenceTableToolbar
              accent="indigo"
              searchValue={adminBookingSearch}
              onSearchChange={setAdminBookingSearch}
              searchPlaceholder="Cari pemohon, syarikat atau kod..."
              filterCount={(bookingFilter !== 'all' ? 1 : 0) + (adminBookingSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
              onResetFilters={() => {
                setBookingFilter('all');
                setAdminBookingSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                adminBookingSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...adminBookingSortOptions]
                  : adminBookingSortOptions
              }
              sortValue={adminBookingSortPreset === 'table_column' ? '' : adminBookingSortPreset}
              onSortChange={(val) => {
                if (val) setAdminBookingSortPreset(val);
              }}
              filterContent={
                <div>
                  <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                    Status Permohonan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { id: 'all', label: 'Semua' },
                      { id: 'pending', label: 'Menunggu' },
                      { id: 'approved', label: 'Diluluskan' },
                      { id: 'rejected', label: 'Ditolak' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBookingFilter(opt.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border cursor-pointer transition-colors ${
                          bookingFilter === opt.id
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />

            {sortedBookings.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Clock className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">Tiada Permohonan Dalam Kategori Ini</p>
                {(adminBookingSearch || bookingFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminBookingSearch('');
                      setBookingFilter('all');
                      setAdminBookingSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className="mt-1 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Set Semula Carian &amp; Penapis
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                        <th className="py-3 pl-5 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminBookingSortPreset('table_column');
                              setAdminBookingSort((prev) =>
                                prev.key === 'businessName'
                                  ? { key: 'businessName', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'businessName', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kapsul &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminBookingSortPreset('table_column');
                              setAdminBookingSort((prev) =>
                                prev.key === 'category'
                                  ? { key: 'category', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'category', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kategori</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminBookingSortPreset('table_column');
                              setAdminBookingSort((prev) =>
                                prev.key === 'hubLocation'
                                  ? { key: 'hubLocation', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'hubLocation', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Pemohon &amp; Lokasi</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminBookingSortPreset('table_column');
                              setAdminBookingSort((prev) =>
                                prev.key === 'status'
                                  ? { key: 'status', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'status', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 pl-2 pr-5 w-12 text-right">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                      {adminBookingsPagination.paginatedItems.map((b) => {
                        const isExpanded = expandedAdminBookingIds.includes(b.id);
                        return (
                          <React.Fragment key={b.id}>
                            <tr className="kbelia-table-row">
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 shrink-0">
                                    <PortalImage
                                      src={resolveBookingKioskImage(b, safeSlots)}
                                      alt={`Reka bentuk kiosk ${b.slotName}`}
                                      fallbackType="kiosk"
                                      fallbackLabel={b.slotCode}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-black dark:text-white truncate max-w-[230px]">
                                      {b.slotCode} · {b.businessName}
                                    </p>
                                    <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[230px]">
                                      {b.slotName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                                {b.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : b.businessCategory}
                              </td>
                              <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                                <p className="font-medium text-black dark:text-white">{b.applicantName}</p>
                                <p className="text-[0.8125rem] text-black/60 dark:text-white/65">
                                  {b.hubLocation} · {b.durationMonths} bulan
                                </p>
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
                                    b.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                      : b.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
                                      : b.status === 'cancelled'
                                      ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                  }`}
                                >
                                  {b.status === 'approved'
                                    ? 'Diluluskan'
                                    : b.status === 'rejected'
                                    ? 'Ditolak'
                                    : b.status === 'cancelled'
                                    ? 'Dibatalkan'
                                    : 'Menunggu Kelulusan'}
                                </span>
                              </td>
                              <td className="py-3.5 pl-2 pr-5 text-right">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk ${b.businessName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran & Semakan',
                                      onClick: () => toggleAdminBookingExpand(b.id)
                                    },
                                    {
                                      label: 'Luluskan Permohonan',
                                      tone: 'accent',
                                      disabled: loading || b.status === 'approved',
                                      onClick: () => handleApproveBooking(b)
                                    },
                                    {
                                      label: 'Tolak Permohonan',
                                      disabled: loading || b.status === 'rejected',
                                      onClick: () => handleRejectBooking(b)
                                    },
                                    ...(b.status !== 'pending'
                                      ? [
                                          {
                                            label: 'Set Menunggu Kelulusan',
                                            disabled: loading,
                                            onClick: () => handleDirectAdminBookingStatus(b, 'pending')
                                          }
                                        ]
                                      : []),
                                    {
                                      label: 'Edit Permohonan',
                                      dividerBefore: true,
                                      onClick: () => {
                                        setIsCreatingBooking(false);
                                        setEditingBooking(b);
                                      }
                                    },
                                    {
                                      label: 'Padam Permohonan',
                                      tone: 'danger',
                                      onClick: () =>
                                        confirmDelete({
                                          itemName: `${b.businessName} (${b.slotCode})`,
                                          itemType: 'Permohonan Sewaan Kiosk',
                                          onConfirm: () => handleDeleteAdminBooking(b)
                                        })
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                <td colSpan={5} className="px-5 py-4 space-y-3">
                                  <div className="grid sm:grid-cols-3 gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl text-sm text-black dark:text-white/80 border border-slate-200 dark:border-zinc-700">
                                    <div>
                                      <span className="text-black/60 dark:text-white/65 block text-[0.8125rem]">Pemohon:</span>
                                      <strong className="text-black dark:text-white">{b.applicantName}</strong>
                                    </div>
                                    <div>
                                      <span className="text-black/60 dark:text-white/65 block text-[0.8125rem]">E-mel / Telefon:</span>
                                      <span className="font-mono text-[0.8125rem] text-black dark:text-white">{b.applicantEmail} · {b.applicantPhone}</span>
                                    </div>
                                    <div>
                                      <span className="text-black/60 dark:text-white/65 block text-[0.8125rem]">Tempoh &amp; Tarikh Mula:</span>
                                      <span className="text-black dark:text-white tabular-nums">{b.durationMonths} Bulan (Mulai {b.startDate})</span>
                                    </div>
                                  </div>

                                  {b.pitchNotes && (
                                    <div className="text-sm text-black dark:text-white bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/70">
                                      <span className="font-bold block mb-0.5">Cadangan Pitching Usahawan:</span>
                                      <p>{b.pitchNotes}</p>
                                    </div>
                                  )}

                                  {b.status === 'pending' && (
                                    <div className="pt-1 space-y-3">
                                      <div>
                                        <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1">
                                          Catatan Pentadbir
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Masukkan catatan pentadbir"
                                          value={reviewNoteInput[b.id] || ''}
                                          onChange={(e) => setReviewNoteInput({ ...reviewNoteInput, [b.id]: e.target.value })}
                                          className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                                        />
                                      </div>

                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleRejectBooking(b)}
                                          disabled={loading}
                                          className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-black dark:text-white border border-rose-200 dark:border-rose-800 font-bold text-[0.8125rem] rounded-xl transition-colors cursor-pointer"
                                        >
                                          Tolak Permohonan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveBooking(b)}
                                          disabled={loading}
                                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[0.8125rem] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Luluskan Permohonan</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {b.adminNotes && b.status !== 'pending' && (
                                    <div className="text-sm text-black dark:text-white bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                                      <strong>Catatan Pentadbir:</strong> {b.adminNotes}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={adminBookingsPagination.currentPage}
                  totalItems={adminBookingsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={adminBookingsPagination.setCurrentPage}
                  itemLabel="permohonan sewaan"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESSES DIRECTORY MANAGEMENT */}
      {adminTab === 'businesses' && (
        <div key="businesses" className="space-y-4 animate-dashboard-tab">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
              Senarai Kedai &amp; Usahawan
            </h3>
          </div>

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
            <ReferenceTableToolbar
              accent="indigo"
              searchValue={bizSearch}
              onSearchChange={setBizSearch}
              searchPlaceholder="Cari perniagaan atau kategori..."
              filterCount={
                (bizStatusFilter !== 'all' ? 1 : 0) +
                (bizDistrictFilter !== 'Semua' ? 1 : 0) +
                (bizSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
              }
              onResetFilters={() => {
                setBizStatusFilter('all');
                setBizDistrictFilter('Semua');
                setBizSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                bizSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...bizSortOptions]
                  : bizSortOptions
              }
              sortValue={bizSortPreset === 'table_column' ? '' : bizSortPreset}
              rightSlot={
                <button
                  type="button"
                  onClick={() => {
                    setEditingBusiness(null);
                    setIsCreatingBusiness(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Perniagaan</span>
                </button>
              }
              onSortChange={(val) => {
                if (val) setBizSortPreset(val);
              }}
              filterContent={
                <>
                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Status Paparan
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'all', label: 'Semua' },
                        { id: 'approved', label: 'Aktif' },
                        { id: 'hidden', label: 'Tersembunyi' },
                        { id: 'featured', label: 'Pilihan' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBizStatusFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border cursor-pointer transition-colors ${
                            bizStatusFilter === opt.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Daerah
                    </label>
                    <select
                      value={bizDistrictFilter}
                      onChange={(e) => setBizDistrictFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="Semua">Semua Daerah</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              }
            />

            {filteredBusinesses.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Store className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">
                  Tiada perniagaan sepadan dengan carian atau penapis.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBizSearch('');
                    setBizStatusFilter('all');
                    setBizDistrictFilter('Semua');
                    setBizSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className="mt-1 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Set Semula Carian &amp; Penapis
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                        <th className="py-3 pl-5 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setBizSortPreset('table_column');
                              setBizSort((prev) =>
                                prev.key === 'businessName'
                                  ? { key: 'businessName', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'businessName', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Perniagaan &amp; Pemilik</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setBizSortPreset('table_column');
                              setBizSort((prev) =>
                                prev.key === 'category'
                                  ? { key: 'category', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'category', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kategori</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setBizSortPreset('table_column');
                              setBizSort((prev) =>
                                prev.key === 'district'
                                  ? { key: 'district', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'district', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Daerah &amp; SSM</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">Produk</th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setBizSortPreset('table_column');
                              setBizSort((prev) =>
                                prev.key === 'isApproved'
                                  ? { key: 'isApproved', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'isApproved', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 pl-2 pr-5 w-12 text-right">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                      {businessesPagination.paginatedItems.map((biz) => {
                        const bizProductCount = products.filter(p => p.businessId === biz.id).length;
                        return (
                          <tr key={biz.id} className="kbelia-table-row">
                            <td className="py-3.5 pl-5 pr-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <img
                                  src={biz.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                                  alt={biz.businessName}
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-black dark:text-white truncate max-w-[230px]">
                                    {biz.businessName}
                                  </p>
                                  <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[230px]">
                                    {biz.ownerName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                              {formatBusinessCategory(biz.category)}
                            </td>
                            <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                              <p className="font-medium text-black dark:text-white">{biz.district}</p>
                              <p className="text-[0.8125rem] text-black/60 dark:text-white/65">
                                SSM: {biz.ssmNumber || 'Tiada'}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 tabular-nums whitespace-nowrap text-black dark:text-white font-medium">
                              {bizProductCount} item
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
                                    biz.isApproved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                  }`}
                                >
                                  {biz.isApproved ? 'Aktif' : 'Tersembunyi'}
                                </span>
                                {biz.isFeatured && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70">
                                    Pilihan
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 pl-2 pr-5 text-right">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${biz.businessName}`}
                                items={[
                                  {
                                    label: `Urus Produk (${bizProductCount})`,
                                    tone: 'accent',
                                    onClick: () => setManagingProductsBusiness(biz)
                                  },
                                  {
                                    label: biz.isFeatured ? 'Buang Status Pilihan' : 'Jadikan Pilihan',
                                    onClick: () => handleToggleFeatured(biz)
                                  },
                                  {
                                    label: biz.isApproved ? 'Sembunyikan Dari Direktori' : 'Aktifkan Paparan',
                                    onClick: () => handleToggleApprovedBusiness(biz)
                                  },
                                  {
                                    label: 'Edit Perniagaan',
                                    dividerBefore: true,
                                    onClick: () => {
                                      setIsCreatingBusiness(false);
                                      setEditingBusiness(biz);
                                    }
                                  },
                                  {
                                    label: 'Padam Perniagaan',
                                    tone: 'danger',
                                    onClick: () =>
                                      confirmDelete({
                                        itemName: biz.businessName,
                                        itemType: 'Senarai Perniagaan',
                                        onConfirm: () => handleDeleteBusiness(biz.id, biz.businessName)
                                      })
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={businessesPagination.currentPage}
                  totalItems={businessesPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={businessesPagination.setCurrentPage}
                  itemLabel="perniagaan"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CAPSULE SLOTS MANAGEMENT */}
      {adminTab === 'slots' && (
        <div key="slots" className="space-y-4 animate-dashboard-tab">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
              Inventori &amp; Pengurusan Kapsul Jajahan
            </h3>
          </div>

          {/* New Slot Form */}
          {showSlotForm && (
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden animate-dashboard-tab transition-colors">
              <div className="h-0.5 w-full bg-indigo-500/80 dark:bg-indigo-400/80" />
              <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-3.5 px-5 flex items-center justify-between">
                <h4 className="font-extrabold text-base sm:text-lg text-black dark:text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
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

              <form onSubmit={handleSaveSlot} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      placeholder="Contoh: Kapsul Niaga Belia Bachok 02"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Menyimpan...' : 'Simpan Kapsul'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Slots Reference Table View */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
            <ReferenceTableToolbar
              accent="indigo"
              searchValue={adminSlotSearch}
              onSearchChange={setAdminSlotSearch}
              searchPlaceholder="Cari kod, nama, hab atau daerah..."
              filterCount={
                (adminSlotStatusFilter !== 'all' ? 1 : 0) +
                (adminSlotDistrictFilter !== 'Semua' ? 1 : 0) +
                (adminSlotSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
              }
              onResetFilters={() => {
                setAdminSlotStatusFilter('all');
                setAdminSlotDistrictFilter('Semua');
                setAdminSlotSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                adminSlotSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...adminSlotSortOptions]
                  : adminSlotSortOptions
              }
              sortValue={adminSlotSortPreset === 'table_column' ? '' : adminSlotSortPreset}
              onSortChange={(val) => {
                if (val) setAdminSlotSortPreset(val);
              }}
              rightSlot={
                <button
                  type="button"
                  id="btn-admin-add-slot-toggle"
                  onClick={() => setShowSlotForm(!showSlotForm)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{showSlotForm ? 'Tutup Borang' : 'Tambah Kiosk Baharu'}</span>
                </button>
              }
              filterContent={
                <>
                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Status Kapsul
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'all', label: 'Semua' },
                        { id: 'available', label: 'Tersedia' },
                        { id: 'occupied', label: 'Beroperasi' },
                        { id: 'maintenance', label: 'Selenggara' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAdminSlotStatusFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border cursor-pointer transition-colors ${
                            adminSlotStatusFilter === opt.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Daerah
                    </label>
                    <select
                      value={adminSlotDistrictFilter}
                      onChange={(e) => setAdminSlotDistrictFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="Semua">Semua Daerah</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              }
            />

            {filteredAdminSlots.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Building2 className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">
                  Tiada slot kapsul sepadan dengan carian atau penapis.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSlotSearch('');
                    setAdminSlotStatusFilter('all');
                    setAdminSlotDistrictFilter('Semua');
                    setAdminSlotSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className="mt-1 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Set Semula Carian &amp; Penapis
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                        <th className="py-3 pl-5 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminSlotSortPreset('table_column');
                              setAdminSlotSort((prev) =>
                                prev.key === 'name'
                                  ? { key: 'name', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'name', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Unit Kapsul</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminSlotSortPreset('table_column');
                              setAdminSlotSort((prev) =>
                                prev.key === 'district'
                                  ? { key: 'district', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'district', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Lokasi &amp; Daerah</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminSlotSortPreset('table_column');
                              setAdminSlotSort((prev) =>
                                prev.key === 'monthlyRate'
                                  ? { key: 'monthlyRate', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'monthlyRate', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kadar Sewa</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminSlotSortPreset('table_column');
                              setAdminSlotSort((prev) =>
                                prev.key === 'status'
                                  ? { key: 'status', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'status', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 pl-2 pr-5 w-12 text-right">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                      {slotsPagination.paginatedItems.map((s) => (
                        <tr key={s.id} className="kbelia-table-row">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 shrink-0">
                                <PortalImage
                                  src={resolveSlotImage(s)}
                                  alt={s.name}
                                  fallbackType="kiosk"
                                  fallbackLabel={s.code}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-black dark:text-white truncate max-w-[230px]">
                                  {s.code} · {s.name}
                                </p>
                                <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[230px]">
                                  {s.size}{s.currentTenantBusinessName ? ` · Penyewa: ${s.currentTenantBusinessName}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <p className="font-medium text-black dark:text-white">{s.hubLocation}</p>
                            <p className="text-[0.8125rem] text-black/60 dark:text-white/65">{s.district}</p>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                            RM{s.monthlyRate}/bulan
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
                                s.status === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                  : s.status === 'occupied'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                              }`}
                            >
                              {s.status === 'available'
                                ? 'Tersedia'
                                : s.status === 'occupied'
                                ? 'Beroperasi'
                                : s.status === 'reserved'
                                ? 'Ditempah'
                                : 'Selenggara'}
                            </span>
                          </td>
                          <td className="py-3.5 pl-2 pr-5 text-right">
                            <RowActionMenu
                              ariaLabel={`Tindakan untuk ${s.code}`}
                              items={[
                                {
                                  label: 'Set Tersedia',
                                  disabled: s.status === 'available',
                                  onClick: () => handleDirectSlotStatusChange(s, 'available')
                                },
                                {
                                  label: 'Set Beroperasi',
                                  disabled: s.status === 'occupied',
                                  onClick: () => handleDirectSlotStatusChange(s, 'occupied')
                                },
                                {
                                  label: 'Set Ditempah',
                                  disabled: s.status === 'reserved',
                                  onClick: () => handleDirectSlotStatusChange(s, 'reserved')
                                },
                                {
                                  label: 'Set Selenggara',
                                  disabled: s.status === 'maintenance',
                                  onClick: () => handleDirectSlotStatusChange(s, 'maintenance')
                                },
                                {
                                  label: 'Edit Slot Kapsul',
                                  dividerBefore: true,
                                  onClick: () => setEditingSlot(s)
                                },
                                {
                                  label: 'Padam Slot',
                                  tone: 'danger',
                                  onClick: () =>
                                    confirmDelete({
                                      itemName: `${s.code} · ${s.name}`,
                                      itemType: 'Slot Kiosk',
                                      onConfirm: () => handleDeleteSlot(s.id)
                                    })
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={slotsPagination.currentPage}
                  totalItems={slotsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={slotsPagination.setCurrentPage}
                  itemLabel="slot kapsul"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAMS MANAGEMENT */}
      {adminTab === 'programs' && (
        <div key="programs" className="space-y-4 animate-dashboard-tab">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
              Pengurusan Inisiatif Geran &amp; Program Belia
            </h3>
          </div>

          {/* New Program Form */}
          {showProgramForm && (
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden animate-dashboard-tab transition-colors">
              <div className="h-0.5 w-full bg-indigo-500/80 dark:bg-indigo-400/80" />
              <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-3.5 px-5 flex items-center justify-between">
                <h4 className="font-extrabold text-base sm:text-lg text-black dark:text-white tracking-tight flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
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

              <form onSubmit={handleSaveProgram} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <option value="Geran & Dana" className="dark:bg-slate-900">Geran &amp; Dana</option>
                      <option value="Bengkel & Latihan" className="dark:bg-slate-900">Bengkel &amp; Latihan</option>
                      <option value="Pameran & Ekspo" className="dark:bg-slate-900">Pameran &amp; Ekspo</option>
                      <option value="Pitching & Inkubasi" className="dark:bg-slate-900">Pitching &amp; Inkubasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Tarikh Pelaksanaan
                    </label>
                    <ModernDatePicker
                      value={progDate}
                      onChange={setProgDate}
                      valueFormat="program-date"
                      allowRange
                      allowOngoingPreset
                      placeholder="Pilih tarikh atau tempoh"
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
                    className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Menerbitkan...' : 'Terbitkan Program'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
            <ReferenceTableToolbar
              accent="indigo"
              searchValue={progSearch}
              onSearchChange={setProgSearch}
              searchPlaceholder="Cari tajuk atau kategori program..."
              filterCount={(progCategoryFilter !== 'Semua' ? 1 : 0) + (progSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
              onResetFilters={() => {
                setProgCategoryFilter('Semua');
                setProgSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                progSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...progSortOptions]
                  : progSortOptions
              }
              sortValue={progSortPreset === 'table_column' ? '' : progSortPreset}
              onSortChange={(val) => {
                if (val) setProgSortPreset(val);
              }}
              rightSlot={
                <button
                  type="button"
                  id="btn-admin-add-prog-toggle"
                  onClick={() => setShowProgramForm(!showProgramForm)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Award className="w-4 h-4" />
                  <span>{showProgramForm ? 'Tutup Borang' : 'Terbitkan Program Baharu'}</span>
                </button>
              }
              filterContent={
                <div>
                  <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                    Kategori Program
                  </label>
                  <select
                    value={progCategoryFilter}
                    onChange={(e) => setProgCategoryFilter(e.target.value as 'Semua' | YouthProgram['category'])}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Geran & Dana">Geran &amp; Dana</option>
                    <option value="Bengkel & Latihan">Bengkel &amp; Latihan</option>
                    <option value="Pameran & Ekspo">Pameran &amp; Ekspo</option>
                    <option value="Pitching & Inkubasi">Pitching &amp; Inkubasi</option>
                  </select>
                </div>
              }
            />

            {filteredAdminPrograms.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Award className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">
                  Tiada program atau geran sepadan dengan carian atau penapis.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProgSearch('');
                    setProgCategoryFilter('Semua');
                    setProgSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className="mt-1 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Set Semula Carian &amp; Penapis
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                        <th className="py-3 pl-5 pr-3">
                          <button
                            type="button"
                            onClick={() => {
                              setProgSortPreset('table_column');
                              setProgSort((prev) =>
                                prev.key === 'title'
                                  ? { key: 'title', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'title', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Program</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setProgSortPreset('table_column');
                              setProgSort((prev) =>
                                prev.key === 'category'
                                  ? { key: 'category', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'category', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kategori</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setProgSortPreset('table_column');
                              setProgSort((prev) =>
                                prev.key === 'grantAmount'
                                  ? { key: 'grantAmount', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                  : { key: 'grantAmount', dir: 'asc' }
                              );
                            }}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Nilai Bantuan</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">Tarikh &amp; Lokasi</th>
                        <th className="py-3 pl-2 pr-5 w-12 text-right">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                      {programsPagination.paginatedItems.map((p) => (
                        <tr key={p.id} className="kbelia-table-row">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 shrink-0">
                                <PortalImage
                                  src={resolveProgramImage(p)}
                                  alt={p.title}
                                  fallbackType="program"
                                  fallbackLabel={p.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-black dark:text-white truncate max-w-[260px]">
                                  {p.title}
                                </p>
                                <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[260px]">
                                  {p.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                            {p.grantAmount || '-'}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <p className="font-medium text-black dark:text-white">{p.date || '-'}</p>
                            <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[180px]">{p.location || '-'}</p>
                          </td>
                          <td className="py-3.5 pl-2 pr-5 text-right">
                            <RowActionMenu
                              ariaLabel={`Tindakan untuk ${p.title}`}
                              items={[
                                {
                                  label: 'Edit Program',
                                  onClick: () => setEditingProgram(p)
                                },
                                {
                                  label: 'Padam Program',
                                  tone: 'danger',
                                  dividerBefore: true,
                                  onClick: () =>
                                    confirmDelete({
                                      itemName: p.title,
                                      itemType: 'Program & Geran',
                                      onConfirm: () => handleDeleteProg(p.id)
                                    })
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={programsPagination.currentPage}
                  totalItems={programsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={programsPagination.setCurrentPage}
                  itemLabel="program"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: MENTOR & MENTEE MONITORING HUB */}
      {adminTab === 'mentors' && (
        <div key="mentors" className="space-y-4 animate-dashboard-tab">
          <div className="relative overflow-hidden kbelia-important-header p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-300 dark:border-slate-600">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 dark:bg-indigo-400/80" />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200 dark:border-indigo-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Hab Bimbingan Mentor KBelia</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                Pemantauan Mentor &amp; Usahawan Kelantan
              </h3>
            </div>
          </div>

          {/* Mentor Management Table */}
          <div className="space-y-3">
            <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              <span>Senarai Mentor</span>
            </h4>

            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
              <ReferenceTableToolbar
                accent="indigo"
                searchValue={mentorListSearch}
                onSearchChange={setMentorListSearch}
                searchPlaceholder="Cari mentor, agensi atau jawatan..."
                filterCount={mentorListSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0}
                onResetFilters={() => setMentorListSortPreset(DEFAULT_SORT_VALUE)}
                sortOptions={
                  mentorListSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...mentorListSortOptions]
                    : mentorListSortOptions
                }
                sortValue={mentorListSortPreset === 'table_column' ? '' : mentorListSortPreset}
                onSortChange={(val) => {
                  if (val) setMentorListSortPreset(val);
                }}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMentorForEdit(null);
                      setIsCreatingMentor(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mentor Baharu</span>
                  </button>
                }
              />

              {filteredAdminMentors.length === 0 ? (
                <div className="py-10 px-6 text-center text-sm text-black/70 dark:text-white/75">
                  Tiada profil mentor sepadan dengan carian anda.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                          <th className="py-3 pl-5 pr-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorListSortPreset('table_column');
                                setMentorListSort((prev) =>
                                  prev.key === 'name'
                                    ? { key: 'name', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'name', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Mentor</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorListSortPreset('table_column');
                                setMentorListSort((prev) =>
                                  prev.key === 'agency'
                                    ? { key: 'agency', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'agency', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Agensi &amp; Jawatan</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorListSortPreset('table_column');
                                setMentorListSort((prev) =>
                                  prev.key === 'menteeCount'
                                    ? { key: 'menteeCount', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'menteeCount', dir: 'desc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Usahawan Diselia</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">E-mel</th>
                          <th className="py-3 pl-2 pr-5 w-12 text-right">
                            <span className="sr-only">Tindakan</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                        {adminMentorsPagination.paginatedItems.map((m) => {
                          const menteeCount = mentorshipRegistrations.filter(r => r.mentorId === m.id).length;
                          return (
                            <tr key={m.id} className="kbelia-table-row">
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex items-center gap-3 min-w-[180px]">
                                  <img
                                    src={m.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg'}
                                    alt={m.name}
                                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                  />
                                  <span className="font-semibold text-black dark:text-white truncate max-w-[220px]">
                                    {m.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <p className="font-medium text-black dark:text-white truncate max-w-[240px]">
                                  {m.agency.split('(')[0].trim()}
                                </p>
                                <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[240px]">
                                  {m.title}
                                </p>
                              </td>
                              <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300">
                                  {menteeCount} Usahawan
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-mono text-[0.8125rem] text-black/75 dark:text-white/80 whitespace-nowrap">
                                {m.email}
                              </td>
                              <td className="py-3.5 pl-2 pr-5 text-right">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk ${m.name}`}
                                  items={[
                                    {
                                      label: 'Edit Profil Mentor',
                                      onClick: () => {
                                        setIsCreatingMentor(false);
                                        setSelectedMentorForEdit(m);
                                      }
                                    },
                                    {
                                      label: 'Padam Mentor',
                                      tone: 'danger',
                                      dividerBefore: true,
                                      onClick: () =>
                                        confirmDelete({
                                          itemName: m.name,
                                          itemType: 'Profil Mentor',
                                          onConfirm: () => handleDeleteMentor(m)
                                        })
                                    }
                                  ]}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <PaginationBar
                    currentPage={adminMentorsPagination.currentPage}
                    totalItems={adminMentorsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={adminMentorsPagination.setCurrentPage}
                    itemLabel="mentor"
                    accent="rose"
                  />
                </>
              )}
            </div>
          </div>

          {/* Mentee List View */}
          <div className="space-y-3">
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                Senarai Usahawan Berdaftar Mengikut Mentor
              </h4>
            </div>

            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-indigo-500/80 dark:bg-indigo-400/80" />
              <ReferenceTableToolbar
                accent="indigo"
                searchValue={mentorshipSearch}
                onSearchChange={setMentorshipSearch}
                searchPlaceholder="Cari usahawan, mentor atau topik..."
                filterCount={
                  (mentorshipStatusFilter !== 'all' ? 1 : 0) +
                  (mentorshipSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
                }
                onResetFilters={() => {
                  setMentorshipStatusFilter('all');
                  setMentorshipSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  mentorshipSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...mentorshipSortOptions]
                    : mentorshipSortOptions
                }
                sortValue={mentorshipSortPreset === 'table_column' ? '' : mentorshipSortPreset}
                onSortChange={(val) => {
                  if (val) setMentorshipSortPreset(val);
                }}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMentorship(null);
                      setIsCreatingMentorship(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Sesi Bimbingan</span>
                  </button>
                }
                filterContent={
                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Status Sesi Bimbingan
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'all', label: 'Semua' },
                        { id: 'pending', label: 'Menunggu' },
                        { id: 'confirmed', label: 'Disahkan' },
                        { id: 'completed', label: 'Selesai' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMentorshipStatusFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border cursor-pointer transition-colors ${
                            mentorshipStatusFilter === opt.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              />

              {sortedMentorships.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <UserCheck className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    Tiada pendaftaran bimbingan ditemui.
                  </p>
                  {(mentorshipSearch || mentorshipStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMentorshipSearch('');
                        setMentorshipStatusFilter('all');
                        setMentorshipSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className="mt-1 px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Set Semula Carian &amp; Penapis
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                          <th className="py-3 pl-5 pr-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorshipSortPreset('table_column');
                                setMentorshipSort((prev) =>
                                  prev.key === 'entrepreneurName'
                                    ? { key: 'entrepreneurName', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'entrepreneurName', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Usahawan &amp; Perniagaan</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorshipSortPreset('table_column');
                                setMentorshipSort((prev) =>
                                  prev.key === 'mentorName'
                                    ? { key: 'mentorName', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'mentorName', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Mentor &amp; Topik</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorshipSortPreset('table_column');
                                setMentorshipSort((prev) =>
                                  prev.key === 'preferredDate'
                                    ? { key: 'preferredDate', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'preferredDate', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Tarikh &amp; Mod</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMentorshipSortPreset('table_column');
                                setMentorshipSort((prev) =>
                                  prev.key === 'status'
                                    ? { key: 'status', dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : { key: 'status', dir: 'asc' }
                                );
                              }}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Status</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 pl-2 pr-5 w-12 text-right">
                            <span className="sr-only">Tindakan</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                        {adminMentorshipsPagination.paginatedItems.map((m) => (
                          <tr key={m.id} className="kbelia-table-row">
                            <td className="py-3.5 pl-5 pr-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="w-10 h-10 rounded-xl shrink-0 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-black dark:text-white truncate max-w-[230px]">
                                    {m.entrepreneurName}
                                  </p>
                                  <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[230px]">
                                    {m.businessName} · {m.district}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-medium text-black dark:text-white truncate max-w-[220px]">
                                {m.mentorName}
                              </p>
                              <p className="text-[0.8125rem] text-black/60 dark:text-white/65 truncate max-w-[220px]">
                                {m.topic}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                              <p className="font-medium text-black dark:text-white">{m.preferredDate}</p>
                              <p className="text-[0.8125rem] text-black/60 dark:text-white/65">{normalizeMentorshipMode(m.mode)}</p>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
                                  m.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                    : m.status === 'confirmed'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                                    : m.status === 'cancelled'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                }`}
                              >
                                {m.status === 'completed'
                                  ? 'Selesai'
                                  : m.status === 'confirmed'
                                  ? 'Disahkan'
                                  : m.status === 'cancelled'
                                  ? 'Dibatalkan'
                                  : 'Menunggu'}
                              </span>
                            </td>
                            <td className="py-3.5 pl-2 pr-5 text-right">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${m.entrepreneurName}`}
                                items={[
                                  {
                                    label: 'Set Menunggu',
                                    disabled: m.status === 'pending',
                                    onClick: () => handleDirectMentorshipStatus(m, 'pending')
                                  },
                                  {
                                    label: 'Set Disahkan',
                                    tone: 'accent',
                                    disabled: m.status === 'confirmed',
                                    onClick: () => handleDirectMentorshipStatus(m, 'confirmed')
                                  },
                                  {
                                    label: 'Set Selesai',
                                    disabled: m.status === 'completed',
                                    onClick: () => handleDirectMentorshipStatus(m, 'completed')
                                  },
                                  {
                                    label: 'Set Dibatalkan',
                                    disabled: m.status === 'cancelled',
                                    onClick: () => handleDirectMentorshipStatus(m, 'cancelled')
                                  },
                                  {
                                    label: 'Edit Sesi Bimbingan',
                                    dividerBefore: true,
                                    onClick: () => {
                                      setIsCreatingMentorship(false);
                                      setEditingMentorship(m);
                                    }
                                  },
                                  {
                                    label: 'Padam Sesi',
                                    tone: 'danger',
                                    onClick: () =>
                                      confirmDelete({
                                        itemName: `${m.entrepreneurName} (${m.topic})`,
                                        itemType: 'Sesi Bimbingan Mentor',
                                        onConfirm: () => handleDeleteMentorship(m)
                                      })
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationBar
                    currentPage={adminMentorshipsPagination.currentPage}
                    totalItems={adminMentorshipsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={adminMentorshipsPagination.setCurrentPage}
                    itemLabel="pendaftaran bimbingan"
                    accent="rose"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PORTAL NEWS MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'news' && (
        <div key="news" className="animate-dashboard-tab">
          <AdminNewsManager
            newsItems={newsItems}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* TAB: RUANG NIAGA VISUAL AD MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'b2b' && (
        <div key="b2b" className="animate-dashboard-tab">
          <AdminB2BManager />
        </div>
      )}

      {/* TAB: EVENTS & BOOKINGS MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'events' && (
        <div key="events" className="animate-dashboard-tab">
          <AdminEventsManager onRefresh={onRefresh} />
        </div>
      )}

      {/* TAB: USER ACCOUNT MANAGEMENT (ADMIN ONLY) */}
      {adminTab === 'users' && (
        <div key="users" className="animate-dashboard-tab">
          <AdminUsersManager onRefresh={onRefresh} />
        </div>
      )}

      {/* TAB 5: ADMIN & SYSTEM SETTINGS */}
      {adminTab === 'settings' && (
        <div key="settings" className="space-y-4 animate-dashboard-tab">
          {/* Header Banner */}
          <div className="relative overflow-hidden kbelia-important-header p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-300 dark:border-slate-600">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 dark:bg-indigo-400/80" />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200 dark:border-indigo-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Pengurusan Sistem Pentadbir</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                Tetapan Sistem &amp; Profil Pentadbir
              </h3>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

          <form onSubmit={handleSaveAdminSettings} className="space-y-4">
            {/* Section 1: Profil Pentadbir */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-4 transition-colors">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/80 dark:bg-emerald-400/80" />
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                  Profil Pentadbir &amp; Saluran Sokongan Rasmi
                </h4>
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
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-4 transition-colors">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500/80 dark:bg-amber-400/80" />
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                  Tetapan &amp; Parameter Operasi Portal KBelia
                </h4>
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
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs space-y-4 transition-colors">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 dark:bg-indigo-400/80" />
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                  Kawalan Pangkalan Data &amp; Penyelenggaraan Sesi
                </h4>
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
