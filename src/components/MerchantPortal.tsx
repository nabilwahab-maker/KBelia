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
  Download,
  XCircle,
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
  Wallet,
  Printer,
  Copy,
  Pencil,
  Trash2
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
  normalizeMentorshipMode,
  formatBusinessCategory
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  saveBusinessListing, 
  saveProduct, 
  deleteProduct
} from '../services/dataService';
import { KioskCashflowTracker } from './KioskCashflowTracker';
import { UserDocumentsVault } from './UserDocumentsVault';
import { ImageDropzone } from './ImageDropzone';
import { BusinessMediaProfileHeader } from './BusinessMediaProfileHeader';
import { EditProductModal } from './EditProductModal';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu, getSearchInputWidth } from './ReferenceTableKit';
import { EditorialMetricStrip } from './EditorialMetricStrip';
import { RoleDonutCard } from './RoleDonutCard';
import { getRoleTheme } from '../utils/roleTheme';
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
  openAndPrintDocument,
  escapeHtml,
  buildKbeliaCrestSvg,
  buildDigitalSealHtml
} from '../utils/printUtils';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { exportProductsToExcel } from '../utils/excelExport';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';
import { usePrefersReducedMotion } from '../hooks/useMotion';
import confetti from 'canvas-confetti';
import { AcronymText, MiddleTruncate } from './TypographyPrimitives';
import { QrCodeGraphic } from './QrCodeGraphic';
import { buildBusinessQrPayload, computeIntegrityChecksum, generateQrSvgString } from '../utils/qrUtils';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

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

  const sizeClass = compact ? 'w-14 h-14 rounded-lg' : 'w-16 h-16 rounded-lg';

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
  onOpenBookingTab?: (targetView?: 'browse' | 'book' | 'manage') => void;
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
  const beliaTheme = getRoleTheme('belia');
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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mobileProductPreviewOpen, setMobileProductPreviewOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        <div className={`p-8 rounded-2xl border max-w-md mx-auto space-y-4 ${beliaTheme.surfaceClass}`}>
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass} ${beliaTheme.accentTextClass}`}>
            <Store className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-[#F4F1EA]">Portal Usahawan Belia</h3>
          <p className="text-[0.9375rem] text-slate-600 dark:text-stone-300 leading-relaxed">
            Sila log masuk untuk mengurus profil perniagaan, katalog produk, dan ruang niaga anda.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${beliaTheme.primaryButtonClass}`}
          >
            <LogIn className="w-4 h-4" />
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
    <div className="w-full space-y-5">
      
      {/* Editorial Hero: Zamrud & Emas Songket */}
      <div
        id="merchant-portal-header"
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xs p-5 sm:p-6 transition-colors ${beliaTheme.surfaceClass}`}
      >
        {/* Subtle Warm Emerald & Songket Gold Glow */}
        <div className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-emerald-500/12 dark:bg-emerald-500/16 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-6 w-52 h-52 rounded-full bg-amber-400/14 dark:bg-[#E5B85C]/12 blur-3xl" aria-hidden="true" />

        {(() => {
          const merchantDisplayName = userProfile?.fullName || user.displayName || (isMs ? 'Usahawan Belia' : 'Youth Entrepreneur');
          const bizLabel = myBusiness?.businessName || userProfile?.businessName || (isMs ? 'Usaha Niaga Belia' : 'Youth Business');
          const districtLabel = myBusiness?.district || userProfile?.district || 'Kelantan';

          const headerMap: Record<MerchantSubTab, { prefix: string; accent: string }> = {
            overview: {
              prefix: isMs ? 'Gambaran Usaha Niaga ' : 'Your Business ',
              accent: isMs ? 'Anda' : 'Overview'
            },
            profile: {
              prefix: isMs ? 'Identiti ' : 'Manage ',
              accent: isMs ? 'Perniagaan' : 'Business Identity'
            },
            products: {
              prefix: isMs ? 'Koleksi ' : 'Your ',
              accent: isMs ? 'Produk & Tawaran' : 'Products & Offers'
            },
            cashflow: {
              prefix: isMs ? 'Aliran Hasil & ' : 'Sales & ',
              accent: isMs ? 'Perkembangan' : 'Cashflow'
            },
            vault: {
              prefix: isMs ? 'Dokumen & ' : 'Records & ',
              accent: isMs ? 'Rekod Simpanan' : 'Documents'
            },
            card: {
              prefix: isMs ? 'Perkongsian ' : 'Share ',
              accent: isMs ? 'Kad Digital' : 'Digital Card'
            }
          };
          const currentHeader = headerMap[activeTab] || headerMap.overview;

          const targetBeliaTab: MerchantSubTab = activeTab === 'overview' ? 'cashflow' : 'overview';
          const beliaActionLabel =
            activeTab === 'overview'
              ? (isMs ? 'Catat Jualan' : 'Log Sales')
              : 'Dashboard';

          return (
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-stone-400 mb-1.5">
                  <span className="truncate">{bizLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{districtLabel}</span>
                </div>
                <h1 className="font-display text-fluid-portal font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight kbelia-trim">
                  {currentHeader.prefix}
                  <span className={beliaTheme.accentTextClass}>{currentHeader.accent}</span>
                </h1>
                <p className="text-[0.9375rem] text-slate-600 dark:text-stone-300 mt-1.5">
                  {isMs ? (
                    <>
                      Selamat kembali, <span className="font-semibold text-slate-900 dark:text-[#F4F1EA]">{merchantDisplayName}</span>
                    </>
                  ) : (
                    <>
                      Welcome back, <span className="font-semibold text-slate-900 dark:text-[#F4F1EA]">{merchantDisplayName}</span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(targetBeliaTab)}
                className={`self-start lg:self-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${beliaTheme.primaryButtonClass}`}
              >
                {beliaActionLabel}
              </button>
            </div>
          );
        })()}
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
          { name: 'Bayaran Tanpa Tunai', value: periodQrTotal, color: beliaTheme.chartSecondary },
          { name: 'Jualan Tunai', value: periodCashTotal, color: beliaTheme.chartPrimary }
        ];
        const periodShortBadge =
          salesPeriod === 'weekly' ? 'Mingguan' : salesPeriod === 'monthly' ? 'Bulanan' : 'Suku';

        // Dynamic journey steps expressed in warm general language
        const hasBusiness = Boolean(myBusiness || userProfile?.businessName);
        const hasSsm = Boolean(myBusiness?.ssmNumber || userProfile?.ssmNumber);
        const hasBooking = Boolean(primaryBooking);
        const isBookingApproved = Boolean(approvedBooking);
        const isTenancySigned = Boolean(approvedBooking?.tenancySigned);

        const stepperItems = [
          {
            step: 1,
            title: 'Kenalkan Perniagaan Anda',
            date: myBusiness?.createdAt ? formatDisplayDate(myBusiness.createdAt.split('T')[0]) : 'Langkah Awal',
            officer: 'Ruang Usaha',
            status: hasBusiness ? 'completed' : 'current',
            desc: hasBusiness
              ? `Perniagaan "${myBusiness?.businessName || userProfile?.businessName}" sudah tersenarai dalam rangkaian.`
              : 'Kongsikan nama dan latar ringkas perniagaan anda.'
          },
          {
            step: 2,
            title: 'Lengkapkan Butiran Asas',
            date: hasSsm ? 'Sudah Lengkap' : 'Dalam Proses',
            officer: 'Maklumat Asas',
            status: hasSsm ? 'completed' : hasBusiness ? 'current' : 'upcoming',
            desc: hasSsm
              ? 'Maklumat pendaftaran perniagaan anda telah dikemas kini.'
              : 'Tambahkan nombor pendaftaran perniagaan apabila sedia.'
          },
          {
            step: 3,
            title: 'Pilih Ruang Niaga',
            date: primaryBooking ? formatDisplayDate(primaryBooking.createdAt?.split('T')[0]) : 'Pilihan Terbuka',
            officer: 'Lokasi Pilihan',
            status: isBookingApproved ? 'completed' : hasBooking ? 'current' : 'upcoming',
            desc: primaryBooking
              ? `Penyertaan di ${primaryBooking.hubLocation} kini berstatus: ${primaryBooking.status === 'approved' ? 'Diluluskan' : primaryBooking.status === 'rejected' ? 'Perlu Semakan Semula' : 'Dalam Semakan'}.`
              : 'Teroka ruang niaga yang sesuai dengan keperluan perniagaan anda.'
          },
          {
            step: 4,
            title: 'Sahkan Penyertaan',
            date: isBookingApproved ? (isTenancySigned ? 'Disahkan' : 'Menunggu Pengesahan') : 'Fasa Seterusnya',
            officer: 'Pengesahan',
            status: isTenancySigned ? 'completed' : isBookingApproved ? 'current' : 'upcoming',
            desc: isTenancySigned
              ? 'Pengesahan penyertaan ruang niaga anda telah lengkap.'
              : isBookingApproved
              ? 'Dokumen penyertaan sedia untuk disemak dan disahkan.'
              : 'Langkah pengesahan akan dibuka selepas lokasi dipilih.'
          },
          {
            step: 5,
            title: 'Mula Berniaga & Catat Hasil',
            date: isTenancySigned ? 'Sedang Berjalan' : 'Sedia Bermula',
            officer: 'Perkembangan',
            status: isTenancySigned && safeCashflow.length > 0 ? 'completed' : isTenancySigned ? 'current' : 'upcoming',
            desc: safeCashflow.length > 0
              ? `${safeCashflow.length} catatan hasil jualan telah direkodkan.`
              : 'Mula catat hasil harian anda bagi memantau perkembangan semasa.'
          }
        ];

        // Dynamic updates in general friendly prose
        const liveAlerts: { tag: string; time: string; title: string; body: string; action?: () => void }[] = [];
        if (upcomingMentor) {
          liveAlerts.push({
            tag: 'Bimbingan',
            time: upcomingMentor.preferredDate || 'Dijadualkan',
            title: `Perbincangan: ${upcomingMentor.topic}`,
            body: `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime} (${normalizeMentorshipMode(upcomingMentor.mode)})`,
            action: onOpenMentorshipClinic
          });
        }
        if (safeTickets.length > 0) {
          const latestTicket = safeTickets[0];
          liveAlerts.push({
            tag: 'Penjagaan Ruang',
            time: latestTicket.status === 'resolved' ? 'Selesai' : latestTicket.status === 'in_progress' ? 'Sedang Diurus' : 'Diterima',
            title: `${latestTicket.issueCategory}`,
            body: latestTicket.description,
            action: () => onOpenBookingTab?.('manage')
          });
        }
        if (latestGrant) {
          liveAlerts.push({
            tag: 'Sokongan Modal',
            time: latestGrant.status === 'approved' ? 'Diluluskan' : latestGrant.status === 'rejected' ? 'Tidak Berjaya' : 'Dalam Semakan',
            title: latestGrant.programTitle,
            body: `Anggaran sokongan: ${latestGrant.grantAmount} (${latestGrant.businessName})`,
            action: () => setActiveTab('vault')
          });
        }

        // Aggregate open pending items calmly
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
              category: 'Ruang Niaga',
              title: `${b.hubLocation}`,
              subtitle: `${b.businessName} · Tempoh ${b.durationMonths} bulan`,
              statusLabel: 'Menunggu Semakan',
              dateLabel: b.createdAt ? formatDisplayDate(b.createdAt.split('T')[0]) : 'Baharu',
              createdAt: b.createdAt || '',
              actionLabel: 'Lihat',
              onAction: () => onOpenBookingTab?.('manage')
            })),
          ...grantApplications
            .filter((g) => g.status === 'pending')
            .map((g) => ({
              id: `grant-${g.id}`,
              category: 'Sokongan Modal',
              title: g.programTitle,
              subtitle: `${g.businessName} · ${g.grantAmount || g.amount || 'Dalam Semakan'}`,
              statusLabel: 'Dalam Semakan',
              dateLabel: g.createdAt ? formatDisplayDate(g.createdAt.split('T')[0]) : 'Baharu',
              createdAt: g.createdAt || '',
              actionLabel: 'Lihat',
              onAction: () => setActiveTab('vault')
            })),
          ...safeMentorships
            .filter((m) => m.status === 'pending')
            .map((m) => ({
              id: `mentor-${m.id}`,
              category: 'Sesi Bimbingan',
              title: m.topic,
              subtitle: `${m.mentorName} · ${m.preferredDate} (${m.preferredTime})`,
              statusLabel: 'Menunggu Pengesahan',
              dateLabel: m.createdAt ? formatDisplayDate(m.createdAt.split('T')[0]) : m.preferredDate || 'Dijadualkan',
              createdAt: m.createdAt || '',
              actionLabel: 'Buka',
              onAction: onOpenMentorshipClinic
            })),
          ...safeTickets
            .filter((t) => t.status === 'received' || t.status === 'in_progress')
            .map((t) => ({
              id: `ticket-${t.id}`,
              category: 'Penjagaan Ruang',
              title: `${t.issueCategory}`,
              subtitle: `${t.kioskName} · ${t.description}`,
              statusLabel: t.status === 'in_progress' ? 'Sedang Diurus' : 'Diterima',
              dateLabel: t.createdAt ? formatDisplayDate(t.createdAt.split('T')[0]) : 'Baharu',
              createdAt: t.createdAt || '',
              actionLabel: 'Semak',
              onAction: () => onOpenBookingTab?.('manage')
            }))
        ].sort((a, b) => {
          const tsA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tsB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (Number.isNaN(tsB) ? 0 : tsB) - (Number.isNaN(tsA) ? 0 : tsA);
        });

        const topPendingApprovals = pendingApprovalItems.slice(0, 3);

        return (
        <div className="space-y-5">
          
          {/* Open-Editorial 4-Column Metric Strip */}
          <EditorialMetricStrip
            role="belia"
            items={[
              {
                id: 'sales',
                label: 'Perkembangan Jualan',
                value: `RM ${totalSalesAll.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                summary:
                  safeCashflow.length > 0
                    ? `Ringkasan hasil terkini (Purata RM ${avgDailySales.toLocaleString()})`
                    : 'Mula catat jualan harian anda',
                highlightTone: 'primary',
                onClick: () => setActiveTab('cashflow')
              },
              {
                id: 'space',
                label: 'Ruang Niaga',
                value: primaryBooking ? primaryBooking.slotCode : 'Terbuka',
                summary: primaryBooking
                  ? `${primaryBooking.hubLocation} · ${primaryBooking.durationMonths} bulan`
                  : 'Teroka pilihan tapak niaga',
                highlightTone: 'secondary',
                onClick: () =>
                  onOpenBookingTab?.(primaryBooking || safeTickets.length > 0 ? 'manage' : 'browse')
              },
              {
                id: 'support',
                label: 'Sokongan Modal',
                value: `RM ${totalGrantValue.toLocaleString('ms-MY')}`,
                summary: latestGrant ? latestGrant.programTitle : 'Lihat peluang sokongan modal',
                highlightTone: 'neutral',
                onClick: () => setActiveTab('vault')
              },
              {
                id: 'mentoring',
                label: 'Sesi Bimbingan',
                value: upcomingMentor ? upcomingMentor.preferredDate : 'Sedia Diatur',
                summary: upcomingMentor
                  ? `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime}`
                  : 'Atur sesi bersama mentor',
                highlightTone: 'neutral',
                onClick: onOpenMentorshipClinic
              }
            ]}
          />

          {/* [2] Seksyen Analitik 2:1 — Aliran Perkembangan Jualan + Ringkasan Hasil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div
              style={{ '--stagger': 4 } as React.CSSProperties}
              className={`animate-dashboard-card lg:col-span-2 h-full w-full rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0 ${beliaTheme.surfaceClass}`}
            >
              {/* Card Header */}
              <div className={`border-b py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${beliaTheme.dividerClass}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <BarChart3 className={`w-5 h-5 shrink-0 ${beliaTheme.accentTextClass}`} />
                  <div>
                    <h4 className="font-display text-base sm:text-[1.0625rem] font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                      Aliran Perkembangan Jualan
                    </h4>
                    {chartRangeLabel && (
                      <p className="text-xs text-slate-500 dark:text-stone-400">
                        {chartRangeLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Chart Mode + Period Selector Tabs */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className={`flex items-center gap-1 p-1 rounded-xl border ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                    <button
                      type="button"
                      onClick={() => setChartMode('bar')}
                      className={`px-2.5 py-1 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
                        chartMode === 'bar'
                          ? beliaTheme.segmentedActiveClass
                          : 'text-slate-600 dark:text-stone-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Lajur
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('area')}
                      className={`px-2.5 py-1 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
                        chartMode === 'area'
                          ? beliaTheme.segmentedActiveClass
                          : 'text-slate-600 dark:text-stone-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Lengkung
                    </button>
                  </div>

                  <div className={`flex items-center gap-1 p-1 rounded-xl border ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('weekly')}
                      className={`px-2.5 py-1 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
                        salesPeriod === 'weekly'
                          ? beliaTheme.segmentedActiveClass
                          : 'text-slate-600 dark:text-stone-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Mingguan
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('monthly')}
                      className={`px-2.5 py-1 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
                        salesPeriod === 'monthly'
                          ? beliaTheme.segmentedActiveClass
                          : 'text-slate-600 dark:text-stone-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Bulanan
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('quarterly')}
                      className={`px-2.5 py-1 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
                        salesPeriod === 'quarterly'
                          ? beliaTheme.segmentedActiveClass
                          : 'text-slate-600 dark:text-stone-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Suku
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content Area */}
              <div className="p-4 sm:p-5 flex flex-col gap-3 min-w-0">
                {/* Calm Hairline-Divided Metric Strip */}
                <div className={`grid grid-cols-3 divide-x pb-3 border-b text-center ${beliaTheme.dividerClass}`}>
                  <div className="px-2">
                    <span className="text-xs text-slate-500 dark:text-stone-400 block font-medium">Jumlah Tempoh</span>
                    <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-[#F4F1EA]">
                      RM {periodTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-xs text-slate-500 dark:text-stone-400 block font-medium">Purata</span>
                    <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-[#F4F1EA]">
                      RM {periodAvg.toLocaleString()}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-xs text-slate-500 dark:text-stone-400 block font-medium">Tertinggi</span>
                    <span className={`font-mono tabular-nums text-base sm:text-lg font-bold ${beliaTheme.accentStrongTextClass}`}>
                      RM {periodMax.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Interactive Full-Width Recharts Chart in Zamrud & Emas */}
                <div className="relative h-[220px] w-full min-w-0 [&_.recharts-cartesian-axis-tick_text]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick_text]:fill-stone-300">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 220 }}>
                      {chartMode === 'area' ? (
                        <AreaChart data={chartBars} margin={{ top: 18, right: 12, left: 0, bottom: 2 }}>
                          <defs>
                            <linearGradient id="beliaSalesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={beliaTheme.chartPrimary} stopOpacity={0.38} />
                              <stop offset="100%" stopColor={beliaTheme.chartSecondary} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.16)" />
                          <XAxis
                            dataKey="label"
                            height={24}
                            tickMargin={4}
                            tick={{ fontSize: 12, fontWeight: 500 }}
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
                                  <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border ${beliaTheme.tooltipBgClass}`}>
                                    <div className="opacity-75 text-[0.8125rem] mb-0.5">{d.fullDate || d.label}</div>
                                    <div className="font-bold">RM {d.value.toLocaleString()}</div>
                                    <div className="text-[0.8125rem] opacity-80 mt-0.5">{d.tx} catatan · {d.qr}% tanpa tunai</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={beliaTheme.chartPrimary}
                            strokeWidth={2.5}
                            fill="url(#beliaSalesGradient)"
                            isAnimationActive={!prefersReducedMotion}
                            animationDuration={650}
                            animationEasing="ease-out"
                            dot={{ r: 4, fill: beliaTheme.chartSecondary, stroke: '#101614', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: beliaTheme.chartPrimary, stroke: '#FFFFFF', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      ) : (
                        <BarChart
                          data={chartBars}
                          barCategoryGap="20%"
                          margin={{ top: 18, right: 12, left: 0, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.16)" />
                          <XAxis
                            dataKey="label"
                            height={24}
                            tickMargin={4}
                            tick={{ fontSize: 12, fontWeight: 500 }}
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
                            cursor={{ fill: 'rgba(16, 185, 129, 0.10)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload as { label: string; fullDate?: string; value: number; tx: number; qr: number };
                                return (
                                  <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border ${beliaTheme.tooltipBgClass}`}>
                                    <div className="opacity-75 text-[0.8125rem] mb-0.5">{d.fullDate || d.label}</div>
                                    <div className="font-bold">RM {d.value.toLocaleString()}</div>
                                    <div className="text-[0.8125rem] opacity-80 mt-0.5">{d.tx} catatan · {d.qr}% tanpa tunai</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill={beliaTheme.chartPrimary}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={52}
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
                              className="fill-slate-800 dark:fill-stone-200 font-mono"
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
              role="belia"
              className="lg:col-span-1 h-full"
              title="Ringkasan Hasil & Perbelanjaan"
              icon={Wallet}
              headerRight={
                <span className="text-[0.8125rem] font-medium text-slate-500 dark:text-stone-400">
                  {periodShortBadge}
                </span>
              }
              segments={paymentMixSegments}
              centerValue={`${periodProfitMargin}%`}
              centerLabel="Baki Positif"
              valueUnit="RM"
              summaryPairs={[
                {
                  label: 'Aliran Masuk',
                  value: `${periodNetProfit < 0 ? '-' : ''}RM ${Math.abs(periodNetProfit).toLocaleString('ms-MY')}`,
                  dotColor: periodNetProfit >= 0 ? beliaTheme.chartPrimary : '#F43F5E'
                },
                {
                  label: 'Perbelanjaan',
                  value: `RM ${periodExpensesTotal.toLocaleString('ms-MY')}`,
                  dotColor: beliaTheme.chartSecondary
                }
              ]}
              emptyState={{
                title: 'Belum Ada Catatan Tempoh Ini',
                description: 'Catat jualan harian dan perbelanjaan anda bagi melihat ringkasan perkembangan semasa.',
                actionLabel: 'Catat Jualan',
                onAction: () => setActiveTab('cashflow')
              }}
              staggerIndex={5}
            />
          </div>

          {/* [3] Dua Lajur Ringkasan Editorial Terbuka (Tanpa Kotak Bertindih) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Lajur Kiri: Perkara Terkini Untuk Anda */}
            <div
              style={{ '--stagger': 5 } as React.CSSProperties}
              className={`animate-dashboard-card min-w-0 rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col ${beliaTheme.surfaceClass}`}
            >
              <div className={`border-b py-3.5 px-5 flex items-center gap-2.5 ${beliaTheme.dividerClass}`}>
                <Clock className={`w-4.5 h-4.5 shrink-0 ${beliaTheme.accentStrongTextClass}`} />
                <h4 className="font-display text-base sm:text-[1.0625rem] font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                  Perkara Terkini Untuk Anda
                </h4>
              </div>

              <div className="flex flex-col">
                {topPendingApprovals.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-3">
                    <CheckCircle2 className={`w-7 h-7 ${beliaTheme.accentTextClass}`} />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#F4F1EA]">
                        Semua Urusan Berjalan Lancar
                      </p>
                      <p className="text-sm text-slate-600 dark:text-stone-400 mt-1 max-w-md leading-relaxed">
                        Semua urusan semasa anda berada dalam keadaan teratur. Teroka peluang baharu apabila anda bersedia.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => (onOpenBookingTab ? onOpenBookingTab('browse') : onOpenBookingModal?.())}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${beliaTheme.primaryButtonClass}`}
                      >
                        Teroka Ruang Niaga
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('vault')}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${beliaTheme.secondaryButtonClass}`}
                      >
                        Lihat Sokongan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`divide-y ${beliaTheme.dividerClass}`}>
                    {topPendingApprovals.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onAction}
                        disabled={!item.onAction}
                        className={`w-full text-left px-5 py-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          item.onAction
                            ? 'cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.03]'
                            : 'cursor-default'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-stone-400">
                            <span className={`font-semibold ${beliaTheme.accentTextClass}`}>
                              {item.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.dateLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className={`font-medium ${beliaTheme.accentStrongTextClass}`}>
                              {item.statusLabel}
                            </span>
                          </div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA] leading-snug truncate">
                            {item.title}
                          </h5>
                          <p className="text-[0.8125rem] text-slate-600 dark:text-stone-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>

                        {item.onAction && (
                          <span className={`inline-flex items-center gap-1 text-[0.8125rem] font-semibold shrink-0 self-start sm:self-center ${beliaTheme.accentTextClass}`}>
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

            {/* Lajur Kanan: Perjalanan Usaha Niaga */}
            <div
              style={{ '--stagger': 6 } as React.CSSProperties}
              className={`animate-dashboard-card min-w-0 rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col ${beliaTheme.surfaceClass}`}
            >
              <div className={`border-b py-3.5 px-5 flex items-center gap-2.5 ${beliaTheme.dividerClass}`}>
                <FileCheck className={`w-4.5 h-4.5 shrink-0 ${beliaTheme.accentTextClass}`} />
                <h4 className="font-display text-base sm:text-[1.0625rem] font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                  Perjalanan Usaha Niaga
                </h4>
              </div>

              <div className="p-4 sm:p-5 flex flex-col justify-start gap-3">
                <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
                  {stepperItems.map((stepItem) => (
                    <div
                      key={stepItem.step}
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        stepItem.status === 'completed'
                          ? 'bg-[#10B981]'
                          : stepItem.status === 'current'
                          ? 'bg-[#E5B85C]'
                          : 'bg-slate-200 dark:bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className={`divide-y ${beliaTheme.dividerClass}`}>
                  {stepperItems.map((stepItem, idx) => {
                    const isCompleted = stepItem.status === 'completed';
                    const isCurrent = stepItem.status === 'current';
                    const isSelected = selectedStepperIndex === idx;

                    return (
                      <div
                        key={stepItem.step}
                        onClick={() => setSelectedStepperIndex(idx)}
                        className="py-3 first:pt-1 last:pb-1 transition-colors cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-lg px-2 -mx-2"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.78rem] font-bold ${
                            isCompleted
                              ? 'bg-[#0B6E52] dark:bg-[#10B981] text-white dark:text-[#07130F]'
                              : isCurrent
                              ? 'bg-[#E5B85C] text-[#101614]'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-stone-400'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepItem.step}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA] leading-snug break-words">
                                {stepItem.title}
                              </h5>
                              <span className={`text-xs font-medium shrink-0 ${
                                isCompleted
                                  ? beliaTheme.accentTextClass
                                  : isCurrent
                                  ? beliaTheme.accentStrongTextClass
                                  : 'text-slate-500 dark:text-stone-400'
                              }`}>
                                {isCompleted ? 'Selesai' : isCurrent ? 'Sedang Diurus' : 'Menunggu'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 dark:text-stone-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                              <span className="font-mono">{stepItem.date}</span>
                              <span>·</span>
                              <span>{stepItem.officer}</span>
                            </div>

                            {isSelected && (
                              <p className="mt-2 text-[0.8125rem] text-slate-700 dark:text-stone-300 leading-relaxed animate-in fade-in duration-150">
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

          {/* [4] Catatan & Kemas Kini Semasa (Aliran Terbuka) */}
          <div
            style={{ '--stagger': 7 } as React.CSSProperties}
            className={`animate-dashboard-card w-full rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col ${beliaTheme.surfaceClass}`}
          >
            <div className={`border-b py-3.5 px-5 flex items-center gap-2.5 ${beliaTheme.dividerClass}`}>
              <Bell className={`w-4.5 h-4.5 shrink-0 ${beliaTheme.accentTextClass}`} />
              <h4 className="font-display text-base sm:text-[1.0625rem] font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                Catatan &amp; Kemas Kini Semasa
              </h4>
            </div>

            {liveAlerts.length === 0 ? (
              <div className="p-6 text-center space-y-2.5">
                <p className="text-[0.9375rem] font-semibold text-slate-900 dark:text-[#F4F1EA]">
                  Kongsikan Perkembangan Usaha Anda
                </p>
                <p className="text-[0.875rem] text-slate-600 dark:text-stone-400 leading-relaxed max-w-xl mx-auto">
                  Anda boleh mengatur sesi bimbingan bersama mentor atau mengemas kini keperluan ruang niaga anda pada bila-bila masa.
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                  {onOpenMentorshipClinic && (
                    <button
                      type="button"
                      onClick={onOpenMentorshipClinic}
                      className={`px-4 py-2 rounded-xl text-[0.8125rem] font-semibold ${beliaTheme.primaryButtonClass}`}
                    >
                      Atur Sesi
                    </button>
                  )}
                  {onOpenMaintenanceModal && (
                    <button
                      type="button"
                      onClick={onOpenMaintenanceModal}
                      className={`px-4 py-2 rounded-xl text-[0.8125rem] font-semibold ${beliaTheme.secondaryButtonClass}`}
                    >
                      Lapor Ruang
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`flex flex-col divide-y ${beliaTheme.dividerClass}`}>
                {liveAlerts.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.action}
                    className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      item.action ? 'cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-stone-400">
                        <span className={`font-semibold ${beliaTheme.accentTextClass}`}>{item.tag}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.time}</span>
                      </div>
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA] leading-snug truncate">
                        {item.title}
                      </h5>
                      <p className="text-[0.8125rem] text-slate-600 dark:text-stone-400 truncate">
                        {item.body}
                      </p>
                    </div>
                    {item.action && (
                      <span className={`inline-flex items-center gap-1 text-[0.8125rem] font-semibold shrink-0 self-start sm:self-center ${beliaTheme.accentTextClass}`}>
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
        <div key="profile" className={`mt-4 relative rounded-2xl border overflow-hidden w-full transition-colors animate-dashboard-tab ${beliaTheme.surfaceClass}`}>
          <div className={`border-b py-4 px-5 flex items-center justify-between ${beliaTheme.dividerClass}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass} ${beliaTheme.accentTextClass}`}>
                <Store className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                  Maklumat Perniagaan Anda
                </h3>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Butiran asas dan saluran hebahan untuk paparan komuniti.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBusiness} className="p-4 sm:p-5 space-y-4">
            {/* Top Profile Media Header: Full-width Banner + Overlapping 1:1 Logo */}
            <BusinessMediaProfileHeader
              logoUrl={logoUrl}
              onLogoChange={(val) => setLogoUrl(val)}
              bannerUrl={bannerUrl}
              onBannerChange={(val) => setBannerUrl(val)}
              dividerClass={beliaTheme.dividerClass}
            />

            {/* 2-Column Row 1: Nama Perniagaan + Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Nama Perniagaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama perniagaan"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all font-medium ${beliaTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Slogan Perniagaan
                </label>
                <input
                  type="text"
                  placeholder="Masukkan slogan ringkas"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
            </div>

            {/* 2-Column Row 2: Kategori + Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Kategori Perniagaan *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all cursor-pointer ${beliaTheme.inputClass}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="dark:bg-[#141D1A]">{formatBusinessCategory(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Lokasi Operasi *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all cursor-pointer ${beliaTheme.inputClass}`}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d} className="dark:bg-[#141D1A]">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2-Column Row 3: Nombor Pendaftaran SSM + Nombor WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Nombor Pendaftaran SSM
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nombor pendaftaran SSM"
                  value={ssmNumber}
                  onChange={(e) => setSsmNumber(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Nombor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Masukkan nombor telefon"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
            </div>

            {/* Penerangan Perniagaan */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                Penerangan Perniagaan
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan sedikit tentang produk atau perkhidmatan anda"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
              />
            </div>

            {/* 2-Column Row 4: Instagram + TikTok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="Nama pengguna Instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                  TikTok
                </label>
                <input
                  type="text"
                  placeholder="Nama pengguna TikTok"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className={`flex justify-end items-center gap-3 pt-5 border-t ${beliaTheme.dividerClass}`}>
              <button
                type="submit"
                disabled={loading}
                className={`py-2.5 px-6 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${beliaTheme.primaryButtonClass}`}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
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
          <div className="px-1">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
              Senarai Produk &amp; Perkhidmatan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400 mt-0.5">
              Urus pilihan tawaran, harga, dan ketersediaan stok perniagaan anda.
            </p>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <div className={`relative rounded-2xl border overflow-hidden animate-dashboard-tab transition-colors ${beliaTheme.surfaceClass}`}>
              <div className={`border-b py-3.5 px-5 flex items-center justify-between ${beliaTheme.dividerClass}`}>
                <h4 className="font-semibold text-base text-slate-900 dark:text-[#F4F1EA] tracking-tight flex items-center gap-2">
                  <ShoppingBag className={`w-4.5 h-4.5 ${beliaTheme.accentTextClass}`} />
                  <span>Tambah Produk Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  aria-label="Tutup borang tambah produk"
                  className="p-1.5 rounded-xl text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      placeholder="Masukkan nama produk"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all font-medium ${beliaTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                      Harga Jualan *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.10"
                      required
                      placeholder="0.00"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono tabular-nums focus:outline-none transition-all ${beliaTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                      Kategori Produk
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Contoh: Makanan, Kraf"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                    Status Stok
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    <button
                      type="button"
                      aria-pressed={prodInStock}
                      onClick={() => setProdInStock(true)}
                      className={`min-h-[42px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                        prodInStock
                          ? `${beliaTheme.activeMiniBtnClass}`
                          : `${beliaTheme.secondaryButtonClass}`
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Tersedia</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={!prodInStock}
                      onClick={() => setProdInStock(false)}
                      className={`min-h-[42px] px-4 py-2 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                        !prodInStock
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400/60 dark:border-rose-700/60 text-rose-700 dark:text-rose-300'
                          : `${beliaTheme.secondaryButtonClass}`
                      }`}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Kehabisan Stok</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
                      Penerangan Produk
                    </label>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      placeholder="Masukkan penerangan ringkas produk"
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-[#F4F1EA] mb-1.5">
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

                <div className={`flex justify-end items-center gap-3 pt-4 border-t ${beliaTheme.dividerClass}`}>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className={`min-h-[40px] py-2 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${beliaTheme.secondaryButtonClass}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`min-h-[40px] py-2 px-6 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50 ${beliaTheme.primaryButtonClass}`}
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Google Workspace Header + Split-Pane Products List & Preview */}
          {(() => {
            const inStockCount = safeProducts.filter((p) => p.inStock !== false).length;
            const outOfStockCount = safeProducts.filter((p) => p.inStock === false).length;
            const activeProduct =
              filteredSortedProducts.find((p) => p.id === selectedProductId) ||
              productsPagination.paginatedItems[0] ||
              filteredSortedProducts[0] ||
              null;

            return (
              <>
                <WorkspaceHeaderCard
                  role="belia"
                  icon={<ShoppingBag className="w-5 h-5" />}
                  title="Katalog Produk & Perkhidmatan"
                  subtitle="Pilih mana-mana produk di kiri untuk pratonton gambar, harga, penerangan, dan tindakan pantas."
                  tabs={[
                    { id: 'all', label: 'Semua', count: safeProducts.length },
                    { id: 'in_stock', label: 'Tersedia', count: inStockCount },
                    { id: 'out_of_stock', label: 'Habis Stok', count: outOfStockCount }
                  ]}
                  activeTab={prodStockFilter}
                  onTabChange={(id) => setProdStockFilter(id as 'all' | 'in_stock' | 'out_of_stock')}
                  searchValue={prodSearch}
                  onSearchChange={setProdSearch}
                  searchPlaceholder="Cari produk atau kategori..."
                  rightActions={
                    <>
                      {selectedProductIds.length > 0 && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[0.8125rem] font-semibold ${beliaTheme.activeMiniBtnClass}`}>
                          <span className="tabular-nums">{selectedProductIds.length} dipilih</span>
                          <button
                            type="button"
                            onClick={() => setSelectedProductIds([])}
                            className="underline cursor-pointer font-semibold"
                          >
                            Kosongkan
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleExportProducts}
                        className={`min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${beliaTheme.secondaryButtonClass}`}
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
                        className={`min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${beliaTheme.primaryButtonClass}`}
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>{showAddProduct ? 'Tutup' : 'Tambah'}</span>
                      </button>
                    </>
                  }
                  extraControls={
                    <div className="relative flex items-center gap-2" data-prod-filter>
                      <select
                        value={prodCategoryFilter}
                        onChange={(e) => setProdCategoryFilter(e.target.value)}
                        aria-label="Tapis kategori produk"
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm cursor-pointer focus:outline-none ${beliaTheme.inputClass}`}
                      >
                        {productCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'Semua' ? 'Semua Kategori' : cat}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setIsProdFilterOpen((prev) => !prev)}
                        aria-expanded={isProdFilterOpen}
                        aria-label="Susun produk"
                        title="Susun produk"
                        className={`min-h-[34px] w-[34px] rounded-xl border inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          activeFilterCount > 0
                            ? beliaTheme.activeMiniBtnClass
                            : beliaTheme.secondaryButtonClass
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4 shrink-0" />
                      </button>

                      {isProdFilterOpen && (
                        <div className="animate-popover-enter absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#141D1A] border border-slate-200 dark:border-[#24342D] shadow-xl p-4 z-30 space-y-3.5">
                          <div className={`pb-3 border-b ${beliaTheme.dividerClass}`}>
                            <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                              <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${beliaTheme.accentTextClass}`} />
                              <span>Susun Mengikut</span>
                            </label>
                            <select
                              value={prodSortBy === 'table_column' ? '' : prodSortBy}
                              onChange={(e) => {
                                if (e.target.value) setProdSortBy(e.target.value);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${beliaTheme.inputClass}`}
                            >
                              {productSortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setProdCategoryFilter('Semua');
                                setProdStockFilter('all');
                                setProdSortBy(DEFAULT_SORT_VALUE);
                              }}
                              className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300 hover:underline cursor-pointer"
                            >
                              Set Semula
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsProdFilterOpen(false)}
                              className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold cursor-pointer ${beliaTheme.primaryButtonClass}`}
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />

                <GoogleWorkspaceSplitPane
                  role="belia"
                  mobileOpen={mobileProductPreviewOpen}
                  onMobileClose={() => setMobileProductPreviewOpen(false)}
                  mobileTitle={activeProduct?.name || 'Produk'}
                  leftHeader={
                    filteredSortedProducts.length > 0 ? (
                      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-stone-400 ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={toggleSelectAllOnPage}
                            aria-label="Pilih semua produk pada halaman ini"
                            className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                          />
                          <span>Pilih Semua (Halaman Ini)</span>
                        </label>
                        <span className="tabular-nums">{filteredSortedProducts.length} produk</span>
                      </div>
                    ) : undefined
                  }
                  leftContent={
                    safeProducts.length === 0 ? (
                      <div className="p-10 text-center space-y-1.5">
                        <ShoppingBag className="w-9 h-9 text-slate-400 dark:text-stone-500 mx-auto mb-1" />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
                          Belum Ada Produk Disenaraikan
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-stone-400">
                          Klik butang Tambah di atas untuk mula menyenaraikan produk anda.
                        </p>
                      </div>
                    ) : filteredSortedProducts.length === 0 ? (
                      <div className="p-10 text-center space-y-2">
                        <Search className="w-8 h-8 text-slate-400 dark:text-stone-500 mx-auto" />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
                          Tiada Produk Padan Dengan Carian
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setProdSearch('');
                            setProdCategoryFilter('Semua');
                            setProdStockFilter('all');
                          }}
                          className={`text-xs font-semibold hover:underline cursor-pointer ${beliaTheme.accentTextClass}`}
                        >
                          Set Semula
                        </button>
                      </div>
                    ) : (
                      productsPagination.paginatedItems.map((prod) => {
                        const isAvailable = prod.inStock !== false;
                        const isChecked = selectedProductIds.includes(prod.id);
                        const isSelected = activeProduct?.id === prod.id;
                        const formattedPrice = `RM ${Number(prod.price || 0).toFixed(2)}`;
                        const dateStr = formatDisplayDate(
                          (prod.updatedAt || prod.createdAt || '').slice(0, 10)
                        );

                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              setSelectedProductId(prod.id);
                              setMobileProductPreviewOpen(true);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedProductId(prod.id);
                                setMobileProductPreviewOpen(true);
                              }
                            }}
                            className={`w-full text-left p-3.5 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? getWorkspaceActiveRowClass('belia')
                                : beliaTheme.rowHoverClass
                            }`}
                          >
                            <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRow(prod.id)}
                                aria-label={`Pilih ${prod.name}`}
                                className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                              />
                            </div>
                            <ProductRowThumbnail src={prod.imageUrl} alt={prod.name} compact />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-bold truncate kbelia-trim ${isSelected ? beliaTheme.accentTextClass : 'text-slate-900 dark:text-[#F4F1EA]'}`}>
                                  {prod.name}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg ${
                                    isAvailable
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                  }`}
                                >
                                  {isAvailable ? 'Tersedia' : 'Habis Stok'}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 dark:text-stone-400 truncate">
                                {prod.category || 'Umum'} &middot; <span className="font-mono font-semibold text-slate-900 dark:text-[#F4F1EA]">{formattedPrice}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-stone-400 tabular-nums">
                                Dikemas kini: {dateStr || '-'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )
                  }
                  leftFooter={
                    filteredSortedProducts.length > 0 ? (
                      <PaginationBar
                        variant="compact"
                        currentPage={productsPagination.currentPage}
                        totalItems={productsPagination.totalItems}
                        itemsPerPage={7}
                        onPageChange={productsPagination.setCurrentPage}
                        itemLabel="produk"
                      />
                    ) : undefined
                  }
                  rightContent={
                    !activeProduct ? (
                      <SidePreviewEmptyState
                        icon={<ShoppingBag className="w-10 h-10 text-slate-400 dark:text-stone-500" />}
                        title="Pilih produk daripada senarai di sebelah kiri"
                        description="Gambar produk, harga jualan, status stok dan penerangan penuh akan dipaparkan di sini."
                      />
                    ) : (() => {
                      const isAvailable = activeProduct.inStock !== false;
                      const formattedPrice = `RM ${Number(activeProduct.price || 0).toFixed(2)}`;
                      const dateStr = formatDisplayDate(
                        (activeProduct.updatedAt || activeProduct.createdAt || '').slice(0, 10)
                      );
                      return (
                        <div>
                          <SidePreviewHeader
                            role="belia"
                            media={<ProductRowThumbnail src={activeProduct.imageUrl} alt={activeProduct.name} />}
                            title={activeProduct.name}
                            status={
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                }`}
                              >
                                {isAvailable ? 'Tersedia' : 'Habis Stok'}
                              </span>
                            }
                            subtitle={formattedPrice}
                            meta={
                              <>
                                <span>{activeProduct.category || 'Umum'}</span>
                                <span>&middot;</span>
                                <span className="tabular-nums">Dikemas kini: {dateStr || '-'}</span>
                              </>
                            }
                            actions={
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(activeProduct)}
                                  className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.secondaryButtonClass}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={duplicatingProdId === activeProduct.id}
                                  onClick={() => handleDuplicateProduct(activeProduct)}
                                  className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 ${beliaTheme.secondaryButtonClass}`}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{duplicatingProdId === activeProduct.id ? 'Menduplikasi...' : 'Duplikasi'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={togglingStockId === activeProduct.id}
                                  onClick={() => handleToggleProductStock(activeProduct)}
                                  className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 ${beliaTheme.secondaryButtonClass}`}
                                >
                                  {isAvailable ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  <span>{isAvailable ? 'Habis Stok' : 'Stok Ada'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmDelete({
                                      itemName: activeProduct.name,
                                      itemType: 'Produk Katalog',
                                      onConfirm: () => handleDeleteProd(activeProduct.id)
                                    })
                                  }
                                  className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.dangerOutlineButtonClass}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Padam</span>
                                </button>
                              </>
                            }
                          />

                          <div className="p-4 sm:p-5 space-y-4">
                            {/* Product Image Showcase */}
                            <div className={`rounded-xl overflow-hidden border bg-slate-50 dark:bg-zinc-900 max-h-60 flex items-center justify-center ${beliaTheme.dividerClass}`}>
                              <img
                                src={activeProduct.imageUrl || DEFAULT_PRODUCT_IMAGE}
                                alt={activeProduct.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-52 object-cover"
                              />
                            </div>

                            <SidePreviewMetricsStrip
                              role="belia"
                              items={[
                                { label: 'Harga Jualan', value: formattedPrice, mono: true, accent: true },
                                { label: 'Kategori', value: activeProduct.category || 'Umum' },
                                { label: 'Tarikh Kemas Kini', value: dateStr || '-', mono: true }
                              ]}
                            />

                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400">
                                Penerangan Produk
                              </h5>
                              <div className={`p-3.5 rounded-xl border text-sm text-slate-800 dark:text-stone-200 leading-relaxed whitespace-pre-line ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                                {activeProduct.description || 'Tiada penerangan terperinci dimasukkan untuk produk ini.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  }
                />
              </>
            );
          })()}
        </div>
        );
      })()}

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
      {activeTab === 'card' && (() => {
        const cardRef = myBusiness?.ssmNumber || userProfile?.ssmNumber || myBusiness?.id || user.uid;
        const bizTitle = myBusiness?.businessName || 'Usaha Niaga Belia';
        const qrPayload = buildBusinessQrPayload(cardRef, bizTitle);
        const handlePrintBusinessCard = () => {
          const qrSvg = generateQrSvgString(qrPayload, {
            size: 112,
            darkColor: '#0F172A',
            includeMonogram: true,
            monogramText: 'KB'
          });
          const checksum = computeIntegrityChecksum(cardRef);
          const html = `<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8" /><title>Kad Profil Perniagaan - ${escapeHtml(bizTitle)}</title><style>@page{size:A4 portrait;margin:14mm;}*{box-sizing:border-box;}body{font-family:system-ui,-apple-system,sans-serif;color:#0F172A;background:#FFF;margin:0;padding:18px;}.document-page{max-width:740px;margin:0 auto;border:3.5px solid #1E3A8A;padding:5px;}.inner{border:1.5px solid #B45309;padding:28px;position:relative;}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1E3A8A;padding-bottom:14px;margin-bottom:20px;}.tbl{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;}.tbl th{background:#F8FAFC;border:1px solid #CBD5E1;padding:9px 12px;text-align:left;width:36%;}.tbl td{border:1px solid #CBD5E1;padding:9px 12px;}.digital-seal-stamp{width:82px;height:82px;border:2px solid #1E3A8A;border-radius:50%;padding:3px;display:flex;align-items:center;justify-content:center;transform:rotate(-6deg);}.digital-seal-inner{width:100%;height:100%;border:1px dashed #B45309;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}.seal-top{font-size:6.5px;font-weight:800;color:#1E3A8A;}.seal-mid{font-size:9px;font-weight:900;color:#B45309;margin:2px 0;}.seal-bot{font-size:6px;font-weight:700;color:#475569;}</style></head><body><div class="document-page"><div class="inner"><div class="hdr"><div style="display:flex;gap:12px;align-items:center;">${buildKbeliaCrestSvg(44)}<div><div style="font-size:10px;font-weight:800;color:#B45309;letter-spacing:1.2px;">KAD PROFIL DIGITAL USAHAWAN KBELIA</div><div style="font-size:19px;font-weight:900;color:#0F172A;margin-top:2px;">${escapeHtml(bizTitle)}</div><div style="font-size:12px;color:#475569;">${escapeHtml(myBusiness?.tagline || 'Komuniti Usahawan Belia Kelantan')}</div></div></div><div style="text-align:right;font-family:monospace;font-size:11px;"><strong>RUJUKAN</strong><br/>${escapeHtml(cardRef)}</div></div><table class="tbl"><tr><th>Pemilik Perniagaan</th><td><strong>${escapeHtml(userProfile?.fullName || user.displayName || 'Usahawan Belia')}</strong></td></tr><tr><th>Lokasi Operasi</th><td>${escapeHtml(myBusiness?.district || 'Kota Bharu')}, Negeri Kelantan</td></tr><tr><th>Kategori Sektor</th><td>${escapeHtml(myBusiness?.category || 'Makanan & Minuman')}</td></tr><tr><th>Nombor WhatsApp</th><td>${escapeHtml(myBusiness?.whatsapp || userProfile?.phone || '-')}</td></tr><tr><th>Nombor Pendaftaran SSM</th><td>${escapeHtml(myBusiness?.ssmNumber || userProfile?.ssmNumber || 'Dalam Kemas Kini')}</td></tr></table><div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #CBD5E1;padding-top:16px;margin-top:16px;"><div style="display:flex;align-items:center;gap:14px;"><div style="padding:4px;border:1px solid #CBD5E1;background:#FFF;">${qrSvg}</div><div style="font-size:11px;color:#475569;line-height:1.45;"><strong style="color:#1E3A8A;">IMBAS KOD QR PENGESAHAN</strong><br/>Sahkan profil perniagaan berdaftar di Portal KBelia.<br/><span style="font-family:monospace;color:#0F172A;">DIGEST: ${checksum}</span></div></div>${buildDigitalSealHtml('BERDAFTAR')}</div></div></div></body></html>`;
          void openAndPrintDocument(html, `Kad_Profil_${bizTitle.replace(/\s+/g, '_')}`);
        };

        return (
        <div key="card" className="mt-4 animate-dashboard-tab">
          <div className={`relative overflow-hidden rounded-2xl border transition-colors ${beliaTheme.surfaceClass}`}>
            <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${beliaTheme.dividerClass}`}>
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between items-center text-center space-y-5">
                <div className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold mx-auto ${beliaTheme.accentTextClass}`}>
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Kad Profil &amp; Kod QR Perniagaan</span>
                </div>

                <div className="space-y-3">
                  <div className={`w-16 h-16 rounded-2xl mx-auto border overflow-hidden ${beliaTheme.dividerClass} ${beliaTheme.surfaceMutedClass}`}>
                    <PortalImage
                      src={myBusiness?.logoUrl || user.photoURL || ''}
                      alt={myBusiness?.businessName || 'Logo Perniagaan'}
                      fallbackType="business"
                      fallbackLabel={myBusiness?.businessName || userProfile?.fullName || 'KB'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
                    {bizTitle}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 font-medium">
                    {myBusiness?.tagline || 'Komuniti Usahawan Belia Kelantan'}
                  </p>
                </div>

                <QrCodeGraphic
                  value={qrPayload}
                  size={136}
                  caption="KOD QR PROFIL NIAGA"
                  subcaption={cardRef}
                  showDownloadButton
                  downloadFileName={`QR_Profil_${bizTitle.replace(/\s+/g, '_')}.png`}
                  downloadLabelBottom={bizTitle.toUpperCase()}
                />

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintBusinessCard}
                    className={`w-full py-2.5 px-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${beliaTheme.secondaryButtonClass}`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kad</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Sokong perniagaan ${bizTitle} di Portal KBelia Kelantan: ${qrPayload}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${beliaTheme.primaryButtonClass}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F4F1EA] tracking-tight mb-3">
                    Butiran Ringkas Perniagaan
                  </h4>
                  <div className={`divide-y border-y text-sm ${beliaTheme.dividerClass}`}>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-stone-400">Lokasi Operasi</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F4F1EA]">{myBusiness?.district || 'Kota Bharu'}</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-stone-400">Kategori</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F4F1EA]">
                        {myBusiness?.category === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : (myBusiness?.category || 'Makanan & Minuman')}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-stone-400">Nombor WhatsApp</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-[#F4F1EA] tabular-nums">{myBusiness?.whatsapp || userProfile?.phone || '-'}</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-stone-400">
                        Status Pendaftaran <span className="kbelia-acro">SSM</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-[#F4F1EA] tabular-nums">
                        {(myBusiness?.ssmNumber || userProfile?.ssmNumber) ? (
                          <MiddleTruncate
                            text={myBusiness?.ssmNumber || userProfile?.ssmNumber || ''}
                            startChars={9}
                            endChars={5}
                          />
                        ) : (
                          'Sedang Dikemas Kini'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-600 dark:text-stone-400 kbelia-prose`}>
                  <AcronymText text="Maklumat pada kad ini diselaraskan terus daripada profil perniagaan anda." />
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0 ${beliaTheme.secondaryButtonClass}`}
                  >
                    Ubah Profil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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
