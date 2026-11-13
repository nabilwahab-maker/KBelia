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
  KioskDailySale,
  MaintenanceTicket,
  MentorshipRegistration,
  MerchantSubTab
} from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  saveBusinessListing, 
  saveProduct, 
  deleteProduct,
  updateBookingStatus,
  createMaintenanceTicket
} from '../services/dataService';
import { KioskCashflowTracker } from './KioskCashflowTracker';
import { UserDocumentsVault } from './UserDocumentsVault';
import { ImageDropzone } from './ImageDropzone';
import { showToast } from './ToastNotification';
import { SaaSKpiCard, SparkPoint } from './SaaSKpiCard';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import confetti from 'canvas-confetti';

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
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
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
  const [prodImageUrl, setProdImageUrl] = useState('/assets/generated/product_kelantan_delights_1793924253401.jpg');

  // Booking action states
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<CapsuleBooking | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<CapsuleBooking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [maintenanceComplaintBooking, setMaintenanceComplaintBooking] = useState<CapsuleBooking | null>(null);
  const [complaintType, setComplaintType] = useState('Bekalan Elektrik 13A & Lampu');
  const [complaintNotes, setComplaintNotes] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Portal Usahawan Belia</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Sila log masuk untuk mendaftar perniagaan anda, mengurus produk katalog, dan memantau status sewaan Kapsul Niaga Kelantan.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-sky-100" />
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
        className="kbelia-important-header rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 mb-2 transition-colors"
      >
        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Store className="w-4 h-4" />
          <span>Pusat Kawalan Usahawan KBelia</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-1">
          Urus Bisnes & Kapsul Saya
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
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
        const primaryBooking = approvedBooking || pendingBooking || safeBookings[0] || null;
        const activeSlotInfo = primaryBooking ? safeSlots.find(s => s.id === primaryBooking.slotId || s.code === primaryBooking.slotCode) : null;

        // Real Grant Computation
        const latestGrant = grantApplications[0] || null;
        const approvedGrants = grantApplications.filter(g => g.status === 'approved');
        const parseAmount = (amt?: string) => {
          const num = Number((amt || '0').replace(/[^0-9.]/g, ''));
          return isNaN(num) ? 0 : num;
        };
        const totalGrantValue = (approvedGrants.length > 0 ? approvedGrants : grantApplications)
          .reduce((sum, g) => sum + parseAmount(g.grantAmount || g.amount), 0);

        // Real Mentorship Computation
        const upcomingMentor = safeMentorships.find(m => m.status === 'confirmed' || m.status === 'pending') || safeMentorships[0] || null;

        // Build Chart Bars from real cashflowRecords
        const now = new Date();
        const chartBars = (() => {
          if (salesPeriod === 'weekly') {
            const days = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
            const buckets = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(now);
              d.setDate(now.getDate() - (6 - i));
              const iso = d.toISOString().split('T')[0];
              const dayRecs = safeCashflow.filter(r => r.date === iso);
              const cash = dayRecs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
              const qr = dayRecs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
              const value = cash + qr;
              return {
                label: days[d.getDay()],
                value,
                tx: dayRecs.length,
                qr: value > 0 ? Math.round((qr / value) * 100) : 0
              };
            });
            return buckets;
          }
          if (salesPeriod === 'monthly') {
            const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
            return Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
              const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const recs = safeCashflow.filter(r => (r.date || '').startsWith(ym));
              const cash = recs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
              const qr = recs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
              const value = cash + qr;
              return {
                label: months[d.getMonth()],
                value,
                tx: recs.length,
                qr: value > 0 ? Math.round((qr / value) * 100) : 0
              };
            });
          }
          return [0, 1, 2, 3].map((qIdx) => {
            const qLabel = `S${qIdx + 1}`;
            const startMonth = qIdx * 3;
            const recs = safeCashflow.filter(r => {
              if (!r.date) return false;
              const dt = new Date(r.date);
              return dt.getFullYear() === now.getFullYear() && dt.getMonth() >= startMonth && dt.getMonth() <= startMonth + 2;
            });
            const cash = recs.reduce((s, r) => s + (Number(r.cashSales) || 0), 0);
            const qr = recs.reduce((s, r) => s + (Number(r.qrSales) || 0), 0);
            const value = cash + qr;
            return {
              label: qLabel,
              value,
              tx: recs.length,
              qr: value > 0 ? Math.round((qr / value) * 100) : 0
            };
          });
        })();

        const periodTotal = chartBars.reduce((s, b) => s + b.value, 0);
        const periodMax = Math.max(...chartBars.map(b => b.value), 0);
        const periodAvg = chartBars.length > 0 ? Math.round(periodTotal / chartBars.length) : 0;

        // Dynamic Application Stepper based on user's actual state
        const hasBusiness = Boolean(myBusiness || userProfile?.businessName);
        const hasSsm = Boolean(myBusiness?.ssmNumber || userProfile?.ssmNumber);
        const hasBooking = safeBookings.length > 0;
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
            officer: 'Urusetia PBT',
            status: hasSsm ? 'completed' : hasBusiness ? 'current' : 'upcoming',
            desc: hasSsm
              ? `No. SSM (${myBusiness?.ssmNumber || userProfile?.ssmNumber}) telah direkodkan.`
              : 'Masukkan nombor SSM (jika ada) di Tetapan Akaun atau Profil Bisnes.'
          },
          {
            step: 3,
            title: 'Permohonan Slot Kapsul Niaga',
            date: primaryBooking ? formatDisplayDate(primaryBooking.createdAt?.split('T')[0]) : 'Belum Mohon',
            officer: 'Jawatankuasa Hub',
            status: isBookingApproved ? 'completed' : hasBooking ? 'current' : 'upcoming',
            desc: primaryBooking
              ? `Permohonan ${primaryBooking.slotCode} (${primaryBooking.hubLocation}) berstatus: ${primaryBooking.status === 'approved' ? 'Diluluskan' : primaryBooking.status === 'rejected' ? 'Ditolak' : 'Dalam Semakan'}.`
              : 'Pilih tapak kiosk kapsul di menu Kapsul Niaga untuk mula berniaga.'
          },
          {
            step: 4,
            title: 'Surat Tawaran & Perjanjian Digital',
            date: isBookingApproved ? (isTenancySigned ? 'Dimeterai' : 'Sedia Ditandatangani') : 'Menunggu Kelulusan',
            officer: 'Penyelaras UMK',
            status: isTenancySigned ? 'completed' : isBookingApproved ? 'current' : 'upcoming',
            desc: isTenancySigned
              ? 'Perjanjian sewaan digital telah ditandatangani.'
              : isBookingApproved
              ? 'Surat tawaran sedia dimuat turun. Sila meterai perjanjian digital.'
              : 'Surat tawaran dijana sebaik permohonan kapsul diluluskan.'
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
            tagColor: 'text-amber-700 dark:text-amber-400',
            time: upcomingMentor.preferredDate || 'Dijadualkan',
            title: `Sesi Bimbingan: ${upcomingMentor.topic}`,
            body: `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime} (${upcomingMentor.mode}).`,
            action: onOpenMentorshipClinic
          });
        }
        if (safeTickets.length > 0) {
          const latestTicket = safeTickets[0];
          liveAlerts.push({
            tag: 'Tiket Fasiliti',
            tagColor: 'text-emerald-700 dark:text-emerald-400',
            time: latestTicket.status === 'resolved' ? 'Selesai' : latestTicket.status === 'in_progress' ? 'Diproses' : 'Diterima',
            title: `Aduan ${latestTicket.slotCode}: ${latestTicket.issueCategory}`,
            body: latestTicket.description,
            action: () => setActiveTab('bookings')
          });
        }
        if (latestGrant) {
          liveAlerts.push({
            tag: 'Permohonan Geran',
            tagColor: 'text-sky-700 dark:text-sky-400',
            time: latestGrant.status === 'approved' ? 'Diluluskan' : latestGrant.status === 'rejected' ? 'Ditolak' : 'Dalam Semakan',
            title: latestGrant.programTitle,
            body: `Jumlah dipohon: ${latestGrant.grantAmount} (${latestGrant.businessName}).`,
            action: () => setActiveTab('vault')
          });
        }

        // Build Sparkline series from real records for the 4 SaaS KPI Cards
        const salesSpark: SparkPoint[] = chartBars.map(b => ({ label: b.label, value: b.value }));
        const kioskSpark: SparkPoint[] = [
          { label: 'Mohon', value: safeBookings.length },
          { label: 'Semak', value: safeBookings.filter(b => b.status === 'pending').length },
          { label: 'Lulus', value: safeBookings.filter(b => b.status === 'approved').length },
          { label: 'Aktif', value: approvedBooking ? 1 : 0 },
          { label: 'Slot', value: safeSlots.filter(s => s.status === 'available').length }
        ];
        const grantSpark: SparkPoint[] = grantApplications.length > 0
          ? grantApplications.slice(0, 6).reverse().map((g, idx) => ({
              label: g.programTitle?.slice(0, 8) || `G${idx + 1}`,
              value: parseAmount(g.grantAmount || g.amount)
            }))
          : [
              { label: 'M1', value: 0 },
              { label: 'M2', value: 0 },
              { label: 'M3', value: 0 },
              { label: 'M4', value: 0 }
            ];
        const mentorSpark: SparkPoint[] = [
          { label: 'Mohon', value: safeMentorships.filter(m => m.status === 'pending').length },
          { label: 'Sah', value: safeMentorships.filter(m => m.status === 'confirmed').length },
          { label: 'Selesai', value: safeMentorships.filter(m => m.status === 'completed').length },
          { label: 'Jumlah', value: safeMentorships.length }
        ];

        return (
        <div className="mt-6 space-y-6">
          
          {/* Executive Greeting Banner */}
          <div className="relative rounded-2xl bg-white/85 dark:bg-zinc-900/75 backdrop-blur-md p-6 sm:p-7 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-35 pointer-events-none" aria-hidden="true" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400 tracking-wider uppercase">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Papan Pemuka Usahawan Belia Kelantan</span>
                  <span className="text-slate-300 dark:text-zinc-600">·</span>
                  <span className="text-slate-600 dark:text-zinc-300 font-mono text-[11px]">
                    {primaryBooking ? `Slot ${primaryBooking.slotCode}` : 'Akaun Berdaftar'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Usahawan Belia'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                  Pemilik: <span className="font-semibold text-slate-800 dark:text-white">{userProfile?.fullName || user.displayName || 'Usahawan Belia'}</span> · {myBusiness?.district || userProfile?.district || 'Kota Bharu'} · SSM: <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{myBusiness?.ssmNumber || userProfile?.ssmNumber || 'Belum Didaftarkan'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('cashflow')}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer interactive-press"
                >
                  <Coins className="w-4 h-4 text-sky-100" />
                  <span>Rekod Jualan Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-sky-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 cursor-pointer interactive-press"
                >
                  <ShoppingBag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Daftar Produk ({safeProducts.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Graphic SaaS KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SaaSKpiCard
              chartId="belia-sales"
              title="Hasil Jualan Direkodkan"
              value={`RM ${totalSalesAll.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtitle={
                safeCashflow.length > 0
                  ? `Purata RM ${avgDailySales.toLocaleString()} · ${qrPercentAll}% QR`
                  : 'Mula catat di Buku Tunai'
              }
              icon={TrendingUp}
              trendLabel={safeCashflow.length > 0 ? `+${safeCashflow.length} rekod` : '0 rekod'}
              trendDirection={safeCashflow.length > 0 ? 'up' : 'neutral'}
              accentColor="emerald"
              sparkData={salesSpark}
              onClick={() => setActiveTab('cashflow')}
            />

            <SaaSKpiCard
              chartId="belia-kiosk"
              title="Status Tapak Kiosk"
              value={primaryBooking ? primaryBooking.slotCode : 'Belum Mohon'}
              subtitle={
                primaryBooking
                  ? `${primaryBooking.hubLocation} · ${primaryBooking.durationMonths} bln`
                  : `${safeSlots.filter(s => s.status === 'available').length} unit kapsul tersedia`
              }
              icon={Building2}
              trendLabel={approvedBooking ? 'Aktif' : pendingBooking ? 'Semakan' : 'Kosong'}
              trendDirection={approvedBooking ? 'up' : 'neutral'}
              accentColor="amber"
              sparkData={kioskSpark}
              onClick={() => setActiveTab('bookings')}
            />

            <SaaSKpiCard
              chartId="belia-grants"
              title="Permohonan Geran Belia"
              value={`RM ${totalGrantValue.toLocaleString('ms-MY')}`}
              subtitle={
                latestGrant
                  ? `${latestGrant.programTitle}`
                  : 'Tiada permohonan geran lagi'
              }
              icon={FileCheck}
              trendLabel={
                approvedGrants.length > 0
                  ? `${approvedGrants.length} Diluluskan`
                  : latestGrant
                  ? 'Semakan'
                  : '0 Mohon'
              }
              trendDirection={approvedGrants.length > 0 ? 'up' : 'neutral'}
              accentColor="sky"
              sparkData={grantSpark}
              onClick={() => setActiveTab('vault')}
            />

            <SaaSKpiCard
              chartId="belia-mentor"
              title="Klinik Mentoring Seterusnya"
              value={upcomingMentor ? upcomingMentor.preferredDate : 'Tiada Sesi'}
              subtitle={
                upcomingMentor
                  ? `${upcomingMentor.mentorName} · ${upcomingMentor.preferredTime}`
                  : 'Tempah sesi bimbingan mentor'
              }
              icon={Calendar}
              trendLabel={upcomingMentor ? upcomingMentor.mode.split(' ')[0] : 'Sedia'}
              trendDirection={upcomingMentor ? 'up' : 'neutral'}
              accentColor="violet"
              sparkData={mentorSpark}
              onClick={onOpenMentorshipClinic}
            />
          </div>

          {/* Asymmetric Bento Grid (lg:grid-cols-12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            
            {/* Left Bento Span (7 Cols): Carta Recharts Analitik Jualan Interaktif */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/75 backdrop-blur-md shadow-sm overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200/80 dark:border-zinc-800 py-4.5 px-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Analitik Aliran Jualan Kiosk
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Transaksi tunai & DuitNow QR sebenar
                  </p>
                </div>

                {/* Chart Mode + Period Selector Tabs */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setChartMode('area')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        chartMode === 'area'
                          ? 'bg-slate-800 dark:bg-zinc-700 text-white'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Grafik
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('bar')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        chartMode === 'bar'
                          ? 'bg-slate-800 dark:bg-zinc-700 text-white'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Bar
                    </button>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('weekly')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        salesPeriod === 'weekly'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Mingguan
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('monthly')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        salesPeriod === 'monthly'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Bulanan
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesPeriod('quarterly')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        salesPeriod === 'quarterly'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Suku
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content Area */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                
                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-zinc-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">Terkumpul</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      RM {periodTotal.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">Purata/Tempoh</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      RM {periodAvg.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">Puncak</span>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                      RM {periodMax.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Interactive Recharts Chart */}
                <div className="relative pt-2 pb-2">
                  {periodMax === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center text-center bg-slate-50/70 dark:bg-zinc-950/60 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 px-4">
                      <BarChart3 className="w-7 h-7 text-slate-300 dark:text-zinc-600 mb-2" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tiada Rekod Jualan Dalam Tempoh Ini</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                        Rekod jualan harian di tab Buku Tunai untuk memaparkan graf prestasi sebenar.
                      </p>
                    </div>
                  ) : (
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartMode === 'area' ? (
                          <AreaChart data={chartBars} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                            <defs>
                              <linearGradient id="beliaSalesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0284C7" stopOpacity={0.38} />
                                <stop offset="100%" stopColor="#0284C7" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `RM${val}`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload as { label: string; value: number; tx: number; qr: number };
                                  return (
                                    <div className="px-3 py-2 rounded-xl bg-zinc-900/95 text-white text-[11px] font-mono shadow-xl border border-zinc-700">
                                      <div className="text-zinc-400 text-[10px] mb-0.5">{d.label}</div>
                                      <div className="font-bold text-sky-300">RM {d.value.toLocaleString()}</div>
                                      <div className="text-[10px] text-zinc-300 mt-0.5">{d.tx} rekod · {d.qr}% DuitNow QR</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#0284C7"
                              strokeWidth={2.5}
                              fill="url(#beliaSalesGradient)"
                              activeDot={{ r: 5, fill: '#0EA5E9', stroke: '#FFFFFF', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        ) : (
                          <BarChart data={chartBars} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `RM${val}`}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload as { label: string; value: number; tx: number; qr: number };
                                  return (
                                    <div className="px-3 py-2 rounded-xl bg-zinc-900/95 text-white text-[11px] font-mono shadow-xl border border-zinc-700">
                                      <div className="text-zinc-400 text-[10px] mb-0.5">{d.label}</div>
                                      <div className="font-bold text-sky-300">RM {d.value.toLocaleString()}</div>
                                      <div className="text-[10px] text-zinc-300 mt-0.5">{d.tx} rekod · {d.qr}% DuitNow QR</div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" fill="#0284C7" radius={[6, 6, 0, 0]} maxBarSize={38} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Footer notes & Cashflow shortcut */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span className="text-[11px] truncate">Buku Tunai Transaksi Sah</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cashflow')}
                    className="text-sky-700 dark:text-sky-400 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Buka Rekod</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Right Bento Span (5 Cols): Penjejak Permohonan + Ringkasan Aktiviti */}
            <div className="lg:col-span-5 space-y-5 sm:space-y-6">

            {/* Card A: Stepper Penjejak Permohonan Berperingkat */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/75 backdrop-blur-md shadow-sm overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 py-4.5 px-5 sm:px-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      Penjejak Permohonan
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Status semakan semasa PBT & UMK
                  </p>
                </div>

                <span className="font-mono text-[11px] font-bold text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                  {primaryBooking ? primaryBooking.slotCode : hasBusiness ? 'PROFIL-AKTIF' : 'BELUM-MOHON'}
                </span>
              </div>

              {/* Stepper Timeline Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                
                {/* 5-Step Vertical Stepper */}
                <div className="space-y-3">
                  {stepperItems.map((stepItem, idx) => {
                    const isCompleted = stepItem.status === 'completed';
                    const isCurrent = stepItem.status === 'current';
                    const isSelected = selectedStepperIndex === idx;

                    return (
                      <div 
                        key={stepItem.step}
                        onClick={() => setSelectedStepperIndex(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-slate-900 border-sky-300 dark:border-sky-700 shadow-xs'
                            : 'border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Node Icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-amber-500 text-white ring-2 ring-amber-100 dark:ring-amber-950/60'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepItem.step}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <h5 className={`text-xs font-bold truncate ${
                                isCurrent ? 'text-sky-700 dark:text-sky-400' : 'text-slate-800 dark:text-white'
                              }`}>
                                {stepItem.title}
                              </h5>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : isCurrent
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
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
                              <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed animate-in fade-in duration-150">
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
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (approvedBooking && onViewOfferLetter) {
                        onViewOfferLetter(approvedBooking);
                      } else {
                        setActiveTab('bookings');
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                    <span>Surat Tawaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Urus Kiosk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Card B: Pusat Notifikasi & Tindakan Segera Usahawan */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/75 backdrop-blur-md shadow-sm overflow-hidden transition-colors flex flex-col">
              
              {/* Card Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 py-4.5 px-5 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      Ringkasan Aktiviti & Tindakan
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  {liveAlerts.length} Rekod
                </span>
              </div>

              {/* Live Alert Items */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {liveAlerts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-center">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Mulakan Langkah Usahawan Anda
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Lengkapkan profil perniagaan, tempah klinik bimbingan mentor, atau laporkan sebarang aduan fasiliti kiosk anda.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        {onOpenMentorshipClinic && (
                          <button
                            type="button"
                            onClick={onOpenMentorshipClinic}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold cursor-pointer"
                          >
                            Klinik Mentor
                          </button>
                        )}
                        {onOpenMaintenanceModal && (
                          <button
                            type="button"
                            onClick={onOpenMaintenanceModal}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold cursor-pointer"
                          >
                            Aduan Fasiliti
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    liveAlerts.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        onClick={item.action}
                        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 ${
                          item.action ? 'cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${item.tagColor}`}>{item.tag}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {item.title}
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Action Shortcuts */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => (onOpenSettingsTab ? onOpenSettingsTab() : setActiveTab('card'))}
                    className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-sky-50 dark:hover:bg-zinc-700 transition-all text-center cursor-pointer"
                  >
                    Tetapan Akaun
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all text-center cursor-pointer"
                  >
                    Urus Produk
                  </button>
                </div>

              </div>

            </div>

            </div>

          </div>

        </div>
        );
      })()}

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden w-full transition-colors">
          {/* Card Header */}
          <div className="kbelia-important-header border-b border-slate-200 dark:border-slate-700 py-4.5 px-6 sm:px-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                  Maklumat Asas & Jenama Perniagaan
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
                  Nama Perniagaan: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama perniagaan anda"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
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
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* 2-Column Row 2: Kategori + Jajahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Kategori Perniagaan: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Jajahan Operasi: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
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
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Nombor WhatsApp Bisnes: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nombor telefon"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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

            {/* Action Buttons Footer */}
            <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Katalog Menu & Produk Anda</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Pelanggan boleh membuat pesanan terus melalui WhatsApp.</p>
            </div>

            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="py-2.5 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Daftar Produk Baharu</span>
            </button>
          </div>

          {/* Add Product Form Box */}
          {showAddProduct && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden animate-in fade-in transition-colors">
              <div className="kbelia-important-header border-b border-slate-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-700 dark:text-sky-400" />
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
                      Nama Produk: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama produk anda"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Harga Jualan (RM): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.10"
                      required
                      placeholder="0.00"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                      className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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

                {/* Action Buttons Footer */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
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
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Produk Disenaraikan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tekan butang di atas untuk memasukkan produk pertama anda.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex gap-3 items-center justify-between transition-colors"
                >
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-50 dark:bg-slate-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate">{prod.name}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{prod.category}</p>
                    <div className="text-xs font-extrabold text-sky-700 dark:text-sky-400 mt-1">
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
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Rekod Permohonan Kapsul Niaga Anda</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Status semakan dan peruntukan kiosk oleh pihak pengurusan hub.</p>
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
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer interactive-press"
            >
              <Building2 className="w-4 h-4" />
              <span>Mohon Slot Kapsul</span>
            </button>
          </div>

          {safeBookings.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tiada Permohonan Kapsul</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Anda belum memohon sewaan slot kapsul niaga belia.</p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenBookingModal) onOpenBookingModal();
                  else if (onOpenBookingTab) onOpenBookingTab();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer interactive-press"
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
                  className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {b.slotCode}
                        </span>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">{b.slotName}</h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {b.hubLocation} • Tempoh: <strong>{b.durationMonths} Bulan</strong> • Mula: <strong>{formatDisplayDate(b.startDate)}</strong> • Akhir: <strong className="text-sky-700 dark:text-sky-400">{calculateOperationEndDate(b.startDate, b.durationMonths)}</strong>
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {b.status === 'pending' && (
                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Dalam Semakan Urusetia
                        </span>
                      )}
                      {b.status === 'approved' && (
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Permohonan Diluluskan
                        </span>
                      )}
                      {b.status === 'rejected' && (
                        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-full text-xs font-bold flex items-center gap-1.5 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          Tidak Berjaya
                        </span>
                      )}
                    </div>
                  </div>

                  {b.adminNotes && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-white block mb-0.5">Arahan & Catatan Urusetia Pentadbir:</span>
                      <p>{b.adminNotes}</p>
                    </div>
                  )}

                  {/* ACTION BUTTONS TOOLBAR */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                    
                    {/* 1. Official Receipt */}
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(b)}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Cetak atau muat turun resit bayaran rasmi"
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                      <span>Resit Rasmi Bayaran</span>
                    </button>

                    {/* 2. Offer Letter */}
                    {b.status === 'approved' && onViewOfferLetter && (
                      <button
                        type="button"
                        onClick={() => onViewOfferLetter(b)}
                        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-100" />
                        <span>Surat Tawaran</span>
                      </button>
                    )}

                    {/* 3. Tenancy Agreement */}
                    {b.status === 'approved' && onOpenTenancyAgreement && (
                      <button
                        type="button"
                        onClick={() => onOpenTenancyAgreement(b)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-sky-600" />
                        <span>Sahkan Lesen QR</span>
                      </button>
                    )}

                    {/* 5. Contact Hub Officer (WhatsApp) */}
                    <a
                      href={`https://wa.me/601120508890?text=${encodeURIComponent(`Salam Urusetia KBelia Kelantan, saya ingin membuat pertanyaan mengenai permohonan kiosk slot ${b.slotCode} (${b.slotName}) bagi perniagaan ${b.businessName}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Lapor kerosakan lampu/elektrik/pintu kiosk"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Aduan Kiosk</span>
                    </button>

                    {/* 7. Cancel Pending Booking (Inline React Confirm Modal) */}
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelBooking(b)}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
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

          {/* Existing Maintenance Tickets List */}
          {safeTickets.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Tiket Aduan Fasiliti Anda ({safeTickets.length})</span>
                </h4>
                {onOpenMaintenanceModal && (
                  <button
                    type="button"
                    onClick={onOpenMaintenanceModal}
                    className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    + Aduan Baharu
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {safeTickets.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-white truncate">
                        {t.slotCode} · {t.issueCategory}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : t.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {t.status === 'resolved' ? 'Selesai' : t.status === 'in_progress' ? 'Sedang Dibaiki' : 'Diterima'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CANCEL CONFIRMATION MODAL */}
          {confirmCancelBooking && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Batalkan Permohonan Slot?
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Adakah anda pasti ingin membatalkan permohonan slot <span className="font-mono font-bold">{confirmCancelBooking.slotCode}</span> ({confirmCancelBooking.slotName})?
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={cancellingBooking}
                    onClick={() => setConfirmCancelBooking(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={cancellingBooking}
                    onClick={async () => {
                      try {
                        setCancellingBooking(true);
                        await updateBookingStatus(confirmCancelBooking.id, 'rejected', 'Permohonan dibatalkan oleh usahawan.');
                        showToast({
                          type: 'info',
                          title: 'Permohonan Dibatalkan',
                          message: `Permohonan slot ${confirmCancelBooking.slotCode} telah dibatalkan.`
                        });
                        setConfirmCancelBooking(null);
                        onRefresh();
                      } catch {
                        showToast('Gagal membatalkan permohonan. Sila cuba lagi.', 'error');
                      } finally {
                        setCancellingBooking(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                  >
                    {cancellingBooking ? 'Memproses...' : 'Ya, Batalkan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 1: OFFICIAL RECEIPT (RESIT RASMI BAYARAN KBELIA) */}
          {selectedReceiptBooking && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-white">
                
                {/* Receipt Header */}
                <div className="p-5 kbelia-important-header border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shadow-xs">
                      <span className="text-base font-black">KB</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wide text-slate-800 dark:text-white">Resit Rasmi Bayaran Subsidi Kiosk</h4>
                      <p className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold">Urusetia Pembangunan Keusahawanan Belia Kelantan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptBooking(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 space-y-4 text-xs">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">No. Rujukan Resit</span>
                      <span className="font-mono font-extrabold text-sm text-sky-800 dark:text-sky-400">
                        REC-{selectedReceiptBooking.slotCode}-{selectedReceiptBooking.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Tarikh Permohonan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDisplayDate(selectedReceiptBooking.createdAt?.split('T')[0])}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Nama Usahawan:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedReceiptBooking.applicantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Jenama Perniagaan:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedReceiptBooking.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Kapsul Diperuntukkan:</span>
                      <span className="font-bold text-sky-800 dark:text-sky-400">{selectedReceiptBooking.slotCode} ({selectedReceiptBooking.slotName})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Lokasi Hab:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReceiptBooking.hubLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Tempoh Perjanjian:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReceiptBooking.durationMonths} Bulan ({formatDisplayDate(selectedReceiptBooking.startDate)} hingga {calculateOperationEndDate(selectedReceiptBooking.startDate, selectedReceiptBooking.durationMonths)})</span>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {(() => {
                    const rate = Number(selectedReceiptBooking.monthlyRate || 150);
                    return (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Keterangan Urusniaga</th>
                          <th className="p-3 text-right">Jumlah (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        <tr>
                          <td className="p-3 font-medium">Yuran Komitmen Sewaan Kiosk Modular Subsidi Belia (Sebulan)</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">{rate.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Deposit Kebersihan & Keselamatan Utiliti Elektrik 13A</td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">50.00</td>
                        </tr>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">
                          <td className="p-3">Subsidi Kerajaan Negeri Kelantan (Kadar Khas)</td>
                          <td className="p-3 text-right font-mono tabular-nums">-50.00</td>
                        </tr>
                        <tr className="bg-sky-600 text-white font-extrabold text-sm">
                          <td className="p-3">JUMLAH DIBAYAR</td>
                          <td className="p-3 text-right font-mono tabular-nums text-sky-50">RM {rate.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                    );
                  })()}

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Status Transaksi: Berjaya & Sah Diperakui Sistem Perakaunan Bersepadu KBelia.</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-sky-100" />
                      <span>Cetak Salinan Resit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(null)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
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
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-white">
                <div className="p-5 kbelia-important-header dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Borang Aduan Fasiliti Kiosk</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300">Slot {maintenanceComplaintBooking.slotCode} • {maintenanceComplaintBooking.hubLocation}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceComplaintBooking(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                          showToast({
                            type: 'success',
                            title: 'Aduan Fasiliti Diterima',
                            message: `Tiket ${created.id} telah dihantar ke Urusetia Hub.`
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
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Jenis Kerosakan / Isu Fasiliti: *
                        </label>
                        <select
                          value={complaintType}
                          onChange={(e) => setComplaintType(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMaintenanceComplaintBooking(null)}
                          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingComplaint}
                          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
        <div className="mt-6 max-w-xl mx-auto bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
            <span>Kad Profil Usahawan Belia Kelantan</span>
          </div>

          <div className="space-y-2">
            <img
              src={myBusiness?.logoUrl || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
              alt=""
              className="w-20 h-20 rounded-2xl mx-auto border-2 border-slate-200 dark:border-slate-700 object-cover bg-white"
            />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{myBusiness?.businessName || 'Nama Bisnes Belia'}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{myBusiness?.tagline || 'Inisiatif Usahawan Muda Kelantan'}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-700 dark:text-slate-200 text-left">
            <div className="flex justify-between"><span>Jajahan:</span> <span className="font-bold text-slate-900 dark:text-white">{myBusiness?.district || 'Kota Bharu'}</span></div>
            <div className="flex justify-between"><span>Kategori:</span> <span className="font-bold text-slate-900 dark:text-white">{myBusiness?.category || 'F&B'}</span></div>
            <div className="flex justify-between"><span>WhatsApp:</span> <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{myBusiness?.whatsapp || userProfile?.phone || '-'}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Sokong perniagaan ${myBusiness?.businessName || 'Usahawan Belia'} di Portal KBelia Kelantan: ${window.location.origin}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kongsi ke WhatsApp</span>
            </a>
          </div>
        </div>
      )}

    </div>
  );
};
