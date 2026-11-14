import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  FileText, 
  Store, 
  Coins, 
  Filter, 
  MessageSquare,
  ShieldCheck,
  Wrench,
  Search,
  Database,
  TrendingUp,
  MapPin,
  Building2,
  Printer,
  Check,
  LayoutDashboard,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CapsuleBooking, GrantApplication, CapsuleSlot, KelantanDistrict, YouthProgram, MaintenanceTicket } from '../types';
import { maskMyKad } from '../utils/securityUtils';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import { OfficialApprovalReportModal } from './OfficialApprovalReportModal';
import { saveCapsuleSlot, saveProgram } from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { ImageDropzone } from './ImageDropzone';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage, resolveSlotImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'kiosks' | 'grants' | 'facility' | 'audit'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Filter Bookings directly by statusFilter so real-time updates reflect consistently across tabs
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = statusFilter === 'all' 
      ? b.status !== 'rejected' 
      : b.status === statusFilter;
    const matchSearch = (b.applicantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (b.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (b.slotCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (b.hubLocation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Filter Grants directly by statusFilter
  const filteredGrants = grantApplications.filter((g) => {
    const matchStatus = statusFilter === 'all' 
      ? g.status !== 'rejected' 
      : g.status === statusFilter;
    const matchSearch = (g.applicantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (g.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (g.programTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );
  const sortedGrants = [...filteredGrants].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );
  const ticketOrder: Record<string, number> = { received: 0, in_progress: 1, resolved: 2 };
  const sortedTickets = [...maintenanceTickets].sort(
    (a, b) => (ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3)
  );

  const bookingsPagination = usePagination(sortedBookings, 5, [
    statusFilter,
    searchQuery,
    sortedBookings.length
  ]);
  const grantsPagination = usePagination(sortedGrants, 5, [
    statusFilter,
    searchQuery,
    sortedGrants.length
  ]);
  const facilitySlotsPagination = usePagination(slots, 5, [slots.length]);
  const ticketsPagination = usePagination(sortedTickets, 5, [sortedTickets.length]);

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
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-6 md:p-8 shadow-xs overflow-hidden">
      {/* Top Controls & Navigation (Important Header Only) */}
      <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8 px-6 pt-6 md:px-8 md:pt-8 pb-6 mb-6 kbelia-important-header border-b border-slate-300 dark:border-slate-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-black dark:text-white/75">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Pusat Kawalan & Kelulusan Rasmi Pegawai
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-xs text-black/70 dark:text-white/75 font-medium">
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
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer dark:bg-blue-600"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Daftar Kiosk Niaga</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddProgramModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Terbitkan Program & Geran</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOfficialReport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-black dark:text-white bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Muat turun ringkasan rasmi kelulusan"
          >
            <Printer className="w-3.5 h-3.5 text-black dark:text-white/75" />
            <span>Muat Turun Ringkasan Permohonan Berjaya (PDF Rasmi)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Segmented Controls */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Pusat Kawalan 3-Kolum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kiosks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'kiosks'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Permohonan Kiosk ({bookings.filter(b => b.status === 'pending').length} Menunggu)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'grants'
              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Permohonan Dana Geran ({grantApplications.filter(g => g.status === 'pending').length} Menunggu)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('facility')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'facility'
              ? 'bg-rose-600 text-white shadow-sm dark:bg-rose-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Kawalan Fasiliti Kiosk ({slots.length} Unit)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Peta Haba Permintaan & Audit
        </button>
      </div>

      {/* TAB 0: 3-COLUMN OVERVIEW MATCHING WIREFRAME */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Kolum 1: Permohonan Sewa Kiosk */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-sm font-bold text-black dark:text-white">
                    Permohonan Sewa Kiosk
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200/80">
                  {bookings.filter(b => b.status === 'pending').length} Menunggu
                </span>
              </div>

              {/* Booking items list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {bookings.filter(b => b.status === 'pending').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50">
                    <CheckCircle2 className="w-8 h-8 text-black/70 dark:text-white/75 mx-auto mb-1 opacity-70" />
                    <p className="text-xs font-bold text-black dark:text-white">Semua Permohonan Selesai Disemak</p>
                    <p className="text-[10px] text-black/70 dark:text-white/75 mt-0.5">Tiada permohonan baru menunggu kelulusan.</p>
                  </div>
                ) : (
                  bookings.filter(b => b.status === 'pending').slice(0, 5).map(b => (
                    <div key={b.id} className="p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-black dark:text-white">{b.slotCode}</span>
                            <span className="text-[10px] text-black/70 dark:text-white/75">· {b.hubLocation.split(' ')[0]}</span>
                          </div>
                          <h5 className="text-xs font-bold text-black dark:text-white">{b.businessName}</h5>
                          <p className="text-[10px] text-black/70 dark:text-white/75">{b.applicantName} · {b.businessCategory}</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-black">Menunggu</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-300 dark:border-slate-600">
                        <button
                          type="button"
                          onClick={() => setRejectModalData({ type: 'kiosk', id: b.id, name: b.applicantName, business: b.businessName, slotOrProgram: b.slotCode })}
                          className="px-2 py-1 rounded text-[10px] font-semibold text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveBooking(b.id)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Luluskan</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-black/70 dark:text-white/75">Sewaan Kiosk Belia</span>
              <button
                type="button"
                onClick={() => setActiveTab('kiosks')}
                className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Lihat Semua ({bookings.length})
              </button>
            </div>
          </div>

          {/* Kolum 2: Permohonan Dana & Geran Belia */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-sm font-bold text-black dark:text-white">
                    Permohonan Geran dan Pembiayaan Belia
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200">
                  {grantApplications.filter(g => g.status === 'pending').length} Menunggu
                </span>
              </div>

              {/* Grant items list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {grantApplications.filter(g => g.status === 'pending').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50">
                    <Award className="w-8 h-8 text-black/70 dark:text-white/75 mx-auto mb-1 opacity-70" />
                    <p className="text-xs font-bold text-black dark:text-white">Tiada Permohonan Geran Tertangguh</p>
                    <p className="text-[10px] text-black/70 dark:text-white/75 mt-0.5">Semua semakan kelayakan pembiayaan telah diproses.</p>
                  </div>
                ) : (
                  grantApplications.filter(g => g.status === 'pending').slice(0, 5).map(g => (
                    <div key={g.id} className="p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-black dark:text-white">{g.grantAmount || 'RM 3,000'}</span>
                            <span className="text-[10px] text-black/70 dark:text-white/75">· {g.district || g.businessCategory || 'Kelantan'}</span>
                          </div>
                          <h5 className="text-xs font-bold text-black dark:text-white">{g.programTitle}</h5>
                          <p className="text-[10px] text-black/70 dark:text-white/75">{g.applicantName} ({g.businessName})</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-black">Menunggu</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-300 dark:border-slate-600">
                        <button
                          type="button"
                          onClick={() => setRejectModalData({ type: 'grant', id: g.id, name: g.applicantName, business: g.businessName, slotOrProgram: g.programTitle })}
                          className="px-2 py-1 rounded text-[10px] font-semibold text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveGrant(g.id)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Luluskan</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-black/70 dark:text-white/75">Dana & Pemangkin Belia</span>
              <button
                type="button"
                onClick={() => setActiveTab('grants')}
                className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Lihat Semua ({grantApplications.length})
              </button>
            </div>
          </div>

          {/* Kolum 3: Kawalan Fasiliti Kiosk & Tindakan Pantas */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-sm font-bold text-black dark:text-white">
                    Fasiliti & Tindakan Pantas
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white border border-indigo-200">
                  {slots.length} Unit Pod
                </span>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-[10px] text-black/70 dark:text-white/75 block font-medium">Kosong</span>
                  <span className="font-mono text-sm font-bold text-black dark:text-white">{slots.filter(s => s.status === 'available').length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-[10px] text-black/70 dark:text-white/75 block font-medium">Disewa</span>
                  <span className="font-mono text-sm font-bold text-black dark:text-white">{slots.filter(s => s.status === 'occupied').length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-[10px] text-black/70 dark:text-white/75 block font-medium">Selenggara</span>
                  <span className="font-mono text-sm font-bold text-black dark:text-white">{slots.filter(s => s.status === 'maintenance').length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(true)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer dark:bg-blue-600"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Daftar Kiosk Niaga Baharu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(true)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-black bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span>Terbitkan Program & Geran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOfficialReport(true)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span>Cetak Laporan PDF Rasmi</span>
                </button>
              </div>

              {/* Recent Slots snippet */}
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-black/70 dark:text-white/75 uppercase tracking-wider block">Kiosk Diurus:</span>
                {slots.slice(0, 4).map(slot => (
                  <div key={slot.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                    <span className="font-bold text-black dark:text-white">{slot.name} ({slot.code})</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${slot.status === 'available' ? 'bg-emerald-100 text-black' : 'bg-amber-100 text-black'}`}>
                      {slot.status === 'available' ? 'Kosong' : 'Disewa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-600 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-black/70 dark:text-white/75">Pusat Audit PBT & SUK</span>
              <button
                type="button"
                onClick={() => setActiveTab('facility')}
                className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer"
              >
                Urus Fasiliti
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Filter & Search Bar */}
      {(activeTab === 'kiosks' || activeTab === 'grants') && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75" />
            <input
              type="text"
              placeholder="Cari nama pemohon, perniagaan, atau kod..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-rose-600 dark:focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-rose-600 text-white dark:bg-rose-600'
                    : 'text-black dark:text-white hover:text-black dark:hover:text-white'
                }`}
              >
                {st === 'all' ? 'Semua' : st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Lulus' : 'Ditolak'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: KIOSK BOOKINGS */}
      {activeTab === 'kiosks' && (
        <div className="space-y-3">
          {sortedBookings.length === 0 ? (
            <div className="text-center py-12 text-black/70 dark:text-white/75 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
              Tiada rekod permohonan kiosk sepadan dengan tapisan semasa.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                {bookingsPagination.paginatedItems.map((booking) => {
                  const isActioning = actionLoading === booking.id;
                  const isExpanded = expandedKioskIds.includes(booking.id);
                  return (
                    <div key={booking.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shrink-0">
                            <PortalImage
                              src={resolveBookingKioskImage(booking, slots)}
                              alt={`Reka bentuk kiosk ${booking.slotName}`}
                              fallbackType="kiosk"
                              fallbackLabel={booking.slotCode}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-mono font-bold text-black dark:text-white/85">
                                {booking.slotCode}
                              </span>
                              <span className="text-black/35 dark:text-white/35">·</span>
                              <span className="font-semibold text-black/75 dark:text-white/75 truncate">
                                {booking.hubLocation}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-black dark:text-white truncate mt-0.5">
                              {booking.businessName} — {booking.applicantName}
                            </h4>
                            <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 truncate tabular-nums">
                              {booking.businessCategory} · {booking.durationMonths} bln · Mula {formatDisplayDate(booking.startDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            booking.status === 'approved'
                              ? 'bg-emerald-100 text-black dark:bg-emerald-950/60 dark:text-white'
                              : booking.status === 'rejected'
                                ? 'bg-rose-100 text-black dark:bg-rose-950/60 dark:text-white'
                                : 'bg-amber-100 text-black dark:bg-amber-950/60 dark:text-white'
                          }`}>
                            {booking.status === 'approved' ? 'Diluluskan' : booking.status === 'rejected' ? 'Ditolak' : 'Menunggu Semakan'}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleExpandedId(setExpandedKioskIds, booking.id)}
                            aria-expanded={isExpanded}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                          <div className="text-xs text-black/75 dark:text-white/80 tabular-nums">
                            Tempoh Operasi: <strong className="text-black dark:text-white">{booking.durationMonths} Bulan</strong> · Mula: <strong className="text-black dark:text-white">{formatDisplayDate(booking.startDate)}</strong> · Akhir: <strong className="text-black dark:text-white">{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</strong>
                          </div>

                          {booking.pitchNotes && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-black dark:text-white">
                              <span className="font-semibold block mb-0.5 text-black dark:text-white">
                                Penerangan Perniagaan & Cadangan Jualan:
                              </span>
                              {booking.pitchNotes}
                            </div>
                          )}

                          {/* Admin Notes & Action Bar */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Tulis ulasan pegawai sebelum meluluskan..."
                                value={adminNoteInput[booking.id] ?? (booking.adminNotes || '')}
                                onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [booking.id]: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => handleApproveBooking(booking.id)}
                                className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Luluskan & Jana Tawaran
                              </button>

                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => {
                                  setRejectModalData({
                                    type: 'kiosk',
                                    id: booking.id,
                                    name: booking.applicantName,
                                    business: booking.businessName,
                                    slotOrProgram: `${booking.slotCode} (${booking.hubLocation})`
                                  });
                                }}
                                className="py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                currentPage={bookingsPagination.currentPage}
                totalItems={bookingsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={bookingsPagination.setCurrentPage}
                itemLabel="permohonan kiosk"
                accent="rose"
              />
            </>
          )}
        </div>
      )}

      {/* TAB 2: GRANT APPLICATIONS */}
      {activeTab === 'grants' && (
        <div className="space-y-3">
          {sortedGrants.length === 0 ? (
            <div className="text-center py-12 text-black/70 dark:text-white/75 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
              Tiada rekod permohonan dana geran sepadan dengan tapisan semasa.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                {grantsPagination.paginatedItems.map((grant) => {
                  const isActioning = actionLoading === grant.id;
                  const isExpanded = expandedGrantIds.includes(grant.id);
                  return (
                    <div key={grant.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs mb-0.5">
                            <span className="font-bold text-black dark:text-white/85 tabular-nums">
                              {grant.grantAmount}
                            </span>
                            <span className="text-black/35 dark:text-white/35">·</span>
                            <span className="font-semibold text-black/80 dark:text-white/80 truncate">
                              {grant.programTitle}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-black dark:text-white truncate">
                            {grant.businessName} — {grant.applicantName}
                          </h4>
                          <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 truncate">
                            {grant.businessCategory} · SSM: {grant.ssmNumber || 'Dikecualikan'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            grant.status === 'approved'
                              ? 'bg-emerald-100 text-black dark:bg-emerald-950/60 dark:text-white'
                              : grant.status === 'rejected'
                                ? 'bg-rose-100 text-black dark:bg-rose-950/60 dark:text-white'
                                : 'bg-amber-100 text-black dark:bg-amber-950/60 dark:text-white'
                          }`}>
                            {grant.status === 'approved' ? 'Diluluskan' : grant.status === 'rejected' ? 'Ditolak' : 'Menunggu Semakan'}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleExpandedId(setExpandedGrantIds, grant.id)}
                            aria-expanded={isExpanded}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                          <div className="text-xs text-black/75 dark:text-white/80">
                            Akaun Bank: <strong className="text-black dark:text-white">{grant.bankName}</strong> ({grant.bankAccountNumber})
                          </div>

                          {grant.fundPurpose && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-black dark:text-white">
                              <span className="font-semibold block mb-0.5 text-black dark:text-white">
                                Cadangan Penggunaan Dana:
                              </span>
                              {grant.fundPurpose}
                            </div>
                          )}

                          {/* Admin Notes & Action Bar */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Tulis catatan pegawai sebelum meluluskan..."
                                value={adminNoteInput[grant.id] ?? (grant.adminNotes || '')}
                                onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [grant.id]: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => handleApproveGrant(grant.id)}
                                className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Luluskan Dana Geran
                              </button>

                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => {
                                  setRejectModalData({
                                    type: 'grant',
                                    id: grant.id,
                                    name: grant.applicantName,
                                    business: grant.businessName,
                                    slotOrProgram: `${grant.programTitle} (${grant.grantAmount})`
                                  });
                                }}
                                className="py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                currentPage={grantsPagination.currentPage}
                totalItems={grantsPagination.totalItems}
                itemsPerPage={5}
                onPageChange={grantsPagination.setCurrentPage}
                itemLabel="permohonan geran"
                accent="rose"
              />
            </>
          )}
        </div>
      )}

      {/* TAB 3: FACILITY & KIOSK MAINTENANCE CONTROL */}
      {activeTab === 'facility' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilitySlotsPagination.paginatedItems.map((slot) => (
                <div 
                  key={slot.id}
                  className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600">
                      <PortalImage
                        src={resolveSlotImage(slot)}
                        alt={slot.name}
                        fallbackType="kiosk"
                        fallbackLabel={slot.code}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-black dark:text-white/75">
                          {slot.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          slot.status === 'available'
                            ? 'bg-emerald-100 text-black dark:bg-emerald-950/60 dark:text-white'
                            : slot.status === 'maintenance'
                              ? 'bg-amber-100 text-black dark:bg-amber-950/60 dark:text-white'
                              : 'bg-slate-100 text-black border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                        }`}>
                          {slot.status === 'available' ? 'Tersedia' : slot.status === 'maintenance' ? 'Dalam Pembaikan' : 'Diduduki'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                        {slot.name}
                      </h4>
                      <p className="text-xs text-black/70 dark:text-white/75 tabular-nums">
                        {slot.hubLocation} ({slot.district}) · RM{slot.monthlyRate}/bln
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Controls */}
                  {onUpdateSlotStatus && (
                    <div className="px-4 pb-4 pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateSlotStatus(slot.id, 'available')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          slot.status === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white/75 hover:bg-emerald-50 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Buka
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSlotStatus(slot.id, 'maintenance')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          slot.status === 'maintenance'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Baiki
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSlotStatus(slot.id, 'occupied')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          slot.status === 'occupied'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Isi
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <PaginationBar
              currentPage={facilitySlotsPagination.currentPage}
              totalItems={facilitySlotsPagination.totalItems}
              itemsPerPage={5}
              onPageChange={facilitySlotsPagination.setCurrentPage}
              itemLabel="unit kiosk"
              accent="rose"
            />
          </div>

          {/* Aduan & Tiket Penyelenggaraan Penyewa */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-black dark:text-white/75" />
                  <span>Tiket Aduan Penyelenggaraan Penyewa ({sortedTickets.length})</span>
                </h4>
                <p className="text-xs text-black/70 dark:text-white/75">
                  Kemas kini status baik pulih aduan kerosakan teknikal daripada usahawan kapsul.
                </p>
              </div>
            </div>

            {sortedTickets.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-black/70 dark:text-white/75">
                Tiada aduan kerosakan aktif diterima daripada penyewa buat masa ini.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
                  {ticketsPagination.paginatedItems.map((ticket) => {
                    const isExpanded = expandedTicketIds.includes(ticket.id);
                    return (
                      <div key={ticket.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-black dark:text-white/75">{ticket.slotCode}</span>
                              <span className="text-xs font-bold text-black dark:text-white">{ticket.kioskName}</span>
                              <span className="text-[11px] text-black/70 dark:text-white/75">· {ticket.issueCategory}</span>
                            </div>
                            <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 truncate">
                              Pelapor: {ticket.reporterName} · {ticket.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap ${
                              ticket.status === 'resolved'
                                ? 'bg-emerald-100 text-black dark:bg-emerald-950/60 dark:text-white'
                                : ticket.status === 'in_progress'
                                  ? 'bg-amber-100 text-black dark:bg-amber-950/60 dark:text-white'
                                  : 'bg-amber-100 text-black dark:bg-indigo-600 dark:text-white'
                            }`}>
                              {ticket.status === 'resolved' ? 'Selesai' : ticket.status === 'in_progress' ? 'Sedang Dibaiki' : 'Diterima'}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleExpandedId(setExpandedTicketIds, ticket.id)}
                              aria-expanded={isExpanded}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Butiran'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                            <p className="text-xs text-black dark:text-white leading-relaxed">{ticket.description}</p>
                            <p className="text-[11px] text-black/70 dark:text-white/75">
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <PaginationBar
                  currentPage={ticketsPagination.currentPage}
                  totalItems={ticketsPagination.totalItems}
                  itemsPerPage={5}
                  onPageChange={ticketsPagination.setCurrentPage}
                  itemLabel="tiket aduan"
                  accent="rose"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEMAND HEATMAP & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
            <span className="text-xs font-bold text-black dark:text-white block mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Peta Haba Permintaan Lokasi Kiosk (Berdasarkan Carian & Permohonan Belia)
            </span>
            <div className="flex flex-col gap-2.5">
              {Object.entries(districtDemandCount).map(([location, count]) => (
                <div key={location} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
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
            <span className="text-xs font-bold text-black dark:text-white block mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Integriti & Garis Panduan Tatakelola Negeri
            </span>
            <p className="text-xs text-black dark:text-white/75 leading-relaxed mb-3">
              Setiap kelulusan yang dibuat oleh pegawai direkodkan dengan cap masa antarabangsa, alamat sesi pentadbir, dan terikat dengan Akta Perlindungan Data Peribadi (PDPA 2010).
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 text-xs text-black dark:text-white">
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
                  <p className="text-xs text-black/70 dark:text-white/75">Daftarkan kiosk untuk permohonan belia Kelantan</p>
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

            <form onSubmit={handleCreateSlot} className="p-6 sm:p-7 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Kod Kiosk / Pod *</label>
                  <input
                    type="text"
                    required
                    placeholder="cth: KB-POD-10"
                    value={slotCode}
                    onChange={(e) => setSlotCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Jajahan Kelantan *</label>
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
                <label className="block font-bold text-black dark:text-white mb-1">Nama Kiosk / Lokasi Premis *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Pod Komuniti Usahawan Medan Selera Bachok"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Hab Strategik</label>
                <input
                  type="text"
                  placeholder="cth: Hub UMK Kampus Bachok"
                  value={slotHub}
                  onChange={(e) => setSlotHub(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Kadar Sewa (RM/Bulan) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    placeholder="150"
                    value={slotMonthlyRate}
                    onChange={(e) => setSlotMonthlyRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Saiz Pod Kiosk</label>
                  <input
                    type="text"
                    placeholder="10ft x 10ft Smart Pod"
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
                  placeholder="Palam Elektrik 13A, WiFi 500Mbps, Rak Paparan"
                  value={slotAmenities}
                  onChange={(e) => setSlotAmenities(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <ImageDropzone
                  label="Gambar Kiosk"
                  sublabel="Seret & lepas gambar di sini atau klik untuk pilih dari galeri / fail peranti"
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
                  <p className="text-xs text-black/70 dark:text-white/75">Buka permohonan dana dan inisiatif latihan belia</p>
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

            <form onSubmit={handleCreateProgram} className="p-6 sm:p-7 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Tajuk Program / Geran *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Geran Pemula Digital Belia Kelantan 2026"
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
                  <label className="block font-bold text-black dark:text-white mb-1">Peruntukan Dana (RM)</label>
                  <input
                    type="text"
                    placeholder="RM3,000"
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
                    placeholder="Sepanjang Bulan"
                    value={progDate}
                    onChange={(e) => setProgDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black dark:text-white mb-1">Penganjur</label>
                  <input
                    type="text"
                    placeholder="Unit Keusahawanan Belia Kelantan"
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
                  placeholder="Hub Keusahawanan Belia Kelantan"
                  value={progLocation}
                  onChange={(e) => setProgLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Keterangan / Skop Inisiatif</label>
                <textarea
                  rows={3}
                  placeholder="Terangkan syarat kelayakan, objektif, dan manfaat program kepada belia..."
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
                  <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">
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
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 space-y-2 mb-4 text-xs">
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

              <p className="text-xs text-black dark:text-white leading-relaxed mb-6">
                Adakah anda pasti ingin menolak permohonan ini? Jika anda memilih <strong>Ya</strong>, permohonan ini akan ditolak dan dikeluarkan serta-merta daripada senarai permohonan ini.
              </p>

              {/* "Ya" atau "Tidak" Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCancelReject}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-black dark:text-white border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ya</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
