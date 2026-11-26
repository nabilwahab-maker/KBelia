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
  Edit3,
  Trash2,
  MapPin,
  Star,
  Eye,
  EyeOff
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
import { EditorialMetricStrip } from './EditorialMetricStrip';
import { getRoleTheme } from '../utils/roleTheme';
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

const adminTheme = getRoleTheme('admin');
import confetti from 'canvas-confetti';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage, resolveSlotImage, resolveProgramImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';
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
import { MiddleTruncate } from './TypographyPrimitives';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

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

  // Filter, sort & split-pane selection states
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminBookingSearch, setAdminBookingSearch] = useState('');
  const [adminBookingSortPreset, setAdminBookingSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);

  const [bizSearch, setBizSearch] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'approved' | 'hidden' | 'featured'>('all');
  const [bizDistrictFilter, setBizDistrictFilter] = useState<string>('Semua');
  const [bizSortPreset, setBizSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [mobileBizOpen, setMobileBizOpen] = useState(false);

  const [adminSlotSearch, setAdminSlotSearch] = useState('');
  const [adminSlotStatusFilter, setAdminSlotStatusFilter] = useState<'all' | SlotStatus>('all');
  const [adminSlotDistrictFilter, setAdminSlotDistrictFilter] = useState<string>('Semua');
  const [adminSlotSortPreset, setAdminSlotSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [mobileSlotOpen, setMobileSlotOpen] = useState(false);

  const [progSearch, setProgSearch] = useState('');
  const [progCategoryFilter, setProgCategoryFilter] = useState<'Semua' | YouthProgram['category']>('Semua');
  const [progSortPreset, setProgSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [mobileProgramOpen, setMobileProgramOpen] = useState(false);

  const [mentorListSearch, setMentorListSearch] = useState('');
  const [mentorListSortPreset, setMentorListSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [mobileMentorOpen, setMobileMentorOpen] = useState(false);

  const [mentorshipSearch, setMentorshipSearch] = useState('');
  const [mentorshipStatusFilter, setMentorshipStatusFilter] = useState<'all' | MentorshipRegistration['status']>('all');
  const [mentorshipSortPreset, setMentorshipSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedMentorshipId, setSelectedMentorshipId] = useState<string | null>(null);
  const [mobileMentorshipOpen, setMobileMentorshipOpen] = useState(false);

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
  const sortedBookings = sortRecords(filteredBookings, {
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

  const filteredBusinesses = sortRecords(baseFilteredBusinesses, {
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

  const slotStatusOrder: Record<string, number> = { available: 0, occupied: 1, reserved: 2, maintenance: 3 };
  const filteredAdminSlots = sortRecords(baseFilteredAdminSlots, {
    sortBy: adminSlotSortPreset,
    getName: (s) => `${s.code || ''} ${s.name || ''}`.trim(),
    customCompare: (a, b, mode) => {
      if (mode === 'rate_asc') return (Number(a.monthlyRate) || 0) - (Number(b.monthlyRate) || 0);
      if (mode === 'rate_desc') return (Number(b.monthlyRate) || 0) - (Number(a.monthlyRate) || 0);
      if (mode === 'district_asc') return compareText(a.district, b.district);
      if (mode === 'status_available') return (slotStatusOrder[a.status] ?? 4) - (slotStatusOrder[b.status] ?? 4);
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

  const filteredAdminPrograms = sortRecords(baseFilteredAdminPrograms, {
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

  const filteredAdminMentors = sortRecords(baseFilteredAdminMentors, {
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

  const sortedMentorships = sortRecords(baseFilteredMentorships, {
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
    sortedBookings.length
  ]);
  const businessesPagination = usePagination(filteredBusinesses, 7, [
    bizSearch,
    bizStatusFilter,
    bizDistrictFilter,
    bizSortPreset,
    filteredBusinesses.length
  ]);
  const slotsPagination = usePagination(filteredAdminSlots, 7, [
    adminSlotSearch,
    adminSlotStatusFilter,
    adminSlotDistrictFilter,
    adminSlotSortPreset,
    filteredAdminSlots.length
  ]);
  const programsPagination = usePagination(filteredAdminPrograms, 7, [
    progSearch,
    progCategoryFilter,
    progSortPreset,
    filteredAdminPrograms.length
  ]);
  const adminMentorsPagination = usePagination(filteredAdminMentors, 7, [
    mentorListSearch,
    mentorListSortPreset,
    filteredAdminMentors.length
  ]);
  const adminMentorshipsPagination = usePagination(sortedMentorships, 7, [
    mentorshipSearch,
    mentorshipStatusFilter,
    mentorshipSortPreset,
    sortedMentorships.length
  ]);

  const selectedBooking =
    sortedBookings.find((b) => b.id === selectedBookingId) ||
    adminBookingsPagination.paginatedItems[0] ||
    sortedBookings[0] ||
    null;
  const selectedBusiness =
    filteredBusinesses.find((b) => b.id === selectedBizId) ||
    businessesPagination.paginatedItems[0] ||
    filteredBusinesses[0] ||
    null;
  const selectedSlot =
    filteredAdminSlots.find((s) => s.id === selectedSlotId) ||
    slotsPagination.paginatedItems[0] ||
    filteredAdminSlots[0] ||
    null;
  const selectedProgram =
    filteredAdminPrograms.find((p) => p.id === selectedProgramId) ||
    programsPagination.paginatedItems[0] ||
    filteredAdminPrograms[0] ||
    null;
  const selectedMentorItem =
    filteredAdminMentors.find((m) => m.id === selectedMentorId) ||
    adminMentorsPagination.paginatedItems[0] ||
    filteredAdminMentors[0] ||
    null;
  const selectedMentorship =
    sortedMentorships.find((m) => m.id === selectedMentorshipId) ||
    adminMentorshipsPagination.paginatedItems[0] ||
    sortedMentorships[0] ||
    null;

  if (!isAdmin) {
    return (
      <div className={`rounded-3xl p-8 text-center space-y-4 border ${adminTheme.surfaceClass}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900 dark:text-[#F5F2EC]">
          Akses Khusus Pentadbir Sistem Sahaja
        </h3>
        <p className="text-[0.9375rem] text-stone-600 dark:text-stone-300 max-w-md mx-auto">
          Modul kawalan pentadbiran dan kelulusan permohonan hanya dibenarkan untuk akaun Pentadbir Sistem yang disahkan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5">
      
      {/* Admin Hero: Arang & Gangsa (Editorial Operations Header) */}
      <div className={`relative overflow-hidden kbelia-ambient-sheen-soft rounded-2xl border backdrop-blur-xs p-5 sm:p-6 transition-colors ${adminTheme.surfaceClass}`}>
        {/* Softened Warm Bronze & Sage Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-52 h-52 rounded-full bg-[#D98A4E]/10 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-48 h-48 rounded-full bg-[#78907C]/10 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        {(() => {
          const adminDisplayName = userProfile?.fullName || user?.displayName || (isMs ? 'Pentadbir KBelia' : 'KBelia Admin');
          const pendingBookingsCount = safeBookings.filter(b => b && b.status === 'pending').length;
          const pendingGrantsCount = (grantApplications || []).filter(g => g.status === 'pending').length;
          const openTicketsCount = (maintenanceTickets || []).filter(t => t.status !== 'resolved').length;

          const adminHeaderMap: Record<AdminSubTab, { prefix: string; accent: string }> = {
            queue: {
              prefix: isMs ? 'Ringkasan ' : 'Operations ',
              accent: isMs ? 'Operasi' : 'Summary'
            },
            bookings: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Permohonan Kiosk' : 'Kiosk Bookings'
            },
            businesses: {
              prefix: isMs ? 'Direktori & Profil ' : 'Entrepreneur ',
              accent: isMs ? 'Usahawan' : 'Directory'
            },
            slots: {
              prefix: isMs ? 'Urus ' : 'Manage ',
              accent: isMs ? 'Slot Kiosk' : 'Kiosk Slots'
            },
            programs: {
              prefix: isMs ? 'Program & ' : 'Grants & ',
              accent: isMs ? 'Geran Belia' : 'Programs'
            },
            mentors: {
              prefix: isMs ? 'Senarai ' : 'Mentor ',
              accent: isMs ? 'Panel Mentor' : 'Directory'
            },
            news: {
              prefix: isMs ? 'Pengurusan ' : 'Manage ',
              accent: isMs ? 'Berita Portal' : 'News & Updates'
            },
            b2b: {
              prefix: isMs ? 'Iklan ' : 'B2B ',
              accent: isMs ? 'Pembekal B2B' : 'Supplier Ads'
            },
            events: {
              prefix: isMs ? 'Acara & ' : 'Youth ',
              accent: isMs ? 'Karnival Belia' : 'Events'
            },
            users: {
              prefix: isMs ? 'Pengurusan ' : 'User ',
              accent: isMs ? 'Akaun Pengguna' : 'Accounts'
            },
            sync: {
              prefix: isMs ? 'Semak & ' : 'Data ',
              accent: isMs ? 'Sync Data' : 'Sync'
            },
            settings: {
              prefix: isMs ? 'Tetapan ' : 'Portal ',
              accent: isMs ? 'Portal' : 'Settings'
            }
          };
          const currentAdminHeader = adminHeaderMap[adminTab] || adminHeaderMap.queue;
          const targetTab: AdminSubTab = adminTab === 'queue' ? 'bookings' : 'queue';
          const actionLabel =
            adminTab === 'queue'
              ? (isMs ? 'Semak Permohonan' : 'Review Applications')
              : 'Dashboard';

          return (
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className={`text-xs sm:text-[13px] font-semibold mb-1 ${adminTheme.accentTextClass}`}>
                  {isMs ? 'Seluruh Negeri Kelantan' : 'Across Kelantan'}
                </p>
                <h1 className="font-display text-fluid-portal font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight kbelia-trim">
                  {currentAdminHeader.prefix}
                  <span className={adminTheme.accentTextClass}>{currentAdminHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-slate-600 dark:text-stone-300 mt-1 max-w-2xl">
                  {isMs ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-slate-900 dark:text-[#F5F2EC]">{adminDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-slate-900 dark:text-[#F5F2EC]">{adminDisplayName}</span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdminTab(targetTab)}
                className={`self-start lg:self-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${adminTheme.primaryButtonClass}`}
              >
                {actionLabel}
              </button>
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
          { name: 'Aktif', value: capsuleOperatingCount, color: adminTheme.chartPrimary },
          { name: 'Tersedia', value: availableSlotsCount, color: adminTheme.chartSecondary },
          { name: 'Dalam Penjagaan', value: capsuleMaintenanceCount, color: '#E5B85C' },
          { name: 'Tempahan', value: capsuleReservedCount, color: adminTheme.chartTertiary }
        ];

        return (
          <>
            <EditorialMetricStrip
              role="admin"
              items={[
                {
                  id: 'admin-review',
                  label: isMs ? 'Perlu Semakan' : 'Pending Review',
                  value: pendingBookingsCount,
                  summary: isMs ? 'Menanti pengesahan seterusnya' : 'Awaiting next confirmation',
                  highlightTone: 'primary',
                  onClick: () => setAdminTab('bookings')
                },
                {
                  id: 'admin-community',
                  label: isMs ? 'Komuniti Niaga' : 'Business Community',
                  value: businesses.length,
                  summary: isMs ? 'Perniagaan aktif dalam rangkaian' : 'Active businesses in network',
                  highlightTone: 'neutral',
                  onClick: () => setAdminTab('businesses')
                },
                {
                  id: 'admin-spaces',
                  label: isMs ? 'Pengisian Ruang' : 'Space Occupancy',
                  value: `${occupancyRate}%`,
                  summary: isMs
                    ? `${occupiedSlotsCount} ruang sedang digunakan`
                    : `${occupiedSlotsCount} spaces currently active`,
                  highlightTone: 'secondary',
                  onClick: () => setAdminTab('slots')
                },
                {
                  id: 'admin-initiatives',
                  label: isMs ? 'Inisiatif Aktif' : 'Active Initiatives',
                  value: programs.length,
                  summary: isMs ? 'Program bimbingan & sokongan berjalan' : 'Ongoing coaching & support',
                  highlightTone: 'neutral',
                  onClick: () => setAdminTab('programs')
                }
              ]}
            />

            {/* Ringkasan Ekosistem: Graf Rangkaian -> Dua Lajur Aliran -> Perkembangan Komuniti */}
            {adminTab === 'queue' && (
              <div key="queue-analytics" className="space-y-3.5 animate-dashboard-tab">
                {/* 1. Seksyen Analitik 2:1 — Graf Rangkaian (2 Bahagian) + Donat Ruang Niaga (1 Bahagian) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
                <div
                  style={{ '--stagger': 4 } as React.CSSProperties}
                  className={`animate-dashboard-card lg:col-span-2 h-full relative rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0 ${adminTheme.surfaceClass}`}
                >
                <div className={`px-4 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${adminTheme.dividerClass}`}>
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className={`w-5 h-5 shrink-0 ${adminTheme.accentTextClass}`} />
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight">
                        Statistik Kiosk &amp; Permohonan Semasa
                      </h3>
                    </div>

                    <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl border self-start sm:self-auto ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <button
                        type="button"
                        onClick={() => setAdminChartMode('districts')}
                        className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          adminChartMode === 'districts'
                            ? adminTheme.segmentedActiveClass
                            : 'text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Mengikut Daerah
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminChartMode('pipeline')}
                        className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          adminChartMode === 'pipeline'
                            ? adminTheme.segmentedActiveClass
                            : 'text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Status Permohonan
                      </button>
                    </div>
                  </div>

                  <div className="p-2 pt-3 pb-1 min-w-0">
                    <div className="relative h-[210px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-stone-300">
                      <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 210 }}>
                        {adminChartMode === 'districts' ? (
                          <BarChart
                            data={districtChartData}
                            barCategoryGap="8%"
                            barGap={3}
                            margin={{ top: 18, right: 4, left: 0, bottom: 2 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.22)" />
                            <XAxis dataKey="district" height={24} tickMargin={4} tick={{ fontSize: 11.5, fontWeight: 600 }} interval={0} padding={{ left: 0, right: 0 }} axisLine={false} tickLine={false} />
                            <YAxis width={24} tickMargin={2} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: 'rgba(217, 138, 78, 0.12)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload as { fullName: string; beroperasi: number; tersedia: number };
                                  return (
                                    <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border ${adminTheme.tooltipBgClass}`}>
                                      <div className="font-bold mb-1">{d.fullName}</div>
                                      <div className="opacity-90">Aktif / Tempahan: {d.beroperasi}</div>
                                      <div className="opacity-90">Ruang Tersedia: {d.tersedia}</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="beroperasi"
                              name="Aktif"
                              fill={adminTheme.chartPrimary}
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
                                className="fill-slate-800 dark:fill-stone-200 font-mono"
                                style={{ fontSize: 11.5, fontWeight: 700 }}
                              />
                            </Bar>
                            <Bar
                              dataKey="tersedia"
                              name="Tersedia"
                              fill={adminTheme.chartSecondary}
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
                                className="fill-slate-800 dark:fill-stone-200 font-mono"
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.22)" />
                            <XAxis dataKey="label" height={24} tickMargin={4} tick={{ fontSize: 12, fontWeight: 600 }} interval={0} padding={{ left: 0, right: 0 }} axisLine={false} tickLine={false} />
                            <YAxis width={24} tickMargin={2} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} allowDecimals={false} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: 'rgba(217, 138, 78, 0.12)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload as { label: string; jumlah: number };
                                  return (
                                    <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border ${adminTheme.tooltipBgClass}`}>
                                      <div className="opacity-80 text-[0.8125rem]">{d.label}</div>
                                      <div className="font-bold">{d.jumlah} Rekod</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="jumlah"
                              name="Ringkasan Aktiviti Semasa"
                              fill={adminTheme.chartPrimary}
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
                                className="fill-slate-800 dark:fill-stone-200 font-mono"
                                style={{ fontSize: 12.5, fontWeight: 700 }}
                              />
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-sm ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    {adminChartMode === 'districts' ? (
                      <>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#F5F2EC]">
                            <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: adminTheme.chartPrimary }} />
                            <span>Aktif / Tempahan</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#F5F2EC]">
                            <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: adminTheme.chartSecondary }} />
                            <span>Ruang Tersedia</span>
                          </span>
                        </div>
                        <span className="font-mono font-semibold tabular-nums text-slate-600 dark:text-stone-300">
                          {occupiedSlotsCount + availableSlotsCount} Ruang Niaga
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-[#F5F2EC]">
                          <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: adminTheme.chartPrimary }} />
                          <span>Ringkasan Aktiviti Semasa</span>
                        </div>
                        <span className="font-mono font-semibold tabular-nums text-slate-600 dark:text-stone-300">
                          {pipelineChartData.reduce((sum, item) => sum + item.jumlah, 0)} Jumlah Aktiviti
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <RoleDonutCard
                  className="lg:col-span-1 h-full"
                  role="admin"
                  title="Status Unit Kiosk"
                  icon={Building2}
                  segments={capsuleStatusSegments}
                  centerValue={safeSlots.length}
                  centerLabel="Jumlah Kiosk"
                  valueUnit="unit"
                  summaryPairs={[
                    { label: 'Sedia Disewa', value: `${availableSlotsCount} unit`, dotColor: adminTheme.chartSecondary },
                    { label: 'Dalam Penjagaan', value: `${capsuleMaintenanceCount} unit`, dotColor: adminTheme.chartPrimary }
                  ]}
                  emptyState={{
                    title: 'Tiada Unit Kiosk',
                    description: 'Tambah unit kiosk baharu untuk memantau status sewaan dan pembaikan.',
                    actionLabel: 'Urus Kiosk',
                    onAction: () => setAdminTab('slots')
                  }}
                  staggerIndex={5}
                />
                </div>

                {/* 2. Dua Lajur Seimbang Tanpa Kotak Bertindih */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
                  {/* Lajur Kiri: Ringkasan Operasi Kelantan (Pembahagi Garis Halus) */}
                  <div
                    style={{ '--stagger': 5 } as React.CSSProperties}
                    className={`animate-dashboard-card relative min-w-0 h-full rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col justify-start ${adminTheme.surfaceClass}`}
                  >
                    <div className={`px-4 py-3.5 border-b ${adminTheme.dividerClass}`}>
                      <div className="flex items-center gap-2.5">
                        <Building2 className={`w-4.5 h-4.5 shrink-0 ${adminTheme.accentTextClass}`} />
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight">
                          Ringkasan Operasi Kelantan
                        </h3>
                      </div>
                    </div>

                    {/* Baris 1: 3 Kolum Ringkas Berpembahagi Nipis */}
                    <div className={`grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x ${adminTheme.dividerClass} border-b`}>
                      <div className="px-4 py-3.5">
                        <div className="text-xs font-medium text-slate-500 dark:text-stone-400">
                          Kadar Kelulusan Kiosk
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums">
                            {bookingApprovalRate}%
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-stone-400 tabular-nums">
                            {approvedBookingsCount} diluluskan
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-3.5">
                        <div className="text-xs font-medium text-slate-500 dark:text-stone-400">
                          Kadar Kelulusan Geran
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums">
                            {grantApprovalRate}%
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-stone-400 tabular-nums">
                            {approvedGrantsCount} diluluskan
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-3.5">
                        <div className="text-xs font-medium text-slate-500 dark:text-stone-400">
                          Daerah Aktif
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-[#F5F2EC] tabular-nums">
                            {activeDistrictsCount} Daerah
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-stone-400 tabular-nums">
                            {occupiedSlotsCount} disewa
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Baris 2: 2 Lajur Terbuka Berpembahagi Tengah */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x ${adminTheme.dividerClass} flex-1`}>
                      <div className="p-4 flex flex-col justify-start gap-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC]">
                            Daerah Ada Kiosk Kosong
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdminTab('slots')}
                            className={`text-[0.8125rem] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer shrink-0 ${adminTheme.accentTextClass}`}
                          >
                            <span>Urus Kiosk</span>
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
                                className={`px-2.5 py-1 rounded-xl border text-[0.8125rem] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer hover:border-[#9A5628] dark:hover:border-[#D98A4E] ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass} text-slate-800 dark:text-[#F5F2EC]`}
                              >
                                <span>{d.fullName}</span>
                                <span className={`font-mono font-bold tabular-nums ${adminTheme.accentStrongTextClass}`}>
                                  {d.tersedia}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[0.8125rem] text-slate-600 dark:text-stone-400">
                            Semua unit kiosk di seluruh Kelantan telah penuh disewa buat masa ini.
                          </p>
                        )}
                      </div>

                      <div className="p-4 flex flex-col justify-start gap-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC]">
                            Baki Permohonan Semasa
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdminTab('bookings')}
                            className={`text-[0.8125rem] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer shrink-0 ${adminTheme.accentTextClass}`}
                          >
                            <span>Semak</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[0.8125rem] text-slate-600 dark:text-stone-300">
                            <span>Kadar Kiosk Diisi</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-[#F5F2EC] tabular-nums">{occupancyRate}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#E5DFD5] dark:bg-[#2E2A26] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${adminTheme.progressFillClass}`}
                              style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                            />
                          </div>
                          <p className="text-[0.8125rem] text-slate-500 dark:text-stone-400 tabular-nums">
                            {pendingBookingsCount + pendingGrantsCount} permohonan menunggu semakan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lajur Kanan: Perkara Memerlukan Perhatian (Baris Mengalir Tanpa Sub-Kotak) */}
                  <div
                    style={{ '--stagger': 6 } as React.CSSProperties}
                    className={`animate-dashboard-card relative min-w-0 h-full rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col justify-start ${adminTheme.surfaceClass}`}
                  >
                    <div className={`px-4 py-3.5 border-b ${adminTheme.dividerClass}`}>
                      <div className="flex items-center gap-2.5">
                        <Activity className={`w-4.5 h-4.5 shrink-0 ${adminTheme.accentTextClass}`} />
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight">
                          Perlu Tindakan Segera
                        </h3>
                      </div>
                    </div>

                    <div className={`divide-y ${adminTheme.dividerClass} px-4 sm:px-5`}>
                      <button
                        type="button"
                        onClick={() => setAdminTab('bookings')}
                        className="w-full py-3.5 flex items-center justify-between gap-3 transition-colors hover:opacity-85 cursor-pointer text-left"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Clock className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${adminTheme.accentTextClass}`} />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC] leading-snug break-words">
                              Permohonan Kiosk
                            </div>
                            <div className="text-xs sm:text-[0.8125rem] text-slate-500 dark:text-stone-400 leading-relaxed break-words">
                              Menunggu semakan admin
                            </div>
                          </div>
                        </div>
                        <span className={`font-mono tabular-nums text-base font-bold shrink-0 ${adminTheme.accentTextClass}`}>
                          {pendingBookingsCount}
                        </span>
                      </button>

                      <div className="w-full py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Award className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${adminTheme.accentStrongTextClass}`} />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC] leading-snug break-words">
                              Permohonan Geran Belia
                            </div>
                            <div className="text-xs sm:text-[0.8125rem] text-slate-500 dark:text-stone-400 leading-relaxed break-words">
                              {approvedGrantsCount} telah diluluskan
                            </div>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-[#F5F2EC] shrink-0">
                          {pendingGrantsCount}
                        </span>
                      </div>

                      <div className="w-full py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Wrench className="w-4.5 h-4.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC] leading-snug break-words">
                              Aduan Kerosakan Kiosk
                            </div>
                            <div className="text-xs sm:text-[0.8125rem] text-slate-500 dark:text-stone-400 leading-relaxed break-words">
                              Permintaan baik pulih kiosk
                            </div>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-[#F5F2EC] shrink-0">
                          {openTicketsCount}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAdminTab('mentors')}
                        className="w-full py-3.5 flex items-center justify-between gap-3 transition-colors hover:opacity-85 cursor-pointer text-left"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <GraduationCap className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${adminTheme.accentTextClass}`} />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC] leading-snug break-words">
                              Sesi Mentor
                            </div>
                            <div className="text-xs sm:text-[0.8125rem] text-slate-500 dark:text-stone-400 leading-relaxed break-words">
                              {mentors.length} mentor aktif
                            </div>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-[#F5F2EC] shrink-0">
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
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-stone-900 dark:text-[#F5F2EC] border-emerald-200 dark:border-emerald-800/70'
            : 'bg-rose-50 dark:bg-rose-950/40 text-stone-900 dark:text-[#F5F2EC] border-rose-200 dark:border-rose-800/70'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
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
          <WorkspaceHeaderCard
            role="admin"
            icon={<Clock className="w-5 h-5" />}
            title="Senarai Permohonan Sewaan Kapsul"
            subtitle="Semak cadangan perniagaan, status permohonan, dan kelulusan ruang niaga kapsul."
            rightActions={
              <button
                type="button"
                onClick={() => {
                  setEditingBooking(null);
                  setIsCreatingBooking(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${adminTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            }
            searchValue={adminBookingSearch}
            onSearchChange={setAdminBookingSearch}
            searchPlaceholder="Cari pemohon, syarikat atau kod..."
            filterCount={(bookingFilter !== 'all' ? 1 : 0) + (adminBookingSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
            onResetFilters={() => {
              setBookingFilter('all');
              setAdminBookingSortPreset(DEFAULT_SORT_VALUE);
              setMobileBookingOpen(false);
            }}
            sortOptions={adminBookingSortOptions}
            sortValue={adminBookingSortPreset}
            onSortChange={setAdminBookingSortPreset}
            filterContent={
              <div>
                <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Status Permohonan
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Semua' },
                      { id: 'pending', label: 'Menunggu' },
                      { id: 'approved', label: 'Diluluskan' },
                      { id: 'rejected', label: 'Ditolak' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setBookingFilter(opt.id);
                        setMobileBookingOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                        bookingFilter === opt.id
                          ? adminTheme.activeMiniBtnClass
                          : adminTheme.secondaryButtonClass
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
            <div className={`rounded-2xl border backdrop-blur-xs py-12 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
              <Clock className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] kbelia-trim">
                Tiada Permohonan Dalam Kategori Ini
              </p>
              {(adminBookingSearch || bookingFilter !== 'all' || adminBookingSortPreset !== DEFAULT_SORT_VALUE) && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminBookingSearch('');
                    setBookingFilter('all');
                    setAdminBookingSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className={`mt-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  Set Semula
                </button>
              )}
            </div>
          ) : (
            <GoogleWorkspaceSplitPane
              role="admin"
              mobileOpen={mobileBookingOpen && Boolean(selectedBooking)}
              onMobileClose={() => setMobileBookingOpen(false)}
              mobileTitle={selectedBooking ? `${selectedBooking.slotCode} · ${selectedBooking.businessName}` : undefined}
              leftHeader={
                <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  <span>{sortedBookings.length} permohonan sewaan</span>
                  {(adminBookingSearch || bookingFilter !== 'all' || adminBookingSortPreset !== DEFAULT_SORT_VALUE) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminBookingSearch('');
                        setBookingFilter('all');
                        setAdminBookingSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                    >
                      Set Semula
                    </button>
                  )}
                </div>
              }
              leftContent={adminBookingsPagination.paginatedItems.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                const statusLabel =
                  b.status === 'approved'
                    ? 'Diluluskan'
                    : b.status === 'rejected'
                    ? 'Ditolak'
                    : b.status === 'cancelled'
                    ? 'Dibatalkan'
                    : 'Menunggu';
                const statusColor =
                  b.status === 'approved'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : b.status === 'rejected'
                    ? 'text-rose-700 dark:text-rose-400'
                    : b.status === 'cancelled'
                    ? 'text-stone-500 dark:text-stone-400'
                    : 'text-amber-700 dark:text-amber-300';

                return (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedBookingId(b.id);
                      setMobileBookingOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBookingId(b.id);
                        setMobileBookingOpen(true);
                      }
                    }}
                    className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <PortalImage
                        src={resolveBookingKioskImage(b, safeSlots)}
                        alt={`Reka bentuk kiosk ${b.slotName}`}
                        fallbackType="kiosk"
                        fallbackLabel={b.slotCode}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug truncate kbelia-trim">
                          {b.slotCode} · {b.businessName}
                        </p>
                        <span className={`text-[11px] font-bold shrink-0 ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                        {b.applicantName} · {b.hubLocation} · {b.durationMonths} bln
                      </p>
                    </div>
                  </div>
                );
              })}
              leftFooter={
                <PaginationBar
                  currentPage={adminBookingsPagination.currentPage}
                  totalItems={adminBookingsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={adminBookingsPagination.setCurrentPage}
                  itemLabel="permohonan sewaan"
                  accent="amber"
                />
              }
              rightContent={
                selectedBooking ? (
                  <div>
                    <SidePreviewHeader
                      role="admin"
                      media={
                        <div className={`w-14 h-14 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <PortalImage
                            src={resolveBookingKioskImage(selectedBooking, safeSlots)}
                            alt={`Reka bentuk kiosk ${selectedBooking.slotName}`}
                            fallbackType="kiosk"
                            fallbackLabel={selectedBooking.slotCode}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      }
                      title={`${selectedBooking.slotCode} · ${selectedBooking.businessName}`}
                      status={
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            selectedBooking.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : selectedBooking.status === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : selectedBooking.status === 'cancelled'
                              ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              : adminTheme.activeNavClass
                          }`}
                        >
                          {selectedBooking.status === 'approved'
                            ? 'Diluluskan'
                            : selectedBooking.status === 'rejected'
                            ? 'Ditolak'
                            : selectedBooking.status === 'cancelled'
                            ? 'Dibatalkan'
                            : 'Menunggu Kelulusan'}
                        </span>
                      }
                      subtitle={selectedBooking.slotName}
                      meta={
                        <>
                          <span>
                            {selectedBooking.businessCategory === 'Makanan & Minuman (F&B)'
                              ? 'Makanan & Minuman'
                              : selectedBooking.businessCategory}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedBooking.hubLocation}
                          </span>
                        </>
                      }
                      actions={
                        <>
                          <button
                            type="button"
                            disabled={loading || selectedBooking.status === 'approved'}
                            onClick={() => handleApproveBooking(selectedBooking)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45 ${adminTheme.primaryButtonClass}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lulus</span>
                          </button>
                          <button
                            type="button"
                            disabled={loading || selectedBooking.status === 'rejected'}
                            onClick={() => handleRejectBooking(selectedBooking)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45 ${adminTheme.dangerOutlineButtonClass}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                          {selectedBooking.status !== 'pending' && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleDirectAdminBookingStatus(selectedBooking, 'pending')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-45 ${adminTheme.secondaryButtonClass}`}
                            >
                              Set Menunggu
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingBooking(false);
                              setEditingBooking(selectedBooking);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sunting</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: `${selectedBooking.businessName} (${selectedBooking.slotCode})`,
                                itemType: 'Permohonan Sewaan Kiosk',
                                onConfirm: () => handleDeleteAdminBooking(selectedBooking)
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam</span>
                          </button>
                        </>
                      }
                    />

                    <div className="p-4 sm:p-5 space-y-4">
                      <SidePreviewMetricsStrip
                        role="admin"
                        columns={3}
                        items={[
                          { label: 'Pemohon', value: selectedBooking.applicantName },
                          {
                            label: 'E-mel / Telefon',
                            value: `${selectedBooking.applicantEmail || '-'} · ${selectedBooking.applicantPhone || '-'}`,
                            mono: true
                          },
                          {
                            label: 'Tempoh & Tarikh Mula',
                            value: `${selectedBooking.durationMonths} Bulan (Mulai ${selectedBooking.startDate})`
                          }
                        ]}
                      />

                      {selectedBooking.pitchNotes && (
                        <div className={`p-4 rounded-xl border space-y-1.5 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            Cadangan Pitching Usahawan
                          </span>
                          <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                            {selectedBooking.pitchNotes}
                          </p>
                        </div>
                      )}

                      {selectedBooking.status === 'pending' && (
                        <div className={`p-4 rounded-xl border space-y-3 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                              Catatan Pentadbir
                            </label>
                            <input
                              type="text"
                              placeholder="Masukkan catatan pentadbir"
                              value={reviewNoteInput[selectedBooking.id] || ''}
                              onChange={(e) =>
                                setReviewNoteInput({ ...reviewNoteInput, [selectedBooking.id]: e.target.value })
                              }
                              className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:outline-none ${adminTheme.inputClass}`}
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectBooking(selectedBooking)}
                              disabled={loading}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveBooking(selectedBooking)}
                              disabled={loading}
                              className={`px-4 py-1.5 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Lulus</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedBooking.adminNotes && selectedBooking.status !== 'pending' && (
                        <div className={`p-4 rounded-xl border space-y-1 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            Catatan Pentadbir
                          </span>
                          <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                            {selectedBooking.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <SidePreviewEmptyState
                    icon={<Clock className="w-10 h-10 text-stone-400" />}
                    title="Tiada Permohonan Dipilih"
                    description="Butiran permohonan kiosk akan dipaparkan di sini."
                  />
                )
              }
            />
          )}
        </div>
      )}

      {/* TAB 2: BUSINESSES DIRECTORY MANAGEMENT */}
      {adminTab === 'businesses' && (
        <div key="businesses" className="space-y-4 animate-dashboard-tab">
          <WorkspaceHeaderCard
            role="admin"
            icon={<Store className="w-5 h-5" />}
            title="Senarai Kedai & Usahawan"
            subtitle="Pantau direktori perniagaan belia, katalog produk, dan status paparan awam."
            rightActions={
              <button
                type="button"
                onClick={() => {
                  setEditingBusiness(null);
                  setIsCreatingBusiness(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${adminTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            }
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
              setMobileBizOpen(false);
            }}
            sortOptions={bizSortOptions}
            sortValue={bizSortPreset}
            onSortChange={setBizSortPreset}
            filterContent={
              <>
                <div>
                  <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Status Paparan
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Semua' },
                        { id: 'approved', label: 'Aktif' },
                        { id: 'hidden', label: 'Tersembunyi' },
                        { id: 'featured', label: 'Pilihan' }
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setBizStatusFilter(opt.id);
                          setMobileBizOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                          bizStatusFilter === opt.id
                            ? adminTheme.activeMiniBtnClass
                            : adminTheme.secondaryButtonClass
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Daerah
                  </label>
                  <select
                    value={bizDistrictFilter}
                    onChange={(e) => setBizDistrictFilter(e.target.value)}
                    aria-label="Tapis daerah perniagaan"
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
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
            <div className={`rounded-2xl border backdrop-blur-xs py-12 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
              <Store className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] kbelia-trim">
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
                className={`mt-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Set Semula
              </button>
            </div>
          ) : (
            <GoogleWorkspaceSplitPane
              role="admin"
              mobileOpen={mobileBizOpen && Boolean(selectedBusiness)}
              onMobileClose={() => setMobileBizOpen(false)}
              mobileTitle={selectedBusiness?.businessName}
              leftHeader={
                <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  <span>{filteredBusinesses.length} perniagaan dipaparkan</span>
                  {(bizSearch || bizStatusFilter !== 'all' || bizDistrictFilter !== 'Semua' || bizSortPreset !== DEFAULT_SORT_VALUE) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBizSearch('');
                        setBizStatusFilter('all');
                        setBizDistrictFilter('Semua');
                        setBizSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                    >
                      Set Semula
                    </button>
                  )}
                </div>
              }
              leftContent={businessesPagination.paginatedItems.map((biz) => {
                const bizProductCount = products.filter(p => p.businessId === biz.id).length;
                const isSelected = selectedBusiness?.id === biz.id;
                return (
                  <div
                    key={biz.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedBizId(biz.id);
                      setMobileBizOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBizId(biz.id);
                        setMobileBizOpen(true);
                      }
                    }}
                    className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                    }`}
                  >
                    <img
                      src={biz.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                      alt={biz.businessName}
                      className={`w-20 h-20 rounded-xl object-cover border shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug truncate kbelia-trim">
                          {biz.businessName}
                        </p>
                        <span
                          className={`text-[11px] font-bold shrink-0 ${
                            biz.isApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {biz.isApproved ? 'Aktif' : 'Tersembunyi'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                        {biz.ownerName} · {biz.district} · {bizProductCount} item{biz.isFeatured ? ' · Pilihan' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              leftFooter={
                <PaginationBar
                  currentPage={businessesPagination.currentPage}
                  totalItems={businessesPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={businessesPagination.setCurrentPage}
                  itemLabel="perniagaan"
                  accent="amber"
                />
              }
              rightContent={
                selectedBusiness ? (
                  (() => {
                    const selectedBizProductCount = products.filter(p => p.businessId === selectedBusiness.id).length;
                    return (
                      <div>
                        <SidePreviewHeader
                          role="admin"
                          media={
                            <img
                              src={selectedBusiness.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                              alt={selectedBusiness.businessName}
                              className={`w-24 h-24 rounded-xl object-cover border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}
                            />
                          }
                          title={selectedBusiness.businessName}
                          status={
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                                  selectedBusiness.isApproved
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                }`}
                              >
                                {selectedBusiness.isApproved ? 'Aktif' : 'Tersembunyi'}
                              </span>
                              {selectedBusiness.isFeatured && (
                                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${adminTheme.activeNavClass}`}>
                                  Pilihan
                                </span>
                              )}
                            </div>
                          }
                          subtitle={selectedBusiness.ownerName}
                          meta={
                            <>
                              <span>{formatBusinessCategory(selectedBusiness.category)}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {selectedBusiness.district}
                              </span>
                            </>
                          }
                          actions={
                            <>
                              <button
                                type="button"
                                onClick={() => setManagingProductsBusiness(selectedBusiness)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                              >
                                <Store className="w-3.5 h-3.5" />
                                <span>Urus Produk ({selectedBizProductCount})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(selectedBusiness)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>{selectedBusiness.isFeatured ? 'Buang Pilihan' : 'Jadikan Pilihan'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleApprovedBusiness(selectedBusiness)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                              >
                                {selectedBusiness.isApproved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{selectedBusiness.isApproved ? 'Sembunyikan' : 'Aktifkan'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingBusiness(false);
                                  setEditingBusiness(selectedBusiness);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sunting</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  confirmDelete({
                                    itemName: selectedBusiness.businessName,
                                    itemType: 'Senarai Perniagaan',
                                    onConfirm: () => handleDeleteBusiness(selectedBusiness.id, selectedBusiness.businessName)
                                  })
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Padam</span>
                              </button>
                            </>
                          }
                        />

                        <div className="p-4 sm:p-5 space-y-4">
                          <SidePreviewMetricsStrip
                            role="admin"
                            columns={3}
                            items={[
                              { label: 'Pemilik', value: selectedBusiness.ownerName },
                              { label: 'Kategori', value: formatBusinessCategory(selectedBusiness.category) },
                              { label: 'Daerah', value: selectedBusiness.district },
                              {
                                label: 'No. Pendaftaran SSM',
                                value: selectedBusiness.ssmNumber ? (
                                  <MiddleTruncate text={selectedBusiness.ssmNumber} startChars={8} endChars={5} />
                                ) : (
                                  'Tiada'
                                ),
                                mono: true
                              },
                              { label: 'Katalog Produk', value: `${selectedBizProductCount} item`, accent: true },
                              {
                                label: 'Status Paparan',
                                value: selectedBusiness.isApproved ? 'Aktif dalam Direktori' : 'Disembunyikan'
                              }
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <SidePreviewEmptyState
                    icon={<Store className="w-10 h-10 text-stone-400" />}
                    title="Tiada Perniagaan Dipilih"
                    description="Maklumat perniagaan dan senarai produk akan dipaparkan di sini."
                  />
                )
              }
            />
          )}
        </div>
      )}

      {/* TAB 3: CAPSULE SLOTS MANAGEMENT */}
      {adminTab === 'slots' && (
        <div key="slots" className="space-y-4 animate-dashboard-tab">
          <WorkspaceHeaderCard
            role="admin"
            icon={<Building2 className="w-5 h-5" />}
            title="Inventori & Pengurusan Kapsul Rangkaian Negeri"
            subtitle="Selaraskan unit kapsul niaga, kadar sewaan bulanan, dan status ketersediaan."
            rightActions={
              <button
                type="button"
                id="btn-admin-add-slot-toggle"
                onClick={() => setShowSlotForm(!showSlotForm)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
              >
                <Building2 className="w-4 h-4" />
                <span>{showSlotForm ? 'Tutup' : 'Tambah Kiosk'}</span>
              </button>
            }
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
              setMobileSlotOpen(false);
            }}
            sortOptions={adminSlotSortOptions}
            sortValue={adminSlotSortPreset}
            onSortChange={setAdminSlotSortPreset}
            filterContent={
              <>
                <div>
                  <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Status Unit
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Semua' },
                        { id: 'available', label: 'Tersedia' },
                        { id: 'occupied', label: 'Beroperasi' },
                        { id: 'reserved', label: 'Ditempah' },
                        { id: 'maintenance', label: 'Selenggara' }
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAdminSlotStatusFilter(opt.id);
                          setMobileSlotOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                          adminSlotStatusFilter === opt.id
                            ? adminTheme.activeMiniBtnClass
                            : adminTheme.secondaryButtonClass
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Daerah
                  </label>
                  <select
                    value={adminSlotDistrictFilter}
                    onChange={(e) => setAdminSlotDistrictFilter(e.target.value)}
                    aria-label="Tapis daerah slot kapsul"
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
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

          {/* New Slot Form */}
          {showSlotForm && (
            <div className={`rounded-2xl border shadow-2xs overflow-hidden animate-dashboard-tab transition-colors ${adminTheme.surfaceClass}`}>
              <div className={`border-b py-3.5 px-5 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                <h4 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-[#F5F2EC] tracking-tight flex items-center gap-2">
                  <Building2 className={`w-4.5 h-4.5 ${adminTheme.accentTextClass}`} />
                  <span>Borang Tambah Kiosk Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSlotForm(false)}
                  className="p-1.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-[#F5F2EC] cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Kod Kiosk <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan kod kiosk"
                      value={slotCode}
                      onChange={(e) => setSlotCode(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all font-mono ${adminTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Nama Kiosk <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kapsul Niaga Belia Bachok 02"
                      value={slotName}
                      onChange={(e) => setSlotName(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all font-medium ${adminTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Kadar Sewa Bulanan <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Masukkan kadar sewa bulanan"
                      value={slotMonthlyRate}
                      onChange={(e) => setSlotMonthlyRate(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all font-bold ${adminTheme.inputClass}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Lokasi Hab
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan lokasi hab"
                      value={slotHub}
                      onChange={(e) => setSlotHub(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all ${adminTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Daerah
                    </label>
                    <select
                      value={slotDistrict}
                      onChange={(e) => setSlotDistrict(e.target.value as KelantanDistrict)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border font-medium focus:outline-none transition-all cursor-pointer ${adminTheme.inputClass}`}
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Status Kiosk
                    </label>
                    <select
                      value={slotStatus}
                      onChange={(e) => setSlotStatus(e.target.value as SlotStatus)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border font-medium focus:outline-none transition-all cursor-pointer ${adminTheme.inputClass}`}
                    >
                      <option value="available">Tersedia (Kosong)</option>
                      <option value="occupied">Sedang Beroperasi</option>
                      <option value="reserved">Dalam Tempahan</option>
                      <option value="maintenance">Penyelenggaraan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                    Kemudahan Disediakan
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan senarai kemudahan"
                    value={slotAmenities}
                    onChange={(e) => setSlotAmenities(e.target.value)}
                    className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all ${adminTheme.inputClass}`}
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

                <div className={`flex justify-end items-center gap-3 pt-5 border-t ${adminTheme.dividerClass}`}>
                  <button
                    type="button"
                    onClick={() => setShowSlotForm(false)}
                    className={`py-2.5 px-5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold border transition-all cursor-pointer ${adminTheme.secondaryButtonClass}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2.5 px-6 rounded-xl text-sm sm:text-[0.9375rem] font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${adminTheme.primaryButtonClass}`}
                  >
                    <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Slots Google Workspace Split-Pane View */}
          {filteredAdminSlots.length === 0 ? (
            <div className={`rounded-2xl border backdrop-blur-xs py-12 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
              <Building2 className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] kbelia-trim">
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
                className={`mt-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Set Semula
              </button>
            </div>
          ) : (
            <GoogleWorkspaceSplitPane
              role="admin"
              mobileOpen={mobileSlotOpen && Boolean(selectedSlot)}
              onMobileClose={() => setMobileSlotOpen(false)}
              mobileTitle={selectedSlot ? `${selectedSlot.code} · ${selectedSlot.name}` : undefined}
              leftHeader={
                <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  <span>{filteredAdminSlots.length} unit kapsul</span>
                  {(adminSlotSearch || adminSlotStatusFilter !== 'all' || adminSlotDistrictFilter !== 'Semua' || adminSlotSortPreset !== DEFAULT_SORT_VALUE) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSlotSearch('');
                        setAdminSlotStatusFilter('all');
                        setAdminSlotDistrictFilter('Semua');
                        setAdminSlotSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                    >
                      Set Semula
                    </button>
                  )}
                </div>
              }
              leftContent={slotsPagination.paginatedItems.map((s) => {
                const isSelected = selectedSlot?.id === s.id;
                const slotStatusLabel =
                  s.status === 'available'
                    ? 'Tersedia'
                    : s.status === 'occupied'
                    ? 'Beroperasi'
                    : s.status === 'reserved'
                    ? 'Ditempah'
                    : 'Selenggara';
                const slotStatusColor =
                  s.status === 'available'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : s.status === 'occupied'
                    ? adminTheme.accentTextClass
                    : 'text-amber-700 dark:text-amber-300';

                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedSlotId(s.id);
                      setMobileSlotOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSlotId(s.id);
                        setMobileSlotOpen(true);
                      }
                    }}
                    className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <PortalImage
                        src={resolveSlotImage(s)}
                        alt={s.name}
                        fallbackType="kiosk"
                        fallbackLabel={s.code}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug truncate kbelia-trim">
                          {s.code} · {s.name}
                        </p>
                        <span className={`text-[11px] font-bold shrink-0 ${slotStatusColor}`}>
                          {slotStatusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                        {s.hubLocation} · {s.district} · RM{s.monthlyRate}/bln
                      </p>
                    </div>
                  </div>
                );
              })}
              leftFooter={
                <PaginationBar
                  currentPage={slotsPagination.currentPage}
                  totalItems={slotsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={slotsPagination.setCurrentPage}
                  itemLabel="slot kapsul"
                  accent="amber"
                />
              }
              rightContent={
                selectedSlot ? (
                  <div>
                    <SidePreviewHeader
                      role="admin"
                      media={
                        <div className={`w-14 h-14 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <PortalImage
                            src={resolveSlotImage(selectedSlot)}
                            alt={selectedSlot.name}
                            fallbackType="kiosk"
                            fallbackLabel={selectedSlot.code}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      }
                      title={`${selectedSlot.code} · ${selectedSlot.name}`}
                      status={
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            selectedSlot.status === 'available'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : selectedSlot.status === 'occupied'
                              ? adminTheme.activeNavClass
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {selectedSlot.status === 'available'
                            ? 'Tersedia'
                            : selectedSlot.status === 'occupied'
                            ? 'Beroperasi'
                            : selectedSlot.status === 'reserved'
                            ? 'Ditempah'
                            : 'Selenggara'}
                        </span>
                      }
                      subtitle={selectedSlot.hubLocation}
                      meta={
                        <>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedSlot.district}
                          </span>
                          <span>·</span>
                          <span>{selectedSlot.size}</span>
                        </>
                      }
                      actions={
                        <>
                          <button
                            type="button"
                            disabled={selectedSlot.status === 'available'}
                            onClick={() => handleDirectSlotStatusChange(selectedSlot, 'available')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                          >
                            Set Tersedia
                          </button>
                          <button
                            type="button"
                            disabled={selectedSlot.status === 'occupied'}
                            onClick={() => handleDirectSlotStatusChange(selectedSlot, 'occupied')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                          >
                            Set Beroperasi
                          </button>
                          <button
                            type="button"
                            disabled={selectedSlot.status === 'reserved'}
                            onClick={() => handleDirectSlotStatusChange(selectedSlot, 'reserved')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                          >
                            Set Ditempah
                          </button>
                          <button
                            type="button"
                            disabled={selectedSlot.status === 'maintenance'}
                            onClick={() => handleDirectSlotStatusChange(selectedSlot, 'maintenance')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                          >
                            Set Selenggara
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlot(selectedSlot)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Slot Kapsul</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: `${selectedSlot.code} · ${selectedSlot.name}`,
                                itemType: 'Slot Kiosk',
                                onConfirm: () => handleDeleteSlot(selectedSlot.id)
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam Slot</span>
                          </button>
                        </>
                      }
                    />

                    <div className="p-4 sm:p-5 space-y-4">
                      <SidePreviewMetricsStrip
                        role="admin"
                        columns={3}
                        items={[
                          { label: 'Kadar Sewa Bulanan', value: `RM${selectedSlot.monthlyRate}/bulan`, accent: true, mono: true },
                          { label: 'Saiz Unit', value: selectedSlot.size },
                          { label: 'Penyewa Semasa', value: selectedSlot.currentTenantBusinessName || 'Tiada Penyewa' }
                        ]}
                      />

                      {selectedSlot.amenities && selectedSlot.amenities.length > 0 && (
                        <div className={`p-4 rounded-xl border space-y-2 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            Kemudahan Disediakan
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSlot.amenities.map((item, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${adminTheme.surfaceClass} ${adminTheme.dividerClass} text-stone-700 dark:text-stone-300`}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <SidePreviewEmptyState
                    icon={<Building2 className="w-10 h-10 text-stone-400" />}
                    title="Tiada Unit Kiosk Dipilih"
                    description="Status dan maklumat unit kiosk akan dipaparkan di sini."
                  />
                )
              }
            />
          )}
        </div>
      )}

      {/* TAB 4: PROGRAMS MANAGEMENT */}
      {adminTab === 'programs' && (
        <div key="programs" className="space-y-4 animate-dashboard-tab">
          <WorkspaceHeaderCard
            role="admin"
            icon={<Award className="w-5 h-5" />}
            title="Pengurusan Inisiatif Geran & Program Belia"
            subtitle="Terbitkan program geran, bengkel latihan, ekspo, dan sesi pitching usahawan."
            rightActions={
              <button
                type="button"
                id="btn-admin-add-prog-toggle"
                onClick={() => setShowProgramForm(!showProgramForm)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
              >
                <Award className="w-4 h-4" />
                <span>{showProgramForm ? 'Tutup' : 'Tambah Program'}</span>
              </button>
            }
            searchValue={progSearch}
            onSearchChange={setProgSearch}
            searchPlaceholder="Cari tajuk atau kategori program..."
            filterCount={
              (progCategoryFilter !== 'Semua' ? 1 : 0) +
              (progSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
            }
            onResetFilters={() => {
              setProgCategoryFilter('Semua');
              setProgSortPreset(DEFAULT_SORT_VALUE);
              setMobileProgramOpen(false);
            }}
            sortOptions={progSortOptions}
            sortValue={progSortPreset}
            onSortChange={setProgSortPreset}
            filterContent={
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Kategori Program
                </label>
                <select
                  value={progCategoryFilter}
                  onChange={(e) => {
                    setProgCategoryFilter(e.target.value as 'Semua' | YouthProgram['category']);
                    setMobileProgramOpen(false);
                  }}
                  aria-label="Tapis kategori program"
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
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

          {/* New Program Form */}
          {showProgramForm && (
            <div className={`rounded-2xl border shadow-2xs overflow-hidden animate-dashboard-tab transition-colors ${adminTheme.surfaceClass}`}>
              <div className={`border-b py-3.5 px-5 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                <h4 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-[#F5F2EC] tracking-tight flex items-center gap-2">
                  <Award className={`w-4.5 h-4.5 ${adminTheme.accentTextClass}`} />
                  <span>Borang Terbit Program Keusahawanan Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="p-1.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-[#F5F2EC] cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProgram} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Tajuk Program <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan tajuk program"
                      value={progTitle}
                      onChange={(e) => setProgTitle(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all font-bold ${adminTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Kategori Program <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <select
                      value={progCategory}
                      onChange={(e) => setProgCategory(e.target.value as YouthProgram['category'])}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border font-medium focus:outline-none transition-all cursor-pointer ${adminTheme.inputClass}`}
                    >
                      <option value="Geran & Dana">Geran &amp; Dana</option>
                      <option value="Bengkel & Latihan">Bengkel &amp; Latihan</option>
                      <option value="Pameran & Ekspo">Pameran &amp; Ekspo</option>
                      <option value="Pitching & Inkubasi">Pitching &amp; Inkubasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Tarikh Pelaksanaan
                    </label>
                    <ModernDatePicker
                      value={progDate}
                      onChange={setProgDate}
                      valueFormat="program-date"
                      allowRange
                      allowOngoingPreset
                      accentColor="amber"
                      placeholder="Pilih tarikh atau tempoh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan lokasi"
                      value={progLocation}
                      onChange={(e) => setProgLocation(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all ${adminTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                      Nilai Bantuan
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nilai bantuan"
                      value={progAmount}
                      onChange={(e) => setProgAmount(e.target.value)}
                      className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all font-bold ${adminTheme.inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-[0.9375rem] font-medium text-stone-900 dark:text-[#F5F2EC] mb-2">
                    Keterangan Program
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan keterangan program"
                    value={progDesc}
                    onChange={(e) => setProgDesc(e.target.value)}
                    className={`w-full px-4.5 py-3 rounded-lg text-sm sm:text-[0.9375rem] border focus:outline-none transition-all ${adminTheme.inputClass}`}
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

                <div className={`flex justify-end items-center gap-3 pt-5 border-t ${adminTheme.dividerClass}`}>
                  <button
                    type="button"
                    onClick={() => setShowProgramForm(false)}
                    className={`py-2.5 px-5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold border transition-all cursor-pointer ${adminTheme.secondaryButtonClass}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2.5 px-6 rounded-xl text-sm sm:text-[0.9375rem] font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${adminTheme.primaryButtonClass}`}
                  >
                    <span>{loading ? 'Menerbitkan...' : 'Terbitkan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {filteredAdminPrograms.length === 0 ? (
            <div className={`rounded-2xl border backdrop-blur-xs py-12 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
              <Award className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] kbelia-trim">
                Tiada program atau geran sepadan dengan carian atau penapis.
              </p>
              <button
                type="button"
                onClick={() => {
                  setProgSearch('');
                  setProgCategoryFilter('Semua');
                  setProgSortPreset(DEFAULT_SORT_VALUE);
                }}
                className={`mt-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Set Semula
              </button>
            </div>
          ) : (
            <GoogleWorkspaceSplitPane
              role="admin"
              mobileOpen={mobileProgramOpen && Boolean(selectedProgram)}
              onMobileClose={() => setMobileProgramOpen(false)}
              mobileTitle={selectedProgram?.title}
              leftHeader={
                <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  <span>{filteredAdminPrograms.length} program disenaraikan</span>
                  {(progSearch || progCategoryFilter !== 'Semua' || progSortPreset !== DEFAULT_SORT_VALUE) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProgSearch('');
                        setProgCategoryFilter('Semua');
                        setProgSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                    >
                      Set Semula
                    </button>
                  )}
                </div>
              }
              leftContent={programsPagination.paginatedItems.map((p) => {
                const isSelected = selectedProgram?.id === p.id;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedProgramId(p.id);
                      setMobileProgramOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedProgramId(p.id);
                        setMobileProgramOpen(true);
                      }
                    }}
                    className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <PortalImage
                        src={resolveProgramImage(p)}
                        alt={p.title}
                        fallbackType="program"
                        fallbackLabel={p.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug line-clamp-2 kbelia-trim">
                          {p.title}
                        </p>
                        <span className={`text-[11px] font-bold shrink-0 ${adminTheme.accentTextClass}`}>
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                        {p.grantAmount || '-'} · {p.date || '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
              leftFooter={
                <PaginationBar
                  currentPage={programsPagination.currentPage}
                  totalItems={programsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={programsPagination.setCurrentPage}
                  itemLabel="program"
                  accent="amber"
                />
              }
              rightContent={
                selectedProgram ? (
                  <div>
                    <SidePreviewHeader
                      role="admin"
                      media={
                        <div className={`w-14 h-14 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <PortalImage
                            src={resolveProgramImage(selectedProgram)}
                            alt={selectedProgram.title}
                            fallbackType="program"
                            fallbackLabel={selectedProgram.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      }
                      title={selectedProgram.title}
                      status={
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${adminTheme.activeNavClass}`}>
                          {selectedProgram.category}
                        </span>
                      }
                      subtitle={selectedProgram.organizer || 'Unit Belia & Keusahawanan Kelantan'}
                      meta={
                        <>
                          <span>{selectedProgram.date || '-'}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedProgram.location || '-'}
                          </span>
                        </>
                      }
                      actions={
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingProgram(selectedProgram)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sunting</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: selectedProgram.title,
                                itemType: 'Program & Geran',
                                onConfirm: () => handleDeleteProg(selectedProgram.id)
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam</span>
                          </button>
                        </>
                      }
                    />

                    <div className="p-4 sm:p-5 space-y-4">
                      <SidePreviewMetricsStrip
                        role="admin"
                        columns={3}
                        items={[
                          { label: 'Kategori', value: selectedProgram.category },
                          { label: 'Nilai Bantuan', value: selectedProgram.grantAmount || '-', accent: true, mono: true },
                          { label: 'Tarikh Pelaksanaan', value: selectedProgram.date || '-' }
                        ]}
                      />

                      {selectedProgram.description && (
                        <div className={`p-4 rounded-xl border space-y-1.5 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            Keterangan Program
                          </span>
                          <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                            {selectedProgram.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <SidePreviewEmptyState
                    icon={<Award className="w-10 h-10 text-stone-400" />}
                    title="Tiada Program Dipilih"
                    description="Butiran program dan geran akan dipaparkan di sini."
                  />
                )
              }
            />
          )}
        </div>
      )}

      {/* TAB: MENTOR & MENTEE MONITORING HUB */}
      {adminTab === 'mentors' && (
        <div key="mentors" className="space-y-5 animate-dashboard-tab">
          <div className={`p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${adminTheme.surfaceClass}`}>
            <div className="space-y-1">
              <div className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-bold uppercase tracking-wider ${adminTheme.accentTextClass}`}>
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Hab Bimbingan Mentor KBelia</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-[#F5F2EC] tracking-tight kbelia-trim">
                Pemantauan Mentor &amp; Usahawan Negeri Kelantan
              </h3>
            </div>
          </div>

          {/* Mentor Management Split-Pane */}
          <div className="space-y-4">
            <WorkspaceHeaderCard
              role="admin"
              icon={<GraduationCap className="w-5 h-5" />}
              title="Senarai Mentor"
              subtitle="Urus profil mentor bertauliah dan bilangan usahawan di bawah seliaan."
              rightActions={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMentorForEdit(null);
                    setIsCreatingMentor(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              }
              searchValue={mentorListSearch}
              onSearchChange={setMentorListSearch}
              searchPlaceholder="Cari mentor, agensi atau jawatan..."
              filterCount={mentorListSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0}
              onResetFilters={() => setMentorListSortPreset(DEFAULT_SORT_VALUE)}
              sortOptions={mentorListSortOptions}
              sortValue={mentorListSortPreset}
              onSortChange={setMentorListSortPreset}
            />

            {filteredAdminMentors.length === 0 ? (
              <div className={`rounded-2xl border backdrop-blur-xs py-10 px-6 text-center text-sm text-stone-600 dark:text-stone-300 ${adminTheme.surfaceClass}`}>
                Tiada profil mentor sepadan dengan carian anda.
              </div>
            ) : (
              <GoogleWorkspaceSplitPane
                role="admin"
                mobileOpen={mobileMentorOpen && Boolean(selectedMentorItem)}
                onMobileClose={() => setMobileMentorOpen(false)}
                mobileTitle={selectedMentorItem?.name}
                leftHeader={
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span>{filteredAdminMentors.length} mentor berdaftar</span>
                    {(mentorListSearch || mentorListSortPreset !== DEFAULT_SORT_VALUE) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMentorListSearch('');
                          setMentorListSortPreset(DEFAULT_SORT_VALUE);
                        }}
                        className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                      >
                        Set Semula
                      </button>
                    )}
                  </div>
                }
                leftContent={adminMentorsPagination.paginatedItems.map((m) => {
                  const menteeCount = mentorshipRegistrations.filter(r => r.mentorId === m.id).length;
                  const isSelected = selectedMentorItem?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedMentorId(m.id);
                        setMobileMentorOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedMentorId(m.id);
                          setMobileMentorOpen(true);
                        }
                      }}
                      className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                      }`}
                    >
                      <img
                        src={m.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg'}
                        alt={m.name}
                        className={`w-12 h-12 rounded-xl object-cover border shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug truncate kbelia-trim">
                            {m.name}
                          </p>
                          <span className={`text-[11px] font-bold shrink-0 tabular-nums ${adminTheme.accentTextClass}`}>
                            {menteeCount} Usahawan
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                          {m.agency.split('(')[0].trim()} · {m.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
                leftFooter={
                  <PaginationBar
                    currentPage={adminMentorsPagination.currentPage}
                    totalItems={adminMentorsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={adminMentorsPagination.setCurrentPage}
                    itemLabel="mentor"
                    accent="amber"
                  />
                }
                rightContent={
                  selectedMentorItem ? (
                    (() => {
                      const selectedMenteeCount = mentorshipRegistrations.filter(
                        r => r.mentorId === selectedMentorItem.id
                      ).length;
                      return (
                        <div>
                          <SidePreviewHeader
                            role="admin"
                            media={
                              <img
                                src={selectedMentorItem.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg'}
                                alt={selectedMentorItem.name}
                                className={`w-14 h-14 rounded-xl object-cover border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}
                              />
                            }
                            title={selectedMentorItem.name}
                            status={
                              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold tabular-nums ${adminTheme.activeNavClass}`}>
                                {selectedMenteeCount} Usahawan
                              </span>
                            }
                            subtitle={selectedMentorItem.title}
                            meta={<span>{selectedMentorItem.agency}</span>}
                            actions={
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCreatingMentor(false);
                                    setSelectedMentorForEdit(selectedMentorItem);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Sunting</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmDelete({
                                      itemName: selectedMentorItem.name,
                                      itemType: 'Profil Mentor',
                                      onConfirm: () => handleDeleteMentor(selectedMentorItem)
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Padam</span>
                                </button>
                              </>
                            }
                          />

                          <div className="p-4 sm:p-5 space-y-4">
                            <SidePreviewMetricsStrip
                              role="admin"
                              columns={3}
                              items={[
                                { label: 'Agensi', value: selectedMentorItem.agency.split('(')[0].trim() },
                                { label: 'Jawatan', value: selectedMentorItem.title },
                                { label: 'Usahawan Diselia', value: `${selectedMenteeCount} Usahawan`, accent: true }
                              ]}
                            />

                            <div className={`p-4 rounded-xl border space-y-1 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                                Alamat E-mel Rasmi
                              </span>
                              <p className="text-sm font-mono text-stone-800 dark:text-stone-200">
                                {selectedMentorItem.email || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <SidePreviewEmptyState
                      icon={<GraduationCap className="w-10 h-10 text-stone-400" />}
                      title="Tiada Mentor Dipilih"
                      description="Maklumat profil mentor akan dipaparkan di sini."
                    />
                  )
                }
              />
            )}
          </div>

          {/* Mentee Sessions Split-Pane View */}
          <div className="space-y-4">
            <WorkspaceHeaderCard
              role="admin"
              icon={<UserCheck className="w-5 h-5" />}
              title="Senarai Usahawan Berdaftar Mengikut Mentor"
              subtitle="Pantau pendaftaran sesi bimbingan, mod pertemuan, dan status pengesahan."
              rightActions={
                <button
                  type="button"
                  onClick={() => {
                    setEditingMentorship(null);
                    setIsCreatingMentorship(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sesi</span>
                </button>
              }
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
                setMobileMentorshipOpen(false);
              }}
              sortOptions={mentorshipSortOptions}
              sortValue={mentorshipSortPreset}
              onSortChange={setMentorshipSortPreset}
              filterContent={
                <div>
                  <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Status Sesi
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Semua' },
                        { id: 'pending', label: 'Menunggu' },
                        { id: 'confirmed', label: 'Disahkan' },
                        { id: 'completed', label: 'Selesai' },
                        { id: 'cancelled', label: 'Dibatalkan' }
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMentorshipStatusFilter(opt.id);
                          setMobileMentorshipOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                          mentorshipStatusFilter === opt.id
                            ? adminTheme.activeMiniBtnClass
                            : adminTheme.secondaryButtonClass
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
              <div className={`rounded-2xl border backdrop-blur-xs py-12 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
                <UserCheck className="w-9 h-9 text-stone-400 dark:text-stone-500 mx-auto" />
                <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] kbelia-trim">
                  Tiada pendaftaran bimbingan ditemui.
                </p>
                {(mentorshipSearch || mentorshipStatusFilter !== 'all' || mentorshipSortPreset !== DEFAULT_SORT_VALUE) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMentorshipSearch('');
                      setMentorshipStatusFilter('all');
                      setMentorshipSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className={`mt-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${adminTheme.secondaryButtonClass}`}
                  >
                    Set Semula
                  </button>
                )}
              </div>
            ) : (
              <GoogleWorkspaceSplitPane
                role="admin"
                mobileOpen={mobileMentorshipOpen && Boolean(selectedMentorship)}
                onMobileClose={() => setMobileMentorshipOpen(false)}
                mobileTitle={selectedMentorship?.entrepreneurName}
                leftHeader={
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span>{sortedMentorships.length} pendaftaran bimbingan</span>
                    {(mentorshipSearch || mentorshipStatusFilter !== 'all' || mentorshipSortPreset !== DEFAULT_SORT_VALUE) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMentorshipSearch('');
                          setMentorshipStatusFilter('all');
                          setMentorshipSortPreset(DEFAULT_SORT_VALUE);
                        }}
                        className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                      >
                        Set Semula
                      </button>
                    )}
                  </div>
                }
                leftContent={adminMentorshipsPagination.paginatedItems.map((m) => {
                  const isSelected = selectedMentorship?.id === m.id;
                  const statusLabel =
                    m.status === 'completed'
                      ? 'Selesai'
                      : m.status === 'confirmed'
                      ? 'Disahkan'
                      : m.status === 'cancelled'
                      ? 'Dibatalkan'
                      : 'Menunggu';
                  const statusColor =
                    m.status === 'completed'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : m.status === 'confirmed'
                      ? adminTheme.accentTextClass
                      : m.status === 'cancelled'
                      ? 'text-stone-500 dark:text-stone-400'
                      : 'text-amber-700 dark:text-amber-300';

                  return (
                    <div
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedMentorshipId(m.id);
                        setMobileMentorshipOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedMentorshipId(m.id);
                          setMobileMentorshipOpen(true);
                        }
                      }}
                      className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center ${adminTheme.activeMiniBtnClass}`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC] leading-snug truncate kbelia-trim">
                            {m.entrepreneurName}
                          </p>
                          <span className={`text-[11px] font-bold shrink-0 ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                          {m.businessName} · {m.mentorName} · {m.preferredDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
                leftFooter={
                  <PaginationBar
                    currentPage={adminMentorshipsPagination.currentPage}
                    totalItems={adminMentorshipsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={adminMentorshipsPagination.setCurrentPage}
                    itemLabel="pendaftaran bimbingan"
                    accent="amber"
                  />
                }
                rightContent={
                  selectedMentorship ? (
                    <div>
                      <SidePreviewHeader
                        role="admin"
                        media={
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${adminTheme.activeMiniBtnClass}`}>
                            <UserCheck className="w-5 h-5" />
                          </div>
                        }
                        title={selectedMentorship.entrepreneurName}
                        status={
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              selectedMentorship.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : selectedMentorship.status === 'confirmed'
                                ? adminTheme.activeNavClass
                                : selectedMentorship.status === 'cancelled'
                                ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {selectedMentorship.status === 'completed'
                              ? 'Selesai'
                              : selectedMentorship.status === 'confirmed'
                              ? 'Disahkan'
                              : selectedMentorship.status === 'cancelled'
                              ? 'Dibatalkan'
                              : 'Menunggu'}
                          </span>
                        }
                        subtitle={`${selectedMentorship.businessName} · ${selectedMentorship.district}`}
                        meta={
                          <>
                            <span>{selectedMentorship.preferredDate}</span>
                            <span>·</span>
                            <span>{normalizeMentorshipMode(selectedMentorship.mode)}</span>
                          </>
                        }
                        actions={
                          <>
                            <button
                              type="button"
                              disabled={selectedMentorship.status === 'pending'}
                              onClick={() => handleDirectMentorshipStatus(selectedMentorship, 'pending')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                            >
                              Set Menunggu
                            </button>
                            <button
                              type="button"
                              disabled={selectedMentorship.status === 'confirmed'}
                              onClick={() => handleDirectMentorshipStatus(selectedMentorship, 'confirmed')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 ${adminTheme.primaryButtonClass}`}
                            >
                              Set Disahkan
                            </button>
                            <button
                              type="button"
                              disabled={selectedMentorship.status === 'completed'}
                              onClick={() => handleDirectMentorshipStatus(selectedMentorship, 'completed')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                            >
                              Set Selesai
                            </button>
                            <button
                              type="button"
                              disabled={selectedMentorship.status === 'cancelled'}
                              onClick={() => handleDirectMentorshipStatus(selectedMentorship, 'cancelled')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-40 ${adminTheme.secondaryButtonClass}`}
                            >
                              Set Dibatalkan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingMentorship(false);
                                setEditingMentorship(selectedMentorship);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Sesi Bimbingan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                confirmDelete({
                                  itemName: `${selectedMentorship.entrepreneurName} (${selectedMentorship.topic})`,
                                  itemType: 'Sesi Bimbingan Mentor',
                                  onConfirm: () => handleDeleteMentorship(selectedMentorship)
                                })
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Padam Sesi</span>
                            </button>
                          </>
                        }
                      />

                      <div className="p-4 sm:p-5 space-y-4">
                        <SidePreviewMetricsStrip
                          role="admin"
                          columns={3}
                          items={[
                            { label: 'Mentor', value: selectedMentorship.mentorName },
                            { label: 'Tarikh Pilihan', value: selectedMentorship.preferredDate, mono: true },
                            { label: 'Mod Sesi', value: normalizeMentorshipMode(selectedMentorship.mode), accent: true }
                          ]}
                        />

                        <div className={`p-4 rounded-xl border space-y-1.5 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            Topik Bimbingan
                          </span>
                          <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                            {selectedMentorship.topic}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SidePreviewEmptyState
                      icon={<UserCheck className="w-10 h-10 text-stone-400" />}
                      title="Tiada Sesi Bimbingan Dipilih"
                      description="Butiran pendaftaran sesi bimbingan akan dipaparkan di sini."
                    />
                  )
                }
              />
            )}
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
          <div className={`p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${adminTheme.surfaceClass}`}>
            <div className="space-y-1">
              <div className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-bold uppercase tracking-wider ${adminTheme.accentTextClass}`}>
                <Shield className="w-3.5 h-3.5" />
                <span>Pengurusan Sistem Pentadbir</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-[#F5F2EC] tracking-tight">
                Tetapan Sistem &amp; Profil Pentadbir
              </h3>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Super Admin Berkuasa Penuh
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {adminSettingsSuccess && (
            <div className="p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs bg-emerald-50 dark:bg-emerald-950/40 text-stone-900 dark:text-[#F5F2EC] border border-emerald-200 dark:border-emerald-800/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{adminSettingsSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminSettingsSuccess(null)}
                className="text-[0.8125rem] font-bold opacity-60 hover:opacity-100 px-2 py-0.5 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-4">
            {/* Section 1: Profil Pentadbir */}
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${adminTheme.surfaceClass}`}>
              <div className={`flex items-center gap-2.5 pb-3 border-b ${adminTheme.dividerClass}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${adminTheme.activeMiniBtnClass}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-[#F5F2EC] tracking-tight">
                  Profil Pentadbir &amp; Saluran Sokongan Rasmi
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Pentadbir */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Nama Pegawai Pentadbir <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminOfficerName}
                      onChange={(e) => setAdminOfficerName(e.target.value)}
                      placeholder="Masukkan nama penuh"
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all ${adminTheme.inputClass}`}
                    />
                  </div>
                </div>

                {/* Emel Pentadbir */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Alamat Emel
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'nabilwahab03020302@gmail.com'}
                      placeholder="Masukkan alamat emel"
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-[0.9375rem] font-medium text-stone-500 dark:text-stone-400 cursor-not-allowed ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}
                    />
                  </div>
                </div>

                {/* Talian Sokongan WhatsApp Urusetia */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Nombor Telefon Pentadbiran <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={adminHelpdeskPhone}
                      onChange={(e) => setAdminHelpdeskPhone(e.target.value)}
                      placeholder="Masukkan nombor telefon pentadbiran"
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all font-mono ${adminTheme.inputClass}`}
                    />
                  </div>
                </div>

                {/* Tahap Akses */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Tahap Akses Sistem
                  </label>
                  <div className={`w-full px-3 py-2.5 border rounded-xl text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <Shield className={`w-4 h-4 ${adminTheme.accentTextClass}`} />
                    <span>Super Admin Pentadbiran (Level 1)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tetapan & Parameter Portal */}
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${adminTheme.surfaceClass}`}>
              <div className={`flex items-center gap-2.5 pb-3 border-b ${adminTheme.dividerClass}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${adminTheme.activeMiniBtnClass}`}>
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-[#F5F2EC] tracking-tight">
                  Tetapan &amp; Parameter Operasi Portal KBelia
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kadar Subsidi Sewaan */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Kadar Subsidi Sewaan
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={portalSubsidyRate}
                    onChange={(e) => setPortalSubsidyRate(e.target.value)}
                    placeholder="Masukkan peratusan subsidi"
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all ${adminTheme.inputClass}`}
                  />
                </div>

                {/* Had Tempoh Sewaan */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Tempoh Maksimum Sewaan
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={maxLeaseDurationMonths}
                    onChange={(e) => setMaxLeaseDurationMonths(e.target.value)}
                    placeholder="Masukkan tempoh dalam bulan"
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all ${adminTheme.inputClass}`}
                  />
                </div>

                {/* Status Mod Sistem */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Status Operasi Portal
                  </label>
                  <select
                    value={systemStatus}
                    onChange={(e) => setSystemStatus(e.target.value as 'operational' | 'maintenance')}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all ${adminTheme.inputClass}`}
                  >
                    <option value="operational">Portal Aktif &amp; Permohonan Dibuka</option>
                    <option value="maintenance">Mod Penyelenggaraan Sistem (Sementara)</option>
                  </select>
                </div>

                {/* Pengumuman Khas Banner */}
                <div>
                  <label className="block text-sm font-bold text-stone-900 dark:text-[#F5F2EC] mb-1.5">
                    Teks Pengumuman Portal
                  </label>
                  <input
                    type="text"
                    value={portalAnnouncement}
                    onChange={(e) => setPortalAnnouncement(e.target.value)}
                    placeholder="Masukkan teks pengumuman portal"
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-hidden transition-all ${adminTheme.inputClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Ringkasan Pengguna & Kawalan Pangkalan Data */}
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${adminTheme.surfaceClass}`}>
              <div className={`flex items-center gap-2.5 pb-3 border-b ${adminTheme.dividerClass}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${adminTheme.activeMiniBtnClass}`}>
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-[#F5F2EC] tracking-tight">
                  Kawalan Pangkalan Data &amp; Penyelenggaraan Sesi
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs ${adminTheme.primaryButtonClass}`}
                >
                  <Database className="w-4 h-4" />
                  <span>{loading ? 'Sedang Memproses...' : 'Muat Semula'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLocalSessionCache}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Kosongkan Cache</span>
                </button>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${adminTheme.surfaceClass}`}>
              <div className="space-y-1">
                <div className="text-sm font-bold text-stone-900 dark:text-[#F5F2EC]">Simpan Tetapan Pentadbir</div>
                <p className="text-[0.875rem] text-stone-600 dark:text-stone-300">
                  Semua perubahan akan terus aktif pada portal usahawan.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingAdminSettings}
                className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 disabled:opacity-50 cursor-pointer ${adminTheme.primaryButtonClass}`}
              >
                <Save className="w-4 h-4" />
                <span>{savingAdminSettings ? 'Menyimpan...' : 'Simpan'}</span>
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
