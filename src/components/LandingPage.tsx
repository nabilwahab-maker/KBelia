import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown, 
  LogIn, 
  Globe, 
  Play,
  Pause,
  Clock,
  Star,
  Zap,
  Wifi,
  XCircle,
  TrendingUp,
  BookOpen,
  Users,
  FileText,
  UserCheck,
  Send,
  Video,
  Mail,
  Phone,
  X,
  ExternalLink,
  Briefcase,
  HelpCircle,
  Check,
  Shield,
  Layers,
  ShoppingBag,
  Sun,
  Moon
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { CapsuleSlot, BusinessListing, YouthProgram, KelantanDistrict } from '../types';
import { INITIAL_CAPSULE_SLOTS } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  setActiveTab: (tab: UMKTab) => void;
  slots: CapsuleSlot[];
  businesses: BusinessListing[];
  programs: YouthProgram[];
  onSelectSlot: (slot: CapsuleSlot) => void;
  onSelectBusiness: (biz: BusinessListing) => void;
  onOpenNewBooking: () => void;
  onOpenGrantModal?: (title?: string, amount?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setActiveTab,
  slots,
  businesses,
  programs,
  onSelectSlot,
  onSelectBusiness,
  onOpenNewBooking,
  onOpenGrantModal
}) => {
  const { userProfile, openLoginModal } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, isDark, toggleTheme } = useTheme();
  const isBM = language === 'ms';
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const availableSlotsCount = slots.filter(s => s.status === 'available').length;

  // 5 Rich Visual Slides for the Automatic Moving Carousel (Maintained as original)
  const heroSlides = [
    {
      id: 'slide-1',
      title: 'Kapsul Niaga Modular Pintar 2026',
      subtitle: 'Hab Kapsul Keusahawanan Zon Bachok & Kota Bharu',
      description: 'Kiosk kontena pasang-siap moden dilengkapi kemudahan palam elektrik 13A, Wi-Fi 500Mbps dan sistem keselamatan berpusat dengan kadar sewa subsidi serendah RM12/hari.',
      badge: 'Slot Sedia Diduduki',
      badgeColor: 'bg-emerald-500 text-white',
      location: 'Hab UMK Bachok & KB Sentral',
      imageUrl: '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg',
      stat: '10 Kapsul Tersedia',
      ctaText: 'Log Masuk & Mohon Sewa',
      onAction: () => setActiveTab('login')
    },
    {
      id: 'slide-2',
      title: 'Batik Belia Kontemporari & Streetwear',
      subtitle: 'Koleksi Fesyen Graduan Muda — Nur Syafiqah (Kota Bharu)',
      description: 'Inovasi kraftangan canting batik tempatan berwajah segar dengan motif flora moden pada kemeja cuban dan totebag kanvas yang menembusi pasaran eksport.',
      badge: 'Usahawan Pilihan Belia',
      badgeColor: 'bg-amber-500 text-slate-950',
      location: 'Zon Seni & Warisan Kota Bharu',
      imageUrl: '/src/assets/images/avatar_youth_female_1793924250745.jpg',
      stat: 'Penilaian 4.8 ★ (38 Ulasan)',
      ctaText: 'Log Masuk & Lihat Direktori',
      onAction: () => setActiveTab('login')
    },
    {
      id: 'slide-3',
      title: 'Kafe Artisan & Masakan Warisan Moden',
      subtitle: "D'Kelate Artisan Coffee & Akok Leleh — Ahmad Faizul",
      description: 'Kombinasi kopi barista espresso dengan pencuci mulut tradisi seperti Akok Tart dan Kopi Nissem Melaka yang kini beroperasi aktif di kiosk inkubator belia.',
      badge: 'F&B Pilihan Ramai',
      badgeColor: 'bg-red-600 text-white',
      location: 'Hab Kapsul Niaga Bachok',
      imageUrl: '/src/assets/images/product_kelantan_delights_1793924253401.jpg',
      stat: '42+ Ulasan Pelanggan',
      ctaText: 'Log Masuk & Teroka Produk',
      onAction: () => setActiveTab('login')
    },
    {
      id: 'slide-4',
      title: 'Studio Multimedia & Kreatif Digital Belia',
      subtitle: 'Studio Belia Multimedia KB — Harith Yusoff',
      description: 'Pusat fotografi komersil, penjenamaan jenama usahawan mikro, dan siaran langsung TikTok Shop yang didanai melalui program inkubasi keusahawanan KBELIA.',
      badge: 'Penerima Dana Benih',
      badgeColor: 'bg-blue-600 text-white',
      location: 'Pusat Transformasi Belia KB',
      imageUrl: '/src/assets/images/avatar_youth_male_1793924250192.jpg',
      stat: 'Pembiayaan Diluluskan',
      ctaText: 'Log Masuk & Maklumat Skim',
      onAction: () => setActiveTab('login')
    },
    {
      id: 'slide-5',
      title: 'Rangkaian Pasaran Komuniti 10 Jajahan',
      subtitle: 'Peluang Saksama Usahawan Bandar Hingga Luar Bandar',
      description: 'Menghubungkan ekosistem peniaga belia dari Kota Bharu, Pasir Mas, Tumpat, Machang, Jeli hingga Gua Musang dalam satu gerbang keusahawanan bersepadu.',
      badge: 'Liputan Seluruh Negeri',
      badgeColor: 'bg-purple-600 text-white',
      location: '10 Jajahan Kelantan',
      imageUrl: '/src/assets/images/banner_kelantan_landmark_1793924253242.jpg',
      stat: '10 Jajahan Berhubung',
      ctaText: 'Log Masuk & Semak Lokasi',
      onAction: () => setActiveTab('login')
    }
  ];

  // Automatic slide rotation (moves automatically every 3.8 seconds)
  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isHovered, heroSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Continuous auto-moving horizontal photo strip cards (Maintained as original)
  const movingPhotoCards = [
    {
      img: '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg',
      title: "Kapsul F&B A1",
      subtitle: "D'Kelate Artisan Coffee",
      tag: 'RM15/hari',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      location: 'Bachok',
      type: 'Kiosk Sedia Ada'
    },
    {
      img: '/src/assets/images/avatar_youth_female_1793924250745.jpg',
      title: 'Batik Belia Kontemporari',
      subtitle: 'Fesyen & Kraf Moden',
      tag: 'Rating 4.8 ★',
      tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
      location: 'Kota Bharu',
      type: 'Kraf & Fesyen'
    },
    {
      img: '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg',
      title: 'Kapsul Niaga KB Sentral B1',
      subtitle: 'Ruang Komersil Smart Pod',
      tag: 'RM20/hari',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      location: 'Kota Bharu',
      type: 'Kiosk Komersil'
    },
    {
      img: '/src/assets/images/avatar_youth_male_1793924250192.jpg',
      title: 'Studio Multimedia KB',
      subtitle: 'Fotografi & TikTok Ads',
      tag: 'Dana Benih',
      tagColor: 'bg-blue-100 text-blue-900 border-blue-300',
      location: 'Kota Bharu',
      type: 'Servis Digital'
    },
    {
      img: '/src/assets/images/banner_kelantan_landmark_1793924253242.jpg',
      title: 'Kapsul Fesyen A2',
      subtitle: 'Boutique Pod Modular',
      tag: 'RM12/hari',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      location: 'Bachok',
      type: 'Kiosk Butik'
    },
    {
      img: '/src/assets/images/product_kelantan_delights_1793924253401.jpg',
      title: 'Akok Tart & Kopi Nissem',
      subtitle: 'Pastri & Minuman Warisan',
      tag: 'F&B Pilihan',
      tagColor: 'bg-rose-100 text-rose-900 border-rose-300',
      location: 'Bachok',
      type: 'Inkubasi F&B'
    },
    {
      img: '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg',
      title: 'Kapsul Agrotek C1',
      subtitle: 'Hub Komuniti Keusahawanan',
      tag: 'RM14/hari',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      location: 'Jeli',
      type: 'Produk Agro'
    },
    {
      img: '/src/assets/images/banner_kelantan_landmark_1793924253242.jpg',
      title: 'Kapsul Warisan & Kraf D1',
      subtitle: 'Hub Pelancongan Sri Tujoh',
      tag: 'RM12/hari',
      tagColor: 'bg-purple-100 text-purple-900 border-purple-300',
      location: 'Tumpat',
      type: 'Kraf Tradisi'
    }
  ];

  // All FAQs including checklist additions
  const faqs = [
    {
      q: 'Siapakah yang layak menyewa Kapsul Niaga KBELIA?',
      a: 'Warganegara Malaysia berumur 18 hingga 40 tahun yang bermastautin atau menjalankan perniagaan di negeri Kelantan layak memohon. Keutamaan diberikan kepada usahawan belia baharu yang memerlukan tapak permulaan berniaga.'
    },
    {
      q: 'Berapakah kadar sewaan harian dan tempoh minimum?',
      a: 'Kadar sewaan berpatutan bermula dari RM12 hingga RM25 sehari bergantung kepada lokasi jajahan dan jenis kiosk. Tempoh sewaan fleksibel boleh dimohon dari 3 hari, mingguan sehingga 3 bulan dengan kemudahan elektrik dan Wi-Fi sedia ada.'
    },
    {
      q: 'Bagaimanakah cara mendaftarkan produk dalam Direktori Usahawan?',
      a: 'Daftar akaun percuma melalui pautan "Log Masuk / Daftar Usahawan", kemudian lengkapkan profil perniagaan anda di Portal Usahawan untuk mula mempamerkan produk terus kepada umum.'
    },
    {
      q: 'Adakah pemohon geran dan bantuan perlu mempunyai premis tetap?',
      a: 'Tidak semestinya. Skim Dana Benih dan Inkubasi Belia terbuka kepada perniagaan dari rumah, kiosk bergerak, serta perniagaan digital asalkan mempunyai perancangan perniagaan yang jelas.'
    },
    {
      q: 'Bagaimanakah proses semakan dan kelulusan Geran Dana Benih KBELIA?',
      a: 'Permohonan geran disemak secara digital melalui sistem penjejak (Grant Tracker). Selepas permohonan dihantar, panel urusetia negeri akan membuat penilaian dalam tempoh 7-14 hari bekerja dan pemohon boleh memantau status secara langsung dalam papan pemuka.'
    },
    {
      q: 'Bolehkah saya mendapatkan bimbingan mentor industri secara percuma?',
      a: 'Ya, semua usahawan belia berdaftar di portal KBELIA layak menyertai sesi padanan mentor perniagaan (Mentorship Hub) dan bengkel akademi keusahawanan secara percuma tanpa sebarang caj tersembunyi.'
    },
    {
      q: 'Adakah platform ini membantu pendaftaran SSM dan pematuhan lesen?',
      a: 'Benar. Kami menyediakan panduan pematuhan (Compliance & SSM Guide) lengkap dengan pautan integrasi SSM, panduan sijil Halal JAKIM, dan permohonan lesen PBT 10 jajahan.'
    }
  ];

  const activeSlideData = heroSlides[currentSlide];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  return (
    <div id="kbelia-landing-root" className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1329] bg-songket-pattern text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-600 selection:text-white transition-colors duration-200">
      
      {/* 2. LANDING NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#F4F1EA]/92 dark:bg-[#0B1329]/92 backdrop-blur border-b border-[#E0DBD0] dark:border-[#1E3158] shadow-xs transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 via-red-800 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              <span className="text-amber-300">K</span>
              <span>B</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-red-950 dark:text-white">KBELIA</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-300 rounded border border-red-200 dark:border-red-900/60 uppercase">
                  Kelantan
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {isBM ? 'Portal Keusahawanan & Kapsul Niaga Belia' : 'Youth Entrepreneurship & Modular Kiosk Portal'}
              </p>
            </div>
          </div>

          {/* Quick Nav Anchors to Landing Sections */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#hero" className="hover:text-red-700 dark:hover:text-amber-400 transition-colors">{isBM ? 'Utama' : 'Home'}</a>
            <a href="#kiosk" className="hover:text-red-700 dark:hover:text-amber-400 transition-colors">{isBM ? 'Kiosk Modular' : 'Modular Kiosks'}</a>
            <a href="#direktori" className="hover:text-red-700 dark:hover:text-amber-400 transition-colors">{isBM ? 'Direktori Usahawan' : 'Directory'}</a>
            <a href="#inisiatif" className="hover:text-red-700 dark:hover:text-amber-400 transition-colors">{isBM ? 'Inisiatif Teras' : 'Initiatives'}</a>
            <a href="#faq" className="hover:text-red-700 dark:hover:text-amber-400 transition-colors">{isBM ? 'Soalan Lazim' : 'FAQ'}</a>
          </nav>

          {/* Actions: Mod Gelap/Cerah, Penukar Bahasa (BM|EN), Butang Daftar, Butang Log Masuk */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Animated Dark Mode Switcher (Rotating Sun/Moon Icon matching Dashboard) */}
            <button
              id="landing-darkmode-toggle"
              type="button"
              onClick={toggleTheme}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all duration-300 cursor-pointer shadow-2xs group focus:outline-none interactive-press hover:scale-105 active:scale-95"
              title={isDark ? (isBM ? "Tukar ke Mod Cerah" : "Switch to Light Mode") : (isBM ? "Tukar ke Mod Gelap" : "Switch to Dark Mode")}
              aria-label="Tukar tema sistem"
            >
              <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                {/* Sun Icon (Visible in Light Mode) */}
                <Sun
                  className={`w-4 h-4 text-amber-500 absolute transition-all duration-500 ease-out transform ${
                    isDark 
                      ? 'rotate-90 scale-0 opacity-0 pointer-events-none' 
                      : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                {/* Moon Icon (Visible in Dark Mode) */}
                <Moon
                  className={`w-4 h-4 text-amber-400 absolute transition-all duration-500 ease-out transform ${
                    isDark 
                      ? 'rotate-0 scale-100 opacity-100' 
                      : '-rotate-90 scale-0 opacity-0 pointer-events-none'
                  }`}
                />
              </div>
              <span className="sr-only">{isDark ? 'Mod Gelap Aktif' : 'Mod Cerah Aktif'}</span>
            </button>

            {/* Penukar Bahasa Global */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('ms')}
                className={`px-2 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                  isBM ? 'bg-red-700 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Bahasa Melayu (Rasmi)"
              >
                BM
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                  !isBM ? 'bg-red-700 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="English (International)"
              >
                EN
              </button>
            </div>

            {/* Butang Daftar */}
            <button
              type="button"
              id="landing-register-nav-btn"
              onClick={() => setActiveTab('register')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer interactive-press interactive-lift group"
            >
              <Users className="w-3.5 h-3.5 text-red-700 dark:text-red-400 transition-transform duration-200 group-hover:scale-110" />
              <span>{isBM ? 'Daftar' : 'Register'}</span>
            </button>

            {/* Butang Log Masuk */}
            <button
              type="button"
              id="landing-login-btn"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer interactive-press interactive-lift group"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300 transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>{isBM ? 'Log Masuk' : 'Log In'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION PRESTIJ TEMA KELANTAN & CAROUSEL VISUAL */}
      <section id="hero" className="relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-gradient-to-b from-[#ECE7DC] via-[#F4F1EA] to-[#ECE7DC] dark:from-[#080E1E] dark:via-[#0B1329] dark:to-[#0F1C3B] text-slate-900 dark:text-slate-100 transition-colors bg-songket-pattern">
        
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.14),transparent_100%)] pointer-events-none" />

        <div className="relative max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-6">
          
          {/* Headline & Subhead */}
          <div className="max-w-4xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] animate-fade-slide-up">
              {isBM 
                ? 'Platform Bersepadu Usahawan Belia Kelantan Berniaga & Berkembang'
                : 'Integrated Platform for Kelantan Youth Entrepreneurs to Trade & Grow'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              {isBM
                ? 'Sewa kios pintar modular, pameran produk tempatan di Direktori Negeri, dan mohon geran pembiayaan keusahawanan dalam satu gerbang rasmi.'
                : 'Rent smart modular kiosks across 10 districts, showcase local products in the state digital directory, and access entrepreneur grants in one official portal.'}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* PAMERAN GAMBAR BERGERAK AUTOMATIK (HERO CAROUSEL WITH AUTO-SLIDE) */}
          {/* ========================================================================= */}
          <div 
            id="sorotan-gambar"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="pt-6 w-full mx-auto text-left relative"
          >
            {/* Carousel Frame Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-slate-200/90 bg-slate-950 text-white group">
              
              {/* Background Slide Image with Fade Animation */}
              <div className="relative h-[420px] sm:h-[520px] lg:h-[580px] w-full overflow-hidden">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'
                    }`}
                  >
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Deep gradient overlay for extreme text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/20" />
                  </div>
                ))}
              </div>

              {/* Top Controls Bar within Slide */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${activeSlideData.badgeColor}`}>
                    {activeSlideData.badge}
                  </span>
                  <span className="text-white/60 text-[11px] hidden sm:inline">|</span>
                  <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activeSlideData.location}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                  <button
                    type="button"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    title={isAutoPlaying ? "Jeda gambar bergerak" : "Mainkan gambar bergerak"}
                    className="p-1 text-white hover:text-amber-400 transition-colors"
                  >
                    {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[10px] text-white/70 font-mono font-bold pr-1">
                    {currentSlide + 1} / {heroSlides.length}
                  </span>
                </div>
              </div>

              {/* Prev / Next Arrow Navigation */}
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                title="Gambar Sebelum"
              >
                <ChevronLeft className="w-5 h-5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                title="Gambar Seterusnya"
              >
                <ChevronRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>

              {/* Bottom Content Overlay for Current Slide */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20 space-y-3">
                <div className="max-w-2xl space-y-1.5">
                  <div className="text-amber-400 text-xs sm:text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>{activeSlideData.subtitle}</span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                    {activeSlideData.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                    {activeSlideData.description}
                  </p>
                </div>

                {/* Actions & Interactive Slide Selectors */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={activeSlideData.onAction}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer interactive-press interactive-lift group"
                    >
                      <span>{activeSlideData.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                    <span className="text-xs text-white/80 font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                      {activeSlideData.stat}
                    </span>
                  </div>

                  {/* Dot / Slide Selectors */}
                  <div className="flex items-center gap-2">
                    {heroSlides.map((slide, i) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setCurrentSlide(i)}
                        className={`transition-all duration-300 h-2.5 rounded-full cursor-pointer hover:scale-110 active:scale-95 ${
                          i === currentSlide 
                            ? 'w-8 bg-amber-400 shadow-xs' 
                            : 'w-2.5 bg-white/40 hover:bg-white/70'
                        }`}
                        title={`Slide ${i + 1}: ${slide.title}`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Progress Line Indicator at bottom edge */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${((currentSlide + 1) / heroSlides.length) * 100}%` }}
                />
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* STATISTIK IMPAK (SOCIAL PROOF) */}
          {/* ========================================================================= */}
          <div className="pt-6 w-full mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-amber-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono transition-transform duration-200 group-hover:scale-105 origin-left">10</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Jajahan Liputan' : 'Districts'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isBM ? 'Seluruh Kelantan' : 'Statewide'}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-emerald-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono transition-transform duration-200 group-hover:scale-105 origin-left">{slots.length}</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Kiosk Modular' : 'Modular Kiosks'}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 font-bold font-mono">{availableSlotsCount} {isBM ? 'slot sedia' : 'slots ready'}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-amber-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono transition-transform duration-200 group-hover:scale-105 origin-left">500+</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Usahawan Belia' : 'Entrepreneurs'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isBM ? 'Berdaftar aktif' : 'Active Registered'}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-amber-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono transition-transform duration-200 group-hover:scale-105 origin-left">RM2.4M</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Dana Disalurkan' : 'Grants Disbursed'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isBM ? 'Geran & pembiayaan' : 'Seed funding'}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-blue-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono transition-transform duration-200 group-hover:scale-105 origin-left">35+</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Mentor Industri' : 'Mentors'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isBM ? 'Bimbingan berkala' : 'Industry Mentors'}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left shadow-sm backdrop-blur hover:border-emerald-400/50 hover:bg-slate-900/90 transition-all duration-300 interactive-lift cursor-default group">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono transition-transform duration-200 group-hover:scale-105 origin-left">94.8%</div>
              <div className="text-xs font-bold text-white mt-0.5">{isBM ? 'Kadar Kejayaan' : 'Success Rate'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isBM ? 'Inkubasi perniagaan' : 'Business incubation'}</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3B. REEL GAMBAR BERGERAK BERTERUSAN (CONTINUOUS HORIZONTAL MARQUEE TICKER) */}
      {/* ========================================================================= */}
      <section className="py-6 bg-slate-900 text-white overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-amber-300">
              Galeri Bergerak: Kiosk Kapsul & Produk Usahawan Kelantan
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tatal secara berterusan • Halakan tetikus untuk berhenti
          </span>
        </div>

        {/* Marquee Track Container */}
        <div className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="animate-marquee-left flex gap-4 py-2">
            {/* Duplicated for seamless infinite looping */}
            {[...movingPhotoCards, ...movingPhotoCards].map((card, idx) => (
              <div
                key={`marquee-${idx}`}
                onClick={() => {
                  if (card.title.includes('Kapsul')) {
                    setActiveTab('academic');
                  } else {
                    setActiveTab('hepa');
                  }
                }}
                className="w-64 sm:w-72 shrink-0 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-md group hover:-translate-y-1"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-amber-400" />
                    <span>{card.location}</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shadow-xs ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-amber-300 uppercase">
                    {card.type}
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROBLEM VS SOLUTION (CHECKLIST ITEM 4) */}
      {/* ========================================================================= */}
      <section id="masalah-solusi" className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#FAF7F0]/85 dark:bg-[#0D1833]/90 bg-songket-pattern transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
              Analisis Cabaran & Transformasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Cabaran Tradisional vs. Penyelesaian Pintar KBELIA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Menghapuskan halangan utama yang dihadapi anak muda Kelantan untuk memulakan dan mengembangkan perniagaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Column 1: Cabaran Tradisional */}
            <div className="p-7 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-200 dark:border-rose-900/50">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-rose-950 dark:text-rose-200">Cabaran Lazim Belia</h3>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Kekangan memulakan bisnes tradisional</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Sewa Premis Kedai Terlalu Tinggi</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Deposit 3+1 bulan dan kos sewa ribuan ringgit membebankan modal pusingan awal.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Kekeliruan Pematuhan SSM & Lesen PBT</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Ketiadaan panduan berpusat menyukarkan pendaftaran syarikat dan kelulusan lesen.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Pasaran Terhad & Ketiadaan Direktori</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Sukar memperkenalkan produk tempatan ke luar jajahan tanpa sokongan platform pemasaran.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Tiada Mentor & Bimbingan Berterusan</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Berniaga secara sendirian tanpa nasihat usahawan berpengalaman berisiko tinggi gagal.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Birokrasi & Maklumat Geran Terpencar</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Sukar mengetahui skim dana benih dan semakan status pembiayaan memakan masa lama.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 2: Solusi Pintar KBELIA */}
            <div className="p-7 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-900/50">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-emerald-950 dark:text-emerald-200">Penyelesaian Bersepadu KBELIA</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Inovasi ekosistem keusahawanan negeri</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Kiosk Kapsul Modular Bersubsidi</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">Sewa serendah RM12-RM25/hari di zon strategik 10 jajahan lengkap elektrik 13A & WiFi.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Panduan Kepatuhan & SSM Bersepadu</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">Modul panduan langkah demi langkah mendaftar SSM, pensijilan halal, dan lesen perbandaran.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Direktori Pasaran Digital Terbuka</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">Pamerkan katalog produk terus kepada umum merentasi seluruh negeri dan pelanggan luar.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Hab Mentor & Akademi Kemahiran</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">Padanan mentor industri serta bengkel video TikTok Ads, fotografi, dan pengurusan kewangan.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Sistem Penjejak Geran & Pembiayaan</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">Semak status kelulusan Dana Benih Belia secara langsung dalam papan pemuka masa nyata.</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CIRI-CIRI UTAMA (CORE FEATURES - CHECKLIST ITEM 5) */}
      {/* ========================================================================= */}
      <section id="ciri-utama" className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#F4F1EA] dark:bg-[#0B1329] bg-songket-pattern transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
              Modul Pintar Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              5 Ciri Utama Memperkasakan Bisnes Belia
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Teknologi dan infrastruktur sokongan lengkap daripada analisis data hingga kepatuhan rasmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Business Analytics */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-red-300 dark:hover:border-red-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">1. Business Analytics & Reporting</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pantau rekod jualan harian, pengurusan inventori produk, serta jana laporan prestasi ringkas untuk kegunaan pembentangan kepada pelabur atau pembiaya.
              </p>
              <div className="pt-2 text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-1">
                <span>Grafik visual & eksport PDF</span>
              </div>
            </div>

            {/* Feature 2: Funding & Grant Tracker */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-300 dark:hover:border-amber-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">2. Funding & Grant Tracker</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Akses senarai skim Dana Benih Negeri, geran pendigitalan MDEC, dan pembiayaan mikro TEKUN/MARA lengkap dengan status semakan permohonan masa nyata.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <span>Semakan kelulusan tanpa birokrasi</span>
              </div>
            </div>

            {/* Feature 3: Mentorship & Networking */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">3. Mentorship & Networking Hub</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Padankan diri anda dengan mentor perniagaan berpengalaman, adakan sesi perkongsian industri, dan bina hubungan strategik dengan usahawan belia lain.
              </p>
              <div className="pt-2 text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1">
                <span>Sesi 1-ke-1 & bimbingan kumpulan</span>
              </div>
            </div>

            {/* Feature 4: Upskilling & Academy */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">4. Upskilling & Academy Module</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Modul latihan praktikal percuma merangkumi penstriman TikTok Shop Ads, fotografi produk komersil, penjenamaan jenama, dan literasi perakaunan ringkas.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <span>Sijil penyertaan keusahawanan</span>
              </div>
            </div>

            {/* Feature 5: Compliance & SSM Guide */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">5. Compliance & SSM Guide</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Panduan interaktif pendaftaran entiti perniagaan di SSM, panduan pematuhan cukai LHDN, permohonan pensijilan Halal JAKIM, dan lesen pihak berkuasa tempatan (PBT).
              </p>
              <div className="pt-2 text-xs font-bold text-purple-800 dark:text-purple-400 flex items-center gap-1">
                <span>Templat dokumen & senarai semak</span>
              </div>
            </div>

            {/* Feature 6: Kiosk Modular IoT Hub */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-red-300 dark:hover:border-red-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-slate-900 dark:text-amber-300 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">6. Modular Capsule IoT Hub</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sistem kunci digital pintar, pemantauan status penggunaan kiosk secara atas talian, serta sokongan teknikal bersepadu bagi penyewa kiosk modular 10 jajahan.
              </p>
              <div className="pt-2 text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1">
                <span>Pengurusan sewaan automatik</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LANGKAH BERMULA (HOW IT WORKS - CHECKLIST ITEM 6) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#FAF7F0]/85 dark:bg-[#0D1833]/90 bg-songket-pattern transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
              Proses Mudah 4-Langkah
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Langkah Demi Langkah Mula Berniaga
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sertai komuniti KBELIA dengan proses pendaftaran pantas tanpa bayaran pendaftaran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161D26] border border-slate-200 dark:border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                1
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Daftar Akaun Belia</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cipta akaun percuma menggunakan emel atau Google. Akses terbuka kepada semua warganegara belia Kelantan.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161D26] border border-slate-200 dark:border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 font-black text-sm flex items-center justify-center shadow-xs">
                2
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Isi Profil Perniagaan</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Lengkapkan profil bisnes anda, muat naik katalog produk tempatan, logo jenama serta pautan WhatsApp dan media sosial.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161D26] border border-slate-200 dark:border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                3
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Semak Kiosk & Geran</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pilih slot kiosk kapsul bersubsidi di jajahan anda atau mohon Skim Dana Benih untuk melengkapkan peralatan bisnes.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161D26] border border-slate-200 dark:border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                4
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Kembangkan Bisnes</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Terima bimbingan mentor berpengalaman, pantau analitik jualan, dan tingkatkan keterlihatan pasaran di seluruh negeri.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TIGA INISIATIF TERAS (CORE PILLARS) */}
      {/* ========================================================================= */}
      <section id="inisiatif" className="py-16 sm:py-20 border-b border-[#1E3158] bg-gradient-to-b from-[#0B1329] via-[#0E1A38] to-[#0B1329] bg-songket-pattern text-white">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {isBM ? 'Inisiatif Pembangunan Negeri' : 'State Development Pillars'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isBM ? 'Teras Ekosistem Keusahawanan KBELIA' : 'KBELIA Entrepreneurship Ecosystem Pillars'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {isBM 
                ? 'Direka khas bagi menyelesaikan cabaran modal tapak niaga, keterlihatan pasaran digital dan bimbingan berterusan.'
                : 'Designed to dismantle retail overhead, elevate digital visibility, and provide mentorship.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Kiosk Modular */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-400/60 hover:bg-slate-800 transition-all duration-300 space-y-4 shadow-sm backdrop-blur interactive-card group">
              <div className="w-12 h-12 rounded-xl bg-red-950/80 text-amber-400 border border-red-800/60 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-200 group-hover:text-amber-300">
                {isBM ? '1. Kiosk Kapsul Modular' : '1. Modular Capsule Kiosks'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isBM 
                  ? 'Penyediaan ruang niaga pasang siap di kawasan tumpuan tinggi jajahan. Dilengkapi bekalan elektrik stabil, WiFi 500Mbps dan kawalan keselamatan dengan kadar sewa serendah RM12-RM25/hari.'
                  : 'Turnkey pre-fitted retail pods at high-footfall locations with electricity, 500Mbps WiFi, and security starting at RM12/day.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press"
                >
                  <span>{isBM ? 'Log Masuk & Semak Lokasi' : 'Log In to Check Locations'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Pillar 2: Direktori Digital */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-400/60 hover:bg-slate-800 transition-all duration-300 space-y-4 shadow-sm backdrop-blur interactive-card group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-200 group-hover:text-emerald-300">
                {isBM ? '2. Direktori Pasaran Digital' : '2. Digital Market Directory'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isBM
                  ? 'Katalog atas talian rasmi mempamerkan produk keluaran anak muda Kelantan seperti makanan tradisi, kraftangan batik, servis teknologi, dan hasil pertanian terus kepada orang ramai.'
                  : 'Official digital catalog showcasing youth-crafted products—from heritage delicacies to contemporary batik and tech services.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press"
                >
                  <span>{isBM ? 'Log Masuk & Lihat Usahawan' : 'Log In to Browse Directory'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Pillar 3: Geran & Bantuan */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-400/60 hover:bg-slate-800 transition-all duration-300 space-y-4 shadow-sm backdrop-blur interactive-card group">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white transition-colors duration-200 group-hover:text-amber-300">
                {isBM ? '3. Geran & Inkubasi Modal' : '3. Grants & Seed Capital'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isBM
                  ? 'Peluang mendapatkan Dana Benih Belia, geran digitalisasi, serta latihan keusahawanan intensif bersama mentor industri berkaliber bagi memacu pertumbuhan perniagaan.'
                  : 'Fast-tracked youth seed grants, digitalization subsidies, and structured mentorship programs.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press"
                >
                  <span>{isBM ? 'Log Masuk & Maklumat Skim' : 'Log In to View Schemes'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* ASAL: PREVIEW KIOSK KAPSUL NIAGA */}
      {/* ========================================================================= */}
      <section id="kiosk" className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#FAF7F0]/90 dark:bg-[#0D1833]/90 bg-songket-pattern transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
                Lokasi Pilihan Jajahan
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Kapsul & Kiosk Niaga Sedia Dimohon
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pilih tapak perniagaan yang strategik dengan fasiliti lengkap sedia ada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {(() => {
              const av = slots.filter((slot) => slot.status === 'available');
              const fallbackAvailable = INITIAL_CAPSULE_SLOTS.filter((s) => s.status === 'available');
              const combined = [...av, ...fallbackAvailable.filter((f) => !av.some((a) => a.id === f.id))];
              const displaySlots = combined.length >= 3 ? combined.slice(0, 3) : slots.slice(0, 3);
              
              return displaySlots.map((slot) => (
                <div 
                  key={slot.id} 
                  onClick={() => onSelectSlot(slot)}
                  className="rounded-2xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer interactive-card"
                >
                  <div>
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={slot.imageUrl || '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg'} 
                        alt={slot.name} 
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1 rounded text-[11px] font-bold text-slate-900 dark:text-white shadow-xs flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 transition-transform duration-200 group-hover:scale-105">
                        <MapPin className="w-3 h-3 text-red-700" />
                        <span>{slot.district}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold border shadow-xs bg-emerald-100 text-emerald-900 border-emerald-300 transition-transform duration-200 group-hover:scale-105 inline-block">
                          Kekosongan Sedia
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200">{slot.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{slot.hubLocation}</p>
                      </div>

                      {/* Amenities */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Zap className="w-3 h-3 text-amber-600" /> Elektrik
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Wifi className="w-3 h-3 text-emerald-600" /> WiFi 500M
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-slate-500 dark:text-slate-400">{slot.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Kadar Sewaan Bersubsidi</div>
                      <div className="text-sm sm:text-base font-black text-red-700 dark:text-red-400 group-hover:scale-105 transition-transform duration-200 origin-left">
                        RM{slot.dailyRate} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ hari</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white">
                      {isBM ? 'Sedia Dimohon' : 'Available Now'}
                    </span>
                  </div>

                </div>
              ));
            })()}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* ASAL: PREVIEW DIREKTORI USAHAWAN BELIA */}
      {/* ========================================================================= */}
      <section id="direktori" className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#F4F1EA] dark:bg-[#0B1329] bg-songket-pattern transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Direktori Produk Tempatan
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Karya & Perniagaan Belia Kelantan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sokong produk buatan anak tempatan merentasi pelbagai kategori industri.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {businesses.slice(0, 4).map((biz) => (
              <div 
                key={biz.id}
                onClick={() => onSelectBusiness(biz)}
                className="rounded-2xl bg-slate-50 dark:bg-[#161D26] border border-slate-200 dark:border-slate-800 p-5 hover:bg-white dark:hover:bg-[#1C2434] hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer interactive-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={biz.logoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${biz.id}`}
                      alt={biz.businessName}
                      className="w-12 h-12 rounded-xl object-cover bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 transition-transform duration-300 group-hover:scale-108"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] text-red-700 dark:text-red-400 font-extrabold uppercase tracking-wider">{biz.category}</div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200">
                        {biz.businessName}
                      </h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{biz.district}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {biz.description || biz.tagline}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{biz.ownerName}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800 transition-transform duration-200 group-hover:scale-105">
                    {biz.district}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SOALAN LAZIM (FAQ) */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-20 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-[#FAF7F0]/90 dark:bg-[#0D1833]/90 bg-songket-pattern transition-colors">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center space-y-2 mb-10">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
              Bantuan & Panduan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Soalan Lazim (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Jawapan kepada pertanyaan lazim berkenaan permohonan kiosk, dana bantuan, mentor, dan direktori KBELIA.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-xl bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-200 hover:border-amber-400/40 interactive-lift"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50/80 dark:hover:bg-[#1E2D56] transition-colors cursor-pointer interactive-press group"
                  >
                    <span className="group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-red-700 dark:text-amber-400' : 'group-hover:text-amber-500'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3 animate-fade-slide-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CALL TO ACTION (CTA BANNER - CHECKLIST ITEM 10) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#ECE7DC] dark:bg-[#0F1C3B] text-slate-800 dark:text-slate-100 border-b border-[#E0DBD0] dark:border-[#1E3158] bg-songket-pattern transition-colors">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-transform duration-200 hover:scale-105 cursor-default">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Peluang Terbuka Sepanjang Tahun 2026/2027</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Mulakan Langkah Keusahawanan Anda Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Sertai 500+ usahawan muda Kelantan yang telah memanfaatkan fasiliti kiosk modular, bimbingan mentor, dan pasaran direktori negeri.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer interactive-press interactive-lift group"
            >
              <Users className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>{isBM ? 'Daftar Akaun Percuma' : 'Register Free Account'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#152244] dark:hover:bg-[#1A2B56] text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-2 cursor-pointer interactive-press interactive-lift group"
            >
              <LogIn className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:translate-x-1" />
              <span>{isBM ? 'Log Masuk Sistem' : 'Log In System'}</span>
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>100% Inisiatif Kerajaan Negeri</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tiada Caj Tersembunyi</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kelulusan Digital Pantas</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. COMPREHENSIVE INSTITUTIONAL FOOTER (CHECKLIST ITEM 11) */}
      {/* ========================================================================= */}
      <footer className="bg-[#0A1124] text-slate-300 text-xs border-t border-[#1E3158]">
        
        {/* Newsletter Subscription Row */}
        <div className="border-b border-[#1E3158] py-10 bg-[#080E1F]">
          <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-base font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Langgan Buletin & Info Peluang Usahawan</span>
              </h3>
              <p className="text-xs text-slate-400">
                Terima kemas kini terkini pembukaan slot kiosk, tawaran geran benih, dan bengkel keusahawanan terus ke peti masuk anda.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex items-center w-full max-w-md gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Emel"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1E2638] border border-[#2C384D] text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Langgan</span>
              </button>
            </form>
          </div>

          {newsletterSuccess && (
            <div className="max-w-md mx-auto mt-3 p-2 text-center text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 rounded-lg">
              Terima kasih! Anda kini telah melanggan buletin rasmi KBELIA Kelantan.
            </div>
          )}
        </div>

        {/* 4-Column Footer Content */}
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Identity & Intro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-700 via-red-800 to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                KB
              </div>
              <span className="text-base font-black text-white tracking-tight">KBELIA KELANTAN</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Portal Rasmi Pembangunan & Pemerkasaan Usahawan Belia Negeri Kelantan. Menyediakan kiosk pintar modular, pasaran direktori, serta inkubasi dana benih.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Kompleks Kota Darulnaim, 15503 Kota Bharu, Kelantan Darul Naim.
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">Navigasi Portal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-amber-400 transition-colors">Laman Utama</a>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('register')} className="hover:text-amber-400 transition-colors text-left">Daftar Akaun Usahawan</button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('login')} className="hover:text-amber-400 transition-colors text-left">Log Masuk Sistem</button>
              </li>
              <li>
                <a href="#kiosk" className="hover:text-amber-400 transition-colors">Kiosk Kapsul Modular</a>
              </li>
              <li>
                <a href="#direktori" className="hover:text-amber-400 transition-colors">Direktori Usahawan</a>
              </li>
              <li>
                <a href="#ciri-utama" className="hover:text-amber-400 transition-colors">Ciri-Ciri Utama</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors">Soalan Lazim (FAQ)</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Policy */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">Pautan Perundangan</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Dasar Privasi (Privacy Policy)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Terma & Syarat Perkhidmatan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Polisi Keselamatan Siber & Data
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Penafian Liabiliti Rasmi
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">Hubungi Urusetia</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+60 9-748 1000 (Pejabat Pentadbiran)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>urusetia@kbelia.kelantan.gov.my</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Ahad - Rabu: 8.00 pagi - 5.00 petang</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Ikuti Media Sosial</div>
              <div className="flex items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Facebook KBELIA"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Instagram KBELIA"
                >
                  <Sparkles className="w-4 h-4" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="TikTok KBELIA"
                >
                  <Video className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/601123456789"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="WhatsApp Khidmat Bantuan"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-slate-800 py-6 text-center text-[11px] text-slate-500">
          <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              Hak Cipta Terpelihara © {new Date().getFullYear()} Kerajaan Negeri Kelantan. Diselaraskan di bawah Inisiatif Pembangunan Ekonomi Belia.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Versi 2.4.0</span>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="hover:text-amber-400 transition-colors"
              >
                Kembali ke Atas ↑
              </button>
            </div>
          </div>
        </div>

      </footer>



      {/* ========================================================================= */}
      {/* MODAL 2: LEGAL & PRIVACY VIEWER (CHECKLIST ITEM 12) */}
      {/* ========================================================================= */}
      {legalModalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-5 bg-slate-900 dark:bg-[#161D26] text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-base">
                {legalModalType === 'privacy' ? 'Dasar Privasi & Perlindungan Data' : 'Terma & Syarat Perkhidmatan'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs text-slate-600 dark:text-slate-300 space-y-4 max-h-[60vh] overflow-y-auto leading-relaxed">
              {legalModalType === 'privacy' ? (
                <>
                  <p className="font-bold text-slate-900 dark:text-white">
                    1. Pengenalan & Komitmen Privasi
                  </p>
                  <p>
                    Portal KBELIA diuruskan oleh Urusetia Pembangunan Belia Negeri Kelantan. Kami komited untuk melindungi data peribadi anda mengikut Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    2. Pengumpulan Data Peribadi
                  </p>
                  <p>
                    Data yang dikumpulkan termasuk nama penuh, nombor kad pengenalan, nombor pendaftaran SSM, lokasi perniagaan, nombor telefon dan maklumat akaun bank pemohon bagi tujuan penyaluran geran dan pengurusan sewaan kiosk.
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    3. Keselamatan & Perlindungan Data
                  </p>
                  <p>
                    Semua maklumat disimpan dalam pelayan awan berpusat berstandard keselamatan tinggi. Kami tidak akan menjual atau berkongsi maklumat anda dengan mana-mana pihak ketiga tanpa kebenaran bertulis.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-900 dark:text-white">
                    1. Syarat Kelayakan Pengguna
                  </p>
                  <p>
                    Pengguna mestilah warganegara Malaysia berumur antara 18 hingga 40 tahun yang beroperasi atau bermastautin di negeri Kelantan Darul Naim.
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    2. Tanggungjawab Penyewa Kiosk
                  </p>
                  <p>
                    Penyewa bertanggungjawab menjaga kebersihan, keselamatan peralatan, dan mematuhi peraturan waktu operasi yang ditetapkan oleh pihak pengurusan hab dan pihak berkuasa tempatan (PBT).
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    3. Integriti Permohonan Geran
                  </p>
                  <p>
                    Sebarang maklumat palsu dalam permohonan Dana Benih boleh mengakibatkan pembatalan geran serta-merta dan tindakan undang-undang di bawah peraturan pentadbiran negeri.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#161D26] border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-red-700 dark:hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Saya Faham & Setuju
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
