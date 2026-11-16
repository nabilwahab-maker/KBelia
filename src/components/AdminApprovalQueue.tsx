import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  FileText, 
  Store, 
  Coins, 
  MessageSquare,
  ShieldCheck,
  Wrench,
  Database,
  TrendingUp,
  MapPin,
  Building2,
  Printer,
  Check,
  LayoutDashboard,
  Award,
  Edit3,
  Trash2,
  Plus,
  ArrowUpDown
} from 'lucide-react';
import { CapsuleBooking, GrantApplication, CapsuleSlot, KelantanDistrict, YouthProgram, MaintenanceTicket, BookingStatus } from '../types';
import { maskMyKad } from '../utils/securityUtils';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import { OfficialApprovalReportModal } from './OfficialApprovalReportModal';
import {
  saveCapsuleSlot,
  saveProgram,
  deleteCapsuleSlot,
  deleteCapsuleBooking,
  deleteGrantApplication,
  updateBookingStatus,
  updateGrantApplicationStatus,
  updateMaintenanceTicketStatus,
  deleteMaintenanceTicket
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { ImageDropzone } from './ImageDropzone';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage, resolveSlotImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import {
  DEFAULT_SORT_VALUE,
  ToolbarSortOption,
  buildStandardSortOptions,
  compareText,
  parseNumericAmount,
  sortRecords
} from '../utils/sortUtils';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { EditSlotModal } from './EditSlotModal';
import { EditBookingModal, EditGrantModal, EditMaintenanceTicketModal } from './AdminEditModals';

interface AdminApprovalQueueProps {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  slots: CapsuleSlot[];
  maintenanceTickets?: MaintenanceTicket[];
  onApproveBooking: (bookingId: string, notes?: string) => Promise<void>;
  onRejectBooking: (bookingId: string, notes?: string) => Promise<void>;
  onApproveGrant: (grantId: string, notes?: string) => Promise<void>;
  onRejectGrant: (grantId: string, notes?: string) => Promise<void>;
  onUpdateSlotStatus?: (slotId: string, newStatus: 'available' | 'occupied' | 'maintenance') => Promise<void>;
  onUpdateTicketStatus?: (ticketId: string, status: MaintenanceTicket['status'], adminNotes?: string) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminApprovalQueue: React.FC<AdminApprovalQueueProps> = ({
  bookings,
  grantApplications,
  slots,
  maintenanceTickets = [],
  onApproveBooking,
  onRejectBooking,
  onApproveGrant,
  onRejectGrant,
  onUpdateSlotStatus,
  onUpdateTicketStatus,
  onRefresh
}) => {
  const { confirmDelete } = useConfirmDelete();
  const [activeTab, setActiveTab] = useState<'overview' | 'kiosks' | 'grants' | 'facility' | 'audit'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Admin Edit / Create Modals
  const [editingBooking, setEditingBooking] = useState<CapsuleBooking | null>(null);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [editingGrant, setEditingGrant] = useState<GrantApplication | null>(null);
  const [showCreateGrant, setShowCreateGrant] = useState(false);
  const [editingSlot, setEditingSlot] = useState<CapsuleSlot | null>(null);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  // Reject Confirmation Modal State: "Adakah anda ingin tolak? Ya / Tidak"
  const [rejectModalData, setRejectModalData] = useState<{
    type: 'kiosk' | 'grant';
    id: string;
    name: string;
    business: string;
    slotOrProgram?: string;
  } | null>(null);

  const [expandedKioskIds, setExpandedKioskIds] = useState<string[]>([]);
  const [expandedGrantIds, setExpandedGrantIds] = useState<string[]>([]);
  const [expandedTicketIds, setExpandedTicketIds] = useState<string[]>([]);

  const toggleExpandedId = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => {
    setter((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const [bookingSort, setBookingSort] = useState<{
    key: 'businessName' | 'hubLocation' | 'category' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [bookingSortPreset, setBookingSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [grantSort, setGrantSort] = useState<{
    key: 'businessName' | 'programTitle' | 'grantAmount' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [grantSortPreset, setGrantSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [slotSearch, setSlotSearch] = useState('');
  const [slotStatusFilter, setSlotStatusFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
  const [slotSort, setSlotSort] = useState<{
    key: 'name' | 'district' | 'monthlyRate' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'name', dir: 'asc' });
  const [slotSortPreset, setSlotSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'received' | 'in_progress' | 'resolved'>('all');
  const [ticketSort, setTicketSort] = useState<{
    key: 'slotCode' | 'issueCategory' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [ticketSortPreset, setTicketSortPreset] = useState<string>(DEFAULT_SORT_VALUE);

  const toggleBookingSort = (key: 'businessName' | 'hubLocation' | 'category' | 'status') => {
    setBookingSortPreset('table_column');
    setBookingSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const toggleGrantSort = (key: 'businessName' | 'programTitle' | 'grantAmount' | 'status') => {
    setGrantSortPreset('table_column');
    setGrantSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const toggleSlotSort = (key: 'name' | 'district' | 'monthlyRate' | 'status') => {
    setSlotSortPreset('table_column');
    setSlotSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const toggleTicketSort = (key: 'slotCode' | 'issueCategory' | 'status') => {
    setTicketSortPreset('table_column');
    setTicketSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const bookingSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'hub_asc', label: 'Hab Lokasi (A - Z)' },
    { value: 'category_asc', label: 'Kategori Perniagaan (A - Z)' }
  ]);

  const grantSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_pending', label: 'Status (Menunggu Dahulu)' },
    { value: 'amount_desc', label: 'Jumlah Geran (Tertinggi)' },
    { value: 'program_asc', label: 'Nama Program (A - Z)' }
  ]);

  const slotSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'rate_asc', label: 'Kadar Sewa (Terendah)' },
    { value: 'rate_desc', label: 'Kadar Sewa (Tertinggi)' },
    { value: 'district_asc', label: 'Jajahan (A - Z)' },
    { value: 'status_available', label: 'Status (Tersedia Dahulu)' }
  ]);

  const ticketSortOptions: ToolbarSortOption[] = buildStandardSortOptions([
    { value: 'status_received', label: 'Status (Diterima Dahulu)' },
    { value: 'slot_asc', label: 'Kod Kiosk (A - Z)' },
    { value: 'category_asc', label: 'Kategori Aduan (A - Z)' }
  ]);

  // Filter Bookings directly by statusFilter so real-time updates reflect consistently across tabs
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    const matchSearch =
      (b.applicantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.slotCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.hubLocation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Filter Grants directly by statusFilter
  const filteredGrants = grantApplications.filter((g) => {
    const matchStatus = statusFilter === 'all' ? true : g.status === statusFilter;
    const matchSearch =
      (g.applicantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.programTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 };
  const sortedBookings =
    bookingSortPreset === 'table_column'
      ? [...filteredBookings].sort((a, b) => {
          const dirMult = bookingSort.dir === 'asc' ? 1 : -1;
          if (bookingSort.key === 'businessName') {
            return `${a.slotCode} ${a.businessName}`.localeCompare(`${b.slotCode} ${b.businessName}`) * dirMult;
          }
          if (bookingSort.key === 'hubLocation') {
            return (a.hubLocation || '').localeCompare(b.hubLocation || '') * dirMult;
          }
          if (bookingSort.key === 'category') {
            return (a.businessCategory || '').localeCompare(b.businessCategory || '') * dirMult;
          }
          return ((statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)) * dirMult;
        })
      : sortRecords(filteredBookings, {
          sortBy: bookingSortPreset,
          getName: (b) => b.businessName || b.applicantName || b.slotCode || '',
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
            if (mode === 'hub_asc') return compareText(a.hubLocation, b.hubLocation);
            if (mode === 'category_asc') return compareText(a.businessCategory, b.businessCategory);
            return null;
          }
        });

  const sortedGrants =
    grantSortPreset === 'table_column'
      ? [...filteredGrants].sort((a, b) => {
          const dirMult = grantSort.dir === 'asc' ? 1 : -1;
          if (grantSort.key === 'businessName') {
            return (a.businessName || '').localeCompare(b.businessName || '') * dirMult;
          }
          if (grantSort.key === 'programTitle') {
            return (a.programTitle || '').localeCompare(b.programTitle || '') * dirMult;
          }
          if (grantSort.key === 'grantAmount') {
            const numA = Number(String(a.grantAmount || '0').replace(/[^0-9.]/g, '')) || 0;
            const numB = Number(String(b.grantAmount || '0').replace(/[^0-9.]/g, '')) || 0;
            return (numA - numB) * dirMult;
          }
          return ((statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)) * dirMult;
        })
      : sortRecords(filteredGrants, {
          sortBy: grantSortPreset,
          getName: (g) => g.businessName || g.applicantName || g.programTitle || '',
          customCompare: (a, b, mode) => {
            if (mode === 'status_pending') return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
            if (mode === 'amount_desc') return parseNumericAmount(b.grantAmount) - parseNumericAmount(a.grantAmount);
            if (mode === 'program_asc') return compareText(a.programTitle, b.programTitle);
            return null;
          }
        });

  const baseFacilitySlots = slots.filter((s) => {
    if (slotStatusFilter !== 'all' && s.status !== slotStatusFilter) return false;
    const q = slotSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.code || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.hubLocation || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q)
    );
  });

  const slotStatusOrder: Record<string, number> = { available: 0, occupied: 1, maintenance: 2 };
  const filteredFacilitySlots =
    slotSortPreset === 'table_column'
      ? [...baseFacilitySlots].sort((a, b) => {
          const dirMult = slotSort.dir === 'asc' ? 1 : -1;
          if (slotSort.key === 'district') {
            return (a.district || '').localeCompare(b.district || '') * dirMult;
          }
          if (slotSort.key === 'monthlyRate') {
            return ((Number(a.monthlyRate) || 0) - (Number(b.monthlyRate) || 0)) * dirMult;
          }
          if (slotSort.key === 'status') {
            return (a.status || '').localeCompare(b.status || '') * dirMult;
          }
          return `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`) * dirMult;
        })
      : sortRecords(baseFacilitySlots, {
          sortBy: slotSortPreset,
          getName: (s) => `${s.code || ''} ${s.name || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'rate_asc') return (Number(a.monthlyRate) || 0) - (Number(b.monthlyRate) || 0);
            if (mode === 'rate_desc') return (Number(b.monthlyRate) || 0) - (Number(a.monthlyRate) || 0);
            if (mode === 'district_asc') return compareText(a.district, b.district);
            if (mode === 'status_available') return (slotStatusOrder[a.status] ?? 3) - (slotStatusOrder[b.status] ?? 3);
            return null;
          }
        });

  const ticketOrder: Record<string, number> = { received: 0, in_progress: 1, resolved: 2 };
  const baseFilteredTickets = maintenanceTickets.filter((t) => {
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    const q = ticketSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.slotCode || '').toLowerCase().includes(q) ||
      (t.kioskName || '').toLowerCase().includes(q) ||
      (t.reporterName || '').toLowerCase().includes(q) ||
      (t.issueCategory || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  const sortedTickets =
    ticketSortPreset === 'table_column'
      ? [...baseFilteredTickets].sort((a, b) => {
          const dirMult = ticketSort.dir === 'asc' ? 1 : -1;
          if (ticketSort.key === 'slotCode') {
            return (a.slotCode || '').localeCompare(b.slotCode || '') * dirMult;
          }
          if (ticketSort.key === 'issueCategory') {
            return (a.issueCategory || '').localeCompare(b.issueCategory || '') * dirMult;
          }
          return ((ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3)) * dirMult;
        })
      : sortRecords(baseFilteredTickets, {
          sortBy: ticketSortPreset,
          getName: (t) => `${t.slotCode || ''} ${t.kioskName || ''} ${t.reporterName || ''}`.trim(),
          customCompare: (a, b, mode) => {
            if (mode === 'status_received') return (ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3);
            if (mode === 'slot_asc') return compareText(a.slotCode, b.slotCode);
            if (mode === 'category_asc') return compareText(a.issueCategory, b.issueCategory);
            return null;
          }
        });

  const bookingsPagination = usePagination(sortedBookings, 7, [
    statusFilter,
    searchQuery,
    bookingSortPreset,
    bookingSort.key,
    bookingSort.dir,
    sortedBookings.length
  ]);
  const grantsPagination = usePagination(sortedGrants, 7, [
    statusFilter,
    searchQuery,
    grantSortPreset,
    grantSort.key,
    grantSort.dir,
    sortedGrants.length
  ]);
  const facilitySlotsPagination = usePagination(filteredFacilitySlots, 7, [
    slotSearch,
    slotStatusFilter,
    slotSortPreset,
    slotSort.key,
    slotSort.dir,
    filteredFacilitySlots.length
  ]);
  const ticketsPagination = usePagination(sortedTickets, 7, [
    ticketSearch,
    ticketStatusFilter,
    ticketSortPreset,
    ticketSort.key,
    ticketSort.dir,
    sortedTickets.length
  ]);

  const handleApproveBooking = async (id: string) => {
    setActionLoading(id);
    try {
      await onApproveBooking(id, adminNoteInput[id] || 'Permohonan diluluskan dengan subsidi 50% tajaan Kerajaan Negeri Kelantan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (id: string) => {
    setActionLoading(id);
    try {
      await onRejectBooking(id, adminNoteInput[id] || 'Permohonan tidak dapat dipertimbangkan buat masa ini.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveGrant = async (id: string) => {
    setActionLoading(id);
    try {
      await onApproveGrant(id, adminNoteInput[id] || 'Bantuan dana geran diluluskan oleh panel penilai UMK & YUBK.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectGrant = async (id: string) => {
    setActionLoading(id);
    try {
      await onRejectGrant(id, adminNoteInput[id] || 'Dokumen sokongan tidak lengkap atau kuota pusingan telah dipenuhi.');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation actions for popup modal ("Ya" / "Tidak")
  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    const target = rejectModalData;
    setRejectModalData(null);

    if (target.type === 'kiosk') {
      await handleRejectBooking(target.id);
    } else {
      await handleRejectGrant(target.id);
    }
  };

  const handleCancelReject = () => {
    setRejectModalData(null);
  };

  const handleDirectBookingStatus = async (booking: CapsuleBooking, nextStatus: BookingStatus) => {
    setActionLoading(booking.id);
    try {
      await updateBookingStatus(
        booking.id,
        nextStatus,
        booking.adminNotes || '',
        booking.slotId,
        booking.businessName,
        booking.applicantId,
        booking
      );
      showToast(`Status permohonan ${booking.businessName} ditukar kepada ${nextStatus}.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Gagal menukar status permohonan kiosk.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBookingRecord = async (booking: CapsuleBooking) => {
    try {
      await deleteCapsuleBooking(booking);
      showToast(`Permohonan ${booking.businessName} telah dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam permohonan kiosk.', 'error');
    }
  };

  const handleDirectGrantStatus = async (grant: GrantApplication, nextStatus: GrantApplication['status']) => {
    setActionLoading(grant.id);
    try {
      await updateGrantApplicationStatus(grant.id, nextStatus, grant.adminNotes || '', grant);
      showToast(`Status permohonan geran ${grant.businessName} dikemas kini.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Gagal menukar status permohonan geran.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGrantRecord = async (grant: GrantApplication) => {
    try {
      await deleteGrantApplication(grant.id);
      showToast(`Permohonan geran ${grant.businessName} telah dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam permohonan geran.', 'error');
    }
  };

  const handleDirectTicketStatus = async (ticket: MaintenanceTicket, nextStatus: MaintenanceTicket['status']) => {
    setActionLoading(ticket.id);
    try {
      await updateMaintenanceTicketStatus(ticket.id, nextStatus, ticket.adminNotes, ticket);
      showToast(`Status tiket aduan ${ticket.slotCode} dikemas kini.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Gagal menukar status tiket aduan.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTicketRecord = async (ticket: MaintenanceTicket) => {
    try {
      await deleteMaintenanceTicket(ticket.id);
      showToast(`Tiket aduan ${ticket.slotCode} telah dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam tiket aduan.', 'error');
    }
  };

  const handleDeleteSlotRecord = async (slot: CapsuleSlot) => {
    try {
      await deleteCapsuleSlot(slot.id);
      showToast(`Slot kiosk ${slot.code} telah dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam slot kiosk.', 'error');
    }
  };

  // State for Official Approval Report Modal
  const [showOfficialReport, setShowOfficialReport] = useState(false);

  // State for Add Capsule Slot Modal
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [slotCode, setSlotCode] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotHub, setSlotHub] = useState('Hub UMK Kampus Bachok');
  const [slotDistrict, setSlotDistrict] = useState<KelantanDistrict>('Bachok');
  const [slotSize, setSlotSize] = useState('10ft x 10ft Smart Pod');
  const [slotMonthlyRate, setSlotMonthlyRate] = useState('150');
  const [slotAmenities, setSlotAmenities] = useState('Palam Elektrik 13A, WiFi 500Mbps, Rak Paparan Bertingkat');
  const [slotImageUrl, setSlotImageUrl] = useState('/assets/generated/kiosk_modular_kbelia.jpg');
  const [savingSlot, setSavingSlot] = useState(false);

  // State for Add Program Modal
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [progTitle, setProgTitle] = useState('');
  const [progCategory, setProgCategory] = useState<YouthProgram['category']>('Geran & Dana');
  const [progDate, setProgDate] = useState('Sepanjang Bulan');
  const [progLocation, setProgLocation] = useState('Hub Keusahawanan Belia Kelantan');
  const [progAmount, setProgAmount] = useState('RM3,000');
  const [progDesc, setProgDesc] = useState('');
  const [progOrganizer, setProgOrganizer] = useState('Unit Keusahawanan Belia Kelantan');
  const [savingProgram, setSavingProgram] = useState(false);

  // Handle Save New Slot Directly by Admin
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCode.trim() || !slotName.trim()) {
      showToast('Sila lengkapkan kod dan nama kapsul niaga.', 'error');
      return;
    }
    try {
      setSavingSlot(true);
      const amenitiesList = slotAmenities.split(',').map(s => s.trim()).filter(Boolean);
      await saveCapsuleSlot({
        code: slotCode.toUpperCase(),
        name: slotName,
        hubLocation: slotHub,
        district: slotDistrict,
        size: slotSize,
        monthlyRate: parseFloat(slotMonthlyRate) || 150,
        dailyRate: Math.round((parseFloat(slotMonthlyRate) || 150) / 10),
        status: 'available',
        amenities: amenitiesList,
        imageUrl: slotImageUrl
      });

      emitAdminOrMentorNotification({
        title: `Kiosk Niaga Baharu: ${slotCode.toUpperCase()}`,
        message: `${slotName} di jajahan ${slotDistrict} kini dibuka untuk permohonan usahawan belia Kelantan (RM${slotMonthlyRate}/bln).`,
        type: 'kiosk',
        senderRole: 'admin',
        sender: 'Pentadbir KBelia'
      });

      setShowAddSlotModal(false);
      setSlotCode('');
      setSlotName('');
      showToast('Kiosk baharu berjaya didaftarkan!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Gagal menambah kiosk baharu.', 'error');
    } finally {
      setSavingSlot(false);
    }
  };

  // Handle Save New Program Directly by Admin
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      showToast('Sila lengkapkan tajuk program / geran.', 'error');
      return;
    }
    try {
      setSavingProgram(true);
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
        title: `Pengumuman Geran/Program: ${progTitle}`,
        message: `${progTitle} (${progAmount}) kini dibuka untuk penyertaan usahawan belia Kelantan.`,
        type: 'grant',
        senderRole: 'admin',
        sender: 'Pentadbir KBelia'
      });

      setShowAddProgramModal(false);
      setProgTitle('');
      setProgDesc('');
      showToast('Program & geran baharu berjaya diterbitkan!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Gagal menambah program geran baharu.', 'error');
    } finally {
      setSavingProgram(false);
    }
  };

  // District Demand Calculation
  const districtDemandCount: { [key: string]: number } = {};
  bookings.forEach(b => {
    const loc = b.hubLocation || 'Lain-lain';
    districtDemandCount[loc] = (districtDemandCount[loc] || 0) + 1;
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-6 md:p-8 shadow-xs overflow-visible">
      {/* Top Controls & Navigation (Important Header Only) */}
      <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8 px-6 pt-6 md:px-8 md:pt-8 pb-6 mb-6 kbelia-important-header border-b border-slate-300 dark:border-slate-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-wider uppercase text-black dark:text-white/75">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Pusat Kawalan & Kelulusan Rasmi Pegawai
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-sm text-black/70 dark:text-white/75 font-medium">
              Panel Pengurusan Usahawan Belia Kelantan
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
            Pusat Semakan Permohonan & Pengurusan Kiosk
          </h2>
        </div>

        {/* Action Buttons: Official Report & Admin Creation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddSlotModal(true)}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer dark:bg-blue-600"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Daftar Kiosk Niaga</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddProgramModal(true)}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-black bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Terbit Program</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOfficialReport(true)}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-black dark:text-white bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Muat turun ringkasan rasmi kelulusan"
          >
            <Printer className="w-3.5 h-3.5 text-black dark:text-white/75" />
            <span>Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Main Tab Segmented Controls */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Ringkasan 3-Kolum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kiosks')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'kiosks'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Kiosk ({bookings.filter(b => b.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grants')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'grants'
              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Geran ({grantApplications.filter(g => g.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('facility')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'facility'
              ? 'bg-rose-600 text-white shadow-sm dark:bg-rose-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Fasiliti ({slots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Peta Audit</span>
        </button>
      </div>

      {/* TAB 0: 3-COLUMN OVERVIEW MATCHING WIREFRAME */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          
          {/* Kolum 1: Permohonan Sewa Kiosk */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col h-fit">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-[0.9375rem] font-bold text-black dark:text-white">
                    Permohonan Sewa Kiosk
                  </h4>
                </div>
                <span className="text-[0.8125rem] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200/80">
                  {bookings.filter(b => b.status === 'pending').length} Menunggu
                </span>
              </div>

              {/* Booking items list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {bookings.filter(b => b.status === 'pending').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <CheckCircle2 className="w-8 h-8 text-black/70 dark:text-white/75 mx-auto mb-1 opacity-70" />
                    <p className="text-sm font-bold text-black dark:text-white">Semua Permohonan Selesai Disemak</p>
                    <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5">Tiada permohonan baru menunggu kelulusan.</p>
                  </div>
                ) : (
                  bookings.filter(b => b.status === 'pending').slice(0, 5).map(b => (
                    <div key={b.id} className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[0.8125rem] font-bold text-black dark:text-white">{b.slotCode}</span>
                            <span className="text-sm text-black/70 dark:text-white/75">· {b.hubLocation.split(' ')[0]}</span>
                          </div>
                          <h5 className="text-sm font-bold text-black dark:text-white">{b.businessName}</h5>
                          <p className="text-[0.9375rem] text-black/70 dark:text-white/75">{b.applicantName} · {b.businessCategory}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[0.8125rem] font-bold bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white">Menunggu</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-300 dark:border-slate-600">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingBooking(b)}
                            className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/40 text-black dark:text-white hover:bg-blue-100 cursor-pointer"
                            title="Edit Permohonan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: `${b.businessName} (${b.slotCode})`,
                                itemType: 'Permohonan Kiosk',
                                onConfirm: () => handleDeleteBookingRecord(b)
                              })
                            }
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/40 text-black dark:text-white hover:bg-rose-100 cursor-pointer"
                            title="Padam Permohonan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRejectModalData({ type: 'kiosk', id: b.id, name: b.applicantName, business: b.businessName, slotOrProgram: b.slotCode })}
                            className="px-2.5 py-1 rounded text-[0.8125rem] font-semibold text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveBooking(b.id)}
                            className="px-3 py-1 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Luluskan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-sm text-black/70 dark:text-white/75">Sewaan Kiosk Belia</span>
              <button
                type="button"
                onClick={() => setActiveTab('kiosks')}
                className="text-sm sm:text-[0.9375rem] font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Lihat Semua ({bookings.length})
              </button>
            </div>
          </div>

          {/* Kolum 2: Permohonan Dana & Geran Belia */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col h-fit">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-[0.9375rem] font-bold text-black dark:text-white">
                    Permohonan Geran & Pembiayaan
                  </h4>
                </div>
                <span className="text-[0.8125rem] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200">
                  {grantApplications.filter(g => g.status === 'pending').length} Menunggu
                </span>
              </div>

              {/* Grant items list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {grantApplications.filter(g => g.status === 'pending').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <Award className="w-8 h-8 text-black/70 dark:text-white/75 mx-auto mb-1 opacity-70" />
                    <p className="text-sm font-bold text-black dark:text-white">Tiada Permohonan Geran Tertangguh</p>
                    <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5">Semua semakan kelayakan pembiayaan telah diproses.</p>
                  </div>
                ) : (
                  grantApplications.filter(g => g.status === 'pending').slice(0, 5).map(g => (
                    <div key={g.id} className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[0.8125rem] font-bold text-black dark:text-white">{g.grantAmount || 'RM 3,000'}</span>
                            <span className="text-sm text-black/70 dark:text-white/75">· {g.district || g.businessCategory || 'Kelantan'}</span>
                          </div>
                          <h5 className="text-sm font-bold text-black dark:text-white">{g.programTitle}</h5>
                          <p className="text-[0.9375rem] text-black/70 dark:text-white/75">{g.applicantName} ({g.businessName})</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[0.8125rem] font-bold bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white">Menunggu</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-300 dark:border-slate-600">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingGrant(g)}
                            className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/40 text-black dark:text-white hover:bg-blue-100 cursor-pointer"
                            title="Edit Permohonan Geran"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmDelete({
                                itemName: `${g.businessName} (${g.programTitle})`,
                                itemType: 'Permohonan Geran',
                                onConfirm: () => handleDeleteGrantRecord(g)
                              })
                            }
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/40 text-black dark:text-white hover:bg-rose-100 cursor-pointer"
                            title="Padam Permohonan Geran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRejectModalData({ type: 'grant', id: g.id, name: g.applicantName, business: g.businessName, slotOrProgram: g.programTitle })}
                            className="px-2.5 py-1 rounded text-[0.8125rem] font-semibold text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveGrant(g.id)}
                            className="px-3 py-1 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Luluskan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-sm text-black/70 dark:text-white/75">Dana & Pemangkin Belia</span>
              <button
                type="button"
                onClick={() => setActiveTab('grants')}
                className="text-sm sm:text-[0.9375rem] font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Lihat Semua ({grantApplications.length})
              </button>
            </div>
          </div>

          {/* Kolum 3: Kawalan Fasiliti Kiosk & Tindakan Pantas */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col h-fit">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-[0.9375rem] font-bold text-black dark:text-white">
                    Fasiliti & Tindakan Pantas
                  </h4>
                </div>
                <span className="text-[0.8125rem] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200">
                  {slots.length} Unit Pod
                </span>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-sm text-black/70 dark:text-white/75 block font-medium">Kosong</span>
                  <span className="font-mono text-base font-bold text-black dark:text-white">{slots.filter(s => s.status === 'available').length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-sm text-black/70 dark:text-white/75 block font-medium">Disewa</span>
                  <span className="font-mono text-base font-bold text-black dark:text-white">{slots.filter(s => s.status === 'occupied').length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-sm text-black/70 dark:text-white/75 block font-medium">Selenggara</span>
                  <span className="font-mono text-base font-bold text-black dark:text-white">{slots.filter(s => s.status === 'maintenance').length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(true)}
                  className="w-full py-2 px-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer dark:bg-blue-600"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Daftar Kiosk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(true)}
                  className="w-full py-2 px-3 rounded-xl text-sm font-bold text-black bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-black" />
                  <span>Terbit Program</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOfficialReport(true)}
                  className="w-full py-2 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span>Laporan PDF</span>
                </button>
              </div>

              {/* Recent Slots snippet */}
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                <span className="text-[0.8125rem] font-bold text-black/75 dark:text-white/75 uppercase tracking-wider block">Kiosk Diurus:</span>
                {slots.slice(0, 4).map(slot => (
                  <div key={slot.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                    <span className="font-bold text-black dark:text-white">{slot.name} ({slot.code})</span>
                    <span className={`text-[0.8125rem] font-bold px-2 py-0.5 rounded ${slot.status === 'available' ? 'bg-emerald-100 text-black' : 'bg-amber-100 text-black'}`}>
                      {slot.status === 'available' ? 'Kosong' : 'Disewa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-sm text-black/70 dark:text-white/75">Pusat Audit PBT & SUK</span>
              <button
                type="button"
                onClick={() => setActiveTab('facility')}
                className="text-sm sm:text-[0.9375rem] font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Urus Fasiliti
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 1: KIOSK BOOKINGS */}
      {activeTab === 'kiosks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-black dark:text-white">
                Senarai Permohonan Sewaan Kiosk
              </h4>
              <p className="text-sm text-black/70 dark:text-white/75">
                Semak cadangan perniagaan, ubah status kelulusan, sunting atau padam rekod permohonan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBooking(null);
                setShowCreateBooking(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Permohonan</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <ReferenceTableToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari pemohon, perniagaan atau kod kiosk..."
              filterCount={(statusFilter !== 'all' ? 1 : 0) + (bookingSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
              onResetFilters={() => {
                setStatusFilter('all');
                setBookingSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                bookingSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...bookingSortOptions]
                  : bookingSortOptions
              }
              sortValue={bookingSortPreset === 'table_column' ? '' : bookingSortPreset}
              onSortChange={(val) => {
                if (val) setBookingSortPreset(val);
              }}
              filterContent={
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                    Status Permohonan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { id: 'all', label: 'Semua' },
                      { id: 'pending', label: 'Menunggu' },
                      { id: 'approved', label: 'Lulus' },
                      { id: 'rejected', label: 'Ditolak' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStatusFilter(opt.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          statusFilter === opt.id
                            ? 'bg-blue-600 border-blue-600 text-white'
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
                <Store className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">
                  Tiada rekod permohonan kiosk sepadan dengan tapisan semasa.
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setBookingSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className="mt-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
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
                            onClick={() => toggleBookingSort('businessName')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kiosk &amp; Perniagaan</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleBookingSort('category')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kategori</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleBookingSort('hubLocation')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Lokasi &amp; Tempoh</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleBookingSort('status')}
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
                      {bookingsPagination.paginatedItems.map((booking) => {
                        const isActioning = actionLoading === booking.id;
                        const isExpanded = expandedKioskIds.includes(booking.id);
                        return (
                          <React.Fragment key={booking.id}>
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex items-center gap-3 min-w-[210px]">
                                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 shrink-0">
                                    <PortalImage
                                      src={resolveBookingKioskImage(booking, slots)}
                                      alt={`Reka bentuk kiosk ${booking.slotName}`}
                                      fallbackType="kiosk"
                                      fallbackLabel={booking.slotCode}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-black dark:text-white truncate max-w-[240px]">
                                      {booking.slotCode} · {booking.businessName}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[240px]">
                                      {booking.applicantName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                                {booking.businessCategory}
                              </td>
                              <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                                <p className="font-medium text-black dark:text-white">{booking.hubLocation}</p>
                                <p className="text-xs text-black/60 dark:text-white/65">
                                  {booking.durationMonths} bln · Mula {formatDisplayDate(booking.startDate)}
                                </p>
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    booking.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                      : booking.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
                                      : booking.status === 'cancelled'
                                      ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                  }`}
                                >
                                  {booking.status === 'approved'
                                    ? 'Diluluskan'
                                    : booking.status === 'rejected'
                                    ? 'Ditolak'
                                    : booking.status === 'cancelled'
                                    ? 'Dibatalkan'
                                    : 'Menunggu Semakan'}
                                </span>
                              </td>
                              <td className="py-3.5 pl-2 pr-5 text-right">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk ${booking.businessName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran & Catatan',
                                      onClick: () => toggleExpandedId(setExpandedKioskIds, booking.id)
                                    },
                                    {
                                      label: 'Luluskan Permohonan',
                                      tone: 'accent',
                                      disabled: isActioning || booking.status === 'approved',
                                      onClick: () => handleApproveBooking(booking.id)
                                    },
                                    {
                                      label: 'Tolak Permohonan',
                                      disabled: isActioning || booking.status === 'rejected',
                                      onClick: () =>
                                        setRejectModalData({
                                          type: 'kiosk',
                                          id: booking.id,
                                          name: booking.applicantName,
                                          business: booking.businessName,
                                          slotOrProgram: `${booking.slotCode} (${booking.hubLocation})`
                                        })
                                    },
                                    ...(booking.status !== 'pending'
                                      ? [
                                          {
                                            label: 'Set Menunggu Semakan',
                                            disabled: isActioning,
                                            onClick: () => handleDirectBookingStatus(booking, 'pending')
                                          }
                                        ]
                                      : []),
                                    {
                                      label: 'Edit Permohonan',
                                      dividerBefore: true,
                                      onClick: () => setEditingBooking(booking)
                                    },
                                    {
                                      label: 'Padam Permohonan',
                                      tone: 'danger',
                                      onClick: () =>
                                        confirmDelete({
                                          itemName: `${booking.businessName} (${booking.slotCode})`,
                                          itemType: 'Permohonan Kiosk',
                                          onConfirm: () => handleDeleteBookingRecord(booking)
                                        })
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                <td colSpan={5} className="px-5 py-4 space-y-3">
                                  <div className="text-sm text-black/75 dark:text-white/80 tabular-nums">
                                    Tempoh Operasi: <strong className="text-black dark:text-white">{booking.durationMonths} Bulan</strong> · Mula: <strong className="text-black dark:text-white">{formatDisplayDate(booking.startDate)}</strong> · Akhir: <strong className="text-black dark:text-white">{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</strong>
                                  </div>

                                  {booking.pitchNotes && (
                                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm text-black dark:text-white">
                                      <span className="font-semibold block mb-0.5">
                                        Penerangan Perniagaan &amp; Cadangan Jualan:
                                      </span>
                                      {booking.pitchNotes}
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Masukkan catatan pegawai"
                                      value={adminNoteInput[booking.id] ?? (booking.adminNotes || '')}
                                      onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [booking.id]: e.target.value })}
                                      className="flex-1 px-3 py-1.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isActioning}
                                        onClick={() => handleApproveBooking(booking.id)}
                                        className="py-1.5 px-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Luluskan</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isActioning}
                                        onClick={() =>
                                          setRejectModalData({
                                            type: 'kiosk',
                                            id: booking.id,
                                            name: booking.applicantName,
                                            business: booking.businessName,
                                            slotOrProgram: `${booking.slotCode} (${booking.hubLocation})`
                                          })
                                        }
                                        className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                                      >
                                        Tolak
                                      </button>
                                    </div>
                                  </div>
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
                  currentPage={bookingsPagination.currentPage}
                  totalItems={bookingsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={bookingsPagination.setCurrentPage}
                  itemLabel="permohonan kiosk"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRANT APPLICATIONS */}
      {activeTab === 'grants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-black dark:text-white">
                Senarai Permohonan Geran &amp; Pembiayaan Belia
              </h4>
              <p className="text-sm text-black/70 dark:text-white/75">
                Nilai kelayakan permohonan geran, ubah status kelulusan, sunting atau padam rekod geran.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingGrant(null);
                setShowCreateGrant(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Geran</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
            <ReferenceTableToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari pemohon, perniagaan atau program geran..."
              filterCount={(statusFilter !== 'all' ? 1 : 0) + (grantSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
              onResetFilters={() => {
                setStatusFilter('all');
                setGrantSortPreset(DEFAULT_SORT_VALUE);
              }}
              sortOptions={
                grantSortPreset === 'table_column'
                  ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...grantSortOptions]
                  : grantSortOptions
              }
              sortValue={grantSortPreset === 'table_column' ? '' : grantSortPreset}
              onSortChange={(val) => {
                if (val) setGrantSortPreset(val);
              }}
              filterContent={
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                    Status Permohonan Geran
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { id: 'all', label: 'Semua' },
                      { id: 'pending', label: 'Menunggu' },
                      { id: 'approved', label: 'Lulus' },
                      { id: 'rejected', label: 'Ditolak' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStatusFilter(opt.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          statusFilter === opt.id
                            ? 'bg-blue-600 border-blue-600 text-white'
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

            {sortedGrants.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Coins className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                <p className="text-sm font-bold text-black dark:text-white">
                  Tiada rekod permohonan dana geran sepadan dengan tapisan semasa.
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setGrantSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className="mt-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
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
                            onClick={() => toggleGrantSort('businessName')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Perniagaan &amp; Pemohon</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleGrantSort('programTitle')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Program &amp; SSM</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleGrantSort('grantAmount')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Nilai Geran</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleGrantSort('status')}
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
                      {grantsPagination.paginatedItems.map((grant) => {
                        const isActioning = actionLoading === grant.id;
                        const isExpanded = expandedGrantIds.includes(grant.id);
                        return (
                          <React.Fragment key={grant.id}>
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className="w-10 h-10 rounded-xl shrink-0 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                                    <Coins className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-black dark:text-white truncate max-w-[240px]">
                                      {grant.businessName}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[240px]">
                                      {grant.applicantName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <p className="font-medium text-black dark:text-white truncate max-w-[240px]">
                                  {grant.programTitle}
                                </p>
                                <p className="text-xs text-black/60 dark:text-white/65 whitespace-nowrap">
                                  {grant.businessCategory} · SSM: {grant.ssmNumber || 'Dikecualikan'}
                                </p>
                              </td>
                              <td className="py-3.5 px-3 font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                                {grant.grantAmount}
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    grant.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                      : grant.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
                                      : grant.status === 'cancelled'
                                      ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                  }`}
                                >
                                  {grant.status === 'approved'
                                    ? 'Diluluskan'
                                    : grant.status === 'rejected'
                                    ? 'Ditolak'
                                    : grant.status === 'cancelled'
                                    ? 'Dibatalkan'
                                    : 'Menunggu Semakan'}
                                </span>
                              </td>
                              <td className="py-3.5 pl-2 pr-5 text-right">
                                <RowActionMenu
                                  ariaLabel={`Tindakan untuk ${grant.businessName}`}
                                  items={[
                                    {
                                      label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran & Catatan',
                                      onClick: () => toggleExpandedId(setExpandedGrantIds, grant.id)
                                    },
                                    {
                                      label: 'Luluskan Dana Geran',
                                      tone: 'accent',
                                      disabled: isActioning || grant.status === 'approved',
                                      onClick: () => handleApproveGrant(grant.id)
                                    },
                                    {
                                      label: 'Tolak Permohonan',
                                      disabled: isActioning || grant.status === 'rejected',
                                      onClick: () =>
                                        setRejectModalData({
                                          type: 'grant',
                                          id: grant.id,
                                          name: grant.applicantName,
                                          business: grant.businessName,
                                          slotOrProgram: `${grant.programTitle} (${grant.grantAmount})`
                                        })
                                    },
                                    ...(grant.status !== 'pending'
                                      ? [
                                          {
                                            label: 'Set Menunggu Semakan',
                                            disabled: isActioning,
                                            onClick: () => handleDirectGrantStatus(grant, 'pending')
                                          }
                                        ]
                                      : []),
                                    {
                                      label: 'Edit Permohonan',
                                      dividerBefore: true,
                                      onClick: () => setEditingGrant(grant)
                                    },
                                    {
                                      label: 'Padam Permohonan',
                                      tone: 'danger',
                                      onClick: () =>
                                        confirmDelete({
                                          itemName: `${grant.businessName} (${grant.programTitle})`,
                                          itemType: 'Permohonan Geran',
                                          onConfirm: () => handleDeleteGrantRecord(grant)
                                        })
                                    }
                                  ]}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                <td colSpan={5} className="px-5 py-4 space-y-3">
                                  <div className="text-sm text-black/75 dark:text-white/80">
                                    Akaun Bank: <strong className="text-black dark:text-white">{grant.bankName}</strong> ({grant.bankAccountNumber})
                                  </div>

                                  {grant.fundPurpose && (
                                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm text-black dark:text-white">
                                      <span className="font-semibold block mb-0.5">
                                        Cadangan Penggunaan Dana:
                                      </span>
                                      {grant.fundPurpose}
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Masukkan catatan pegawai"
                                      value={adminNoteInput[grant.id] ?? (grant.adminNotes || '')}
                                      onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [grant.id]: e.target.value })}
                                      className="flex-1 px-3 py-1.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isActioning}
                                        onClick={() => handleApproveGrant(grant.id)}
                                        className="py-1.5 px-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Luluskan Dana Geran</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isActioning}
                                        onClick={() =>
                                          setRejectModalData({
                                            type: 'grant',
                                            id: grant.id,
                                            name: grant.applicantName,
                                            business: grant.businessName,
                                            slotOrProgram: `${grant.programTitle} (${grant.grantAmount})`
                                          })
                                        }
                                        className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                                      >
                                        Tolak
                                      </button>
                                    </div>
                                  </div>
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
                  currentPage={grantsPagination.currentPage}
                  totalItems={grantsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={grantsPagination.setCurrentPage}
                  itemLabel="permohonan geran"
                  accent="rose"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FACILITY & KIOSK MAINTENANCE CONTROL */}
      {activeTab === 'facility' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-black dark:text-white">
                  Kawalan Fasiliti &amp; Status Unit Kiosk ({slots.length})
                </h4>
                <p className="text-sm text-black/70 dark:text-white/75">
                  Tukar status operasi unit kiosk, sunting spesifikasi atau padam unit yang tidak lagi aktif.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlotModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit Kiosk</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
              <ReferenceTableToolbar
                searchValue={slotSearch}
                onSearchChange={setSlotSearch}
                searchPlaceholder="Cari kod kiosk, nama atau daerah..."
                filterCount={(slotStatusFilter !== 'all' ? 1 : 0) + (slotSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
                onResetFilters={() => {
                  setSlotStatusFilter('all');
                  setSlotSortPreset(DEFAULT_SORT_VALUE);
                }}
                sortOptions={
                  slotSortPreset === 'table_column'
                    ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...slotSortOptions]
                    : slotSortOptions
                }
                sortValue={slotSortPreset === 'table_column' ? '' : slotSortPreset}
                onSortChange={(val) => {
                  if (val) setSlotSortPreset(val);
                }}
                filterContent={
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Status Unit Kiosk
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'all', label: 'Semua' },
                        { id: 'available', label: 'Tersedia' },
                        { id: 'occupied', label: 'Diduduki' },
                        { id: 'maintenance', label: 'Pembaikan' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSlotStatusFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                            slotStatusFilter === opt.id
                              ? 'bg-blue-600 border-blue-600 text-white'
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

              {filteredFacilitySlots.length === 0 ? (
                <div className="py-10 px-6 text-center space-y-2">
                  <Building2 className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    Tiada unit kiosk sepadan dengan carian atau penapis.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotSearch('');
                      setSlotStatusFilter('all');
                      setSlotSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className="mt-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
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
                              onClick={() => toggleSlotSort('name')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Unit Kiosk</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleSlotSort('district')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Hab &amp; Daerah</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleSlotSort('monthlyRate')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Kadar Sewa</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleSlotSort('status')}
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
                        {facilitySlotsPagination.paginatedItems.map((slot) => (
                          <tr
                            key={slot.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="py-3.5 pl-5 pr-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 shrink-0">
                                  <PortalImage
                                    src={resolveSlotImage(slot)}
                                    alt={slot.name}
                                    fallbackType="kiosk"
                                    fallbackLabel={slot.code}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-black dark:text-white truncate max-w-[240px]">
                                    {slot.code} · {slot.name}
                                  </p>
                                  <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[240px]">
                                    {slot.size}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-medium text-black dark:text-white whitespace-nowrap">
                                {slot.hubLocation}
                              </p>
                              <p className="text-xs text-black/60 dark:text-white/65 whitespace-nowrap">
                                {slot.district}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                              RM{slot.monthlyRate}/bln
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  slot.status === 'available'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                    : slot.status === 'maintenance'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {slot.status === 'available'
                                  ? 'Tersedia'
                                  : slot.status === 'maintenance'
                                  ? 'Dalam Pembaikan'
                                  : 'Diduduki'}
                              </span>
                            </td>
                            <td className="py-3.5 pl-2 pr-5 text-right">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${slot.code}`}
                                items={[
                                  ...(onUpdateSlotStatus
                                    ? [
                                        {
                                          label: 'Set Tersedia (Buka)',
                                          disabled: slot.status === 'available',
                                          onClick: () => onUpdateSlotStatus(slot.id, 'available')
                                        },
                                        {
                                          label: 'Set Dalam Pembaikan',
                                          disabled: slot.status === 'maintenance',
                                          onClick: () => onUpdateSlotStatus(slot.id, 'maintenance')
                                        },
                                        {
                                          label: 'Set Diduduki',
                                          disabled: slot.status === 'occupied',
                                          onClick: () => onUpdateSlotStatus(slot.id, 'occupied')
                                        }
                                      ]
                                    : []),
                                  {
                                    label: 'Edit Unit Kiosk',
                                    dividerBefore: Boolean(onUpdateSlotStatus),
                                    onClick: () => setEditingSlot(slot)
                                  },
                                  {
                                    label: 'Padam Unit Kiosk',
                                    tone: 'danger',
                                    onClick: () =>
                                      confirmDelete({
                                        itemName: `${slot.code} · ${slot.name}`,
                                        itemType: 'Slot Kiosk',
                                        onConfirm: () => handleDeleteSlotRecord(slot)
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
                    currentPage={facilitySlotsPagination.currentPage}
                    totalItems={facilitySlotsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={facilitySlotsPagination.setCurrentPage}
                    itemLabel="unit kiosk"
                    accent="rose"
                  />
                </>
              )}
            </div>
          </div>

          {/* Aduan & Tiket Penyelenggaraan Penyewa */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-black dark:text-white/75" />
                  <span>Tiket Aduan Penyelenggaraan Penyewa ({maintenanceTickets.length})</span>
                </h4>
                <p className="text-sm text-black/70 dark:text-white/75">
                  Kemas kini status baik pulih, sunting atau padam aduan kerosakan teknikal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTicket(null);
                  setShowCreateTicket(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tiket Aduan</span>
              </button>
            </div>

            {maintenanceTickets.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-black/70 dark:text-white/75">
                Tiada aduan kerosakan aktif diterima daripada penyewa buat masa ini.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
                <ReferenceTableToolbar
                  searchValue={ticketSearch}
                  onSearchChange={setTicketSearch}
                  searchPlaceholder="Cari kod kiosk, pelapor atau kategori aduan..."
                  filterCount={(ticketStatusFilter !== 'all' ? 1 : 0) + (ticketSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)}
                  onResetFilters={() => {
                    setTicketStatusFilter('all');
                    setTicketSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  sortOptions={
                    ticketSortPreset === 'table_column'
                      ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...ticketSortOptions]
                      : ticketSortOptions
                  }
                  sortValue={ticketSortPreset === 'table_column' ? '' : ticketSortPreset}
                  onSortChange={(val) => {
                    if (val) setTicketSortPreset(val);
                  }}
                  filterContent={
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                        Status Tiket Aduan
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { id: 'all', label: 'Semua' },
                          { id: 'received', label: 'Diterima' },
                          { id: 'in_progress', label: 'Sedang Dibaiki' },
                          { id: 'resolved', label: 'Selesai' }
                        ] as const).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTicketStatusFilter(opt.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                              ticketStatusFilter === opt.id
                                ? 'bg-blue-600 border-blue-600 text-white'
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

                {sortedTickets.length === 0 ? (
                  <div className="py-10 px-6 text-center space-y-2">
                    <Wrench className="w-8 h-8 text-black/30 dark:text-white/30 mx-auto" />
                    <p className="text-sm font-bold text-black dark:text-white">
                      Tiada tiket aduan sepadan dengan carian atau penapis.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTicketSearch('');
                        setTicketStatusFilter('all');
                        setTicketSortPreset(DEFAULT_SORT_VALUE);
                      }}
                      className="mt-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
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
                                onClick={() => toggleTicketSort('slotCode')}
                                className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                              >
                                <span>Kiosk &amp; Pelapor</span>
                                <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                              </button>
                            </th>
                            <th className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => toggleTicketSort('issueCategory')}
                                className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                              >
                                <span>Kategori &amp; Aduan</span>
                                <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                              </button>
                            </th>
                            <th className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => toggleTicketSort('status')}
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
                          {ticketsPagination.paginatedItems.map((ticket) => {
                            const isExpanded = expandedTicketIds.includes(ticket.id);
                            const isBusy = actionLoading === ticket.id;
                            return (
                              <React.Fragment key={ticket.id}>
                                <tr className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                                  <td className="py-3.5 pl-5 pr-3">
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                      <div className="w-10 h-10 rounded-xl shrink-0 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 flex items-center justify-center text-amber-700 dark:text-amber-300">
                                        <Wrench className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-black dark:text-white truncate max-w-[220px]">
                                          {ticket.slotCode} · {ticket.kioskName}
                                        </p>
                                        <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[220px]">
                                          {ticket.reporterName}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <p className="font-medium text-black dark:text-white truncate max-w-[240px]">
                                      {ticket.issueCategory}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[280px]">
                                      {ticket.description}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        ticket.status === 'resolved'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                          : ticket.status === 'in_progress'
                                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                      }`}
                                    >
                                      {ticket.status === 'resolved'
                                        ? 'Selesai'
                                        : ticket.status === 'in_progress'
                                        ? 'Sedang Dibaiki'
                                        : 'Diterima'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pl-2 pr-5 text-right">
                                    <RowActionMenu
                                      ariaLabel={`Tindakan untuk tiket ${ticket.slotCode}`}
                                      items={[
                                        {
                                          label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran Aduan',
                                          onClick: () => toggleExpandedId(setExpandedTicketIds, ticket.id)
                                        },
                                        {
                                          label: 'Set Sedang Dibaiki',
                                          disabled: isBusy || ticket.status === 'in_progress',
                                          onClick: () => handleDirectTicketStatus(ticket, 'in_progress')
                                        },
                                        {
                                          label: 'Tandakan Selesai',
                                          tone: 'accent',
                                          disabled: isBusy || ticket.status === 'resolved',
                                          onClick: () => handleDirectTicketStatus(ticket, 'resolved')
                                        },
                                        ...(ticket.status !== 'received'
                                          ? [
                                              {
                                                label: 'Set Diterima',
                                                disabled: isBusy,
                                                onClick: () => handleDirectTicketStatus(ticket, 'received')
                                              }
                                            ]
                                          : []),
                                        {
                                          label: 'Edit Tiket Aduan',
                                          dividerBefore: true,
                                          onClick: () => setEditingTicket(ticket)
                                        },
                                        {
                                          label: 'Padam Tiket Aduan',
                                          tone: 'danger',
                                          onClick: () =>
                                            confirmDelete({
                                              itemName: `${ticket.slotCode} · ${ticket.issueCategory}`,
                                              itemType: 'Tiket Aduan Fasiliti',
                                              onConfirm: () => handleDeleteTicketRecord(ticket)
                                            })
                                        }
                                      ]}
                                    />
                                  </td>
                                </tr>

                                {isExpanded && (
                                  <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                    <td colSpan={4} className="px-5 py-3.5 space-y-2.5">
                                      <p className="text-sm text-black dark:text-white leading-relaxed">{ticket.description}</p>
                                      <p className="text-xs text-black/70 dark:text-white/75">
                                        Pelapor: <strong className="text-black dark:text-white">{ticket.reporterName}</strong> ({ticket.reporterPhone})
                                      </p>
                                      {onUpdateTicketStatus && ticket.status !== 'resolved' && (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                          {ticket.status === 'received' && (
                                            <button
                                              type="button"
                                              onClick={() => onUpdateTicketStatus(ticket.id, 'in_progress', 'Juruteknik telah ditugaskan untuk pemeriksaan.')}
                                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                                            >
                                              Tugaskan Juruteknik
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => onUpdateTicketStatus(ticket.id, 'resolved', 'Kerja baik pulih selesai dan disahkan.')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                          >
                                            Tandakan Selesai
                                          </button>
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
                      currentPage={ticketsPagination.currentPage}
                      totalItems={ticketsPagination.totalItems}
                      itemsPerPage={7}
                      onPageChange={ticketsPagination.setCurrentPage}
                      itemLabel="tiket aduan"
                      accent="rose"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEMAND HEATMAP & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
            <span className="text-sm font-bold text-black dark:text-white block mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Peta Haba Permintaan Lokasi Kiosk (Berdasarkan Carian & Permohonan Belia)
            </span>
            <div className="flex flex-col gap-2.5">
              {Object.entries(districtDemandCount).map(([location, count]) => (
                <div key={location} className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                  <span className="font-medium text-black dark:text-white">
                    {location}
                  </span>
                  <span className="font-bold text-black dark:text-white/75 tabular-nums">
                    {count} Permohonan
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
            <span className="text-sm font-bold text-black dark:text-white block mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Integriti & Garis Panduan Tatakelola Negeri
            </span>
            <p className="text-[0.9375rem] text-black dark:text-white/75 leading-relaxed mb-3">
              Setiap kelulusan yang dibuat oleh pegawai direkodkan dengan cap masa antarabangsa, alamat sesi pentadbir, dan terikat dengan Akta Perlindungan Data Peribadi (PDPA 2010).
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 text-sm text-black dark:text-white">
              ✓ Semua permohonan yang diluluskan secara automatik menjana Surat Tawaran Digital rasmi berkod QR untuk semakan pihak berkuasa tempatan (PBT).
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: OFFICIAL APPROVAL REPORT (PDF & CETAKAN) */}
      <OfficialApprovalReportModal
        isOpen={showOfficialReport}
        onClose={() => setShowOfficialReport(false)}
        bookings={bookings}
        grantApplications={grantApplications}
      />

      {/* MODAL 2: TAMBAH KAPSUL NIAGA OLEH PENTADBIR */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[90vh] overflow-y-auto overflow-hidden">
            <div className="kbelia-important-header px-6 py-5 sm:px-7 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-blue-600 text-black dark:text-white/75 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">Tambah Kiosk Baharu</h3>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Daftarkan kiosk untuk permohonan belia Kelantan</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddSlotModal(false)}
                className="text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 sm:p-7 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Kod Kiosk <span className="text-black dark:text-white">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan kod kiosk"
                    value={slotCode}
                    onChange={(e) => setSlotCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Daerah <span className="text-black dark:text-white">*</span></label>
                  <select
                    value={slotDistrict}
                    onChange={(e) => setSlotDistrict(e.target.value as KelantanDistrict)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  >
                    {(['Kota Bharu', 'Bachok', 'Pasir Mas', 'Tumpat', 'Tanah Merah', 'Machang', 'Pasir Puteh', 'Kuala Krai', 'Gua Musang', 'Jeli'] as KelantanDistrict[]).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Nama Kiosk <span className="text-black dark:text-white">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama kiosk"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Lokasi Hab</label>
                <input
                  type="text"
                  placeholder="Masukkan lokasi hab"
                  value={slotHub}
                  onChange={(e) => setSlotHub(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Kadar Sewa Bulanan <span className="text-black dark:text-white">*</span></label>
                  <input
                    type="number"
                    required
                    min="50"
                    placeholder="Masukkan kadar sewa bulanan"
                    value={slotMonthlyRate}
                    onChange={(e) => setSlotMonthlyRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Saiz Kiosk</label>
                  <input
                    type="text"
                    placeholder="Masukkan saiz kiosk"
                    value={slotSize}
                    onChange={(e) => setSlotSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Kemudahan Disediakan</label>
                <input
                  type="text"
                  placeholder="Masukkan senarai kemudahan"
                  value={slotAmenities}
                  onChange={(e) => setSlotAmenities(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <ImageDropzone
                  label="Gambar Kiosk"
                  value={slotImageUrl}
                  onChange={(val) => setSlotImageUrl(val)}
                  aspectRatio="landscape"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 dark:bg-blue-600"
                >
                  {savingSlot ? 'Menyimpan...' : 'Terbitkan Kiosk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH PROGRAM & GERAN OLEH PENTADBIR */}
      {showAddProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 max-h-[90vh] overflow-y-auto overflow-hidden">
            <div className="kbelia-important-header px-6 py-5 sm:px-7 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-emerald-600 text-black dark:text-white/75 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">Tambah Program / Geran Baharu</h3>
                  <p className="text-[0.9375rem] text-black/70 dark:text-white/75">Buka permohonan dana dan inisiatif latihan belia</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddProgramModal(false)}
                className="text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 sm:p-7 space-y-4 text-sm">
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Tajuk Program <span className="text-black dark:text-white">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan tajuk program"
                  value={progTitle}
                  onChange={(e) => setProgTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Kategori Program</label>
                  <select
                    value={progCategory}
                    onChange={(e) => setProgCategory(e.target.value as YouthProgram['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                  >
                    <option value="Geran & Dana">Geran & Dana</option>
                    <option value="Bengkel & Latihan">Bengkel & Latihan</option>
                    <option value="Inkubator Perniagaan">Inkubator Perniagaan</option>
                    <option value="Bimbingan Mentor">Bimbingan Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Peruntukan Dana</label>
                  <input
                    type="text"
                    placeholder="Masukkan peruntukan dana"
                    value={progAmount}
                    onChange={(e) => setProgAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Tarikh Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Masukkan tarikh pelaksanaan"
                    value={progDate}
                    onChange={(e) => setProgDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Penganjur</label>
                  <input
                    type="text"
                    placeholder="Masukkan nama penganjur"
                    value={progOrganizer}
                    onChange={(e) => setProgOrganizer(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Lokasi</label>
                <input
                  type="text"
                  placeholder="Masukkan lokasi"
                  value={progLocation}
                  onChange={(e) => setProgLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Keterangan Program</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan keterangan program"
                  value={progDesc}
                  onChange={(e) => setProgDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProgram}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 dark:bg-blue-600"
                >
                  {savingProgram ? 'Menyimpan...' : 'Terbitkan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL PENGESAHAN: "Adakah anda ingin tolak? Ya / Tidak"              */}
      {/* ========================================================================= */}
      {rejectModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 transition-all scale-100 overflow-hidden">
            {/* Header with warning icon */}
            <div className="kbelia-important-header px-6 pt-6 sm:px-7 sm:pt-7 pb-4 border-b border-slate-300 dark:border-slate-600 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-black dark:bg-rose-950/60 dark:text-white/75 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white leading-tight">
                    Adakah anda ingin tolak?
                  </h3>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75 mt-0.5">
                    Pengesahan Pengurusan Kiosk Pentadbiran Niaga Belia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelReject}
                className="p-1 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup & Kembali"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-7">
              {/* Target Application Summary Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 space-y-2 mb-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-black/70 dark:text-white/75">Nama Pemohon:</span>
                  <span className="font-bold text-black dark:text-white">{rejectModalData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black/70 dark:text-white/75">Perniagaan:</span>
                  <span className="font-semibold text-black dark:text-white">{rejectModalData.business}</span>
                </div>
                {rejectModalData.slotOrProgram && (
                  <div className="flex justify-between items-center">
                    <span className="text-black/70 dark:text-white/75">Kiosk / Lokasi:</span>
                    <span className="font-mono text-black dark:text-white/75 font-bold">{rejectModalData.slotOrProgram}</span>
                  </div>
                )}
              </div>

              <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed mb-6">
                Adakah anda pasti ingin menolak permohonan ini? Jika anda memilih <strong>Ya</strong>, permohonan ini akan ditolak dan dikeluarkan serta-merta daripada senarai permohonan ini.
              </p>

              {/* "Ya" atau "Tidak" Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCancelReject}
                  className="w-full py-2.5 px-4 rounded-xl text-sm sm:text-[0.9375rem] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-black dark:text-white border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="w-full py-2.5 px-4 rounded-xl text-sm sm:text-[0.9375rem] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ya</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT / CREATE MODALS FOR APPROVAL QUEUE */}
      <EditBookingModal
        isOpen={Boolean(editingBooking) || showCreateBooking}
        booking={showCreateBooking ? null : editingBooking}
        slots={slots}
        onClose={() => {
          setEditingBooking(null);
          setShowCreateBooking(false);
        }}
        onSaved={() => {
          showToast(showCreateBooking ? 'Permohonan kiosk baharu ditambah!' : 'Permohonan kiosk dikemas kini!', 'success');
          setEditingBooking(null);
          setShowCreateBooking(false);
          onRefresh?.();
        }}
      />

      <EditGrantModal
        isOpen={Boolean(editingGrant) || showCreateGrant}
        grant={showCreateGrant ? null : editingGrant}
        onClose={() => {
          setEditingGrant(null);
          setShowCreateGrant(false);
        }}
        onSaved={() => {
          showToast(showCreateGrant ? 'Permohonan geran baharu ditambah!' : 'Permohonan geran dikemas kini!', 'success');
          setEditingGrant(null);
          setShowCreateGrant(false);
          onRefresh?.();
        }}
      />

      <EditMaintenanceTicketModal
        isOpen={Boolean(editingTicket) || showCreateTicket}
        ticket={showCreateTicket ? null : editingTicket}
        slots={slots}
        onClose={() => {
          setEditingTicket(null);
          setShowCreateTicket(false);
        }}
        onSaved={() => {
          showToast(showCreateTicket ? 'Tiket aduan baharu ditambah!' : 'Tiket aduan dikemas kini!', 'success');
          setEditingTicket(null);
          setShowCreateTicket(false);
          onRefresh?.();
        }}
      />

      <EditSlotModal
        isOpen={Boolean(editingSlot)}
        slot={editingSlot}
        onClose={() => setEditingSlot(null)}
        onSaved={() => {
          showToast('Maklumat slot kiosk berjaya dikemas kini!', 'success');
          setEditingSlot(null);
          onRefresh?.();
        }}
      />
    </div>
  );
};
