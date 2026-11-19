import React, { useState } from 'react';
import { 
  Store, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  Share2, 
  ExternalLink,
  MessageCircle,
  Save,
  Sparkles,
  QrCode,
  LogIn,
  Settings,
  User,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  MapPin,
  Check,
  Briefcase,
  Printer,
  Download,
  Wrench,
  XCircle,
  PenTool,
  X,
  TrendingUp,
  BarChart3,
  Calendar,
  Bell,
  ArrowUpRight,
  FileCheck,
  Activity,
  ChevronRight,
  Loader2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Wallet
} from 'lucide-react';
import { 
  BusinessListing, 
  ProductItem, 
  CapsuleBooking, 
  CapsuleSlot,
  BusinessCategory, 
  KelantanDistrict,
  GrantApplication,
  KioskDailySale,
  MaintenanceTicket,
  MentorshipRegistration,
  MerchantSubTab,
  normalizeMentorshipMode
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  saveBusinessListing, 
  saveProduct, 
  deleteProduct,
  updateBookingStatus,
  createMaintenanceTicket,
  loadLocalPortalSettings
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { KioskCashflowTracker } from './KioskCashflowTracker';
import { UserDocumentsVault } from './UserDocumentsVault';
import { ImageDropzone } from './ImageDropzone';
import { EditProductModal } from './EditProductModal';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveBookingKioskImage } from '../utils/visualAssets';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { SaaSKpiCard } from './SaaSKpiCard';
import { RoleDonutCard } from './RoleDonutCard';
import { AnimatedShimmerBar, AnimatedShimmerBarProps } from './AnimatedShimmerBar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateOfficialReceiptHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { exportProductsToExcel } from '../utils/excelExport';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';
import { usePrefersReducedMotion } from '../hooks/useMotion';
import confetti from 'canvas-confetti';

const DEFAULT_PRODUCT_IMAGE = '/assets/generated/product_kelantan_delights_1793924253401.jpg';

const ProductRowThumbnail: React.FC<{ src?: string; alt: string; compact?: boolean }> = ({
  src,
  alt,
  compact = false
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClass = compact ? 'w-10 h-10 rounded-lg' : 'w-16 h-16 rounded-lg';

  if (!src || hasError) {
    return (
      <div className={`${sizeClass} bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center shrink-0 text-black/40 dark:text-white/40`}>
        <ShoppingBag className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${sizeClass} object-cover bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0`}
    />
  );
};

interface MerchantPortalProps {
  myBusiness: BusinessListing | null;
  myProducts?: ProductItem[];
  myBookings?: CapsuleBooking[];
  slots?: CapsuleSlot[];
  grantApplications?: GrantApplication[];
  cashflowRecords?: KioskDailySale[];
  maintenanceTickets?: MaintenanceTicket[];
  mentorshipRegistrations?: MentorshipRegistration[];
  onViewOfferLetter?: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
  onOpenBookingTab?: () => void;
  onOpenBookingModal?: () => void;
  onOpenSettingsTab?: () => void;
  onOpenMentorshipClinic?: () => void;
  onOpenMaintenanceModal?: () => void;
  onRefresh: () => void;
  activeSubTab?: MerchantSubTab;
  onSelectSubTab?: (subTab: MerchantSubTab) => void;
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

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  myBusiness,
  myProducts = [],
  myBookings = [],
  slots = [],
  grantApplications = [],
  cashflowRecords = [],
  maintenanceTickets = [],
  mentorshipRegistrations = [],
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  onOpenBookingTab,
  onOpenBookingModal,
  onOpenSettingsTab,
  onOpenMentorshipClinic,
  onOpenMaintenanceModal,
  onRefresh,
  activeSubTab = 'overview',
  onSelectSubTab
}) => {
  const { user, userProfile, updateProfileData, openLoginModal } = useAuth();
  const { language } = useLanguage();
  const isMs = language === 'ms';
  const prefersReducedMotion = usePrefersReducedMotion();
  const { confirmDelete } = useConfirmDelete();
  const safeProducts = myProducts || [];
  const safeBookings = myBookings || [];
  const safeSlots = slots || [];
  const safeCashflow = cashflowRecords || [];
  const safeTickets = maintenanceTickets || [];
  const safeMentorships = mentorshipRegistrations || [];

  const [internalTab, setInternalTab] = useState<MerchantSubTab>('overview');

  // Synchronize internal tab state with external activeSubTab prop
  React.useEffect(() => {
    if (activeSubTab) {
      setInternalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const activeTab: MerchantSubTab = activeSubTab || internalTab;
  const setActiveTab = (tab: MerchantSubTab) => {
    setInternalTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab);
    }
  };

  const [salesPeriod, setSalesPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('bar');
  const [selectedStepperIndex, setSelectedStepperIndex] = useState<number>(0);

  // Business Form State
  const [businessName, setBusinessName] = useState(myBusiness?.businessName || '');
  const [tagline, setTagline] = useState(myBusiness?.tagline || '');
  const [category, setCategory] = useState<BusinessCategory>(myBusiness?.category || 'Makanan & Minuman (F&B)');
  const [district, setDistrict] = useState<KelantanDistrict>(myBusiness?.district || 'Kota Bharu');
  const [description, setDescription] = useState(myBusiness?.description || '');
  const [ssmNumber, setSsmNumber] = useState(myBusiness?.ssmNumber || '');
  const [whatsapp, setWhatsapp] = useState(myBusiness?.whatsapp || userProfile?.phone || '');
  const [instagram, setInstagram] = useState(myBusiness?.instagram || '');
  const [tiktok, setTiktok] = useState(myBusiness?.tiktok || '');
  const [logoUrl, setLogoUrl] = useState(myBusiness?.logoUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg');
  const [bannerUrl, setBannerUrl] = useState(myBusiness?.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg');

  // Sync state if myBusiness changes
  React.useEffect(() => {
    if (myBusiness) {
      setBusinessName(myBusiness.businessName);
      setTagline(myBusiness.tagline);
      setCategory(myBusiness.category);
      setDistrict(myBusiness.district);
      setDescription(myBusiness.description);
      setSsmNumber(myBusiness.ssmNumber || '');
      setWhatsapp(myBusiness.whatsapp || '');
      setInstagram(myBusiness.instagram || '');
      setTiktok(myBusiness.tiktok || '');
      setLogoUrl(myBusiness.logoUrl || '');
      setBannerUrl(myBusiness.bannerUrl || '');
    }
  }, [myBusiness]);

  // Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Menu Utama');
  const [prodImageUrl, setProdImageUrl] = useState(DEFAULT_PRODUCT_IMAGE);
  const [prodInStock, setProdInStock] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [togglingStockId, setTogglingStockId] = useState<string | null>(null);
  const [duplicatingProdId, setDuplicatingProdId] = useState<string | null>(null);

  // Products Catalog Search, Filter, Sort, Selection & Row Menu State
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>('Semua');
  const [prodStockFilter, setProdStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [isProdFilterOpen, setIsProdFilterOpen] = useState(false);
  const [prodSortBy, setProdSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [prodSort, setProdSort] = useState<{
    key: 'name' | 'category' | 'price' | 'inStock' | 'createdAt';
    dir: 'asc' | 'desc';
  }>({ key: 'createdAt', dir: 'desc' });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Booking action states
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<CapsuleBooking | null>(null);
  const [inlineCancelBookingId, setInlineCancelBookingId] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [maintenanceComplaintBooking, setMaintenanceComplaintBooking] = useState<CapsuleBooking | null>(null);
  const [complaintType, setComplaintType] = useState('Bekalan Elektrik 13A & Lampu');
  const [complaintNotes, setComplaintNotes] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-prod-filter]')) {
        setIsProdFilterOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProdFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Bookings & Tickets search, filter, sort
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [bookingSortBy, setBookingSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [bookingSort, setBookingSort] = useState<{
    key: 'slotName' | 'hubLocation' | 'startDate' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'received' | 'in_progress' | 'resolved'>('all');
  const [ticketSortBy, setTicketSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [ticketSort, setTicketSort] = useState<{
    key: 'slotCode' | 'issueCategory' | 'status';
    dir: 'asc' | 'desc';
  }>({ key: 'status', dir: 'asc' });
  const [expandedTicketIds, setExpandedTicketIds] = useState<string[]>([]);

  const productSortOptions = React.useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'price_asc', label: 'Harga Produk (Terendah)' },
          { value: 'price_desc', label: 'Harga Produk (Tertinggi)' },
          { value: 'stock_first', label: 'Status Stok (Tersedia Dahulu)' }
        ],
        false,
        {
          asc: 'Nama Produk (A - Z)',
          desc: 'Nama Produk (Z - A)'
        }
      ),
    []
  );

  const bookingSortOptions = React.useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'status_pending', label: 'Status (Dalam Semakan Dahulu)' },
          { value: 'start_date_asc', label: 'Tarikh Mula Operasi (Terdekat)' }
        ],
        false,
        {
          asc: 'Nama Kiosk (A - Z)',
          desc: 'Nama Kiosk (Z - A)'
        }
      ),
    []
  );

  const ticketSortOptions = React.useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'status_received', label: 'Status (Diterima Dahulu)' },
          { value: 'category_asc', label: 'Kategori Isu (A - Z)' }
        ],
        false,
        {
          asc: 'Unit Kiosk (A - Z)',
          desc: 'Unit Kiosk (Z - A)'
        }
      ),
    []
  );

  const toggleBookingExpand = (id: string) => {
    setExpandedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleBookingSort = (key: 'slotName' | 'hubLocation' | 'startDate' | 'status') => {
    setBookingSortBy('table_column');
    setBookingSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const toggleTicketSort = (key: 'slotCode' | 'issueCategory' | 'status') => {
    setTicketSortBy('table_column');
    setTicketSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const hasActiveKioskBooking = safeBookings.some(
    (b) => b.status === 'pending' || b.status === 'approved'
  );
  const hasCancelledKioskBooking = safeBookings.some(
    (b) => b.status === 'cancelled'
  );
  const bookingOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 };
  const activeVisibleBookings = React.useMemo(() => {
    return [...safeBookings]
      .filter((b) => b.status !== 'cancelled')
      .sort((a, b) => (bookingOrder[a.status] ?? 4) - (bookingOrder[b.status] ?? 4));
  }, [safeBookings]);

  const filteredBookings = React.useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    const list = activeVisibleBookings.filter((b) => {
      if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
      if (!q) return true;
      return (
        (b.slotCode || '').toLowerCase().includes(q) ||
        (b.slotName || '').toLowerCase().includes(q) ||
        (b.hubLocation || '').toLowerCase().includes(q) ||
        (b.businessName || '').toLowerCase().includes(q)
      );
    });
    if (bookingSortBy === 'table_column') {
      const dirMult = bookingSort.dir === 'asc' ? 1 : -1;
      return [...list].sort((a, b) => {
        if (bookingSort.key === 'slotName') {
          return `${a.slotCode} ${a.slotName}`.localeCompare(`${b.slotCode} ${b.slotName}`) * dirMult;
        }
        if (bookingSort.key === 'hubLocation') {
          return (a.hubLocation || '').localeCompare(b.hubLocation || '') * dirMult;
        }
        if (bookingSort.key === 'startDate') {
          return (a.startDate || '').localeCompare(b.startDate || '') * dirMult;
        }
        return ((bookingOrder[a.status] ?? 4) - (bookingOrder[b.status] ?? 4)) * dirMult;
      });
    }
    return sortRecords(list, {
      sortBy: bookingSortBy,
      getName: (b) => `${b.slotCode || ''} ${b.slotName || ''}`.trim(),
      customCompare: (a, b, mode) => {
        if (mode === 'status_pending') return (bookingOrder[a.status] ?? 4) - (bookingOrder[b.status] ?? 4);
        if (mode === 'start_date_asc') return (a.startDate || '').localeCompare(b.startDate || '');
        return null;
      }
    });
  }, [activeVisibleBookings, bookingSearch, bookingStatusFilter, bookingSortBy, bookingSort]);

  const bookingsPagination = usePagination(filteredBookings, 7, [
    bookingSearch,
    bookingStatusFilter,
    bookingSortBy,
    bookingSort.key,
    bookingSort.dir,
    filteredBookings.length
  ]);

  const ticketOrder: Record<string, number> = { received: 0, in_progress: 1, resolved: 2 };
  const sortedTickets = React.useMemo(() => {
    return [...safeTickets].sort(
      (a, b) => (ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3)
    );
  }, [safeTickets]);

  const filteredTickets = React.useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();
    const list = sortedTickets.filter((t) => {
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      if (!q) return true;
      return (
        (t.slotCode || '').toLowerCase().includes(q) ||
        (t.issueCategory || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    });
    if (ticketSortBy === 'table_column') {
      const dirMult = ticketSort.dir === 'asc' ? 1 : -1;
      return [...list].sort((a, b) => {
        if (ticketSort.key === 'slotCode') {
          return (a.slotCode || '').localeCompare(b.slotCode || '') * dirMult;
        }
        if (ticketSort.key === 'issueCategory') {
          return (a.issueCategory || '').localeCompare(b.issueCategory || '') * dirMult;
        }
        return ((ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3)) * dirMult;
      });
    }
    return sortRecords(list, {
      sortBy: ticketSortBy,
      getName: (t) => t.slotCode || t.kioskName || '',
      customCompare: (a, b, mode) => {
        if (mode === 'status_received') return (ticketOrder[a.status] ?? 3) - (ticketOrder[b.status] ?? 3);
        if (mode === 'category_asc') return (a.issueCategory || '').localeCompare(b.issueCategory || '');
        return null;
      }
    });
  }, [sortedTickets, ticketSearch, ticketStatusFilter, ticketSortBy, ticketSort]);

  const ticketsPagination = usePagination(filteredTickets, 7, [
    ticketSearch,
    ticketStatusFilter,
    ticketSortBy,
    ticketSort.key,
    ticketSort.dir,
    filteredTickets.length
  ]);

  const productCategories = React.useMemo(() => {
    const set = new Set<string>();
    safeProducts.forEach((p) => {
      const cat = (p.category || 'Umum').trim();
      if (cat) set.add(cat);
    });
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [safeProducts]);

  const filteredSortedProducts = React.useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    const filtered = safeProducts.filter((p) => {
      const cat = (p.category || 'Umum').trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      const matchCategory = prodCategoryFilter === 'Semua' || cat === prodCategoryFilter;
      const isAvail = p.inStock !== false;
      const matchStock =
        prodStockFilter === 'all' ||
        (prodStockFilter === 'in_stock' && isAvail) ||
        (prodStockFilter === 'out_of_stock' && !isAvail);
      return matchSearch && matchCategory && matchStock;
    });

    if (prodSortBy === 'table_column') {
      return [...filtered].sort((a, b) => {
        const dirMult = prodSort.dir === 'asc' ? 1 : -1;
        switch (prodSort.key) {
          case 'name':
            return a.name.localeCompare(b.name) * dirMult;
          case 'category':
            return (a.category || 'Umum').localeCompare(b.category || 'Umum') * dirMult;
          case 'price':
            return ((Number(a.price) || 0) - (Number(b.price) || 0)) * dirMult;
          case 'inStock': {
            const aVal = a.inStock !== false ? 1 : 0;
            const bVal = b.inStock !== false ? 1 : 0;
            return (aVal - bVal) * dirMult;
          }
          case 'createdAt':
          default: {
            const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
            const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
            return (aTime - bTime) * dirMult;
          }
        }
      });
    }

    return sortRecords(filtered, {
      sortBy: prodSortBy,
      getName: (p) => p.name || '',
      customCompare: (a, b, mode) => {
        if (mode === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (mode === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (mode === 'stock_first') {
          return (b.inStock !== false ? 1 : 0) - (a.inStock !== false ? 1 : 0);
        }
        return null;
      }
    });
  }, [safeProducts, prodSearch, prodCategoryFilter, prodStockFilter, prodSortBy, prodSort]);

  const productsPagination = usePagination(filteredSortedProducts, 7, [
    prodSearch,
    prodCategoryFilter,
    prodStockFilter,
    prodSortBy,
    prodSort.key,
    prodSort.dir,
    filteredSortedProducts.length
  ]);

  if (!user) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-950/60 dark:border-blue-800/70 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-black dark:text-white">Portal Usahawan Belia</h3>
          <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed">
            Sila log masuk untuk daftar perniagaan anda, urus katalog produk, dan semak status sewaan Kiosk Belia Kelantan.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer dark:bg-blue-600"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>Log Masuk</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setMessage({ type: 'error', text: 'Sila masukkan nama perniagaan.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      await saveBusinessListing({
        id: myBusiness?.id,
        ownerId: user.uid,
        ownerName: userProfile?.fullName || user.displayName || 'Usahawan Belia',
        ownerEmail: user.email || '',
        ownerPhone: whatsapp,
        businessName,
        tagline,
        category,
        district,
        description,
        ssmNumber,
        whatsapp,
        instagram,
        tiktok,
        logoUrl,
        bannerUrl,
        isApproved: myBusiness?.isApproved ?? true,
        isFeatured: myBusiness?.isFeatured ?? false,
      });

      confetti({ particleCount: 50, spread: 50 });
      setMessage({ type: 'success', text: 'Maklumat perniagaan anda berjaya dikemaskini!' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan maklumat perniagaan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myBusiness) {
      setMessage({ type: 'error', text: 'Sila daftar profil perniagaan anda terlebih dahulu sebelum menambah produk.' });
      return;
    }
    const parsedPrice = parseFloat(prodPrice);
    if (!prodName.trim() || !prodPrice || isNaN(parsedPrice) || parsedPrice < 0) {
      setMessage({ type: 'error', text: 'Sila isi nama dan harga jualan yang sah (RM0.00 atau lebih).' });
      return;
    }

    try {
      setLoading(true);
      await saveProduct({
        businessId: myBusiness.id,
        ownerId: user.uid,
        name: prodName.trim(),
        price: parsedPrice,
        description: prodDesc.trim(),
        category: prodCategory.trim() || 'Umum',
        imageUrl: prodImageUrl || DEFAULT_PRODUCT_IMAGE,
        inStock: prodInStock
      });

      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdCategory('Menu Utama');
      setProdImageUrl(DEFAULT_PRODUCT_IMAGE);
      setProdInStock(true);
      setShowAddProduct(false);
      setMessage({ type: 'success', text: 'Produk baharu berjaya ditambah ke katalog!' });
      showToast('Produk baharu berjaya ditambah ke katalog!', 'success');
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menambah produk.' });
      showToast('Gagal menambah produk.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProd = async (id: string) => {
    try {
      await deleteProduct(id);
      setSelectedProductIds((prev) => prev.filter((item) => item !== id));
      setMessage({ type: 'success', text: 'Produk telah dipadam dari katalog.' });
      showToast('Produk telah dipadam dari katalog.', 'success');
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memadam produk. Sila cuba lagi.' });
      showToast('Gagal memadam produk. Sila cuba lagi.', 'error');
    }
  };

  const handleToggleProductStock = async (prod: ProductItem) => {
    const nextInStock = prod.inStock === false;
    try {
      setTogglingStockId(prod.id);
      await saveProduct({
        id: prod.id,
        businessId: prod.businessId,
        ownerId: prod.ownerId,
        createdAt: prod.createdAt,
        name: prod.name,
        price: prod.price,
        category: prod.category,
        description: prod.description,
        imageUrl: prod.imageUrl,
        inStock: nextInStock
      });
      showToast(
        nextInStock
          ? `${prod.name} ditanda sebagai stok tersedia.`
          : `${prod.name} ditanda sebagai habis stok.`,
        'success'
      );
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Gagal menukar status stok produk.', 'error');
    } finally {
      setTogglingStockId(null);
    }
  };

  const handleDuplicateProduct = async (prod: ProductItem) => {
    if (!myBusiness) return;
    try {
      setDuplicatingProdId(prod.id);
      await saveProduct({
        businessId: prod.businessId || myBusiness.id,
        ownerId: user.uid,
        name: `${prod.name} (Salinan)`,
        price: Number(prod.price) || 0,
        category: prod.category || 'Umum',
        description: prod.description || '',
        imageUrl: prod.imageUrl || DEFAULT_PRODUCT_IMAGE,
        inStock: prod.inStock !== false
      });
      showToast(`"${prod.name}" berjaya diduplikasi.`, 'success');
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Gagal menduplikasi produk.', 'error');
    } finally {
      setDuplicatingProdId(null);
    }
  };

  const handleExportProducts = () => {
    const targetList =
      selectedProductIds.length > 0
        ? filteredSortedProducts.filter((p) => selectedProductIds.includes(p.id))
        : filteredSortedProducts;
    if (targetList.length === 0) {
      showToast('Tiada produk untuk dieksport ke Excel.', 'info');
      return;
    }
    exportProductsToExcel(targetList, myBusiness?.businessName);
    showToast(`${targetList.length} rekod produk dieksport ke fail Excel (.xlsx).`, 'success');
  };

  const toggleProductSort = (key: 'name' | 'category' | 'price' | 'inStock' | 'createdAt') => {
    setProdSortBy('table_column');
    setProdSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'createdAt' ? 'desc' : 'asc' }
    );
  };

  return (
    <div className="w-full space-y-3.5">
      
      {/* Clean Single-Elevation Header with Ambient Glow & Sheen */}
      <div 
        id="merchant-portal-header" 
        className="relative overflow-hidden kbelia-ambient-sheen rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
      >
        {/* Autonomous Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -top-14 -left-10 w-56 h-56 rounded-full bg-blue-500/14 dark:bg-blue-500/16 blur-3xl animate-ambient-orb-a" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-52 h-52 rounded-full bg-emerald-500/12 dark:bg-emerald-500/14 blur-3xl animate-ambient-orb-b" aria-hidden="true" />

        <div className="relative z-10">
          {(() => {
            const merchantDisplayName = userProfile?.fullName || user.displayName || (isMs ? 'Usahawan Belia' : 'Youth Entrepreneur');
            const headerMap: Record<MerchantSubTab, { prefix: string; accent: string }> = {
              overview: {
                prefix: isMs ? 'Ringkasan & ' : 'Business Overview & ',
                accent: isMs ? 'Prestasi Bisnes' : 'Performance'
              },
              profile: {
                prefix: isMs ? 'Pengurusan ' : 'Manage ',
                accent: isMs ? 'Profil Kedai' : 'Business Profile'
              },
              products: {
                prefix: isMs ? 'Pengurusan ' : 'Manage ',
                accent: isMs ? 'Produk Saya' : 'My Products'
              },
              bookings: {
                prefix: isMs ? 'Pengurusan ' : 'Manage ',
                accent: isMs ? 'Kiosk Saya' : 'My Kiosks'
              },
              cashflow: {
                prefix: isMs ? 'Rekod Jualan & ' : 'Sales & ',
                accent: isMs ? 'Aliran Tunai' : 'Cashflow Tracker'
              },
              vault: {
                prefix: isMs ? 'Peti Dokumen & ' : 'Document Vault & ',
                accent: isMs ? 'Rekod Rasmi' : 'Official Records'
              },
              card: {
                prefix: isMs ? 'Perkongsian ' : 'Share ',
                accent: isMs ? 'Kad Digital' : 'Digital Card'
              }
            };
            const currentHeader = headerMap[activeTab] || headerMap.overview;
            return (
              <>
                <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
                  {currentHeader.prefix}
                  <span className="kbelia-title-shimmer">{currentHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1">
                  {isMs ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-black dark:text-white">{merchantDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-black dark:text-white">{merchantDisplayName}</span>
                    </>
                  )}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-sm opacity-60 hover:opacity-100 font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Tab 0: Executive Overview Hub */}
      {activeTab === 'overview' && (() => {
        // Real Cashflow Computation
        const totalSalesAll = safeCashflow.reduce((sum, r) => sum + (Number(r.cashSales) || 0) + (Number(r.qrSales) || 0), 0);
        const totalQrAll = safeCashflow.reduce((sum, r) => sum + (Number(r.qrSales) || 0), 0);
        const qrPercentAll = totalSalesAll > 0 ? Math.round((totalQrAll / totalSalesAll) * 100) : 0;
        const avgDailySales = safeCashflow.length > 0 ? Math.round(totalSalesAll / safeCashflow.length) : 0;

        // Real Kiosk Status
        const approvedBooking = safeBookings.find(b => b.status === 'approved') || null;
        const pendingBooking = safeBookings.find(b => b.status === 'pending') || null;
        const primaryBooking = approvedBooking || pendingBooking || null;
        const activeSlotInfo = primaryBooking ? safeSlots.find(s => s.id === primaryBooking.slotId || s.code === primaryBooking.slotCode) : null;

        // Real Grant Computation
        const activeGrants = grantApplications.filter(g => g.status !== 'cancelled');
        const latestGrant = activeGrants[0] || null;
        const approvedGrants = activeGrants.filter(g => g.status === 'approved');
        const parseAmount = (amt?: string) => {
          const num = Number((amt || '0').replace(/[^0-9.]/g, ''));
          return isNaN(num) ? 0 : num;
        };
        const totalGrantValue = (approvedGrants.length > 0 ? approvedGrants : activeGrants)
          .reduce((sum, g) => sum + parseAmount(g.grantAmount || g.amount), 0);

        // Real Mentorship Computation
        const upcomingMentor = safeMentorships.find(m => m.status === 'confirmed' || m.status === 'pending') || safeMentorships[0] || null;

        // Build Chart Bars strictly from real cashflowRecords with auto-anchor to latest record range
        const now = new Date();
        const pad2 = (n: number) => String(n).padStart(2, '0');
        const toLocalIso = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        const parseLocalDate = (raw?: string): Date | null => {
          if (!raw) return null;
          const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (m) {
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
          }
          const dt = new Date(raw);
          return Number.isNaN(dt.getTime()) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        };
        const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
        const days = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

        const datedCashflow = safeCashflow
          .map((r) => ({ record: r, parsedDate: parseLocalDate(r.date) }))
          .filter((item): item is { record: KioskDailySale; parsedDate: Date } => item.parsedDate !== null);

        const latestRecordDate = datedCashflow.reduce<Date | null>(
          (latest, item) => (!latest || item.parsedDate.getTime() > latest.getTime() ? item.parsedDate : latest),
          null
        );

        const formatShortDate = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;

        let isHistoricalAnchor = false;
        let chartRangeLabel = '';

        const chartBars = (() => {
          if (salesPeriod === 'weekly') {
            const buildWeekly = (anchor: Date, includeDateLabel: boolean) =>
              Array.from({ length: 7 }, (_, i) => {
                const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (6 - i));
                const iso = toLocalIso(d);
                const dayRecs = datedCashflow
                  .filter((item) => toLocalIso(item.parsedDate) === iso)
                  .map((item) => item.record);
                const cash = dayRecs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
                const qr = dayRecs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
                const expenses = dayRecs.reduce((s, r) => s + (Number(r.expenses) || 0), 0);
                const value = cash + qr;
                return {
                  label: includeDateLabel ? `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : days[d.getDay()],
                  fullDate: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
                  value,
                  cashSales: cash,
                  qrSales: qr,
                  expenses,
                  tx: dayRecs.length,
                  qr: value > 0 ? Math.round((qr / value) * 100) : 0
                };
              });

            const currentWeekBars = buildWeekly(now, false);
            const currentWeekHasRecords = currentWeekBars.some((b) => b.tx > 0);
            if (!currentWeekHasRecords && latestRecordDate) {
              isHistoricalAnchor = true;
              const startD = new Date(
                latestRecordDate.getFullYear(),
                latestRecordDate.getMonth(),
                latestRecordDate.getDate() - 6
              );
              chartRangeLabel = `${formatShortDate(startD)} – ${formatShortDate(latestRecordDate)} ${latestRecordDate.getFullYear()}`;
              return buildWeekly(latestRecordDate, true);
            }
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
            chartRangeLabel = `${formatShortDate(weekStart)} – ${formatShortDate(now)} ${now.getFullYear()}`;
            return currentWeekBars;
          }

          if (salesPeriod === 'monthly') {
            const buildMonthly = (anchor: Date, includeYear: boolean) =>
              Array.from({ length: 6 }, (_, i) => {
                const d = new Date(anchor.getFullYear(), anchor.getMonth() - (5 - i), 1);
                const ym = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
                const recs = datedCashflow
                  .filter((item) => {
                    const itemYm = `${item.parsedDate.getFullYear()}-${pad2(item.parsedDate.getMonth() + 1)}`;
                    return itemYm === ym;
                  })
                  .map((item) => item.record);
                const cash = recs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
                const qr = recs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
                const expenses = recs.reduce((s, r) => s + (Number(r.expenses) || 0), 0);
                const value = cash + qr;
                const shortYear = String(d.getFullYear()).slice(-2);
                return {
                  label: includeYear ? `${months[d.getMonth()]} '${shortYear}` : months[d.getMonth()],
                  fullDate: `${months[d.getMonth()]} ${d.getFullYear()}`,
                  value,
                  cashSales: cash,
                  qrSales: qr,
                  expenses,
                  tx: recs.length,
                  qr: value > 0 ? Math.round((qr / value) * 100) : 0
                };
              });

            const currentMonthBars = buildMonthly(now, false);
            const currentMonthHasRecords = currentMonthBars.some((b) => b.tx > 0);
            if (!currentMonthHasRecords && latestRecordDate) {
              isHistoricalAnchor = true;
              const startM = new Date(latestRecordDate.getFullYear(), latestRecordDate.getMonth() - 5, 1);
              chartRangeLabel = `${months[startM.getMonth()]} ${startM.getFullYear()} – ${months[latestRecordDate.getMonth()]} ${latestRecordDate.getFullYear()}`;
              return buildMonthly(latestRecordDate, startM.getFullYear() !== latestRecordDate.getFullYear());
            }
            const startCurrentM = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            chartRangeLabel = `${months[startCurrentM.getMonth()]} – ${months[now.getMonth()]} ${now.getFullYear()}`;
            return currentMonthBars;
          }

          const buildQuarterly = (targetYear: number) =>
            [0, 1, 2, 3].map((qIdx) => {
              const qLabel = `S${qIdx + 1}`;
              const startMonth = qIdx * 3;
              const recs = datedCashflow
                .filter((item) => {
                  const dt = item.parsedDate;
                  return dt.getFullYear() === targetYear && dt.getMonth() >= startMonth && dt.getMonth() <= startMonth + 2;
                })
                .map((item) => item.record);
              const cash = recs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
              const qr = recs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
              const expenses = recs.reduce((s, r) => s + (Number(r.expenses) || 0), 0);
              const value = cash + qr;
              return {
                label: qLabel,
                fullDate: `Suku ${qIdx + 1} ${targetYear}`,
                value,
                cashSales: cash,
                qrSales: qr,
                expenses,
                tx: recs.length,
                qr: value > 0 ? Math.round((qr / value) * 100) : 0
              };
            });

          const currentQuarterBars = buildQuarterly(now.getFullYear());
          if (!currentQuarterBars.some((b) => b.tx > 0) && latestRecordDate) {
            isHistoricalAnchor = true;
            chartRangeLabel = `Tahun ${latestRecordDate.getFullYear()}`;
            return buildQuarterly(latestRecordDate.getFullYear());
          }
          chartRangeLabel = `Tahun ${now.getFullYear()}`;
          return currentQuarterBars;
        })();

        const periodTotal = chartBars.reduce((s, b) => s + b.value, 0);
        const periodMax = Math.max(...chartBars.map(b => b.value), 0);
        const periodAvg = chartBars.length > 0 ? Math.round(periodTotal / chartBars.length) : 0;

        // Payment Mix (Tunai vs Pembayaran QR) & Profit Margin synced with salesPeriod
        const periodCashTotal = chartBars.reduce((s, b) => s + b.cashSales, 0);
        const periodQrTotal = chartBars.reduce((s, b) => s + b.qrSales, 0);
        const periodExpensesTotal = chartBars.reduce((s, b) => s + b.expenses, 0);
        const periodNetProfit = periodTotal - periodExpensesTotal;
        const periodProfitMargin = periodTotal > 0 ? Math.round((periodNetProfit / periodTotal) * 100) : 0;

        const paymentMixSegments = [
          { name: 'Pembayaran QR', value: periodQrTotal, color: '#2563EB' },
          { name: 'Jualan Tunai', value: periodCashTotal, color: '#10B981' }
        ];
        const periodShortBadge =
          salesPeriod === 'weekly' ? 'Mingguan' : salesPeriod === 'monthly' ? 'Bulanan' : 'Suku';

        // Dynamic Application Stepper based on user's actual state
        const hasBusiness = Boolean(myBusiness || userProfile?.businessName);
        const hasSsm = Boolean(myBusiness?.ssmNumber || userProfile?.ssmNumber);
        const hasBooking = Boolean(primaryBooking);
        const isBookingApproved = Boolean(approvedBooking);
        const isTenancySigned = Boolean(approvedBooking?.tenancySigned);

        const stepperItems = [
          {
            step: 1,
            title: 'Profil Bisnes & Usahawan',
            date: myBusiness?.createdAt ? formatDisplayDate(myBusiness.createdAt.split('T')[0]) : 'Langkah 1',
            officer: 'KBelia Online',
            status: hasBusiness ? 'completed' : 'current',
            desc: hasBusiness
              ? `Profil "${myBusiness?.businessName || userProfile?.businessName}" telah didaftarkan.`
              : 'Lengkapkan profil perniagaan anda di tab Profil Bisnes.'
          },
          {
            step: 2,
            title: 'Pengesahan SSM & Hubungi',
            date: hasSsm ? 'Disahkan' : 'Menunggu',
            officer: 'Pegawai Pengesah',
            status: hasSsm ? 'completed' : hasBusiness ? 'current' : 'upcoming',
            desc: hasSsm
              ? `No. SSM (${myBusiness?.ssmNumber || userProfile?.ssmNumber}) telah direkodkan.`
              : 'Masukkan nombor SSM (jika ada) di Tetapan Akaun atau Profil Kedai.'
          },
          {
            step: 3,
            title: 'Permohonan Slot Kiosk Belia',
            date: primaryBooking ? formatDisplayDate(primaryBooking.createdAt?.split('T')[0]) : 'Belum Mohon',
            officer: 'Pengurus Hub',
            status: isBookingApproved ? 'completed' : hasBooking ? 'current' : 'upcoming',
            desc: primaryBooking
              ? `Permohonan ${primaryBooking.slotCode} (${primaryBooking.hubLocation}) berstatus: ${primaryBooking.status === 'approved' ? 'Diluluskan' : primaryBooking.status === 'rejected' ? 'Ditolak' : 'Dalam Semakan'}.`
              : 'Pilih lokasi kiosk di menu Kiosk Saya untuk mula beroperasi.'
          },
          {
            step: 4,
            title: 'Surat Tawaran & Perjanjian Digital',
            date: isBookingApproved ? (isTenancySigned ? 'Dimeterai' : 'Sedia Ditandatangani') : 'Menunggu Kelulusan',
            officer: 'Penyelaras KBelia',
            status: isTenancySigned ? 'completed' : isBookingApproved ? 'current' : 'upcoming',
            desc: isTenancySigned
              ? 'Perjanjian sewaan digital telah ditandatangani.'
              : isBookingApproved
              ? 'Surat tawaran sedia dimuat turun. Sila sahkan perjanjian digital.'
              : 'Surat tawaran disediakan sebaik permohonan kiosk diluluskan.'
          },
          {
            step: 5,
            title: 'Operasi Kiosk & Rekod Jualan',
            date: isTenancySigned ? 'Aktif Beroperasi' : 'Peringkat Akhir',
            officer: 'Penyelia Tapak',
            status: isTenancySigned && safeCashflow.length > 0 ? 'completed' : isTenancySigned ? 'current' : 'upcoming',
            desc: safeCashflow.length > 0
              ? `${safeCashflow.length} rekod jualan tunai/QR telah dicatatkan.`
              : 'Catat jualan harian anda melalui Buku Tunai Kiosk selepas beroperasi.'
          }
        ];

        // Dynamic live notifications / alerts from real user records
        const liveAlerts: { tag: string; tagColor: string; time: string; title: string; body: string; action?: () => void }[] = [];
        if (upcomingMentor) {
          liveAlerts.push({
            tag: 'Jadual Mentor',
            tagColor: 'text-black dark:text-white/75',
            time: upcomingMentor.preferredDate || 'Dijadualkan',
            title: `Sesi Bimbingan: ${upcomingMentor.topic}`,
            body: `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime} (${normalizeMentorshipMode(upcomingMentor.mode)}).`,
            action: onOpenMentorshipClinic
          });
        }
        if (safeTickets.length > 0) {
          const latestTicket = safeTickets[0];
          liveAlerts.push({
            tag: 'Tiket Fasiliti',
            tagColor: 'text-black dark:text-white/75',
            time: latestTicket.status === 'resolved' ? 'Selesai' : latestTicket.status === 'in_progress' ? 'Diproses' : 'Diterima',
            title: `Aduan ${latestTicket.slotCode}: ${latestTicket.issueCategory}`,
            body: latestTicket.description,
            action: () => setActiveTab('bookings')
          });
        }
        if (latestGrant) {
          liveAlerts.push({
            tag: 'Permohonan Geran',
            tagColor: 'text-black dark:text-white/75',
            time: latestGrant.status === 'approved' ? 'Diluluskan' : latestGrant.status === 'rejected' ? 'Ditolak' : 'Dalam Semakan',
            title: latestGrant.programTitle,
            body: `Jumlah dipohon: ${latestGrant.grantAmount} (${latestGrant.businessName}).`,
            action: () => setActiveTab('vault')
          });
        }

        // Aggregate real pending approval requests across Kiosk, Grant, Mentorship & Maintenance
        const pendingApprovalItems: {
          id: string;
          category: string;
          title: string;
          subtitle: string;
          statusLabel: string;
          dateLabel: string;
          createdAt: string;
          actionLabel: string;
          onAction?: () => void;
        }[] = [
          ...safeBookings
            .filter((b) => b.status === 'pending')
            .map((b) => ({
              id: `booking-${b.id}`,
              category: 'Sewaan Kiosk',
              title: `${b.slotCode} · ${b.hubLocation}`,
              subtitle: `${b.businessName} · Tempoh ${b.durationMonths} bln`,
              statusLabel: 'Menunggu Kelulusan',
              dateLabel: b.createdAt ? formatDisplayDate(b.createdAt.split('T')[0]) : 'Baharu',
              createdAt: b.createdAt || '',
              actionLabel: 'Lihat Kiosk',
              onAction: () => setActiveTab('bookings')
            })),
          ...grantApplications
            .filter((g) => g.status === 'pending')
            .map((g) => ({
              id: `grant-${g.id}`,
              category: 'Geran Belia',
              title: g.programTitle,
              subtitle: `${g.businessName} · ${g.grantAmount || g.amount || 'Dalam Semakan'}`,
              statusLabel: 'Dalam Semakan',
              dateLabel: g.createdAt ? formatDisplayDate(g.createdAt.split('T')[0]) : 'Baharu',
              createdAt: g.createdAt || '',
              actionLabel: 'Lihat Geran',
              onAction: () => setActiveTab('vault')
            })),
          ...safeMentorships
            .filter((m) => m.status === 'pending')
            .map((m) => ({
              id: `mentor-${m.id}`,
              category: 'Klinik Mentor',
              title: m.topic,
              subtitle: `${m.mentorName} · ${m.preferredDate} (${m.preferredTime})`,
              statusLabel: 'Menunggu Sesi',
              dateLabel: m.createdAt ? formatDisplayDate(m.createdAt.split('T')[0]) : m.preferredDate || 'Dijadualkan',
              createdAt: m.createdAt || '',
              actionLabel: 'Buka Klinik',
              onAction: onOpenMentorshipClinic
            })),
          ...safeTickets
            .filter((t) => t.status === 'received' || t.status === 'in_progress')
            .map((t) => ({
              id: `ticket-${t.id}`,
              category: 'Tiket Fasiliti',
              title: `${t.slotCode}: ${t.issueCategory}`,
              subtitle: `${t.kioskName} · ${t.description}`,
              statusLabel: t.status === 'in_progress' ? 'Sedang Diproses' : 'Diterima',
              dateLabel: t.createdAt ? formatDisplayDate(t.createdAt.split('T')[0]) : 'Baharu',
              createdAt: t.createdAt || '',
              actionLabel: 'Semak Tiket',
              onAction: () => setActiveTab('bookings')
            }))
        ].sort((a, b) => {
          const tsA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tsB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (Number.isNaN(tsB) ? 0 : tsB) - (Number.isNaN(tsA) ? 0 : tsA);
        });

        const topPendingApprovals = pendingApprovalItems.slice(0, 3);

        return (
        <div className="space-y-4">
          
          {/* Compact Business Identity Summary Strip */}
          <div className="animate-dashboard-card rounded-xl bg-white dark:bg-zinc-900 px-4 py-2.5 border border-slate-200 dark:border-zinc-700 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm transition-colors hover:border-slate-300 dark:hover:border-zinc-600">
            <span className="font-extrabold text-black dark:text-white text-sm">
              {myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Usahawan Belia'}
            </span>
            <span className="text-black/30 dark:text-white/30" aria-hidden="true">·</span>
            <span className="text-black/75 dark:text-white/75">
              {myBusiness?.district || userProfile?.district || 'Kota Bharu'}
            </span>
            <span className="text-black/30 dark:text-white/30" aria-hidden="true">·</span>
            <span className="font-mono text-[0.8125rem] font-semibold text-black/80 dark:text-white/80">
              SSM: {myBusiness?.ssmNumber || userProfile?.ssmNumber || 'Belum Didaftarkan'}
            </span>
          </div>

          {/* 4 Compact Summary KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SaaSKpiCard
              title="Hasil Jualan Direkodkan"
              value={`RM ${totalSalesAll.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtitle={
                safeCashflow.length > 0
                  ? `Purata RM ${avgDailySales.toLocaleString()} · ${qrPercentAll}% QR`
                  : 'Mula catat di Buku Tunai'
              }
              icon={TrendingUp}
              accentColor="emerald"
              isLive
              staggerIndex={0}
              onClick={() => setActiveTab('cashflow')}
            />

            <SaaSKpiCard
              title="Status Tapak Kiosk"
              value={primaryBooking ? primaryBooking.slotCode : 'Belum Mohon'}
              subtitle={
                primaryBooking
                  ? `${primaryBooking.hubLocation} · ${primaryBooking.durationMonths} bln`
                  : 'Mohon slot kapsul niaga belia'
              }
              icon={Building2}
              accentColor="amber"
              isLive
              staggerIndex={1}
              onClick={() => setActiveTab('bookings')}
            />

            <SaaSKpiCard
              title="Permohonan Geran Belia"
              value={`RM ${totalGrantValue.toLocaleString('ms-MY')}`}
              subtitle={
                latestGrant
                  ? `${latestGrant.programTitle}`
                  : 'Tiada permohonan geran lagi'
              }
              icon={FileCheck}
              accentColor="blue"
              staggerIndex={2}
              onClick={() => setActiveTab('vault')}
            />

            <SaaSKpiCard
              title="Klinik Mentoring Seterusnya"
              value={upcomingMentor ? upcomingMentor.preferredDate : 'Tiada Sesi'}
              subtitle={
                upcomingMentor
                  ? `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime}`
                  : 'Tempah sesi bimbingan mentor'
              }
              icon={Calendar}
              accentColor="violet"
              staggerIndex={3}
              onClick={onOpenMentorshipClinic}
            />
          </div>

          {/* [2] Seksyen Analitik 2:1 — Graf Aliran Jualan (2 Bahagian) + Donat Kategori & Stok (1 Bahagian) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <div
              style={{ '--stagger': 4 } as React.CSSProperties}
              className="animate-dashboard-card lg:col-span-2 h-full w-full rounded-2xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0"
            >
            {/* Card Header */}
            <div className="border-b border-slate-300 dark:border-zinc-600 py-3 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-black dark:text-white/75" />
                  <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                    Analitik Aliran Jualan Kiosk
                  </h4>
                </div>
                <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5">
                  Transaksi tunai &amp; pembayaran QR (data sebenar &amp; asas sampel)
                </p>
              </div>

              {/* Chart Mode + Period Selector Tabs */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-600">
                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    className={`px-2.5 py-1.5 rounded-md text-[0.8125rem] font-bold transition-all cursor-pointer ${
                      chartMode === 'bar'
                        ? 'bg-slate-800 dark:bg-zinc-700 text-white'
                        : 'text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('area')}
                    className={`px-2.5 py-1.5 rounded-md text-[0.8125rem] font-bold transition-all cursor-pointer ${
                      chartMode === 'area'
                        ? 'bg-slate-800 dark:bg-zinc-700 text-white'
                        : 'text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Grafik
                  </button>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-600">
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('weekly')}
                    className={`px-2.5 py-1.5 rounded-md text-[0.8125rem] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'weekly'
                        ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600'
                        : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('monthly')}
                    className={`px-2.5 py-1.5 rounded-md text-[0.8125rem] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'monthly'
                        ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600'
                        : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('quarterly')}
                    className={`px-2.5 py-1.5 rounded-md text-[0.8125rem] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'quarterly'
                        ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600'
                        : 'text-black dark:text-white/80 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Suku
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Chart Content Area */}
            <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 min-w-0">
              {/* Metric Strip */}
              <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-slate-300 dark:border-zinc-600 text-center">
                <div>
                  <span className="text-sm text-black/75 dark:text-white/80 block font-semibold">Terkumpul</span>
                  <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-black dark:text-white">
                    RM {periodTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-black/75 dark:text-white/80 block font-semibold">Purata/Tempoh</span>
                  <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-black dark:text-white">
                    RM {periodAvg.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-black/75 dark:text-white/80 block font-semibold">Puncak</span>
                  <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-black dark:text-white/85">
                    RM {periodMax.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Interactive Full-Width Recharts Chart */}
              <div className="relative h-[215px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-700 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-200">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 215 }}>
                    {chartMode === 'area' ? (
                      <AreaChart data={chartBars} margin={{ top: 18, right: 12, left: 0, bottom: 2 }}>
                        <defs>
                          <linearGradient id="beliaSalesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.38} />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                        <XAxis
                          dataKey="label"
                          height={24}
                          tickMargin={4}
                          tick={{ fontSize: 12, fontWeight: 600 }}
                          interval={0}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          width={48}
                          tickMargin={2}
                          domain={[0, (dataMax: number) => Math.max(dataMax, 100)]}
                          allowDecimals={false}
                          tick={{ fontSize: 12, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `RM${val}`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as { label: string; fullDate?: string; value: number; tx: number; qr: number };
                              return (
                                <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700">
                                  <div className="text-white/80 text-[0.8125rem] mb-0.5">{d.fullDate || d.label}</div>
                                  <div className="font-bold text-white">RM {d.value.toLocaleString()}</div>
                                  <div className="text-[0.8125rem] text-white/85 mt-0.5">{d.tx} rekod · {d.qr}% Pembayaran QR</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#beliaSalesGradient)"
                          isAnimationActive={!prefersReducedMotion}
                          animationDuration={650}
                          animationEasing="ease-out"
                          dot={{ r: 4, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={chartBars}
                        barCategoryGap="18%"
                        margin={{ top: 18, right: 12, left: 0, bottom: 2 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                        <XAxis
                          dataKey="label"
                          height={24}
                          tickMargin={4}
                          tick={{ fontSize: 12, fontWeight: 600 }}
                          interval={0}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          width={48}
                          tickMargin={2}
                          domain={[0, (dataMax: number) => Math.max(dataMax, 100)]}
                          allowDecimals={false}
                          tick={{ fontSize: 12, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `RM${val}`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(37, 99, 235, 0.12)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as { label: string; fullDate?: string; value: number; tx: number; qr: number };
                              return (
                                <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700">
                                  <div className="text-white/80 text-[0.8125rem] mb-0.5">{d.fullDate || d.label}</div>
                                  <div className="font-bold text-white">RM {d.value.toLocaleString()}</div>
                                  <div className="text-[0.8125rem] text-white/85 mt-0.5">{d.tx} rekod · {d.qr}% Pembayaran QR</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#2563EB"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={56}
                          minPointSize={(val) => (Number(val) > 0 ? 6 : 0)}
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
                            dataKey="value"
                            position="top"
                            formatter={(val: unknown) => {
                              const num = Number(val);
                              return num > 0 ? `RM${num.toLocaleString()}` : '';
                            }}
                            className="fill-slate-900 dark:fill-slate-100 font-mono"
                            style={{ fontSize: 11.5, fontWeight: 700 }}
                          />
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </div>

            <RoleDonutCard
              className="lg:col-span-1 h-full"
              title="Saluran Bayaran & Untung"
              subtitle="Nisbah Tunai vs QR mengikut tempoh"
              icon={Wallet}
              accentBarClass="bg-emerald-600/80 dark:bg-emerald-500/80"
              headerRight={
                <span className="text-[0.75rem] font-mono font-semibold text-black/70 dark:text-white/75 tabular-nums">
                  {periodShortBadge}
                </span>
              }
              segments={paymentMixSegments}
              centerValue={`${periodProfitMargin}%`}
              centerLabel="Margin Untung"
              valueUnit="RM"
              summaryPairs={[
                {
                  label: 'Untung Bersih',
                  value: `${periodNetProfit < 0 ? '-' : ''}RM ${Math.abs(periodNetProfit).toLocaleString('ms-MY')}`,
                  dotColor: periodNetProfit >= 0 ? '#10B981' : '#F43F5E'
                },
                {
                  label: 'Kos / Belanja',
                  value: `RM ${periodExpensesTotal.toLocaleString('ms-MY')}`,
                  dotColor: '#F59E0B'
                }
              ]}
              emptyState={{
                title: 'Tiada Rekod Jualan Tempoh Ini',
                description: 'Catat jualan tunai, pembayaran QR, dan kos di Buku Tunai untuk melihat pecahan saluran bayaran serta margin untung.',
                actionLabel: 'Rekod Jualan',
                onAction: () => setActiveTab('cashflow')
              }}
              staggerIndex={5}
            />
          </div>

          {/* [3] Dua Lajur Ringkasan Seimbang Kiri & Kanan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* Lajur Kiri: Permohonan Menunggu Kelulusan */}
            <div
              style={{ '--stagger': 5 } as React.CSSProperties}
              className="animate-dashboard-card min-w-0 rounded-2xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 flex flex-col"
            >
              <div className="border-b border-slate-300 dark:border-zinc-600 py-3 px-4 sm:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                      Permohonan Menunggu Kelulusan
                    </h4>
                  </div>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75 mt-0.5">
                    Ringkasan permohonan terkini dalam semakan pentadbir &amp; mentor
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col justify-start gap-3">
                <div className="flex flex-col justify-start">
                  {topPendingApprovals.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center gap-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm sm:text-base font-bold text-black dark:text-white">
                          Tiada Permohonan Menunggu Kelulusan
                        </p>
                        <p className="text-sm text-black/70 dark:text-white/75 mt-1 max-w-md leading-relaxed">
                          Semua permohonan sewaan kiosk, geran belia, dan sesi klinik mentor anda telah selesai diproses atau sedia untuk permohonan baharu.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => (onOpenBookingTab ? onOpenBookingTab() : onOpenBookingModal ? onOpenBookingModal() : setActiveTab('bookings'))}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          Mohon Kiosk
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('vault')}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-black dark:text-white bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          Mohon Geran
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {topPendingApprovals.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onAction}
                          disabled={!item.onAction}
                          className={`w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            item.onAction
                              ? 'cursor-pointer hover:-translate-y-0.5 hover:border-blue-500/70 dark:hover:border-blue-400/70'
                              : 'cursor-default'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                {item.category}
                              </span>
                              <span className="text-black/30 dark:text-white/30" aria-hidden="true">·</span>
                              <span className="font-mono text-[0.75rem] text-black/65 dark:text-white/70 tabular-nums">
                                {item.dateLabel}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/70 text-[0.75rem] font-bold text-black dark:text-amber-200">
                                {item.statusLabel}
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-black dark:text-white leading-snug truncate">
                              {item.title}
                            </h5>
                            <p className="text-[0.8125rem] text-black/75 dark:text-white/75 truncate">
                              {item.subtitle}
                            </p>
                          </div>

                          {item.onAction && (
                            <span className="inline-flex items-center gap-1 text-[0.8125rem] font-bold text-blue-600 dark:text-blue-400 shrink-0 self-start sm:self-center">
                              <span>{item.actionLabel}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lajur Kanan: Penjejak Permohonan Berperingkat */}
            <div
              style={{ '--stagger': 6 } as React.CSSProperties}
              className="animate-dashboard-card min-w-0 rounded-2xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 flex flex-col"
            >
              {/* Card Header */}
              <div className="border-b border-slate-300 dark:border-slate-600 py-3 px-4 sm:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                    <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                      Penjejak Permohonan
                    </h4>
                  </div>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75 mt-0.5">
                    Status semakan semasa Jawatankuasa KBelia
                  </p>
                </div>
              </div>

              {/* Stepper Timeline Body */}
              <div className="p-3.5 sm:p-4 flex flex-col justify-start gap-2.5">
                <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
                  {stepperItems.map((stepItem) => (
                    <div
                      key={stepItem.step}
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        stepItem.status === 'completed'
                          ? 'bg-emerald-500'
                          : stepItem.status === 'current'
                          ? 'bg-amber-500'
                          : 'bg-slate-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {stepperItems.map((stepItem, idx) => {
                    const isCompleted = stepItem.status === 'completed';
                    const isCurrent = stepItem.status === 'current';
                    const isSelected = selectedStepperIndex === idx;

                    return (
                      <div
                        key={stepItem.step}
                        onClick={() => setSelectedStepperIndex(idx)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-slate-900 border-amber-400 dark:border-amber-400/40 shadow-xs'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.8125rem] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-amber-500 text-white ring-2 ring-amber-100 dark:ring-amber-950/60'
                              : 'bg-slate-200 dark:bg-slate-700 text-black/70 dark:text-white/75'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepItem.step}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className={`text-sm font-bold leading-snug break-words ${
                                isCurrent ? 'text-black dark:text-white/75' : 'text-black dark:text-white'
                              }`}>
                                {stepItem.title}
                              </h5>
                              <span className={`text-[0.8125rem] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-black dark:text-white'
                                  : isCurrent
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-black dark:text-white'
                                  : 'bg-slate-100 dark:bg-slate-900 text-black/70 dark:text-white/75'
                              }`}>
                                {isCompleted ? 'Selesai' : isCurrent ? 'Diproses' : 'Menunggu'}
                              </span>
                            </div>

                            <div className="text-[0.8125rem] text-black/70 dark:text-white/75 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-relaxed">
                              <span className="font-mono">{stepItem.date}</span>
                              <span>·</span>
                              <span className="break-words">{stepItem.officer}</span>
                            </div>

                            {isSelected && (
                              <p className="mt-1.5 text-[0.875rem] text-black dark:text-white bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-600 leading-relaxed animate-in fade-in duration-150">
                                {stepItem.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* [4] Senarai Ringkasan Aktiviti & Laporan Pantas Usahawan (Lebar Penuh Padat) */}
          <div
            style={{ '--stagger': 7 } as React.CSSProperties}
            className="animate-dashboard-card w-full rounded-2xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 flex flex-col"
          >
            <div className="border-b border-slate-300 dark:border-slate-600 py-3 px-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-black dark:text-white">
                    Ringkasan Aktiviti &amp; Laporan Semasa
                  </h4>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75 mt-0.5">
                    Senarai padat notifikasi terkini, status lesen kiosk, dan jalan pintas pengurusan perniagaan
                  </p>
                </div>
              </div>
            </div>

            {liveAlerts.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <p className="text-[0.9375rem] font-bold text-black dark:text-white">
                  Mulakan Langkah Usahawan Anda
                </p>
                <p className="text-[0.875rem] text-black dark:text-white/75 leading-relaxed max-w-xl mx-auto">
                  Lengkapkan profil perniagaan, tempah klinik bimbingan mentor, atau laporkan sebarang aduan fasiliti kiosk anda.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {onOpenMentorshipClinic && (
                    <button
                      type="button"
                      onClick={onOpenMentorshipClinic}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200 dark:border-teal-800/70 text-[0.8125rem] font-semibold cursor-pointer"
                    >
                      Klinik Mentor
                    </button>
                  )}
                  {onOpenMaintenanceModal && (
                    <button
                      type="button"
                      onClick={onOpenMaintenanceModal}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800 text-[0.8125rem] font-semibold cursor-pointer"
                    >
                      Aduan Fasiliti
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
                {liveAlerts.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.action}
                    className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      item.action ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${item.tagColor}`}>{item.tag}</span>
                        <span className="text-black/30 dark:text-white/30" aria-hidden="true">·</span>
                        <span className="text-xs text-black/65 dark:text-white/70 font-mono tabular-nums">{item.time}</span>
                      </div>
                      <h5 className="text-sm font-bold text-black dark:text-white leading-snug truncate">
                        {item.title}
                      </h5>
                      <p className="text-xs sm:text-[0.875rem] text-black/75 dark:text-white/75 truncate">
                        {item.body}
                      </p>
                    </div>
                    {item.action && (
                      <span className="inline-flex items-center gap-1 text-xs sm:text-[0.8125rem] font-bold text-blue-600 dark:text-blue-400 shrink-0 self-start sm:self-center">
                        <span>Buka</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        );
      })()}

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div key="profile" className="mt-4 relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden w-full transition-colors animate-dashboard-tab">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500/80 dark:bg-blue-400/80" />
          {/* Card Header */}
          <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-3.5 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
                  Maklumat Asas & Jenama Perniagaan
                </h3>
                <p className="text-[0.9375rem] text-black dark:text-white/75">
                  Penyelarasan profil bisnes bagi pendaftaran direktori usahawan belia Kelantan
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBusiness} className="p-4 sm:p-5 space-y-4">
            {/* 2-Column Row 1: Nama Perniagaan + Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Nama Perniagaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama perniagaan"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Slogan Perniagaan
                </label>
                <input
                  type="text"
                  placeholder="Masukkan slogan perniagaan"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* 2-Column Row 2: Kategori + Jajahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Kategori Perniagaan *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Jajahan Operasi *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2-Column Row 3: Nombor Pendaftaran SSM + Nombor WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Nombor Pendaftaran SSM
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nombor pendaftaran SSM"
                  value={ssmNumber}
                  onChange={(e) => setSsmNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Nombor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Masukkan nombor telefon"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Penerangan Perniagaan */}
            <div>
              <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                Penerangan Perniagaan
              </label>
              <textarea
                rows={3}
                placeholder="Masukkan penerangan perniagaan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
            </div>

            {/* 2-Column Row 4: Instagram + TikTok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama pengguna Instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  TikTok
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama pengguna TikTok"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* 2-Column Row 5: Media Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Logo Perniagaan
                </label>
                <ImageDropzone
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val)}
                  label="Pilih gambar logo perniagaan"
                  aspectRatio="1:1"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                  Banner Premis
                </label>
                <ImageDropzone
                  value={bannerUrl}
                  onChange={(val) => setBannerUrl(val)}
                  label="Pilih gambar banner premis"
                  aspectRatio="16:9"
                />
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-lg text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-blue-600"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Profil Perniagaan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Products */}
      {activeTab === 'products' && (() => {
        const activeFilterCount =
          (prodCategoryFilter !== 'Semua' ? 1 : 0) +
          (prodStockFilter !== 'all' ? 1 : 0) +
          (prodSortBy !== DEFAULT_SORT_VALUE ? 1 : 0);
        const pageIds = productsPagination.paginatedItems.map((p) => p.id);
        const allPageSelected =
          pageIds.length > 0 && pageIds.every((id) => selectedProductIds.includes(id));

        const toggleSelectAllOnPage = () => {
          if (allPageSelected) {
            setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
          } else {
            setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
          }
        };

        const toggleSelectRow = (id: string) => {
          setSelectedProductIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        };

        return (
        <div key="products" className="mt-4 space-y-4 animate-dashboard-tab">
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white tracking-tight">
              Katalog Menu &amp; Produk Anda
            </h3>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5">
              Urus senarai menu, pantau ketersediaan stok dan eksport rekod ke Excel.
            </p>
          </div>

          {/* Add Product Form Box */}
          {showAddProduct && (
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden animate-dashboard-tab transition-colors">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500/80 dark:bg-blue-400/80" />
              <div className="kbelia-important-header border-b border-slate-300 dark:border-slate-600 py-3.5 px-5 flex items-center justify-between">
                <h4 className="font-bold text-sm sm:text-[0.9375rem] text-black dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Borang Tambah Produk Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  aria-label="Tutup borang tambah produk"
                  className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      placeholder="Masukkan nama produk"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Harga Jualan *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.10"
                      required
                      placeholder="Masukkan harga jualan"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Kategori Produk
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Masukkan kategori produk"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                    Status Stok
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    <button
                      type="button"
                      aria-pressed={prodInStock}
                      onClick={() => setProdInStock(true)}
                      className={`min-h-[42px] px-4 py-2.5 rounded-xl border text-sm sm:text-[0.9375rem] font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                        prodInStock
                          ? 'bg-emerald-100 dark:bg-emerald-900/70 border-emerald-500 dark:border-emerald-500 text-black dark:text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black/70 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Stok Tersedia</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={!prodInStock}
                      onClick={() => setProdInStock(false)}
                      className={`min-h-[42px] px-4 py-2.5 rounded-xl border text-sm sm:text-[0.9375rem] font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                        !prodInStock
                          ? 'bg-rose-100 dark:bg-rose-900/70 border-rose-500 dark:border-rose-500 text-black dark:text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-black/70 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Kehabisan Stok</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Penerangan Produk
                    </label>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      placeholder="Masukkan penerangan produk"
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-[0.9375rem] font-medium text-black dark:text-white mb-2">
                      Gambar Produk
                    </label>
                    <ImageDropzone
                      value={prodImageUrl}
                      onChange={(val) => setProdImageUrl(val)}
                      label="Pilih gambar produk"
                      aspectRatio="1:1"
                    />
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-300 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="min-h-[40px] py-2.5 px-5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[40px] py-2.5 px-6 rounded-xl text-sm sm:text-[0.9375rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>{loading ? 'Menyimpan...' : 'Simpan Produk'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reference-Style Product Table Card: Search + Filter Toolbar -> Sortable Table -> Compact Pagination */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
            {/* Search & Filter Toolbar */}
            <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-700">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-black/45 dark:text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="Cari produk atau kategori..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                />
                {prodSearch && (
                  <button
                    type="button"
                    onClick={() => setProdSearch('')}
                    aria-label="Kosongkan carian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {selectedProductIds.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 text-xs font-semibold text-black dark:text-white">
                    <span className="tabular-nums">{selectedProductIds.length} dipilih</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="text-blue-700 dark:text-blue-300 hover:underline cursor-pointer font-bold"
                    >
                      Kosongkan
                    </button>
                  </div>
                )}

                <div className="relative" data-prod-filter>
                  <button
                    type="button"
                    onClick={() => setIsProdFilterOpen((prev) => !prev)}
                    aria-expanded={isProdFilterOpen}
                    className={`min-h-[38px] px-3.5 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                      activeFilterCount > 0
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-black dark:text-white'
                        : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    <span>
                      Penapis{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportProducts}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-black dark:text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedProductIds.length > 0
                        ? `Eksport (${selectedProductIds.length})`
                        : 'Eksport'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{showAddProduct ? 'Tutup Borang' : 'Daftar Produk'}</span>
                  </button>

                  {isProdFilterOpen && (
                    <div className="animate-popover-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl p-4 z-30 space-y-3.5">
                      <div className="pb-3 border-b border-slate-200 dark:border-zinc-700">
                        <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                          <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>Susun Mengikut</span>
                        </label>
                        <select
                          value={prodSortBy === 'table_column' ? '' : prodSortBy}
                          onChange={(e) => {
                            if (e.target.value) setProdSortBy(e.target.value);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer"
                        >
                          {prodSortBy === 'table_column' && (
                            <option value="">Ikut Lajur Jadual</option>
                          )}
                          {productSortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                          Kategori
                        </label>
                        <select
                          value={prodCategoryFilter}
                          onChange={(e) => setProdCategoryFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer"
                        >
                          {productCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                          Status Stok
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              { id: 'all', label: 'Semua' },
                              { id: 'in_stock', label: 'Tersedia' },
                              { id: 'out_of_stock', label: 'Habis' }
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setProdStockFilter(opt.id)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                                prodStockFilter === opt.id
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setProdCategoryFilter('Semua');
                            setProdStockFilter('all');
                            setProdSortBy(DEFAULT_SORT_VALUE);
                          }}
                          className="text-xs font-semibold text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:underline cursor-pointer"
                        >
                          Set Semula
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsProdFilterOpen(false)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {safeProducts.length === 0 ? (
              <div className="p-10 text-center">
                <ShoppingBag className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  Belum Ada Produk Disenaraikan
                </h4>
                <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5">
                  Tekan butang Daftar Produk di atas untuk memasukkan item pertama anda.
                </p>
              </div>
            ) : filteredSortedProducts.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Search className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  Tiada Produk Padan Dengan Carian / Penapis
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setProdSearch('');
                    setProdCategoryFilter('Semua');
                    setProdStockFilter('all');
                  }}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
                        <th className="py-3 pl-4 pr-2 w-10">
                          <input
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={toggleSelectAllOnPage}
                            aria-label="Pilih semua produk pada halaman ini"
                            className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleProductSort('name')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Produk</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleProductSort('category')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Kategori</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleProductSort('price')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Harga</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleProductSort('inStock')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Stok</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleProductSort('createdAt')}
                            className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                          >
                            <span>Tarikh</span>
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                          </button>
                        </th>
                        <th className="py-3 pl-2 pr-4 w-12 text-right">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                      {productsPagination.paginatedItems.map((prod) => {
                        const isAvailable = prod.inStock !== false;
                        const isChecked = selectedProductIds.includes(prod.id);
                        const formattedPrice = `RM ${Number(prod.price || 0).toFixed(2)}`;
                        const dateStr = formatDisplayDate(
                          (prod.updatedAt || prod.createdAt || '').slice(0, 10)
                        );

                        return (
                          <tr
                            key={prod.id}
                            className={`kbelia-table-row ${
                              isChecked
                                ? 'bg-blue-50/40 dark:bg-blue-950/20'
                                : ''
                            }`}
                          >
                            <td className="py-3.5 pl-4 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRow(prod.id)}
                                aria-label={`Pilih ${prod.name}`}
                                className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                              />
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <ProductRowThumbnail src={prod.imageUrl} alt={prod.name} compact />
                                <span className="font-semibold text-black dark:text-white truncate max-w-[260px]">
                                  {prod.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-black/75 dark:text-white/80 whitespace-nowrap">
                              {prod.category || 'Umum'}
                            </td>
                            <td className="py-3.5 px-3 font-mono font-bold text-black dark:text-white tabular-nums whitespace-nowrap">
                              {formattedPrice}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70'
                                }`}
                              >
                                {isAvailable ? 'Stok Tersedia' : 'Habis Stok'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-black/70 dark:text-white/75 tabular-nums whitespace-nowrap">
                              {dateStr || '-'}
                            </td>
                            <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">
                              <RowActionMenu
                                ariaLabel={`Tindakan untuk ${prod.name}`}
                                items={[
                                  {
                                    label: 'Edit',
                                    onClick: () => setEditingProduct(prod)
                                  },
                                  {
                                    label: duplicatingProdId === prod.id ? 'Menduplikasi...' : 'Duplikasi',
                                    disabled: duplicatingProdId === prod.id,
                                    onClick: () => handleDuplicateProduct(prod)
                                  },
                                  {
                                    label: isAvailable ? 'Tanda Habis Stok' : 'Tanda Stok Tersedia',
                                    disabled: togglingStockId === prod.id,
                                    onClick: () => handleToggleProductStock(prod)
                                  },
                                  {
                                    label: 'Padam',
                                    tone: 'danger',
                                    dividerBefore: true,
                                    onClick: () =>
                                      confirmDelete({
                                        itemName: prod.name,
                                        itemType: 'Produk Katalog',
                                        onConfirm: () => handleDeleteProd(prod.id)
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
                  variant="compact"
                  currentPage={productsPagination.currentPage}
                  totalItems={productsPagination.totalItems}
                  itemsPerPage={7}
                  onPageChange={productsPagination.setCurrentPage}
                  itemLabel="produk"
                  accent="blue"
                />
              </>
            )}
          </div>
        </div>
        );
      })()}

      {/* Tab 3: Capsule Bookings */}
      {activeTab === 'bookings' && (
        <div key="bookings" className="mt-4 space-y-4 animate-dashboard-tab">
          <div>
            <h3 className="text-base font-bold text-black dark:text-white">Rekod Permohonan Kiosk Anda</h3>
            <p className="text-[0.9375rem] text-black dark:text-white/75">
              {hasActiveKioskBooking
                ? 'Tempahan atau sewaan kiosk aktif anda dipaparkan di bawah. Batalkan tempahan aktif jika ingin memohon unit lain.'
                : 'Semak status permohonan dan kelulusan kiosk anda oleh pihak pengurusan.'}
            </p>
          </div>

          {activeVisibleBookings.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
              <Building2 className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-black dark:text-white">
                {hasCancelledKioskBooking ? 'Tiada Permohonan Kiosk Aktif' : 'Tiada Permohonan Kiosk'}
              </h4>
              <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-0.5 mb-4 max-w-md mx-auto">
                {hasCancelledKioskBooking
                  ? 'Permohonan terdahulu anda telah dibatalkan. Pilih unit kiosk baharu di halaman Tempahan Kiosk untuk memohon semula.'
                  : 'Anda belum memohon sewaan slot kiosk belia. Pilih unit kiosk yang tersedia di halaman Tempahan Kiosk.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenBookingTab) onOpenBookingTab();
                  else if (onOpenBookingModal) onOpenBookingModal();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer interactive-press dark:bg-blue-600"
              >
                <Building2 className="w-4 h-4" />
                <span>{hasCancelledKioskBooking ? 'Mohon Semula Kiosk' : 'Mohon Kiosk'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
              <ReferenceTableToolbar
                accent="blue"
                searchValue={bookingSearch}
                onSearchChange={setBookingSearch}
                searchPlaceholder="Cari kod kiosk, nama slot atau lokasi..."
                filterCount={(bookingStatusFilter !== 'all' ? 1 : 0) + (bookingSortBy !== DEFAULT_SORT_VALUE ? 1 : 0)}
                onResetFilters={() => {
                  setBookingStatusFilter('all');
                  setBookingSortBy(DEFAULT_SORT_VALUE);
                }}
                sortOptions={bookingSortOptions}
                sortValue={bookingSortBy === 'table_column' ? '' : bookingSortBy}
                onSortChange={setBookingSortBy}
                filterContent={
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                      Status Permohonan
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'all', label: 'Semua' },
                        { id: 'pending', label: 'Dalam Semakan' },
                        { id: 'approved', label: 'Diluluskan' },
                        { id: 'rejected', label: 'Tidak Berjaya' }
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBookingStatusFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                            bookingStatusFilter === opt.id
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

              {filteredBookings.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <Building2 className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    Tiada permohonan sepadan dengan carian atau penapis.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('');
                      setBookingStatusFilter('all');
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
                              onClick={() => toggleBookingSort('slotName')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Kiosk</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleBookingSort('hubLocation')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Lokasi &amp; Saiz</span>
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                            </button>
                          </th>
                          <th className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleBookingSort('startDate')}
                              className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>Tempoh &amp; Mula</span>
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
                        {bookingsPagination.paginatedItems.map((b) => {
                          const matchedSlot = safeSlots.find(
                            (s) => (b.slotId && s.id === b.slotId) || (b.slotCode && s.code === b.slotCode)
                          );
                          const kioskImg = resolveBookingKioskImage(b, safeSlots);
                          const isExpanded = expandedBookingIds.includes(b.id);

                          const actionItems = [
                            {
                              label: isExpanded ? 'Tutup Butiran' : 'Lihat Butiran',
                              onClick: () => toggleBookingExpand(b.id)
                            },
                            {
                              label: 'Resit Rasmi Bayaran',
                              onClick: () => setSelectedReceiptBooking(b)
                            },
                            ...(b.status === 'approved' && onViewOfferLetter
                              ? [
                                  {
                                    label: 'Surat Tawaran',
                                    tone: 'accent' as const,
                                    onClick: () => onViewOfferLetter(b)
                                  }
                                ]
                              : []),
                            ...(b.status === 'approved' && onOpenTenancyAgreement
                              ? [
                                  {
                                    label: 'Perjanjian Sewa Kiosk',
                                    onClick: () => onOpenTenancyAgreement(b)
                                  }
                                ]
                              : []),
                            ...(b.status === 'approved' && onOpenVerification
                              ? [
                                  {
                                    label: 'Sahkan Lesen QR',
                                    onClick: () => onOpenVerification(`KBN-${b.slotCode}`)
                                  }
                                ]
                              : []),
                            {
                              label: 'Aduan Kiosk',
                              onClick: () => {
                                setMaintenanceComplaintBooking(b);
                                setComplaintSuccess(null);
                                setComplaintNotes('');
                              }
                            },
                            ...(b.status === 'pending' || b.status === 'approved'
                              ? [
                                  {
                                    label: 'Batalkan Tempahan',
                                    tone: 'danger' as const,
                                    dividerBefore: true,
                                    onClick: () => {
                                      setExpandedBookingIds((prev) =>
                                        prev.includes(b.id) ? prev : [...prev, b.id]
                                      );
                                      setInlineCancelBookingId(b.id);
                                    }
                                  }
                                ]
                              : [])
                          ];

                          return (
                            <React.Fragment key={b.id}>
                              <tr className="kbelia-table-row">
                                <td className="py-3.5 pl-5 pr-3">
                                  <div className="flex items-center gap-3 min-w-[200px]">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 shrink-0">
                                      <PortalImage
                                        src={kioskImg}
                                        alt={`Rupa bentuk kiosk ${b.slotName}`}
                                        fallbackType="kiosk"
                                        fallbackLabel={b.slotCode}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-black dark:text-white truncate max-w-[240px]">
                                        {b.slotCode} · {b.slotName}
                                      </p>
                                      <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[240px]">
                                        {b.businessName}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <p className="text-black dark:text-white font-medium whitespace-nowrap">
                                    {b.hubLocation}
                                  </p>
                                  <p className="text-xs text-black/60 dark:text-white/65 whitespace-nowrap">
                                    {matchedSlot?.size || 'Unit Kiosk Belia'}
                                  </p>
                                </td>
                                <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                                  <p className="font-medium text-black dark:text-white">{b.durationMonths} Bulan</p>
                                  <p className="text-xs text-black/60 dark:text-white/65">
                                    Mula {formatDisplayDate(b.startDate)}
                                  </p>
                                </td>
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  {b.status === 'pending' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
                                      <Clock className="w-3 h-3" />
                                      Dalam Semakan
                                    </span>
                                  )}
                                  {b.status === 'approved' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Diluluskan
                                    </span>
                                  )}
                                  {b.status === 'rejected' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
                                      <AlertCircle className="w-3 h-3" />
                                      Tidak Berjaya
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 pl-2 pr-5 text-right">
                                  <RowActionMenu
                                    ariaLabel={`Tindakan untuk ${b.slotCode}`}
                                    items={actionItems}
                                  />
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                  <td colSpan={5} className="px-5 py-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/75 dark:text-white/80 tabular-nums">
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span>Tempoh Operasi: <strong className="text-black dark:text-white">{b.durationMonths} Bulan</strong></span>
                                        <span>·</span>
                                        <span>Mula: <strong className="text-black dark:text-white">{formatDisplayDate(b.startDate)}</strong></span>
                                        <span>·</span>
                                        <span>Akhir: <strong className="text-black dark:text-white">{calculateOperationEndDate(b.startDate, b.durationMonths)}</strong></span>
                                      </div>

                                      <a
                                        href={`https://wa.me/601120508890?text=${encodeURIComponent(`Salam Admin KBelia Kelantan, saya ingin bertanya mengenai permohonan kiosk slot ${b.slotCode} (${b.slotName}) bagi perniagaan ${b.businessName}.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-black dark:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp Pentadbir</span>
                                      </a>
                                    </div>

                                    {b.adminNotes && (
                                      <div className="text-sm text-black dark:text-white bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-700">
                                        <span className="font-bold block mb-0.5">Catatan Pentadbir:</span>
                                        <p>{b.adminNotes}</p>
                                      </div>
                                    )}

                                    {(b.status === 'pending' || b.status === 'approved') && inlineCancelBookingId === b.id && (
                                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="text-sm text-black dark:text-white">
                                          <span className="font-bold">Sahkan pembatalan tempahan slot {b.slotCode}?</span>{' '}
                                          <span className="text-black/75 dark:text-white/75">
                                            Slot ini akan dilepaskan dan anda boleh memilih kiosk lain selepas pembatalan.
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            disabled={cancellingBooking}
                                            onClick={async () => {
                                              try {
                                                setCancellingBooking(true);
                                                await updateBookingStatus(
                                                  b.id,
                                                  'cancelled',
                                                  'Tempahan dibatalkan oleh usahawan.',
                                                  b.slotId,
                                                  b.businessName,
                                                  b.applicantId,
                                                  b
                                                );
                                                showToast({
                                                  type: 'info',
                                                  title: 'Tempahan Kiosk Dibatalkan',
                                                  message: `Tempahan slot ${b.slotCode} telah dibatalkan. Anda kini boleh memohon unit kiosk lain.`
                                                });
                                                setInlineCancelBookingId(null);
                                                onRefresh();
                                              } catch {
                                                showToast({
                                                  type: 'error',
                                                  title: 'Ralat Pembatalan',
                                                  message: 'Gagal membatalkan tempahan. Sila cuba lagi.'
                                                });
                                              } finally {
                                                setCancellingBooking(false);
                                              }
                                            }}
                                            className="px-3.5 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                                          >
                                            {cancellingBooking ? 'Memproses...' : 'Ya, Batalkan'}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={cancellingBooking}
                                            onClick={() => setInlineCancelBookingId(null)}
                                            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-black dark:text-white bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                          >
                                            Kekalkan
                                          </button>
                                        </div>
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
                    currentPage={bookingsPagination.currentPage}
                    totalItems={bookingsPagination.totalItems}
                    itemsPerPage={7}
                    onPageChange={bookingsPagination.setCurrentPage}
                    itemLabel="sewaan kiosk"
                    accent="blue"
                  />
                </>
              )}
            </div>
          )}

          {/* Existing Maintenance Tickets List */}
          {sortedTickets.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-black dark:text-white" />
                <span>Tiket Aduan Fasiliti Anda</span>
              </h4>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
                <ReferenceTableToolbar
                  accent="blue"
                  searchValue={ticketSearch}
                  onSearchChange={setTicketSearch}
                  searchPlaceholder="Cari kod kiosk, kategori atau aduan..."
                  filterCount={(ticketStatusFilter !== 'all' ? 1 : 0) + (ticketSortBy !== DEFAULT_SORT_VALUE ? 1 : 0)}
                  onResetFilters={() => {
                    setTicketStatusFilter('all');
                    setTicketSortBy(DEFAULT_SORT_VALUE);
                  }}
                  sortOptions={ticketSortOptions}
                  sortValue={ticketSortBy === 'table_column' ? '' : ticketSortBy}
                  onSortChange={setTicketSortBy}
                  rightSlot={
                    onOpenMaintenanceModal ? (
                      <button
                        type="button"
                        onClick={onOpenMaintenanceModal}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Aduan Baharu</span>
                      </button>
                    ) : undefined
                  }
                  filterContent={
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                        Status Aduan
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

                {filteredTickets.length === 0 ? (
                  <div className="py-10 px-6 text-center space-y-2">
                    <Wrench className="w-8 h-8 text-black/30 dark:text-white/30 mx-auto" />
                    <p className="text-sm font-bold text-black dark:text-white">
                      Tiada tiket aduan sepadan dengan carian anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTicketSearch('');
                        setTicketStatusFilter('all');
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
                                <span>Unit Kiosk</span>
                                <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                              </button>
                            </th>
                            <th className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => toggleTicketSort('issueCategory')}
                                className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                              >
                                <span>Kategori &amp; Keterangan</span>
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
                          {ticketsPagination.paginatedItems.map((t) => {
                            const isTicketExpanded = expandedTicketIds.includes(t.id);
                            return (
                              <React.Fragment key={t.id}>
                                <tr className="kbelia-table-row">
                                  <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                        <Wrench className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-black dark:text-white">{t.slotCode}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <p className="font-medium text-black dark:text-white truncate max-w-[260px]">
                                      {t.issueCategory}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[300px]">
                                      {t.description}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        t.status === 'resolved'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                          : t.status === 'in_progress'
                                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                                      }`}
                                    >
                                      {t.status === 'resolved' ? 'Selesai' : t.status === 'in_progress' ? 'Sedang Dibaiki' : 'Diterima'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pl-2 pr-5 text-right">
                                    <RowActionMenu
                                      ariaLabel={`Tindakan untuk tiket ${t.slotCode}`}
                                      items={[
                                        {
                                          label: isTicketExpanded ? 'Tutup Butiran' : 'Lihat Butiran',
                                          onClick: () =>
                                            setExpandedTicketIds((prev) =>
                                              prev.includes(t.id)
                                                ? prev.filter((item) => item !== t.id)
                                                : [...prev, t.id]
                                            )
                                        },
                                        ...(onOpenMaintenanceModal
                                          ? [
                                              {
                                                label: 'Buat Aduan Baharu',
                                                tone: 'accent' as const,
                                                onClick: onOpenMaintenanceModal
                                              }
                                            ]
                                          : [])
                                      ]}
                                    />
                                  </td>
                                </tr>
                                {isTicketExpanded && (
                                  <tr className="bg-slate-50/70 dark:bg-zinc-950/60">
                                    <td colSpan={4} className="px-5 py-3.5 text-sm text-black dark:text-white space-y-1.5">
                                      <p className="font-semibold">Keterangan Penuh Aduan:</p>
                                      <p className="text-black/75 dark:text-white/80">{t.description}</p>
                                      {t.adminNotes && (
                                        <p className="text-xs text-black/70 dark:text-white/75 pt-1">
                                          <strong className="text-black dark:text-white">Catatan Teknikal:</strong> {t.adminNotes}
                                        </p>
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
                      accent="blue"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Inline 2-step cancellation is used above (zero pop-up modal) */}

          {/* MODAL 1: OFFICIAL RECEIPT (RESIT RASMI BAYARAN KBELIA) */}
          {selectedReceiptBooking && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden text-black dark:text-white">
                
                {/* Receipt Header */}
                <div className="p-5 kbelia-important-header border-b border-slate-300 dark:border-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs dark:bg-emerald-600">
                      <span className="text-base font-black">KB</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white">Resit Rasmi Bayaran Subsidi Kiosk</h4>
                      <p className="text-[0.875rem] text-black dark:text-white/75 font-semibold">Pengurusan Pembangunan Usahawan Belia Kelantan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptBooking(null)}
                    className="p-1.5 text-black/70 hover:text-black dark:text-white/75 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 space-y-4 text-sm">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-300 dark:border-slate-600">
                    <div>
                      <span className="text-black/70 dark:text-white/75 text-[0.8125rem] uppercase font-bold block">No. Rujukan Resit</span>
                      <span className="font-mono font-extrabold text-sm text-black dark:text-white/75">
                        REC-{selectedReceiptBooking.slotCode}-{selectedReceiptBooking.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-black/70 dark:text-white/75 text-[0.8125rem] uppercase font-bold block">Tarikh Permohonan</span>
                      <span className="font-semibold text-black dark:text-white">{formatDisplayDate(selectedReceiptBooking.createdAt?.split('T')[0])}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-300 dark:border-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/75">Nama Usahawan:</span>
                      <span className="font-bold text-black dark:text-white">{selectedReceiptBooking.applicantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/75">Jenama Perniagaan:</span>
                      <span className="font-bold text-black dark:text-white">{selectedReceiptBooking.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/75">Kiosk Diberikan:</span>
                      <span className="font-bold text-black dark:text-white/75">{selectedReceiptBooking.slotCode} ({selectedReceiptBooking.slotName})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/75">Lokasi Hab:</span>
                      <span className="font-semibold text-black dark:text-white">{selectedReceiptBooking.hubLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/75">Tempoh Perjanjian:</span>
                      <span className="font-semibold text-black dark:text-white">{selectedReceiptBooking.durationMonths} Bulan ({formatDisplayDate(selectedReceiptBooking.startDate)} hingga {calculateOperationEndDate(selectedReceiptBooking.startDate, selectedReceiptBooking.durationMonths)})</span>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {(() => {
                    const rate = Number(selectedReceiptBooking.monthlyRate || 150);
                    return (
                  <div className="border border-slate-300 dark:border-slate-600 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold border-b border-slate-300 dark:border-slate-600">
                        <tr>
                          <th className="p-3">Keterangan Urusniaga</th>
                          <th className="p-3 text-right">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 dark:divide-slate-600">
                        <tr>
                          <td className="p-3 font-medium">Yuran Komitmen Sewaan Kiosk Modular Subsidi Belia (Sebulan)</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">{rate.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Deposit Kebersihan & Keselamatan Utiliti Elektrik 13A</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">50.00</td>
                        </tr>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white font-bold">
                          <td className="p-3">Subsidi Kerajaan Negeri Kelantan (Kadar Khas)</td>
                          <td className="p-3 text-right font-mono tabular-nums">-50.00</td>
                        </tr>
                        <tr className="bg-blue-600 text-white font-extrabold text-sm dark:bg-blue-600">
                          <td className="p-3">JUMLAH DIBAYAR</td>
                          <td className="p-3 text-right font-mono tabular-nums text-white">RM {rate.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                    );
                  })()}

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-black dark:text-white text-[0.8125rem] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                    <span>Status Transaksi: Berjaya & Sah Diperakui Sistem Perakaunan Bersepadu KBelia.</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const receiptRef = `REC-${selectedReceiptBooking.slotCode}-${selectedReceiptBooking.id.substring(0, 8).toUpperCase()}`;
                        const subsidyRate = loadLocalPortalSettings().portalSubsidyRate ?? 50;
                        const html = generateOfficialReceiptHtml(selectedReceiptBooking, receiptRef, subsidyRate);
                        void openAndPrintDocument(html, `Resit_Rasmi_${selectedReceiptBooking.slotCode}`);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer dark:bg-blue-600"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>Cetak Salinan Resit</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const receiptRef = `REC-${selectedReceiptBooking.slotCode}-${selectedReceiptBooking.id.substring(0, 8).toUpperCase()}`;
                        const subsidyRate = loadLocalPortalSettings().portalSubsidyRate ?? 50;
                        const html = generateOfficialReceiptHtml(selectedReceiptBooking, receiptRef, subsidyRate);
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
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-bold text-sm rounded-xl cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MODAL 2: ADUAN & PENYELENGGARAAN FASILITI KIOSK */}
          {maintenanceComplaintBooking && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden text-black dark:text-white">
                <div className="p-5 kbelia-important-header dark:bg-slate-800 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-black dark:text-white flex items-center justify-center font-bold">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-black dark:text-white">Borang Aduan Fasiliti Kiosk</h4>
                      <p className="text-[0.875rem] text-black dark:text-white">Slot {maintenanceComplaintBooking.slotCode} • {maintenanceComplaintBooking.hubLocation}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceComplaintBooking(null)}
                    className="p-1.5 text-black/70 hover:text-black dark:text-white/75 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-sm">
                  {complaintSuccess ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-black dark:text-white space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                        <span>Aduan Berjaya Dihantar!</span>
                      </div>
                      <p className="text-[0.9375rem] text-black dark:text-white">
                        {complaintSuccess} Pihak pengurusan fasiliti hab akan mengambil tindakan segera dalam tempoh 24 jam.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMaintenanceComplaintBooking(null)}
                        className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Selesai & Tutup
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
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                        >
                          <option value="Bekalan Elektrik 13A & Lampu">Bekalan Elektrik 13A & Lampu Kiosk</option>
                          <option value="Kunci & Roller Shutter Kiosk">Kunci & Pintu Pengatup (Roller Shutter)</option>
                          <option value="Sistem Paip & Saliran Air">Sistem Paip & Saliran Sinki</option>
                          <option value="Wi-Fi Hab & Rangkaian Internet">Wi-Fi Hab & Rangkaian Internet Terputus</option>
                          <option value="Kebersihan & Pelupusan Sisa">Kebersihan Tapak & Tong Sampah</option>
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
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMaintenanceComplaintBooking(null)}
                          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white rounded-xl font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingComplaint}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 dark:bg-rose-600"
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
        </div>
      )}

      {/* Tab: Kiosk Cashflow Tracker */}
      {activeTab === 'cashflow' && (
        <div key="cashflow" className="mt-4 animate-dashboard-tab">
          <KioskCashflowTracker 
            kioskName={myBookings.find(b => b.status === 'approved')?.slotName || myBusiness?.businessName || 'Kiosk Belia'} 
          />
        </div>
      )}

      {/* Tab: User Documents Vault */}
      {activeTab === 'vault' && (
        <div key="vault" className="mt-4 animate-dashboard-tab">
          <UserDocumentsVault
            bookings={safeBookings}
            grantApplications={grantApplications}
            ownerName={userProfile?.fullName || user.displayName || ''}
            ownerEmail={user.email || userProfile?.email || ''}
            businessName={myBusiness?.businessName || userProfile?.businessName}
            district={myBusiness?.district || userProfile?.district}
            ssmNumber={myBusiness?.ssmNumber || userProfile?.ssmNumber}
            onViewOfferLetter={(b) => onViewOfferLetter && onViewOfferLetter(b)}
            onOpenTenancyAgreement={(b) => onOpenTenancyAgreement && onOpenTenancyAgreement(b)}
            onOpenVerification={(ref) => onOpenVerification && onOpenVerification(ref)}
          />
        </div>
      )}

      {/* Tab 4: Digital Card & QR Promo */}
      {activeTab === 'card' && (
        <div key="card" className="mt-4 animate-dashboard-tab">
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 text-black dark:text-white p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-300 dark:border-slate-600">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500/80 dark:bg-blue-400/80" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div
                style={{ '--stagger': 0 } as React.CSSProperties}
                className="animate-dashboard-card lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800/70 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mx-auto">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Kad Profil Usahawan Belia</span>
                </div>

                <div className="space-y-2.5">
                  <div className="w-20 h-20 rounded-2xl mx-auto border-2 border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800">
                    <PortalImage
                      src={myBusiness?.logoUrl || user.photoURL || ''}
                      alt={myBusiness?.businessName || 'Logo Perniagaan'}
                      fallbackType="business"
                      fallbackLabel={myBusiness?.businessName || userProfile?.fullName || 'KB'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-extrabold text-black dark:text-white tracking-tight">
                    {myBusiness?.businessName || 'Nama Bisnes Belia'}
                  </h3>
                  <p className="text-sm text-black/75 dark:text-white/75 font-medium">
                    {myBusiness?.tagline || 'Inisiatif Usahawan Muda Kelantan'}
                  </p>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Sokong perniagaan ${myBusiness?.businessName || 'Usahawan Belia'} di Portal KBelia Kelantan: ${window.location.origin}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kongsi Kad ke WhatsApp</span>
                </a>
              </div>

              <div
                style={{ '--stagger': 1 } as React.CSSProperties}
                className="animate-dashboard-card lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider mb-3">
                    Butiran Pendaftaran &amp; Saluran Hebahan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-black/60 dark:text-white/65 block">Jajahan Operasi</span>
                      <span className="font-bold text-black dark:text-white mt-0.5 block">{myBusiness?.district || 'Kota Bharu'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-black/60 dark:text-white/65 block">Kategori Sektor</span>
                      <span className="font-bold text-black dark:text-white mt-0.5 block">{myBusiness?.category || 'F&B'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-black/60 dark:text-white/65 block">No. WhatsApp Rasmi</span>
                      <span className="font-mono font-bold text-black dark:text-white mt-0.5 block tabular-nums">{myBusiness?.whatsapp || userProfile?.phone || '-'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-black/60 dark:text-white/65 block">Pendaftaran SSM</span>
                      <span className="font-mono font-bold text-black dark:text-white mt-0.5 block tabular-nums">{myBusiness?.ssmNumber || userProfile?.ssmNumber || 'Dalam Proses'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800/60 text-xs sm:text-sm text-black/80 dark:text-white/85 flex items-center justify-between gap-3">
                  <span>
                    Paparan kad digital ini disegerakkan daripada Profil Perniagaan anda untuk tujuan promosi pantas pelanggan.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer shrink-0"
                  >
                    Kemaskini Profil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={(updated) => {
          setEditingProduct(null);
          setMessage({ type: 'success', text: `Maklumat produk "${updated.name}" berjaya dikemaskini.` });
          showToast(`Produk "${updated.name}" berjaya dikemaskini.`, 'success');
          onRefresh();
        }}
      />
    </div>
  );
};
