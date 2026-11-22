import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
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
  Clock,
  ShieldCheck,
  Compass,
  ClipboardList,
  Zap,
  Printer,
  Download,
  Wrench,
  QrCode,
  X,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CapsuleSlot,
  CapsuleBooking,
  BusinessCategory,
  PortalSettings,
  MaintenanceTicket,
  formatBusinessCategory
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  createCapsuleBooking,
  updateBookingStatus,
  createMaintenanceTicket,
  loadLocalPortalSettings
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import {
  resolveSlotImage,
  resolveBookingKioskImage,
  DEFAULT_KIOSK_IMAGE,
  STUDIO_KIOSK_IMAGE,
  kioskAgrotekImg,
  kioskKrafBatikImg,
  kioskKulinariImg
} from '../utils/visualAssets';
import { CapsuleGrid } from './CapsuleGrid';
import { ModernDatePicker } from './ModernDateTimePicker';
import { PaginationBar, usePagination } from './PaginationBar';
import { RowActionMenu, RowActionItem } from './ReferenceTableKit';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateOfficialReceiptHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
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
  maintenanceTickets?: MaintenanceTicket[];
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
  onOpenVerification?: (refCode?: string) => void;
  onOpenMaintenanceModal?: () => void;
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
  maintenanceTickets = [],
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
  onOpenTenancyAgreement,
  onOpenVerification,
  onOpenMaintenanceModal
}) => {
  const { user, userProfile, openLoginModal } = useAuth();

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

  const [bookHubFilter, setBookHubFilter] = useState<string>('Semua');

  const occupiedOrReservedCount = Math.max(0, safeAllSlots.length - availableSlots.length);

  const rateStats = useMemo(() => {
    const source = availableSlots.length > 0 ? availableSlots : safeAllSlots;
    const rates = source
      .map((s) => Number(s.monthlyRate) || 150)
      .filter((n) => Number.isFinite(n) && n > 0);
    if (rates.length === 0) {
      return { min: 150, max: 150, label: 'RM 150 / bulan' };
    }
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const label =
      min === max
        ? `RM ${min.toLocaleString('ms-MY')} / bulan`
        : `RM ${min.toLocaleString('ms-MY')} - RM ${max.toLocaleString('ms-MY')} / bln`;
    return { min, max, label };
  }, [availableSlots, safeAllSlots]);

  const hubBreakdown = useMemo(() => {
    const canonicalHubs = [
      { hubKey: 'Hab Usahawan Bachok', shortLabel: 'Bachok', match: ['bachok', 'umk'] },
      { hubKey: 'Hub Belia Kota Bharu', shortLabel: 'Kota Bharu', match: ['kota bharu', 'kb sentral'] },
      { hubKey: 'Hub Kraf Tumpat', shortLabel: 'Tumpat', match: ['tumpat'] },
      { hubKey: 'Hub Pasir Mas', shortLabel: 'Pasir Mas', match: ['pasir mas'] },
      { hubKey: 'Hub Komuniti Jeli', shortLabel: 'Jeli', match: ['jeli'] }
    ];

    const buckets = new Map<
      string,
      {
        hubKey: string;
        shortLabel: string;
        total: number;
        available: number;
        firstAvailableSlot: CapsuleSlot | null;
      }
    >();

    for (const slot of safeAllSlots) {
      if (!slot) continue;
      const locLower = (slot.hubLocation || '').toLowerCase();
      const distLower = (slot.district || '').toLowerCase();
      const matchedCanonical = canonicalHubs.find((h) =>
        h.match.some((kw) => locLower.includes(kw) || distLower === kw)
      );

      const hubKey = matchedCanonical?.hubKey || slot.hubLocation || slot.district || 'Lain-lain';
      const shortLabel = matchedCanonical?.shortLabel || slot.district || slot.hubLocation || 'Lain-lain';
      const isFree = slot.status === 'available' && !slot.currentTenantBusinessName;

      const existing = buckets.get(hubKey) || {
        hubKey,
        shortLabel,
        total: 0,
        available: 0,
        firstAvailableSlot: null
      };
      existing.total += 1;
      if (isFree) {
        existing.available += 1;
        if (!existing.firstAvailableSlot) existing.firstAvailableSlot = slot;
      }
      buckets.set(hubKey, existing);
    }

    return Array.from(buckets.values()).sort((a, b) => b.available - a.available || b.total - a.total);
  }, [safeAllSlots]);

  const filteredBookAvailableSlots = useMemo(() => {
    if (bookHubFilter === 'Semua') return availableSlots;
    const target = hubBreakdown.find((h) => h.hubKey === bookHubFilter);
    if (!target) return availableSlots;
    const shortLower = target.shortLabel.toLowerCase();
    return availableSlots.filter((slot) => {
      const locLower = (slot.hubLocation || '').toLowerCase();
      const distLower = (slot.district || '').toLowerCase();
      return (
        slot.hubLocation === target.hubKey ||
        locLower.includes(shortLower) ||
        distLower === shortLower ||
        (shortLower === 'bachok' && locLower.includes('umk')) ||
        (shortLower === 'kota bharu' && locLower.includes('kb sentral'))
      );
    });
  }, [availableSlots, bookHubFilter, hubBreakdown]);

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

  // Official Receipt & Facility Maintenance Complaint states (migrated into unified Kiosk Saya page)
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<CapsuleBooking | null>(null);
  const [maintenanceComplaintBooking, setMaintenanceComplaintBooking] = useState<CapsuleBooking | null>(null);
  const [complaintType, setComplaintType] = useState('Bekalan Elektrik 13A & Lampu');
  const [complaintNotes, setComplaintNotes] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  // Manage View ('Kiosk Saya') UI states
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<'about' | 'faq' | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [recordSearch, setRecordSearch] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'aduan' | 'permohonan'>('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState<'all' | 'active' | 'processing' | 'closed'>('all');
  const [recordSortBy, setRecordSortBy] = useState<'date_desc' | 'date_asc' | 'status'>('date_desc');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false);
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  const headerMenuRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const sortPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCarouselIdx(0);
  }, [activeBooking?.id]);

  useEffect(() => {
    if (!isHeaderMenuOpen && !isFilterPopoverOpen && !isSortPopoverOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isHeaderMenuOpen && headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setIsHeaderMenuOpen(false);
      }
      if (isFilterPopoverOpen && filterPopoverRef.current && !filterPopoverRef.current.contains(target)) {
        setIsFilterPopoverOpen(false);
      }
      if (isSortPopoverOpen && sortPopoverRef.current && !sortPopoverRef.current.contains(target)) {
        setIsSortPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHeaderMenuOpen(false);
        setIsFilterPopoverOpen(false);
        setIsSortPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHeaderMenuOpen, isFilterPopoverOpen, isSortPopoverOpen]);

  const userTickets = useMemo(() => {
    if (!user) return [];
    const userSlotCodes = new Set(myBookings.map((b) => b.slotCode).filter(Boolean));
    return [...(maintenanceTickets || [])]
      .filter((t) => {
        if (t.ownerId && t.ownerId === user.uid) return true;
        if (activeBooking?.slotCode && t.slotCode === activeBooking.slotCode) return true;
        if (userSlotCodes.has(t.slotCode) && t.reporterName && userProfile?.fullName && t.reporterName === userProfile.fullName) {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [maintenanceTickets, user, myBookings, activeBooking?.slotCode, userProfile?.fullName]);

  const activeBookingSlot = useMemo(() => {
    if (!activeBooking) return null;
    return (
      safeAllSlots.find((s) => s.id === activeBooking.slotId || s.code === activeBooking.slotCode) ||
      null
    );
  }, [activeBooking, safeAllSlots]);

  const galleryImages = useMemo(() => {
    const primaryImg = activeBooking
      ? resolveBookingKioskImage(activeBooking, safeAllSlots)
      : safeAllSlots[0]
      ? resolveSlotImage(safeAllSlots[0])
      : DEFAULT_KIOSK_IMAGE;
    const pool = [
      primaryImg,
      DEFAULT_KIOSK_IMAGE,
      STUDIO_KIOSK_IMAGE,
      kioskKulinariImg,
      kioskKrafBatikImg,
      kioskAgrotekImg
    ];
    return Array.from(new Set(pool)).slice(0, 4);
  }, [activeBooking, safeAllSlots]);

  const openTicketsCount = useMemo(
    () => userTickets.filter((t) => t.status === 'received' || t.status === 'in_progress').length,
    [userTickets]
  );
  const inProgressTicketsCount = useMemo(
    () => userTickets.filter((t) => t.status === 'in_progress').length,
    [userTickets]
  );
  const resolvedTicketsCount = useMemo(
    () => userTickets.filter((t) => t.status === 'resolved').length,
    [userTickets]
  );

  interface KioskManageRecord {
    id: string;
    refCode: string;
    title: string;
    subtext: string;
    location: string;
    type: 'Aduan' | 'Permohonan';
    dateISO: string;
    dateLabel: string;
    statusLabel: 'Aktif' | 'Diproses' | 'Diterima' | 'Selesai' | 'Batal';
    statusTone: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose';
    statusBucket: 'active' | 'processing' | 'closed';
    rawTicket?: MaintenanceTicket;
    rawBooking?: CapsuleBooking;
  }

  const combinedRecords = useMemo<KioskManageRecord[]>(() => {
    const formatShortDate = (iso?: string) => {
      if (!iso) return '-';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso.split('T')[0] || iso;
      return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const ticketRows: KioskManageRecord[] = userTickets.map((t) => {
      const statusLabel =
        t.status === 'resolved'
          ? 'Selesai'
          : t.status === 'in_progress'
          ? 'Diproses'
          : 'Diterima';
      const statusTone =
        t.status === 'resolved'
          ? 'emerald'
          : t.status === 'in_progress'
          ? 'blue'
          : 'amber';
      const statusBucket = t.status === 'resolved' ? 'closed' : 'processing';

      return {
        id: `ticket-${t.id}`,
        refCode: t.id.length > 10 ? `TIK-${t.id.slice(-4).toUpperCase()}` : t.id,
        title: t.issueCategory || 'Aduan Fasiliti',
        subtext: t.description,
        location: `${t.slotCode} · ${t.kioskName}`,
        type: 'Aduan',
        dateISO: t.createdAt || '',
        dateLabel: formatShortDate(t.createdAt),
        statusLabel,
        statusTone,
        statusBucket,
        rawTicket: t
      };
    });

    const bookingRows: KioskManageRecord[] = myBookings.map((b) => {
      const statusLabel =
        b.status === 'approved'
          ? 'Aktif'
          : b.status === 'pending'
          ? 'Diproses'
          : 'Batal';
      const statusTone =
        b.status === 'approved'
          ? 'emerald'
          : b.status === 'pending'
          ? 'blue'
          : 'rose';
      const statusBucket =
        b.status === 'approved'
          ? 'active'
          : b.status === 'pending'
          ? 'processing'
          : 'closed';

      return {
        id: `booking-${b.id}`,
        refCode: b.slotCode,
        title: `Sewaan ${b.durationMonths} Bulan`,
        subtext: `${b.businessName} · Mula ${formatShortDate(b.startDate)}`,
        location: b.hubLocation,
        type: 'Permohonan',
        dateISO: b.createdAt || b.startDate || '',
        dateLabel: formatShortDate(b.createdAt || b.startDate),
        statusLabel,
        statusTone,
        statusBucket,
        rawBooking: b
      };
    });

    return [...ticketRows, ...bookingRows];
  }, [userTickets, myBookings]);

  const filteredRecords = useMemo(() => {
    const q = recordSearch.trim().toLowerCase();
    const list = combinedRecords.filter((item) => {
      if (recordTypeFilter === 'aduan' && item.type !== 'Aduan') return false;
      if (recordTypeFilter === 'permohonan' && item.type !== 'Permohonan') return false;
      if (recordStatusFilter !== 'all' && item.statusBucket !== recordStatusFilter) return false;
      if (!q) return true;
      return (
        item.refCode.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.subtext.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.statusLabel.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (recordSortBy === 'status') {
        return a.statusLabel.localeCompare(b.statusLabel);
      }
      const timeA = new Date(a.dateISO || 0).getTime();
      const timeB = new Date(b.dateISO || 0).getTime();
      return recordSortBy === 'date_asc' ? timeA - timeB : timeB - timeA;
    });
  }, [combinedRecords, recordSearch, recordTypeFilter, recordStatusFilter, recordSortBy]);

  const {
    currentPage: recordsPage,
    setCurrentPage: setRecordsPage,
    totalItems: totalRecordsCount,
    paginatedItems: paginatedRecords
  } = usePagination(filteredRecords, 6, [
    recordSearch,
    recordTypeFilter,
    recordStatusFilter,
    recordSortBy,
    userTickets.length,
    myBookings.length
  ]);

  const activeFilterCount =
    (recordTypeFilter !== 'all' ? 1 : 0) + (recordStatusFilter !== 'all' ? 1 : 0);

  const toggleExpandedRecord = (id: string) => {
    setExpandedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openComplaintDialog = (booking?: CapsuleBooking | null) => {
    const targetBooking = booking || activeBooking;
    if (targetBooking) {
      setMaintenanceComplaintBooking(targetBooking);
      setComplaintSuccess(null);
      setComplaintNotes('');
    } else if (onOpenMaintenanceModal) {
      onOpenMaintenanceModal();
    }
  };

  // Restore draft when entering 'book' view
  useEffect(() => {
    if (view === 'book') {
      setSubmitted(false);
      setStep(1);
      setBookHubFilter('Semua');
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

  // Keep selectedSlotId synchronized with currently available slots (and active hub filter in book view)
  useEffect(() => {
    const pool = filteredBookAvailableSlots.length > 0 ? filteredBookAvailableSlots : availableSlots;
    setSelectedSlotId((prev) => {
      if (prev && pool.some((s) => s.id === prev)) {
        return prev;
      }
      return pool[0]?.id || '';
    });
  }, [availableSlots, filteredBookAvailableSlots]);

  const currentSlot =
    filteredBookAvailableSlots.find((s) => s.id === selectedSlotId) ||
    availableSlots.find((s) => s.id === selectedSlotId) ||
    filteredBookAvailableSlots[0] ||
    availableSlots[0] ||
    null;
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
      setError('Sila tandakan kotak persetujuan sebelum meneruskan.');
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

  const handleSelectHubFromSummary = (hubKey: string) => {
    if (onSelectHub) {
      onSelectHub(hubKey);
    }
    onChangeView('browse');
  };

  const renderSummaryMetricsBar = () => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-700">
        {/* Metrik 1: Kekosongan Unit Kiosk */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
              Kekosongan Kiosk
            </span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums">
            {availableSlots.length} / {safeAllSlots.length} Unit Tersedia
          </div>
          <p className="text-[0.8125rem] text-black/70 dark:text-white/75 leading-snug tabular-nums">
            {occupiedOrReservedCount} unit sedang beroperasi atau ditempah · {availableSlots.length > 0 ? 'Sedia untuk permohonan baharu' : 'Semua unit penuh sementara'}
          </p>
        </div>

        {/* Metrik 2: Kadar Subsidi & Julat Sewa */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
              Kadar Subsidi Belia
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums">
            {subsidyRate}% Subsidi · {rateStats.label}
          </div>
          <p className="text-[0.8125rem] text-black/70 dark:text-white/75 leading-snug tabular-nums">
            Tempoh sewaan fleksibel 3 hingga {maxLeaseDuration} bulan · Termasuk utiliti asas hab
          </p>
        </div>

        {/* Metrik 3: Lokasi Hab Aktif */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
              Lokasi Hab ({hubBreakdown.length} Jajahan)
            </span>
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          {hubBreakdown.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {hubBreakdown.map((hub) => (
                <button
                  key={hub.hubKey}
                  type="button"
                  onClick={() => handleSelectHubFromSummary(hub.hubKey)}
                  title={`Lihat unit kiosk di ${hub.hubKey}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-[0.8125rem] font-semibold text-black dark:text-white transition-colors cursor-pointer tabular-nums"
                >
                  <span>{hub.shortLabel}</span>
                  <span className="text-black/60 dark:text-white/65 font-mono">
                    {hub.available}/{hub.total}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm font-semibold text-black/75 dark:text-white/75">
              Tiada rekod hab berdaftar buat masa ini.
            </div>
          )}
          <p className="text-[0.8125rem] text-black/70 dark:text-white/75 leading-snug">
            Klik mana-mana hab untuk melihat unit tersedia mengikut lokasi.
          </p>
        </div>
      </div>
    </div>
  );

  const renderApplicationGuideGrid = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      {/* Lajur Kiri: Panduan Langkah Permohonan */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-base font-extrabold text-black dark:text-white tracking-tight">
              Panduan Langkah Permohonan
            </h2>
          </div>
          <span className="text-[0.8125rem] font-semibold text-black/65 dark:text-white/70 tabular-nums">
            4 Peringkat
          </span>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {[
            {
              num: '01',
              title: 'Pilih Unit Kiosk & Tempoh Sewaan',
              desc: `Pilih hab perniagaan pilihan anda bersama pakej sewaan 3, 6, atau sehingga ${maxLeaseDuration} bulan pada kadar subsidi belia.`
            },
            {
              num: '02',
              title: 'Lengkapkan Profil Perniagaan',
              desc: 'Masukkan nama perniagaan, kategori produk atau servis, nombor telefon aktif, dan ringkasan operasi harian anda.'
            },
            {
              num: '03',
              title: 'Semakan & Kelulusan Urusetia',
              desc: 'Pegawai penyelaras menyemak kelayakan belia dan kesesuaian unit sebelum mengesahkan tempahan anda.'
            },
            {
              num: '04',
              title: 'Surat Tawaran QR & Perjanjian Sewa',
              desc: 'Sebaik diluluskan, Surat Tawaran Digital berkod QR dan Perjanjian Sewa Kiosk tersedia terus di halaman ini.'
            }
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-center justify-center font-mono text-[0.8125rem] font-extrabold text-black dark:text-white shrink-0 tabular-nums">
                {item.num}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-black dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-[0.8125rem] text-black/75 dark:text-white/75 leading-relaxed mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lajur Kanan: Syarat Kelayakan Belia & Kemudahan Termasuk */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-extrabold text-black dark:text-white tracking-tight">
              Syarat Kelayakan &amp; Kemudahan Kiosk
            </h2>
          </div>
          <span className="text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
            Garis Panduan
          </span>
        </div>

        <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            <h3 className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
              Syarat Utama Pemohon
            </h3>
            <ul className="space-y-2.5 text-sm text-black dark:text-white">
              {[
                'Terhad kepada satu (1) permohonan atau sewaan kiosk aktif bagi setiap akaun dalam satu masa.',
                'Terbuka kepada usahawan belia negeri Kelantan yang mendaftar dan melengkapkan butiran perniagaan.',
                'Pemohon perlu menetapkan tarikh mula operasi dan mematuhi garis panduan kebersihan serta waktu niaga hab.',
                'Pembatalan tempahan dibenarkan secara terus sekiranya pemohon ingin menukar kepada unit atau lokasi lain.'
              ].map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[0.8125rem] text-black/80 dark:text-white/85 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-700 space-y-2.5">
            <h3 className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
              Kemudahan Asas Disertakan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[0.8125rem] font-semibold text-black dark:text-white">
              {[
                { icon: Zap, text: 'Bekalan Elektrik 13A & Lampu' },
                { icon: Compass, text: 'Lokasi Strategik Hab Daerah' },
                { icon: ShieldCheck, text: 'Kawalan Keselamatan Kawasan' },
                { icon: Store, text: 'Akses Klinik Mentor & Geran' }
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.text}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700"
                  >
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="leading-snug">{feat.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4">

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
        <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden shadow-sm">
          {/* Page Header */}
          <div className="border-b border-slate-300 dark:border-zinc-600 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 kbelia-important-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
                  Permohonan Sewa Kiosk Belia
                </h1>
                <p className="text-[0.8125rem] sm:text-sm text-black/75 dark:text-white/75 mt-0.5 tabular-nums">
                  {availableSlots.length} unit tersedia · Subsidi belia {subsidyRate}% · Tempoh sehingga {maxLeaseDuration} bulan
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingCancel(false);
                  onChangeView('manage');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-bold text-black dark:text-white transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Urus Tempahan</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeView('browse')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-sm font-bold text-black dark:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            </div>
          </div>

          {hasActiveBooking ? (
            <div className="p-6 sm:p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-black dark:text-white flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <h2 className="text-lg font-black text-black dark:text-white">
                  Tempahan Kiosk Aktif Sedia Ada
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
                Nombor Rujukan Anda: <strong>KBN-{currentSlot?.code}-{new Date().getFullYear()}</strong>
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
                    {hubBreakdown.length > 0 && (
                      <div>
                        <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 block mb-2">
                          Tapis Mengikut Hab Daerah
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBookHubFilter('Semua')}
                            className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-bold border transition-colors cursor-pointer tabular-nums ${
                              bookHubFilter === 'Semua'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-600 text-black dark:text-white hover:border-blue-500'
                            }`}
                          >
                            Semua Hab ({availableSlots.length})
                          </button>
                          {hubBreakdown.map((hub) => {
                            const active = bookHubFilter === hub.hubKey;
                            return (
                              <button
                                key={hub.hubKey}
                                type="button"
                                disabled={hub.available === 0}
                                onClick={() => setBookHubFilter(hub.hubKey)}
                                className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold border transition-colors tabular-nums ${
                                  hub.available === 0
                                    ? 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-black/40 dark:text-white/40 cursor-not-allowed'
                                    : active
                                    ? 'bg-blue-600 border-blue-600 text-white cursor-pointer'
                                    : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-600 text-black dark:text-white hover:border-blue-500 cursor-pointer'
                                }`}
                              >
                                {hub.shortLabel} ({hub.available})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white block mb-2">
                        Lokasi Kiosk *
                      </label>
                      <select
                        value={filteredBookAvailableSlots.length > 0 ? selectedSlotId : ''}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                      >
                        {filteredBookAvailableSlots.length > 0 ? (
                          filteredBookAvailableSlots.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} - {s.name} ({s.district}) · [Tersedia]
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
                            subtitle: 'Pakej Pertumbuhan',
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
                      <ModernDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        valueFormat="iso"
                        minDate={todayISO}
                        placeholder="Pilih tarikh mula operasi"
                      />
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
                              {formatBusinessCategory(c)}
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
                          <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
                            Ringkasan Pakej Permohonan Kiosk
                          </h4>
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
                            {currentSlot?.code} - {currentSlot?.name}
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
                          Persetujuan:
                        </strong>
                        Saya mengesahkan semua maklumat di atas adalah benar dan bersetuju ia diproses bagi permohonan kiosk ini.
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

        {/* Ringkasan Kekosongan & Panduan Teratur di Halaman Mohon Kiosk */}
        {renderSummaryMetricsBar()}
        {renderApplicationGuideGrid()}
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 3: KIOSK SAYA (REKA BENTUK MODEN GAYA RUJUKAN)                */}
      {/* ================================================================= */}
      {view === 'manage' && (() => {
        const heroMonthlyRate = activeBooking
          ? Number(activeBooking.monthlyRate || activeBookingSlot?.monthlyRate || 150)
          : rateStats.min;
        const heroMarketRate =
          subsidyRate > 0 && subsidyRate < 100
            ? Math.round(heroMonthlyRate / (1 - subsidyRate / 100))
            : heroMonthlyRate * 2;

        let progressPercent = 0;
        let progressLeftLabel = '0 bulan';
        let progressRightLabel = '0%';

        if (activeBooking) {
          if (activeBooking.status === 'pending') {
            progressPercent = 50;
            progressLeftLabel = 'Dalam semakan urusetia';
            progressRightLabel = '50%';
          } else {
            const totalMonths = Math.max(1, Number(activeBooking.durationMonths || 6));
            const startMs = new Date(activeBooking.startDate || activeBooking.createdAt || Date.now()).getTime();
            const totalDurationMs = totalMonths * 30.4375 * 24 * 60 * 60 * 1000;
            const rawElapsedMs = Math.max(0, Date.now() - startMs);
            const ratio = Math.min(1, Math.max(0, totalDurationMs > 0 ? rawElapsedMs / totalDurationMs : 0));
            const elapsedMonths =
              rawElapsedMs <= 0 ? 0 : Math.min(totalMonths, Math.max(1, Math.round(ratio * totalMonths)));
            progressPercent = Math.round(ratio * 100);
            progressLeftLabel = `${elapsedMonths} dari ${totalMonths} bulan`;
            progressRightLabel = `${progressPercent}% selesai`;
          }
        }

        const safeCarouselIdx = Math.min(carouselIdx, Math.max(0, galleryImages.length - 1));
        const activePhotoSrc = galleryImages[safeCarouselIdx] || DEFAULT_KIOSK_IMAGE;

        const unitAmenities =
          activeBookingSlot?.amenities && activeBookingSlot.amenities.length > 0
            ? activeBookingSlot.amenities
            : ['Bekalan Elektrik 13A', 'Wi-Fi Jalur Lebar', 'Kawalan Keselamatan'];

        return (
          <div className="space-y-4">
            {/* BARIS 1: BAR ATAS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onChangeView('browse')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold text-black dark:text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Peta Kiosk</span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight truncate">
                    Kiosk Saya
                  </h1>
                  <p className="text-sm text-black/65 dark:text-white/70 truncate">
                    Pantau dan urus kiosk anda di sini.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {activeBooking ? (
                  <button
                    type="button"
                    onClick={() => setIsQuickActionsOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Kemaskini Info</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={availableSlots.length === 0 || isMaintenanceMode}
                    onClick={() => onChangeView('book')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Store className="w-4 h-4" />
                    <span>Mohon Kiosk</span>
                  </button>
                )}

                <div className="relative" ref={headerMenuRef}>
                  <button
                    type="button"
                    aria-label="Menu tindakan kiosk"
                    aria-expanded={isHeaderMenuOpen}
                    onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-black dark:text-white inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isHeaderMenuOpen && (
                    <div className="animate-popover-enter absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl py-1.5 z-40 text-left">
                      {activeBooking?.status === 'approved' && onViewOfferLetter && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onViewOfferLetter(activeBooking);
                          }}
                          className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Surat Tawaran</span>
                        </button>
                      )}
                      {activeBooking?.status === 'approved' && onOpenTenancyAgreement && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onOpenTenancyAgreement(activeBooking);
                          }}
                          className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Perjanjian Sewa</span>
                        </button>
                      )}
                      {activeBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            setSelectedReceiptBooking(activeBooking);
                          }}
                          className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Resit Bayaran</span>
                        </button>
                      )}
                      {activeBooking?.status === 'approved' && onOpenVerification && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onOpenVerification(`KBN-${activeBooking.slotCode}`);
                          }}
                          className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Sahkan QR</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          openComplaintDialog(activeBooking);
                        }}
                        className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Buat Aduan</span>
                      </button>
                      {!activeBooking && (
                        <button
                          type="button"
                          disabled={availableSlots.length === 0 || isMaintenanceMode}
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onChangeView('book');
                          }}
                          className="w-full px-3.5 py-2 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Mohon Kiosk</span>
                        </button>
                      )}
                      {activeBooking && (
                        <>
                          <div className="my-1 border-t border-slate-200 dark:border-zinc-700" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsConfirmingCancel(true);
                            }}
                            className="w-full px-3.5 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Batalkan Tempahan</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PENGESAHAN BATAL TEMPAHAN (SEBARIS, TANPA POP-UP) */}
            {isConfirmingCancel && activeBooking && (
              <div className="p-3.5 sm:px-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-semibold text-black dark:text-white">
                  Sahkan pembatalan tempahan slot {activeBooking.slotCode}?
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={cancellingBooking}
                    onClick={handleConfirmCancel}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer transition-colors"
                  >
                    {cancellingBooking ? 'Memproses...' : 'Ya, Batalkan'}
                  </button>
                  <button
                    type="button"
                    disabled={cancellingBooking}
                    onClick={() => setIsConfirmingCancel(false)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Kekalkan
                  </button>
                </div>
              </div>
            )}

            {/* BARIS 2: HERO DUA LAJUR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Lajur Kiri: Karusel Foto + Akordion */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-2 shadow-2xs">
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    <PortalImage
                      src={activePhotoSrc}
                      alt={activeBooking ? activeBooking.slotName : 'Kiosk Belia Kelantan'}
                      fallbackType="kiosk"
                      fallbackLabel={activeBooking?.slotCode || 'KBN'}
                      className="w-full h-full object-cover"
                    />

                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Gambar sebelum"
                          onClick={() =>
                            setCarouselIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
                          }
                          className="w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/90 text-black dark:text-white border border-slate-200/70 dark:border-zinc-700 shadow-md inline-flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Gambar seterusnya"
                          onClick={() => setCarouselIdx((prev) => (prev + 1) % galleryImages.length)}
                          className="w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/90 text-black dark:text-white border border-slate-200/70 dark:border-zinc-700 shadow-md inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                          {galleryImages.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              aria-label={`Gambar ${idx + 1}`}
                              onClick={() => setCarouselIdx(idx)}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                idx === safeCarouselIdx
                                  ? 'w-5 bg-blue-500'
                                  : 'w-2 bg-white/75 hover:bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Akordion 1: Tentang Kiosk */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    aria-expanded={openAccordion === 'about'}
                    onClick={() => setOpenAccordion((prev) => (prev === 'about' ? null : 'about'))}
                    className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-black dark:text-white">Tentang Kiosk</span>
                    <ChevronDown
                      className={`w-4 h-4 text-black/60 dark:text-white/65 transition-transform duration-200 ${
                        openAccordion === 'about' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openAccordion === 'about' && (
                    <div className="px-5 pb-4 pt-2 border-t border-slate-200 dark:border-zinc-700 text-sm text-black/80 dark:text-white/80 space-y-2.5">
                      <p className="leading-relaxed">
                        {activeBooking
                          ? `Unit ${activeBooking.slotCode} (${activeBookingSlot?.size || '8ft x 8ft'}) di ${activeBooking.hubLocation} tersedia dengan kelengkapan asas perniagaan.`
                          : 'Kiosk modular belia dilengkapi sambungan elektrik, Wi-Fi hab, serta kadar sewa bersubsidi.'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {unitAmenities.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-black dark:text-white"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      {activeBooking?.adminNotes && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-xs">
                          <span className="font-bold text-black dark:text-white">Catatan: </span>
                          <span>{activeBooking.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Akordion 2: Soalan Lazim */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    aria-expanded={openAccordion === 'faq'}
                    onClick={() => setOpenAccordion((prev) => (prev === 'faq' ? null : 'faq'))}
                    className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-black dark:text-white">Soalan Lazim</span>
                    <ChevronDown
                      className={`w-4 h-4 text-black/60 dark:text-white/65 transition-transform duration-200 ${
                        openAccordion === 'faq' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openAccordion === 'faq' && (
                    <div className="px-5 pb-4 pt-2 border-t border-slate-200 dark:border-zinc-700 space-y-2.5 text-sm">
                      <div>
                        <p className="font-bold text-black dark:text-white">Bagaimana buat aduan kerosakan?</p>
                        <p className="text-black/75 dark:text-white/75 text-xs mt-0.5">
                          Tekan Kemaskini Info atau menu titik tiga dan pilih Buat Aduan.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-black dark:text-white">Di mana muat turun resit bayaran?</p>
                        <p className="text-black/75 dark:text-white/75 text-xs mt-0.5">
                          Buka menu titik tiga di kanan atas atau menu tindakan pada baris permohonan.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-black dark:text-white">Bolehkah tukar lokasi kiosk?</p>
                        <p className="text-black/75 dark:text-white/75 text-xs mt-0.5">
                          Batalkan tempahan semasa dahulu, kemudian pilih unit baharu di Peta Kiosk.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lajur Kanan: Kad Spesifikasi & Bar Kemajuan */}
              <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
                    {activeBooking
                      ? `${activeBooking.slotCode} · ${activeBooking.slotName}`
                      : 'Tiada Kiosk Aktif'}
                  </h2>
                  <p className="text-sm text-black/65 dark:text-white/70 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>
                      {activeBooking
                        ? activeBooking.hubLocation
                        : 'Pilih unit daripada Peta Kiosk untuk mula memohon'}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/90 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-700/80 p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  {activeBooking ? (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Sewa Bulanan</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          RM {heroMonthlyRate.toLocaleString('ms-MY')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Kadar Asal</span>
                        <span className="font-semibold text-black/60 dark:text-white/60 line-through tabular-nums">
                          RM {heroMarketRate.toLocaleString('ms-MY')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Status</span>
                        <span className="font-bold text-black dark:text-white">
                          {activeBooking.status === 'approved' ? 'Aktif' : 'Diproses'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Perniagaan</span>
                        <span className="font-bold text-black dark:text-white text-right truncate max-w-[60%]">
                          {activeBooking.businessName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Kategori</span>
                        <span className="font-semibold text-black dark:text-white text-right truncate max-w-[60%]">
                          {formatBusinessCategory(activeBooking.businessCategory)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Tempoh</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          {activeBooking.durationMonths} Bulan
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Jumlah Sewaan</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          RM {(heroMonthlyRate * activeBooking.durationMonths).toLocaleString('ms-MY')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Unit Tersedia</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          {availableSlots.length} / {safeAllSlots.length} Unit
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Kadar Subsidi</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          RM {rateStats.min.toLocaleString('ms-MY')} / bulan
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Subsidi Belia</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          {subsidyRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Tempoh Maksimum</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          {maxLeaseDuration} Bulan
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/65 dark:text-white/70">Kuota Akaun</span>
                        <span className="font-bold text-black dark:text-white tabular-nums">
                          0 / 1 Unit
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bar Kemajuan Berjalur Biru */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-zinc-700/80">
                    <div className="h-9 w-full rounded-lg bg-slate-200/75 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-lg bg-[repeating-linear-gradient(135deg,#2563EB_0px,#2563EB_10px,#1D4ED8_10px,#1D4ED8_20px)] transition-all duration-500"
                        style={{ width: `${activeBooking ? Math.max(progressPercent, 8) : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-[0.8125rem] font-semibold text-black/65 dark:text-white/70 tabular-nums">
                      <span>{progressLeftLabel}</span>
                      <span>{progressRightLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BARIS 3: TIGA KAD KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI 1: Aduan Aktif */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 flex flex-col justify-between gap-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-black/75 dark:text-white/80">
                    Aduan Aktif
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums">
                    {openTicketsCount}
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/65 mt-1 tabular-nums">
                    {openTicketsCount > 0
                      ? `${inProgressTicketsCount} sedang dibaiki`
                      : 'Tiada aduan terbuka'}
                  </p>
                </div>
              </div>

              {/* KPI 2: Aduan Selesai */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 flex flex-col justify-between gap-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-black/75 dark:text-white/80">
                    Aduan Selesai
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums">
                    {resolvedTicketsCount}
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/65 mt-1">
                    {resolvedTicketsCount > 0 ? 'Semua selesai' : 'Belum ada rekod selesai'}
                  </p>
                </div>
              </div>

              {/* KPI 3: Permohonan */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 flex flex-col justify-between gap-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-black/75 dark:text-white/80">
                    Permohonan
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums">
                    {myBookings.length}
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/65 mt-1 tabular-nums">
                    {activeBooking ? 1 : 0} aktif · {bookingHistory.length} lalu
                  </p>
                </div>
              </div>
            </div>

            {/* BARIS 4: JADUAL ADUAN & PERMOHONAN */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-2xs">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h2 className="text-base font-extrabold text-black dark:text-white tracking-tight">
                  Aduan &amp; Permohonan
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Cari... */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-black/45 dark:text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      placeholder="Cari..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                    />
                    {recordSearch && (
                      <button
                        type="button"
                        aria-label="Kosongkan carian"
                        onClick={() => setRecordSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tapis */}
                  <div className="relative" ref={filterPopoverRef}>
                    <button
                      type="button"
                      aria-expanded={isFilterPopoverOpen}
                      onClick={() => {
                        setIsSortPopoverOpen(false);
                        setIsFilterPopoverOpen((prev) => !prev);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                        activeFilterCount > 0
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Tapis</span>
                    </button>

                    {isFilterPopoverOpen && (
                      <div className="animate-popover-enter absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl p-4 z-40 space-y-3.5 text-left">
                        <div>
                          <span className="block text-xs font-bold text-black/65 dark:text-white/70 mb-1.5">
                            Jenis Rekod
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { key: 'all', label: 'Semua' },
                              { key: 'aduan', label: 'Aduan' },
                              { key: 'permohonan', label: 'Mohon' }
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => setRecordTypeFilter(opt.key as 'all' | 'aduan' | 'permohonan')}
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  recordTypeFilter === opt.key
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-black/65 dark:text-white/70 mb-1.5">
                            Status
                          </span>
                          <select
                            value={recordStatusFilter}
                            onChange={(e) =>
                              setRecordStatusFilter(
                                e.target.value as 'all' | 'active' | 'processing' | 'closed'
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="processing">Diproses / Diterima</option>
                            <option value="closed">Selesai / Batal</option>
                          </select>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setRecordTypeFilter('all');
                              setRecordStatusFilter('all');
                            }}
                            className="text-xs font-semibold text-black/70 dark:text-white/75 hover:underline cursor-pointer"
                          >
                            Set Semula
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFilterPopoverOpen(false)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Susun */}
                  <div className="relative" ref={sortPopoverRef}>
                    <button
                      type="button"
                      aria-expanded={isSortPopoverOpen}
                      onClick={() => {
                        setIsFilterPopoverOpen(false);
                        setIsSortPopoverOpen((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800 text-black dark:text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Susun</span>
                    </button>

                    {isSortPopoverOpen && (
                      <div className="animate-popover-enter absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl py-1.5 z-40 text-left">
                        {[
                          { key: 'date_desc', label: 'Tarikh Terbaru' },
                          { key: 'date_asc', label: 'Tarikh Terlama' },
                          { key: 'status', label: 'Mengikut Status' }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setRecordSortBy(opt.key as 'date_desc' | 'date_asc' | 'status');
                              setIsSortPopoverOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-sm text-left flex items-center justify-between cursor-pointer ${
                              recordSortBy === opt.key
                                ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                                : 'font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {recordSortBy === opt.key && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700 text-xs font-bold text-black/65 dark:text-white/70">
                      <th className="py-3 px-4 whitespace-nowrap">Rujukan</th>
                      <th className="py-3 px-4 whitespace-nowrap">Perkara</th>
                      <th className="py-3 px-4 whitespace-nowrap">Lokasi</th>
                      <th className="py-3 px-4 whitespace-nowrap">Jenis</th>
                      <th className="py-3 px-4 whitespace-nowrap">Tarikh</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap w-14"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-zinc-700/80 text-sm">
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center">
                          <div className="max-w-sm mx-auto space-y-2.5">
                            <p className="text-sm font-semibold text-black/75 dark:text-white/75">
                              Tiada rekod aduan atau permohonan ditemui.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {(recordSearch || activeFilterCount > 0) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRecordSearch('');
                                    setRecordTypeFilter('all');
                                    setRecordStatusFilter('all');
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-black dark:text-white cursor-pointer"
                                >
                                  Set Semula Tapis
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  activeBooking ? openComplaintDialog(activeBooking) : onChangeView('book')
                                }
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                              >
                                {activeBooking ? 'Buat Aduan' : 'Mohon Kiosk'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((item) => {
                        const isExpanded = expandedRecordIds.includes(item.id);
                        const statusPillClass =
                          item.statusTone === 'emerald'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                            : item.statusTone === 'blue'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                            : item.statusTone === 'amber'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                            : item.statusTone === 'rose'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black/75 dark:text-white/75';

                        const rowActions: RowActionItem[] = [
                          {
                            label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran',
                            onClick: () => toggleExpandedRecord(item.id)
                          }
                        ];

                        if (item.rawBooking) {
                          const bookingItem = item.rawBooking;
                          rowActions.push({
                            label: 'Resit Bayaran',
                            onClick: () => setSelectedReceiptBooking(bookingItem)
                          });
                          if (bookingItem.status === 'approved' && onViewOfferLetter) {
                            rowActions.push({
                              label: 'Surat Tawaran',
                              onClick: () => onViewOfferLetter(bookingItem)
                            });
                          }
                          if (bookingItem.status === 'approved' && onOpenTenancyAgreement) {
                            rowActions.push({
                              label: 'Perjanjian Sewa',
                              onClick: () => onOpenTenancyAgreement(bookingItem)
                            });
                          }
                          if (bookingItem.status === 'pending' || bookingItem.status === 'approved') {
                            rowActions.push({
                              label: 'Buat Aduan',
                              tone: 'accent',
                              dividerBefore: true,
                              onClick: () => openComplaintDialog(bookingItem)
                            });
                          }
                        }

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => toggleExpandedRecord(item.id)}
                              className="hover:bg-slate-50/75 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                            >
                              <td className="py-3.5 px-4 font-mono text-xs sm:text-[0.8125rem] font-bold text-black/80 dark:text-white/85 whitespace-nowrap tabular-nums">
                                {item.refCode}
                              </td>
                              <td className="py-3.5 px-4 min-w-[200px]">
                                <div className="font-bold text-black dark:text-white leading-snug">
                                  {item.title}
                                </div>
                                <div className="text-xs text-black/60 dark:text-white/65 line-clamp-1">
                                  {item.subtext}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-black/80 dark:text-white/85 whitespace-nowrap">
                                {item.location}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-semibold text-black/80 dark:text-white/85">
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-black/75 dark:text-white/80 whitespace-nowrap tabular-nums">
                                {item.dateLabel}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold ${statusPillClass}`}
                                >
                                  {item.statusLabel}
                                </span>
                              </td>
                              <td
                                className="py-3.5 px-4 text-right whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <RowActionMenu
                                  items={rowActions}
                                  ariaLabel={`Tindakan untuk ${item.refCode}`}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/60 dark:bg-zinc-950/60">
                                <td colSpan={7} className="px-4 py-3 text-xs sm:text-sm text-black/80 dark:text-white/85">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="space-y-1">
                                      <p>
                                        <span className="font-bold text-black dark:text-white">Butiran: </span>
                                        {item.subtext}
                                      </p>
                                      {item.rawTicket?.adminNotes && (
                                        <p className="text-black/70 dark:text-white/75">
                                          <span className="font-bold text-black dark:text-white">Tindakan Admin: </span>
                                          {item.rawTicket.adminNotes}
                                        </p>
                                      )}
                                      {item.rawBooking?.adminNotes && (
                                        <p className="text-black/70 dark:text-white/75">
                                          <span className="font-bold text-black dark:text-white">Catatan: </span>
                                          {item.rawBooking.adminNotes}
                                        </p>
                                      )}
                                    </div>
                                    {item.rawBooking && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReceiptBooking(item.rawBooking!)}
                                        className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                                      >
                                        Buka Resit
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                currentPage={recordsPage}
                totalItems={totalRecordsCount}
                itemsPerPage={6}
                onPageChange={setRecordsPage}
                accent="blue"
                variant="compact"
              />
            </div>
          </div>
        );
      })()}

      {/* ================================================================= */}
      {/* MODAL 1: OFFICIAL RECEIPT (RESIT RASMI BAYARAN KBELIA)            */}
      {/* ================================================================= */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden text-black dark:text-white">
            {/* Receipt Header */}
            <div className="p-5 kbelia-important-header border-b border-slate-300 dark:border-zinc-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                  <span className="text-base font-black">KB</span>
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white">
                    Resit Rasmi Bayaran Subsidi Kiosk
                  </h4>
                  <p className="text-[0.875rem] text-black/75 dark:text-white/75 font-semibold">
                    Pengurusan Pembangunan Usahawan Belia Kelantan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptBooking(null)}
                className="p-1.5 text-black/70 hover:text-black dark:text-white/75 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-start pb-3 border-b border-slate-300 dark:border-zinc-600">
                <div>
                  <span className="text-black/70 dark:text-white/75 text-[0.8125rem] uppercase font-bold block">
                    Nombor Rujukan Resit
                  </span>
                  <span className="font-mono font-extrabold text-sm text-black dark:text-white tabular-nums">
                    REC-{selectedReceiptBooking.slotCode}-{selectedReceiptBooking.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-black/70 dark:text-white/75 text-[0.8125rem] uppercase font-bold block">
                    Tarikh Permohonan
                  </span>
                  <span className="font-semibold text-black dark:text-white tabular-nums">
                    {formatDisplayDate(selectedReceiptBooking.createdAt?.split('T')[0])}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl border border-slate-300 dark:border-zinc-600 space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-black/70 dark:text-white/75">Nama Usahawan:</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    {selectedReceiptBooking.applicantName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/70 dark:text-white/75">Jenama Perniagaan:</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    {selectedReceiptBooking.businessName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/70 dark:text-white/75">Kiosk Diberikan:</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    {selectedReceiptBooking.slotCode} ({selectedReceiptBooking.slotName})
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/70 dark:text-white/75">Lokasi Hab:</span>
                  <span className="font-semibold text-black dark:text-white text-right">
                    {selectedReceiptBooking.hubLocation}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/70 dark:text-white/75">Tempoh Perjanjian:</span>
                  <span className="font-semibold text-black dark:text-white text-right tabular-nums">
                    {selectedReceiptBooking.durationMonths} Bulan ({formatDisplayDate(selectedReceiptBooking.startDate)} hingga {calculateOperationEndDate(selectedReceiptBooking.startDate, selectedReceiptBooking.durationMonths)})
                  </span>
                </div>
              </div>

              {/* Fee Breakdown */}
              {(() => {
                const rate = Number(selectedReceiptBooking.monthlyRate || 150);
                return (
                  <div className="border border-slate-300 dark:border-zinc-600 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-zinc-800 text-black dark:text-white font-bold border-b border-slate-300 dark:border-zinc-600">
                        <tr>
                          <th className="p-3">Keterangan Urusniaga</th>
                          <th className="p-3 text-right">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 dark:divide-zinc-600">
                        <tr>
                          <td className="p-3 font-medium">Yuran Komitmen Sewaan Kiosk Modular Subsidi Belia (Sebulan)</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">{rate.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Deposit Kebersihan &amp; Keselamatan Utiliti Elektrik 13A</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">50.00</td>
                        </tr>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white font-bold">
                          <td className="p-3">Subsidi Kerajaan Negeri Kelantan (Kadar Khas)</td>
                          <td className="p-3 text-right font-mono tabular-nums">-50.00</td>
                        </tr>
                        <tr className="bg-blue-600 text-white font-extrabold text-sm">
                          <td className="p-3">JUMLAH DIBAYAR</td>
                          <td className="p-3 text-right font-mono tabular-nums text-white">RM {rate.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-black dark:text-white text-[0.8125rem] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Status Transaksi: Berjaya &amp; Sah Diperakui Sistem Perakaunan Bersepadu KBelia.</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const receiptRef = `REC-${selectedReceiptBooking.slotCode}-${selectedReceiptBooking.id.substring(0, 8).toUpperCase()}`;
                    const rateVal = loadLocalPortalSettings().portalSubsidyRate ?? 50;
                    const html = generateOfficialReceiptHtml(selectedReceiptBooking, receiptRef, rateVal);
                    void openAndPrintDocument(html, `Resit_Rasmi_${selectedReceiptBooking.slotCode}`);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Cetak Salinan Resit</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const receiptRef = `REC-${selectedReceiptBooking.slotCode}-${selectedReceiptBooking.id.substring(0, 8).toUpperCase()}`;
                    const rateVal = loadLocalPortalSettings().portalSubsidyRate ?? 50;
                    const html = generateOfficialReceiptHtml(selectedReceiptBooking, receiptRef, rateVal);
                    const ok = await downloadHtmlAsPdf(html, `Resit_Rasmi_${selectedReceiptBooking.slotCode}_${receiptRef}`);
                    if (ok) {
                      showToast('Fail PDF resit rasmi berjaya dimuat turun.', 'success');
                    } else {
                      showToast('Gagal menjana fail PDF resit. Sila gunakan butang Cetak.', 'error');
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Muat Turun PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptBooking(null)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-bold text-sm rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: ADUAN & PENYELENGGARAAN FASILITI KIOSK                  */}
      {/* ================================================================= */}
      {maintenanceComplaintBooking && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-zinc-600 overflow-hidden text-black dark:text-white">
            <div className="p-5 kbelia-important-header dark:bg-zinc-800 flex items-center justify-between border-b border-slate-300 dark:border-zinc-600">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-black dark:text-white flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-black dark:text-white">Borang Aduan Fasiliti Kiosk</h4>
                  <p className="text-[0.875rem] text-black/75 dark:text-white/75">
                    Slot {maintenanceComplaintBooking.slotCode} · {maintenanceComplaintBooking.hubLocation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceComplaintBooking(null)}
                className="p-1.5 text-black/70 hover:text-black dark:text-white/75 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {complaintSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-black dark:text-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Aduan Berjaya Dihantar!</span>
                  </div>
                  <p className="text-[0.9375rem]">
                    {complaintSuccess} Pihak pengurusan fasiliti hab akan mengambil tindakan segera dalam tempoh 24 jam.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMaintenanceComplaintBooking(null)}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!complaintNotes.trim()) return;
                    const categoryMap: Record<string, MaintenanceTicket['issueCategory']> = {
                      'Bekalan Elektrik 13A & Lampu': 'Elektrik & Suis',
                      'Kunci & Roller Shutter Kiosk': 'Pintu & Kunci',
                      'Sistem Paip & Saliran Air': 'Paip & Air',
                      'Wi-Fi Hab & Rangkaian Internet': 'Lain-lain',
                      'Kebersihan & Pelupusan Sisa': 'Lain-lain',
                      'Lain-lain Isu Fizikal': 'Lain-lain'
                    };
                    try {
                      setSubmittingComplaint(true);
                      const created = await createMaintenanceTicket({
                        ownerId: user.uid,
                        slotCode: maintenanceComplaintBooking.slotCode,
                        kioskName: maintenanceComplaintBooking.slotName,
                        reporterName: userProfile?.fullName || user.displayName || maintenanceComplaintBooking.applicantName,
                        reporterPhone: userProfile?.phone || maintenanceComplaintBooking.applicantPhone || '-',
                        issueCategory: categoryMap[complaintType] || 'Lain-lain',
                        description: `[${complaintType}] ${complaintNotes.trim()}`
                      });
                      setComplaintSuccess(`Tiket aduan ${created.id} didaftarkan bagi kategori "${complaintType}".`);
                      emitAdminOrMentorNotification({
                        title: `Tiket Aduan Fasiliti: ${maintenanceComplaintBooking.slotCode}`,
                        message: `${userProfile?.fullName || user.displayName || maintenanceComplaintBooking.applicantName} melaporkan isu "${complaintType}" di ${maintenanceComplaintBooking.slotName}.`,
                        senderRole: 'user',
                        targetRole: 'admin',
                        targetUserId: '',
                        sender: userProfile?.fullName || user.displayName || 'Usahawan Belia',
                        type: 'kiosk',
                        actionTab: 'admin'
                      });
                      showToast({
                        type: 'success',
                        title: 'Aduan Fasiliti Diterima',
                        message: `Tiket ${created.id} telah dihantar ke Pentadbir Hab.`
                      });
                      onRefresh();
                    } catch {
                      showToast('Gagal menghantar aduan fasiliti. Sila cuba lagi.', 'error');
                    } finally {
                      setSubmittingComplaint(false);
                    }
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                      Jenis Kerosakan *
                    </label>
                    <select
                      value={complaintType}
                      onChange={(e) => setComplaintType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 rounded-xl text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                    >
                      <option value="Bekalan Elektrik 13A & Lampu">Bekalan Elektrik 13A &amp; Lampu Kiosk</option>
                      <option value="Kunci & Roller Shutter Kiosk">Kunci &amp; Pintu Pengatup (Roller Shutter)</option>
                      <option value="Sistem Paip & Saliran Air">Sistem Paip &amp; Saliran Sinki</option>
                      <option value="Wi-Fi Hab & Rangkaian Internet">Wi-Fi Hab &amp; Rangkaian Internet Terputus</option>
                      <option value="Kebersihan & Pelupusan Sisa">Kebersihan Tapak &amp; Tong Sampah</option>
                      <option value="Lain-lain Isu Fizikal">Lain-lain Isu Fizikal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                      Penerangan Masalah *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={complaintNotes}
                      onChange={(e) => setComplaintNotes(e.target.value)}
                      placeholder="Masukkan penerangan masalah"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setMaintenanceComplaintBooking(null)}
                      className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-black dark:text-white rounded-xl font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingComplaint}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{submittingComplaint ? 'Menghantar...' : 'Hantar Aduan Sekarang'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: TINDAKAN PANTAS KIOSK (KEMASKINI INFO)                   */}
      {/* ================================================================= */}
      {isQuickActionsOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden text-black dark:text-white">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base text-black dark:text-white">
                  Kemaskini &amp; Dokumen Kiosk
                </h4>
                <p className="text-xs text-black/65 dark:text-white/70 mt-0.5">
                  {activeBooking.slotCode} · {activeBooking.businessName}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setIsQuickActionsOpen(false)}
                className="p-1.5 text-black/65 hover:text-black dark:text-white/70 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 text-sm">
              {activeBooking.status === 'approved' && onViewOfferLetter && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onViewOfferLetter(activeBooking);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Surat Tawaran Rasmi</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
                </button>
              )}

              {activeBooking.status === 'approved' && onOpenTenancyAgreement && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenTenancyAgreement(activeBooking);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Perjanjian Sewa Kiosk</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setSelectedReceiptBooking(activeBooking);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Resit Rasmi Bayaran</span>
                </span>
                <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
              </button>

              {activeBooking.status === 'approved' && onOpenVerification && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenVerification(`KBN-${activeBooking.slotCode}`);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Sahkan Lesen QR</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  openComplaintDialog(activeBooking);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Buat Aduan Fasiliti</span>
                </span>
                <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  onChangeView('browse');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 hover:border-blue-500 flex items-center justify-between font-semibold text-black dark:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Tukar Unit di Peta Kiosk</span>
                </span>
                <ChevronRight className="w-4 h-4 text-black/45 dark:text-white/50" />
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    setIsConfirmingCancel(true);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer"
                >
                  Batalkan Tempahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-black dark:text-white text-sm font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
