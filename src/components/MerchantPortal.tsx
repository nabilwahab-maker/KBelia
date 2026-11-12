import React, { useState } from 'react';
import { 
  Store, 
  Trash2, 
  Edit3, 
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
  Coins,
  Printer,
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
  ChevronRight
} from 'lucide-react';
import { 
  BusinessListing, 
  ProductItem, 
  CapsuleBooking, 
  CapsuleSlot,
  BusinessCategory, 
  KelantanDistrict,
  GrantApplication,
  MerchantSubTab
} from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  saveBusinessListing, 
  saveProduct, 
  deleteProduct,
  updateBookingStatus
} from '../services/dataService';
import { KioskCashflowTracker } from './KioskCashflowTracker';
import { UserDocumentsVault } from './UserDocumentsVault';
import { ImageDropzone } from './ImageDropzone';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import confetti from 'canvas-confetti';

interface MerchantPortalProps {
  myBusiness: BusinessListing | null;
  myProducts?: ProductItem[];
  myBookings?: CapsuleBooking[];
  slots?: CapsuleSlot[];
  grantApplications?: GrantApplication[];
  onViewOfferLetter?: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
  onOpenBookingTab?: () => void;
  onOpenBookingModal?: () => void;
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
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  onOpenBookingTab,
  onOpenBookingModal,
  onRefresh,
  activeSubTab = 'overview',
  onSelectSubTab
}) => {
  const { user, userProfile, updateProfileData, openLoginModal } = useAuth();
  const safeProducts = myProducts || [];
  const safeBookings = myBookings || [];
  const safeSlots = slots || [];

  const [internalTab, setInternalTab] = useState<'overview' | 'profile' | 'products' | 'bookings' | 'cashflow' | 'vault' | 'card' | 'settings'>('overview');

  // Synchronize internal tab state with external activeSubTab prop
  React.useEffect(() => {
    if (activeSubTab) {
      setInternalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const activeTab = activeSubTab || internalTab;
  const setActiveTab = (tab: 'overview' | 'profile' | 'products' | 'bookings' | 'cashflow' | 'vault' | 'card' | 'settings') => {
    setInternalTab(tab);
    if (onSelectSubTab && (tab === 'overview' || tab === 'profile' || tab === 'products' || tab === 'bookings' || tab === 'cashflow' || tab === 'vault' || tab === 'card')) {
      onSelectSubTab(tab);
    }
  };

  const [salesPeriod, setSalesPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [selectedStepperIndex, setSelectedStepperIndex] = useState<number>(2);

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
  const [logoUrl, setLogoUrl] = useState(myBusiness?.logoUrl || '/public/assets/generated/avatar_youth_male_1793924250192.jpg');
  const [bannerUrl, setBannerUrl] = useState(myBusiness?.bannerUrl || '/public/assets/generated/banner_kelantan_landmark_1793924253242.jpg');

  // Settings Tab State
  const [settingsFullName, setSettingsFullName] = useState(userProfile?.fullName || user?.displayName || '');
  const [settingsIcNumber, setSettingsIcNumber] = useState(userProfile?.icNumber || '');
  const [settingsPhone, setSettingsPhone] = useState(userProfile?.phone || userProfile?.whatsapp || myBusiness?.whatsapp || '');
  const [settingsDistrict, setSettingsDistrict] = useState<KelantanDistrict>((userProfile?.district as KelantanDistrict) || myBusiness?.district || 'Kota Bharu');
  const [settingsBusinessName, setSettingsBusinessName] = useState(userProfile?.businessName || myBusiness?.businessName || '');
  const [settingsCategory, setSettingsCategory] = useState<BusinessCategory>(userProfile?.category || myBusiness?.category || 'Makanan & Minuman (F&B)');
  const [settingsSsmStatus, setSettingsSsmStatus] = useState<'registered' | 'in_progress' | 'not_registered'>(
    userProfile?.ssmStatus || (myBusiness?.ssmNumber ? 'registered' : 'in_progress')
  );
  const [settingsSsmNumber, setSettingsSsmNumber] = useState(userProfile?.ssmNumber || myBusiness?.ssmNumber || '');
  const [settingsBusinessStage, setSettingsBusinessStage] = useState<'idea' | 'startup' | 'growth'>(
    userProfile?.businessStage || 'startup'
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Sync settings state if userProfile or myBusiness changes
  React.useEffect(() => {
    if (userProfile) {
      if (userProfile.fullName) setSettingsFullName(userProfile.fullName);
      if (userProfile.icNumber) setSettingsIcNumber(userProfile.icNumber);
      if (userProfile.phone) setSettingsPhone(userProfile.phone);
      if (userProfile.district) setSettingsDistrict(userProfile.district as KelantanDistrict);
      if (userProfile.businessName) setSettingsBusinessName(userProfile.businessName);
      if (userProfile.category) setSettingsCategory(userProfile.category);
      if (userProfile.ssmStatus) setSettingsSsmStatus(userProfile.ssmStatus);
      if (userProfile.ssmNumber) setSettingsSsmNumber(userProfile.ssmNumber);
      if (userProfile.businessStage) setSettingsBusinessStage(userProfile.businessStage);
    } else if (user) {
      if (user.displayName) setSettingsFullName(user.displayName);
    }
    if (myBusiness) {
      if (!userProfile?.businessName && myBusiness.businessName) setSettingsBusinessName(myBusiness.businessName);
      if (!userProfile?.ssmNumber && myBusiness.ssmNumber) setSettingsSsmNumber(myBusiness.ssmNumber);
      if (!userProfile?.category && myBusiness.category) setSettingsCategory(myBusiness.category);
      if (!userProfile?.phone && myBusiness.whatsapp) setSettingsPhone(myBusiness.whatsapp);
    }
  }, [userProfile, user, myBusiness]);

  // Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Menu Utama');
  const [prodImageUrl, setProdImageUrl] = useState('/public/assets/generated/product_kelantan_delights_1793924253401.jpg');

  // Booking action states
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<CapsuleBooking | null>(null);
  const [maintenanceComplaintBooking, setMaintenanceComplaintBooking] = useState<CapsuleBooking | null>(null);
  const [complaintType, setComplaintType] = useState('Bekalan Elektrik 13A & Lampu');
  const [complaintNotes, setComplaintNotes] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsFullName.trim()) {
      setSettingsMessage({ type: 'error', text: 'Sila masukkan nama penuh anda.' });
      return;
    }
    if (!settingsPhone.trim()) {
      setSettingsMessage({ type: 'error', text: 'Sila masukkan nombor telefon / WhatsApp.' });
      return;
    }

    try {
      setSavingSettings(true);
      setSettingsMessage(null);

      // 1. Update User Profile in AuthContext & Firestore / localStorage
      await updateProfileData({
        fullName: settingsFullName.trim(),
        icNumber: settingsIcNumber.trim(),
        phone: settingsPhone.trim(),
        whatsapp: settingsPhone.trim(),
        district: settingsDistrict,
        businessName: settingsBusinessName.trim(),
        category: settingsCategory,
        ssmStatus: settingsSsmStatus,
        ssmNumber: settingsSsmNumber.trim(),
        businessStage: settingsBusinessStage
      });

      // 2. Also keep business listing in sync if existing
      if (myBusiness) {
        await saveBusinessListing({
          ...myBusiness,
          ownerName: settingsFullName.trim(),
          ownerPhone: settingsPhone.trim(),
          whatsapp: settingsPhone.trim(),
          district: settingsDistrict,
          businessName: settingsBusinessName.trim() || myBusiness.businessName,
          category: settingsCategory,
          ssmNumber: settingsSsmNumber.trim()
        });
      }

      confetti({ particleCount: 50, spread: 60 });
      setSettingsMessage({ type: 'success', text: 'Tetapan maklumat peribadi & bisnes berjaya disimpan dan disegerakkan!' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: 'Gagal menyimpan tetapan. Sila cuba sebentar lagi.' });
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-md max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Portal Usahawan Belia</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sila log masuk untuk mendaftar perniagaan anda, mengurus produk katalog, dan memantau status sewaan Kapsul Niaga Kelantan.
          </p>
          <button
            onClick={openLoginModal}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Log Masuk / Pilih Profil Demo</span>
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
        ownerName: user.displayName || userProfile?.fullName || 'Usahawan Belia',
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
    if (!prodName.trim() || !prodPrice) {
      setMessage({ type: 'error', text: 'Sila isi nama dan harga produk.' });
      return;
    }

    try {
      setLoading(true);
      await saveProduct({
        businessId: myBusiness.id,
        ownerId: user.uid,
        name: prodName,
        price: parseFloat(prodPrice),
        description: prodDesc,
        category: prodCategory,
        imageUrl: prodImageUrl,
        inStock: true
      });

      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setShowAddProduct(false);
      setMessage({ type: 'success', text: 'Produk baharu berjaya ditambah ke katalog!' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menambah produk.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProd = async (id: string) => {
    try {
      await deleteProduct(id);
      setMessage({ type: 'success', text: 'Produk telah dipadam dari katalog.' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full px-1 sm:px-3 py-4">
      
      {/* Header */}
      <div 
        id="merchant-portal-header" 
        className="pb-6 border-b border-slate-200 dark:border-[#2E3A47] transition-colors"
      >
        <div className="flex items-center gap-2 text-red-800 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
          <Store className="w-4 h-4" />
          <span>Pusat Kawalan Usahawan KBelia</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Urus Bisnes & Kapsul Saya
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-0.5">
          Selamat kembali, <span className="font-semibold text-slate-800 dark:text-slate-200">{user.displayName || 'Usahawan Belia'}</span> ({user.email})
        </p>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100 font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Tab 0: TailAdmin Executive Overview Hub */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6">
          
          {/* Executive Greeting Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 sm:p-7 text-white border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(185,28,28,0.25),transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 tracking-wider uppercase">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Papan Pemuka Usahawan Belia Kelantan</span>
                  <span className="text-white/30">·</span>
                  <span className="text-slate-300 font-mono text-[11px]">Sesi 2026 Aktif</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Usahawan Belia'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Pemilik: <span className="font-semibold text-white">{userProfile?.fullName || user.displayName || 'Usahawan Belia'}</span> · {myBusiness?.district || userProfile?.district || 'Kota Bharu'} · SSM: <span className="font-mono text-amber-300">{myBusiness?.ssmNumber || userProfile?.ssmNumber || 'TR0294811-M'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('cashflow')}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>Rekod Jualan Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 border border-white/20 hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>Daftar Produk</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 TailAdmin Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Jualan Bulanan */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Hasil Jualan Bulan Ini
                </span>
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  RM 14,850
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +18.4%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Purata RM 495 / hari · 72% DuitNow QR
              </div>
            </div>

            {/* KPI 2: Kiosk & Tapak Aktif */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Status Tapak Kiosk
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {safeBookings.length > 0 ? safeBookings[0].slotCode : 'KB Sentral A-02'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Aktif
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Palam 13A & Wi-Fi · Baki sewa 42 hari
              </div>
            </div>

            {/* KPI 3: Status Geran Belia */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Geran Pemangkin Aktif
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  RM 15,000
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Saringan Temuduga Geran (Lulus Bersyarat)</span>
              </div>
            </div>

            {/* KPI 4: Sesi Mentor Terdekat */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Klinik Mentoring Seterusnya
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Khamis, 10:30 AM
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Dr. Azlan · Pemasaran Digital UMK (Maya)
              </div>
            </div>

          </div>

          {/* TailAdmin 3-Column Grid matching reference wireframe */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kolum 1: Carta Analitik Jualan Interaktif & Ringkasan Transaksi */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] shadow-2xs overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 py-4.5 px-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#24303F]">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Analitik Aliran Jualan Kiosk
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Transaksi fizikal & DuitNow QR
                  </p>
                </div>

                {/* Period Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1A222C] rounded-lg border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('weekly')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'weekly'
                        ? 'bg-white dark:bg-[#24303F] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('monthly')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'monthly'
                        ? 'bg-white dark:bg-[#24303F] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesPeriod('quarterly')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      salesPeriod === 'quarterly'
                        ? 'bg-white dark:bg-[#24303F] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Suku
                  </button>
                </div>
              </div>

              {/* Chart Content Area */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                
                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Terkumpul</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {salesPeriod === 'weekly' ? 'RM 4,850' : salesPeriod === 'monthly' ? 'RM 14,850' : 'RM 44,800'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Purata/Hari</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {salesPeriod === 'weekly' ? 'RM 692' : salesPeriod === 'monthly' ? 'RM 495' : 'RM 498'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Puncak</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {salesPeriod === 'weekly' ? 'RM 1,280' : salesPeriod === 'monthly' ? 'RM 2,840' : 'RM 15,200'}
                    </span>
                  </div>
                </div>

                {/* Interactive SVG Bar Chart */}
                <div className="relative pt-2 pb-2">
                  <div className="h-48 w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1">
                    {(salesPeriod === 'weekly' ? [
                      { label: 'Isn', value: 420, max: 1400, tx: 32, qr: 70 },
                      { label: 'Sel', value: 380, max: 1400, tx: 28, qr: 65 },
                      { label: 'Rab', value: 510, max: 1400, tx: 41, qr: 75 },
                      { label: 'Kha', value: 490, max: 1400, tx: 38, qr: 72 },
                      { label: 'Jum', value: 820, max: 1400, tx: 64, qr: 80 },
                      { label: 'Sab', value: 1280, max: 1400, tx: 95, qr: 85 },
                      { label: 'Ahd', value: 950, max: 1400, tx: 72, qr: 78 }
                    ] : salesPeriod === 'monthly' ? [
                      { label: 'Mei', value: 11200, max: 16000, tx: 720, qr: 68 },
                      { label: 'Jun', value: 12850, max: 16000, tx: 840, qr: 70 },
                      { label: 'Jul', value: 13400, max: 16000, tx: 890, qr: 74 },
                      { label: 'Ogo', value: 14100, max: 16000, tx: 920, qr: 75 },
                      { label: 'Sep', value: 13950, max: 16000, tx: 905, qr: 73 },
                      { label: 'Okt', value: 14850, max: 16000, tx: 960, qr: 78 }
                    ] : [
                      { label: 'S1', value: 32500, max: 50000, tx: 2100, qr: 65 },
                      { label: 'S2', value: 38400, max: 50000, tx: 2540, qr: 70 },
                      { label: 'S3', value: 41200, max: 50000, tx: 2800, qr: 74 },
                      { label: 'S4', value: 44800, max: 50000, tx: 3100, qr: 78 }
                    ]).map((item, idx) => {
                      const heightPercent = Math.round((item.value / item.max) * 100);
                      const isHovered = hoveredBarIndex === idx;

                      return (
                        <div 
                          key={item.label}
                          className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer relative"
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                        >
                          {/* Tooltip on Hover */}
                          {isHovered && (
                            <div className="absolute -top-12 z-20 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono shadow-lg whitespace-nowrap animate-in fade-in duration-150 border border-slate-700 pointer-events-none">
                              <span className="font-bold text-amber-300">RM {item.value.toLocaleString()}</span>
                              <span className="block text-[9px] text-slate-300">{item.tx} tx · {item.qr}% QR</span>
                            </div>
                          )}

                          {/* Bar Element */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-36 flex items-end overflow-hidden p-0.5">
                            <div 
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                isHovered 
                                  ? 'bg-red-600 dark:bg-red-500 shadow-sm' 
                                  : 'bg-red-700/80 dark:bg-red-700/90 group-hover:bg-red-700'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>

                          {/* X-axis Label */}
                          <span className={`text-[10px] font-medium transition-colors ${
                            isHovered ? 'text-red-700 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer notes & Cashflow shortcut */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] truncate">Buku Tunai Transaksi Sah</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cashflow')}
                    className="text-red-700 dark:text-red-400 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Buka Rekod</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Kolum 2: Stepper Penjejak Permohonan Berperingkat */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] shadow-2xs overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 py-4.5 px-5 sm:px-6 flex items-center justify-between bg-white dark:bg-[#24303F]">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Penjejak Permohonan
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Garis masa semakan PBT & UMK
                  </p>
                </div>

                <span className="font-mono text-[11px] font-bold text-red-700 dark:text-red-400 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40">
                  #KB-2026-8812
                </span>
              </div>

              {/* Stepper Timeline Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                
                {/* 5-Step Vertical Stepper */}
                <div className="space-y-3">
                  {[
                    {
                      step: 1,
                      title: 'Borang Dihantar',
                      date: '12 Okt 2026',
                      officer: 'KBelia Online',
                      status: 'completed',
                      desc: 'Borang pendaftaran profil & tapak diterima.'
                    },
                    {
                      step: 2,
                      title: 'Semakan Dokumen & SSM',
                      date: '15 Okt 2026',
                      officer: 'Urusetia PBT',
                      status: 'completed',
                      desc: 'MyKad dan nombor SSM disahkan patuh kriteria.'
                    },
                    {
                      step: 3,
                      title: 'Saringan & Temuduga Geran Belia',
                      date: '24 Okt 2026',
                      officer: 'Panel Penilai UMK',
                      status: 'current',
                      desc: 'Pitching ringkas. Status: Lulus Bersyarat.'
                    },
                    {
                      step: 4,
                      title: 'Surat Tawaran & Perjanjian',
                      date: 'Dijangka: 02 Nov',
                      officer: 'Penyelaras UMK',
                      status: 'upcoming',
                      desc: 'Dokumen perjanjian sewaan sedang disiapkan.'
                    },
                    {
                      step: 5,
                      title: 'Penyerahan Kunci Kapsul',
                      date: 'Dijangka: 08 Nov',
                      officer: 'Penyelia Tapak',
                      status: 'upcoming',
                      desc: 'Pemeriksaan fizikal palam 13A & penyerahan stiker.'
                    }
                  ].map((stepItem, idx) => {
                    const isCompleted = stepItem.status === 'completed';
                    const isCurrent = stepItem.status === 'current';
                    const isSelected = selectedStepperIndex === idx;

                    return (
                      <div 
                        key={stepItem.step}
                        onClick={() => setSelectedStepperIndex(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-[#1A222C] border-red-300 dark:border-red-900/60 shadow-xs'
                            : 'border-transparent hover:bg-slate-50/70 dark:hover:bg-[#1A222C]/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Node Icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-red-700 text-white ring-2 ring-red-100 dark:ring-red-950/60 animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepItem.step}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <h5 className={`text-xs font-bold truncate ${
                                isCurrent ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
                              }`}>
                                {stepItem.title}
                              </h5>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : isCurrent
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {isCompleted ? 'Selesai' : isCurrent ? 'Diproses' : 'Menunggu'}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono">{stepItem.date}</span>
                              <span>·</span>
                              <span className="truncate">{stepItem.officer}</span>
                            </div>

                            {isSelected && (
                              <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#24303F] p-2 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed animate-in fade-in duration-150">
                                {stepItem.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Direct Action Buttons for Timeline */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (safeBookings.length > 0 && onViewOfferLetter) {
                        onViewOfferLetter(safeBookings[0]);
                      } else {
                        setActiveTab('bookings');
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                    <span>Surat Tawaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Urus Kiosk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Kolum 3: Pusat Notifikasi & Tindakan Segera Usahawan */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#24303F] shadow-2xs overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 py-4.5 px-5 sm:px-6 flex items-center justify-between bg-white dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Notifikasi & Makluman
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  3 Terkini
                </span>
              </div>

              {/* Notification Items */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Jadual Mentor</span>
                      <span className="text-[10px] text-slate-400 font-mono">Hari ini</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Klinik Mentoring Digital #04
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sesi Dr. Azlan dijadualkan Khamis 10:30 AM via Meet. Sedia pautan media sosial bisnes anda.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Fasiliti Kiosk</span>
                      <span className="text-[10px] text-slate-400 font-mono">Semalam</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Suis Elektrik Disahkan
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Palam 13A di Pod A-02 disahkan sedia dan selamat untuk perkakasan peniaga.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Peluang Geran</span>
                      <span className="text-[10px] text-slate-400 font-mono">3 hari lalu</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Geran Digital Belia Kelantan
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Subsidi peranti POS sehingga RM 5,000 kini dibuka untuk usahawan mikro.
                    </p>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-[#1A222C] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2E3A47] transition-all text-center cursor-pointer"
                  >
                    Kad Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all text-center cursor-pointer"
                  >
                    Urus Produk
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div className="mt-6 bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden w-full transition-colors">
          {/* TailAdmin Card Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 py-4.5 px-6 sm:px-7 flex items-center justify-between bg-white dark:bg-[#24303F]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Maklumat Asas & Jenama Perniagaan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Penyelarasan profil bisnes bagi pendaftaran direktori usahawan belia Kelantan
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBusiness} className="p-6 sm:p-7 space-y-5">
            {/* 2-Column Row 1: Nama Bisnes + Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Nama Perniagaan: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama perniagaan anda"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Slogan / Tagline:
                </label>
                <input
                  type="text"
                  placeholder="Slogan atau ringkasan perniagaan anda"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>
            </div>

            {/* 2-Column Row 2: Kategori + Jajahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Kategori Perniagaan: <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="dark:bg-[#1A222C]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Jajahan Operasi: <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d} className="dark:bg-[#1A222C]">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2-Column Row 3: No. Pendaftaran SSM + No. WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Nombor Pendaftaran SSM (Jika ada):
                </label>
                <input
                  type="text"
                  placeholder="Nombor pendaftaran SSM"
                  value={ssmNumber}
                  onChange={(e) => setSsmNumber(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Nombor WhatsApp Bisnes: <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nombor telefon"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>
            </div>

            {/* Penerangan Bisnes */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Penerangan Bisnes & Keistimewaan:
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan tentang produk, keunikan, proses pembuatan atau servis yang ditawarkan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
              />
            </div>

            {/* 2-Column Row 4: Instagram + TikTok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Instagram:
                </label>
                <input
                  type="text"
                  placeholder="Akaun Instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  TikTok:
                </label>
                <input
                  type="text"
                  placeholder="Akaun TikTok"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>
            </div>

            {/* 2-Column Row 5: Media Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Logo Perniagaan:
                </label>
                <ImageDropzone
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val)}
                  label="Tarik atau pilih logo perniagaan"
                  aspectRatio="1:1"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Banner Premis / Kiosk:
                </label>
                <ImageDropzone
                  value={bannerUrl}
                  onChange={(val) => setBannerUrl(val)}
                  label="Tarik atau pilih gambar banner premis"
                  aspectRatio="16:9"
                />
              </div>
            </div>

            {/* TailAdmin Action Buttons Footer */}
            <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Profil Perniagaan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Products */}
      {activeTab === 'products' && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Katalog Menu & Produk Anda</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Pelanggan boleh membuat pesanan terus melalui WhatsApp.</p>
            </div>

            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="py-2.5 px-5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Daftar Produk Baharu</span>
            </button>
          </div>

          {/* Add Product Form Box (TailAdmin Form Layout) */}
          {showAddProduct && (
            <div className="bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Borang Tambah Produk Baharu</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Nama Produk: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama produk anda"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Harga Jualan (RM): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      placeholder="0.00"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Kategori Produk:
                    </label>
                    <input
                      type="text"
                      placeholder="Kategori produk"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Penerangan Produk & Keistimewaan:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Penerangan ringkas produk..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-transparent dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Gambar Produk:
                    </label>
                    <ImageDropzone
                      value={prodImageUrl}
                      onChange={(val) => setProdImageUrl(val)}
                      label="Tarik atau pilih gambar produk"
                      aspectRatio="1:1"
                    />
                  </div>
                </div>

                {/* TailAdmin Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Menyimpan...' : `Simpan Produk Ini (RM${prodPrice ? Number(prodPrice).toFixed(2) : '0.00'})`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Products */}
          {safeProducts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#24303F] rounded-2xl border border-dashed border-slate-300 dark:border-[#2E3A47]">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Produk Disenaraikan</h4>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-0.5">Tekan butang di atas untuk memasukkan produk pertama anda.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-[#24303F] p-4 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-2xs flex gap-3 items-center justify-between transition-colors"
                >
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{prod.name}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-[#8A99AD] truncate">{prod.category}</p>
                    <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">
                      RM{prod.price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProd(prod.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Capsule Bookings */}
      {activeTab === 'bookings' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Rekod Permohonan Kapsul Niaga Anda</h3>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD]">Status semakan dan peruntukan kiosk oleh pihak pengurusan hub.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal();
                } else if (onOpenBookingTab) {
                  onOpenBookingTab();
                }
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer interactive-press"
            >
              <Building2 className="w-4 h-4" />
              <span>Mohon Slot Kapsul</span>
            </button>
          </div>

          {safeBookings.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#24303F] rounded-2xl border border-dashed border-slate-300 dark:border-[#2E3A47]">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tiada Permohonan Kapsul</h4>
              <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-0.5 mb-4">Anda belum memohon sewaan slot kapsul niaga belia.</p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenBookingModal) onOpenBookingModal();
                  else if (onOpenBookingTab) onOpenBookingTab();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer interactive-press"
              >
                <Building2 className="w-4 h-4" />
                <span>Pilih & Mohon Kapsul Niaga Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {safeBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-[#24303F] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-4 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 dark:bg-[#1A222C] text-white border border-transparent dark:border-[#2E3A47]">
                          {b.slotCode}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{b.slotName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#8A99AD]">
                        {b.hubLocation} • Tempoh: <strong>{b.durationMonths} Bulan</strong> • Mula: <strong>{formatDisplayDate(b.startDate)}</strong> • Akhir: <strong className="text-red-700 dark:text-amber-400">{calculateOperationEndDate(b.startDate, b.durationMonths)}</strong>
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {b.status === 'pending' && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Dalam Semakan Urusetia
                        </span>
                      )}
                      {b.status === 'approved' && (
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Permohonan Diluluskan
                        </span>
                      )}
                      {b.status === 'rejected' && (
                        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          Tidak Berjaya
                        </span>
                      )}
                    </div>
                  </div>

                  {b.adminNotes && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#1A222C] p-3 rounded-xl border border-slate-200 dark:border-[#2E3A47]">
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Arahan & Catatan Urusetia Pentadbir:</span>
                      <p>{b.adminNotes}</p>
                    </div>
                  )}

                  {/* ACTION BUTTONS TOOLBAR (FUNGSI PENUH PESANAN/TEMPAHAN) */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                    
                    {/* 1. Official Receipt */}
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(b)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Cetak atau muat turun resit bayaran rasmi"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Resit Rasmi Bayaran</span>
                    </button>

                    {/* 2. Offer Letter (If approved or available) */}
                    {b.status === 'approved' && onViewOfferLetter && (
                      <button
                        type="button"
                        onClick={() => onViewOfferLetter(b)}
                        className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Surat Tawaran</span>
                      </button>
                    )}

                    {/* 3. Tenancy Agreement */}
                    {b.status === 'approved' && onOpenTenancyAgreement && (
                      <button
                        type="button"
                        onClick={() => onOpenTenancyAgreement(b)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A222C] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-600" />
                        <span>Perjanjian Sewa Kiosk</span>
                      </button>
                    )}

                    {/* 4. QR License Verification */}
                    {b.status === 'approved' && onOpenVerification && (
                      <button
                        type="button"
                        onClick={() => onOpenVerification(`KBN-${b.slotCode}`)}
                        className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sahkan Lesen QR</span>
                      </button>
                    )}

                    {/* 5. Contact Hub Officer (WhatsApp) */}
                    <a
                      href={`https://wa.me/601120508890?text=${encodeURIComponent(`Salam Urusetia KBelia Kelantan, saya ingin membuat pertanyaan mengenai permohonan kiosk slot ${b.slotCode} (${b.slotName}) bagi perniagaan ${b.businessName}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Urusetia Hab</span>
                    </a>

                    {/* 6. Facility Maintenance Complaint */}
                    <button
                      type="button"
                      onClick={() => {
                        setMaintenanceComplaintBooking(b);
                        setComplaintSuccess(null);
                        setComplaintNotes('');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A222C] hover:bg-slate-100 border border-slate-300 dark:border-[#2E3A47] text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Lapor kerosakan lampu/elektrik/pintu kiosk"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Aduan Kiosk</span>
                    </button>

                    {/* 7. Cancel Pending Booking */}
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Adakah anda pasti ingin membatalkan permohonan slot ${b.slotCode}?`)) {
                            await updateBookingStatus(b.id, 'rejected', 'Permohonan dibatalkan oleh usahawan.');
                            onRefresh();
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Batal Permohonan</span>
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL 1: OFFICIAL RECEIPT (RESIT RASMI BAYARAN KBELIA) */}
          {selectedReceiptBooking && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
                
                {/* Receipt Header */}
                <div className="p-5 bg-gradient-to-r from-red-800 via-red-900 to-amber-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                      <span className="text-base font-black">KB</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wide">Resit Rasmi Bayaran Subsidi Kiosk</h4>
                      <p className="text-[10px] text-amber-200">Urusetia Pembangunan Keusahawanan Belia Kelantan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptBooking(null)}
                    className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 space-y-4 text-xs">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">No. Rujukan Resit</span>
                      <span className="font-mono font-extrabold text-sm text-red-950">
                        REC-{selectedReceiptBooking.slotCode}-{selectedReceiptBooking.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Tarikh Pembayaran</span>
                      <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('ms-MY')}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Usahawan:</span>
                      <span className="font-bold text-slate-900">{selectedReceiptBooking.applicantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jenama Perniagaan:</span>
                      <span className="font-bold text-slate-900">{selectedReceiptBooking.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kapsul Diperuntukkan:</span>
                      <span className="font-bold text-red-900">{selectedReceiptBooking.slotCode} ({selectedReceiptBooking.slotName})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lokasi Hab:</span>
                      <span className="font-semibold text-slate-800">{selectedReceiptBooking.hubLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tempoh Perjanjian:</span>
                      <span className="font-semibold text-slate-800">{selectedReceiptBooking.durationMonths} Bulan ({formatDisplayDate(selectedReceiptBooking.startDate)} hingga {calculateOperationEndDate(selectedReceiptBooking.startDate, selectedReceiptBooking.durationMonths)})</span>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Keterangan Urusniaga</th>
                          <th className="p-3 text-right">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-medium">Yuran Komitmen Sewaan Kiosk Modular Subsidi Belia (Sebulan)</td>
                          <td className="p-3 text-right font-mono font-bold">150.00</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Deposit Kebersihan & Keselamatan Utiliti Elektrik 13A</td>
                          <td className="p-3 text-right font-mono font-bold">50.00</td>
                        </tr>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold">
                          <td className="p-3">Subsidi Kerajaan Negeri Kelantan (Kadar Khas)</td>
                          <td className="p-3 text-right font-mono">-50.00</td>
                        </tr>
                        <tr className="bg-slate-900 text-white font-extrabold text-sm">
                          <td className="p-3">JUMLAH DIBAYAR</td>
                          <td className="p-3 text-right font-mono text-amber-300">RM 150.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-[11px] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Status Transaksi: Berjaya & Sah Diperakui Sistem Perakaunan Bersepadu KBelia.</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>Cetak Salinan Resit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
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
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">Borang Aduan Fasiliti Kiosk</h4>
                      <p className="text-[10px] text-slate-300">Slot {maintenanceComplaintBooking.slotCode} • {maintenanceComplaintBooking.hubLocation}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceComplaintBooking(null)}
                    className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {complaintSuccess ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Aduan Berjaya Dihantar!</span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        {complaintSuccess} Pihak pengurusan fasiliti hab akan mengambil tindakan segera dalam tempoh 24 jam.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMaintenanceComplaintBooking(null)}
                        className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Selesai & Tutup
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setComplaintSuccess(`Tiket aduan #${Math.floor(1000 + Math.random() * 9000)} didaftarkan bagi kategori "${complaintType}".`);
                      }}
                      className="space-y-3.5"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Jenis Kerosakan / Isu Fasiliti: *
                        </label>
                        <select
                          value={complaintType}
                          onChange={(e) => setComplaintType(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Penerangan Terperinci Isu: *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={complaintNotes}
                          onChange={(e) => setComplaintNotes(e.target.value)}
                          placeholder="Terangkan masalah yang dihadapi di kiosk anda..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMaintenanceComplaintBooking(null)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Hantar Aduan Sekarang</span>
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
        <div className="mt-6">
          <KioskCashflowTracker 
            kioskName={myBookings.find(b => b.status === 'approved')?.slotName || myBusiness?.businessName || 'Kiosk Kapsul Niaga'} 
          />
        </div>
      )}

      {/* Tab: User Documents Vault */}
      {activeTab === 'vault' && (
        <div className="mt-6">
          <UserDocumentsVault
            bookings={safeBookings}
            grantApplications={grantApplications}
            onViewOfferLetter={(b) => onViewOfferLetter && onViewOfferLetter(b)}
            onOpenTenancyAgreement={(b) => onOpenTenancyAgreement && onOpenTenancyAgreement(b)}
            onOpenVerification={(ref) => onOpenVerification && onOpenVerification(ref)}
          />
        </div>
      )}

      {/* Tab 4: Digital Card & QR Promo */}
      {activeTab === 'card' && (
        <div className="mt-6 max-w-xl mx-auto bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider">
            <span>Kad Profil Usahawan Belia Kelantan</span>
          </div>

          <div className="space-y-2">
            <img
              src={myBusiness?.logoUrl || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
              alt=""
              className="w-20 h-20 rounded-2xl mx-auto border-2 border-slate-700 object-cover bg-white"
            />
            <h3 className="text-xl font-bold text-white">{myBusiness?.businessName || 'Nama Bisnes Belia'}</h3>
            <p className="text-xs text-slate-300 font-medium">{myBusiness?.tagline || 'Inisiatif Usahawan Muda Kelantan'}</p>
          </div>

          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-2 text-slate-200 text-left">
            <div className="flex justify-between"><span>Jajahan:</span> <span className="font-bold text-white">{myBusiness?.district || 'Kota Bharu'}</span></div>
            <div className="flex justify-between"><span>Kategori:</span> <span className="font-bold text-white">{myBusiness?.category || 'F&B'}</span></div>
            <div className="flex justify-between"><span>WhatsApp:</span> <span className="font-mono text-emerald-400">{myBusiness?.whatsapp || userProfile?.phone || '-'}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Sokong perniagaan ${myBusiness?.businessName || 'Usahawan Belia'} di Portal KBelia Kelantan: ${window.location.origin}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kongsi ke WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Tab 5: Account & Business Settings */}
      {activeTab === 'settings' && (
        <div className="mt-6 w-full space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-800/80 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5" />
                <span>Pengurusan Maklumat Usahawan</span>
              </div>
              <h3 className="text-xl font-bold text-white">Tetapan Profil & Perniagaan</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Kemaskini maklumat pengenalan peribadi, nombor telefon WhatsApp untuk dihubungi pelanggan, pendaftaran SSM dan jajahan operasi perniagaan anda di Kelantan.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Akaun Disahkan
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {settingsMessage && (
            <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
              settingsMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {settingsMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{settingsMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsMessage(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 px-2 py-0.5"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Section 1: Profil Peribadi & Hubungan */}
            <div className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Maklumat Peribadi & Nombor Perhubungan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Maklumat sah pemilik akaun usahawan belia.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Penuh */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nama Penuh <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={settingsFullName}
                      onChange={(e) => setSettingsFullName(e.target.value)}
                      placeholder="Nama penuh"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* No. MyKad */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    No. MyKad / Kad Pengenalan
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={settingsIcNumber}
                      onChange={(e) => setSettingsIcNumber(e.target.value)}
                      placeholder="Masukkan No. Kad Pengenalan"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Alamat Emel */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Emel
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      placeholder="Emel"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-[#1A222C]/60 border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Emel berdaftar tidak boleh diubah untuk tujuan keselamatan sesi.</span>
                </div>

                {/* Nombor Telefon / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nombor Telefon / WhatsApp <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      placeholder="Nombor Telefon / WhatsApp"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Jajahan Operasi / Kediaman */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Jajahan Kediaman & Operasi Utama (Kelantan) <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={settingsDistrict}
                      onChange={(e) => setSettingsDistrict(e.target.value as KelantanDistrict)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          Jajahan {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Maklumat Bisnes & Pendaftaran SSM */}
            <div className="bg-white dark:bg-[#24303F] p-6 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs space-y-5 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2E3A47]">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Maklumat Bisnes, SSM & Jajahan Operasi</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Penyelarasan profil komersil bagi permohonan kapsul dan direktori.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Perniagaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nama Perniagaan / Jenama Komersil
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={settingsBusinessName}
                      onChange={(e) => setSettingsBusinessName(e.target.value)}
                      placeholder="Nama perniagaan"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Kategori Perniagaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Kategori Perniagaan
                  </label>
                  <select
                    value={settingsCategory}
                    onChange={(e) => setSettingsCategory(e.target.value as BusinessCategory)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Pendaftaran SSM */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Status Pendaftaran SSM
                  </label>
                  <select
                    value={settingsSsmStatus}
                    onChange={(e) => setSettingsSsmStatus(e.target.value as 'registered' | 'in_progress' | 'not_registered')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white"
                  >
                    <option value="registered">Berdaftar Rasmi dengan SSM</option>
                    <option value="in_progress">Dalam Proses Pendaftaran SSM</option>
                    <option value="not_registered">Belum Mendaftar SSM</option>
                  </select>
                </div>

                {/* No. Pendaftaran SSM */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nombor Pendaftaran SSM
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={settingsSsmNumber}
                      onChange={(e) => setSettingsSsmNumber(e.target.value)}
                      placeholder="No. pendaftaran SSM"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#1A222C] focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Peringkat Perkembangan Bisnes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Peringkat Perkembangan Perniagaan Belia
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      settingsBusinessStage === 'idea'
                        ? 'border-red-700 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-700'
                        : 'border-slate-200 dark:border-[#2E3A47] hover:bg-slate-50 dark:hover:bg-[#1A222C]'
                    }`}>
                      <input
                        type="radio"
                        name="settingsBusinessStage"
                        checked={settingsBusinessStage === 'idea'}
                        onChange={() => setSettingsBusinessStage('idea')}
                        className="text-red-700 focus:ring-red-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Peringkat Idea / R&D</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Membangunkan produk permulaan</div>
                      </div>
                    </label>

                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      settingsBusinessStage === 'startup'
                        ? 'border-red-700 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-700'
                        : 'border-slate-200 dark:border-[#2E3A47] hover:bg-slate-50 dark:hover:bg-[#1A222C]'
                    }`}>
                      <input
                        type="radio"
                        name="settingsBusinessStage"
                        checked={settingsBusinessStage === 'startup'}
                        onChange={() => setSettingsBusinessStage('startup')}
                        className="text-red-700 focus:ring-red-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Permulaan (Startup)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Beroperasi di bawah 3 tahun</div>
                      </div>
                    </label>

                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      settingsBusinessStage === 'growth'
                        ? 'border-red-700 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-700'
                        : 'border-slate-200 dark:border-[#2E3A47] hover:bg-slate-50 dark:hover:bg-[#1A222C]'
                    }`}>
                      <input
                        type="radio"
                        name="settingsBusinessStage"
                        checked={settingsBusinessStage === 'growth'}
                        onChange={() => setSettingsBusinessStage('growth')}
                        className="text-red-700 focus:ring-red-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Perkembangan (Growth)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Mempunyai cawangan / pasaran luar</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Ringkasan Akaun & Kawalan */}
            <div className="bg-slate-50 dark:bg-[#24303F] p-5 rounded-2xl border border-slate-200 dark:border-[#2E3A47] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Penyegerakan Data Profil & Direktori</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Data yang dikemaskini akan disegerakkan terus ke pangkalan data KBelia dan memaparkan maklumat terkini pada kad usahawan anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{savingSettings ? 'Menyimpan Tetapan...' : 'Simpan Perubahan Tetapan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
