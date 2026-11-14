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
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
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

  const availableSlotsCount = slots.filter(s => s.status === 'available').length;

  const navigateToPage = (tab: UMKTab) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setActiveTab(tab);
  };

  // 5 Rich Visual Slides for the Automatic Moving Carousel (Maintained as original)
  const heroSlides = [
    {
      id: 'slide-1',
      title: 'Kiosk Belia Modular Pintar 2026',
      subtitle: 'Hab Kiosk Usahawan UMK Bachok & Kota Bharu',
      description: 'Kiosk pasang-siap lengkap soket 13A, Wi-Fi 500Mbps, dan kawalan keselamatan serendah RM15/hari.',
      badge: 'Kekosongan Sedia',
      location: 'Hub UMK Bachok & KB Sentral',
      imageUrl: '/assets/generated/kiosk_modular_kbelia.jpg',
      stat: `${slots.length} Kiosk Strategik`,
      ctaText: 'Mohon Kiosk',
      onAction: () => navigateToPage('login')
    },
    {
      id: 'slide-2',
      title: 'Batik Belia Kontemporari & Streetwear',
      subtitle: 'Koleksi Fesyen Graduan Muda — Nur Syafiqah (Kota Bharu)',
      description: 'Batik canting kontemporari dengan motif flora moden pada kemeja cuban dan beg kanvas untuk pasaran eksport.',
      badge: 'Usahawan Kraf Bimbingan UMK',
      location: 'Kota Bharu',
      imageUrl: '/assets/generated/batik_canting_kelantan.jpg',
      stat: 'Penilaian 4.8 / 5.0',
      ctaText: 'Lihat Direktori',
      onAction: () => navigateToPage('login')
    },
    {
      id: 'slide-3',
      title: 'Kafe Artisan & Masakan Warisan Moden',
      subtitle: "D'Kelate Artisan Coffee & Akok Tart — Ahmad Faizul",
      description: 'Gabungan kopi barista espresso serta kuih tradisi Akok Tart dan Kopi Nissem Melaka di kiosk inkubator belia.',
      badge: 'Inkubasi F&B Berjaya',
      location: 'Hub UMK Bachok',
      imageUrl: '/assets/generated/kopi_nissem_melaka.jpg',
      stat: '42 Ulasan Pelanggan',
      ctaText: 'Lihat Menu',
      onAction: () => navigateToPage('login')
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

  // Continuous auto-moving horizontal photo strip cards
  const movingPhotoCards = [
    {
      img: '/assets/generated/kiosk_modular_kbelia.jpg',
      title: 'Kiosk Belia KB Sentral B1',
      subtitle: 'Ruang Komersial Smart Pod',
      tag: 'RM20/hari',
      tagColor: 'bg-blue-600 text-white border-amber-400/40',
      location: 'Kota Bharu',
      type: 'Kiosk Komersial'
    },
    {
      img: '/assets/generated/batik_canting_kelantan.jpg',
      title: 'Batik Belia Kontemporari',
      subtitle: 'Fesyen & Kraf Moden',
      tag: 'Penarafan 4.8',
      tagColor: 'bg-blue-600 text-white border-amber-400/40',
      location: 'Kota Bharu',
      type: 'Kraf & Fesyen'
    },
    {
      img: '/assets/generated/kopi_nissem_melaka.jpg',
      title: "Kiosk F&B A1 · Kopi Nissem",
      subtitle: "D'Kelate Artisan Coffee",
      tag: 'RM15/hari',
      tagColor: 'bg-blue-600 text-white border-amber-400/40',
      location: 'Bachok',
      type: 'Kiosk F&B'
    }
  ];

  // All FAQs including checklist additions
  const faqs = [
    {
      q: 'Siapakah yang layak menyewa Kiosk KBelia?',
      a: 'Warganegara Malaysia berumur 18 hingga 40 tahun di Kelantan layak memohon, dengan keutamaan kepada usahawan belia baharu.'
    },
    {
      q: 'Berapakah kadar sewaan harian dan tempoh minimum?',
      a: 'Kadar sewa bermula RM12 hingga RM25 sehari mengikut daerah dan jenis kiosk, dengan tempoh fleksibel dari 3 hari hingga 3 bulan.'
    },
    {
      q: 'Bagaimanakah cara mendaftar produk dalam Direktori Usahawan?',
      a: 'Daftar akaun percuma dan lengkapkan profil di Portal Usahawan untuk memaparkan katalog produk anda.'
    },
    {
      q: 'Adakah pemohon geran perlu mempunyai kedai tetap?',
      a: 'Tidak semestinya. Geran ini terbuka kepada usahawan dari rumah, kiosk bergerak, dan jualan dalam talian yang mempunyai pelan perniagaan.'
    },
    {
      q: 'Bagaimanakah proses semakan Geran Permulaan KBelia?',
      a: 'Permohonan disemak secara digital dalam tempoh 7–14 hari bekerja dan status boleh dipantau terus dalam papan pemuka.'
    },
    {
      q: 'Bolehkah saya mendapatkan bimbingan mentor secara percuma?',
      a: 'Ya, semua usahawan berdaftar layak menyertai sesi bimbingan mentor dan bengkel keusahawanan secara percuma.'
    },
    {
      q: 'Adakah portal ini membantu pendaftaran SSM dan lesen?',
      a: 'Ya. Panduan daftar SSM, pensijilan Halal JAKIM, dan permohonan lesen PBT seluruh Kelantan tersedia di dalam portal.'
    }
  ];

  const activeSlideData = heroSlides[currentSlide];

  return (
    <div id="kbelia-landing-root" className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-black dark:text-white flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* 2. LANDING NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-slate-300 dark:border-zinc-600 shadow-xs transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs dark:bg-blue-600">
              <span>KB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-black dark:text-white">KBelia</span>
              </div>
              <p className="text-[11px] text-black/70 dark:text-white/75 font-normal hidden sm:block">
                {isBM ? 'Portal Usahawan & Kiosk Belia Kelantan' : 'Kelantan Youth Entrepreneurship & Capsule Kiosks'}
              </p>
            </div>
          </div>

          {/* Quick Nav Anchors to Landing Sections */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-black dark:text-white">
            <a href="#hero" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">{isBM ? 'Utama' : 'Home'}</a>
            <a href="#kiosk" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">{isBM ? 'Kiosk Modular' : 'Modular Kiosks'}</a>
            <a href="#direktori" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">{isBM ? 'Direktori Usahawan' : 'Directory'}</a>
            <a href="#inisiatif" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">{isBM ? 'Inisiatif Teras' : 'Initiatives'}</a>
            <a href="#faq" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">{isBM ? 'Soalan Lazim' : 'FAQ'}</a>
          </nav>

          {/* Actions: Mod Gelap/Cerah, Penukar Bahasa (BM|EN), Butang Daftar, Butang Log Masuk */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Animated Theme Switcher */}
            <button
              id="landing-darkmode-toggle"
              type="button"
              onClick={toggleTheme}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 transition-all duration-300 cursor-pointer shadow-2xs group focus:outline-none interactive-press hover:scale-105 active:scale-95"
              title={isDark ? (isBM ? "Tukar ke Mod Cerah" : "Switch to Light Mode") : (isBM ? "Tukar ke Mod Gelap" : "Switch to Dark Mode")}
              aria-label="Tukar tema sistem"
            >
              <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                <Sun
                  className={`w-4 h-4 text-black dark:text-white absolute transition-all duration-500 ease-out transform ${
                    isDark 
                      ? 'rotate-90 scale-0 opacity-0 pointer-events-none' 
                      : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                <Moon
                  className={`w-4 h-4 text-black/70 dark:text-white/75 absolute transition-all duration-500 ease-out transform ${
                    isDark 
                      ? 'rotate-0 scale-100 opacity-100' 
                      : '-rotate-90 scale-0 opacity-0 pointer-events-none'
                  }`}
                />
              </div>
              <span className="sr-only">{isDark ? 'Mod Gelap Aktif' : 'Mod Cerah Aktif'}</span>
            </button>

            {/* Penukar Bahasa Global */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('ms')}
                className={`px-2 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                  isBM ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600' : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
                }`}
                title="Bahasa Melayu (Rasmi)"
              >
                BM
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                  !isBM ? 'bg-blue-600 text-white shadow-2xs dark:bg-blue-600' : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
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
              onClick={() => navigateToPage('register')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer interactive-press interactive-lift group"
            >
              <Users className="w-3.5 h-3.5 text-black dark:text-white/75 transition-transform duration-200 group-hover:scale-110" />
              <span>{isBM ? 'Daftar' : 'Register'}</span>
            </button>

            {/* Butang Log Masuk */}
            <button
              type="button"
              id="landing-login-btn"
              onClick={() => navigateToPage('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer interactive-press interactive-lift group dark:bg-blue-600"
            >
              <LogIn className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>{isBM ? 'Log Masuk' : 'Log In'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION & CAROUSEL VISUAL (Important Header: Top-Left Soft Sky Glow + Grid & Ambient Orbs) */}
      <section id="hero" className="kbelia-important-header relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-300 dark:border-zinc-600 text-black dark:text-white transition-colors">
        {/* Subtle SVG Grid & Ambient Radial Glow */}
        <div className="absolute inset-0 bg-grid-pattern opacity-80 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-500/12 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-6">
          
          {/* Headline & Subhead */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black dark:text-white leading-[1.12] text-balance">
              {isBM 
                ? 'Platform Bersepadu Usahawan Belia Kelantan'
                : 'Integrated Kelantan Youth Entrepreneurship Platform'}
            </h1>
            <p className="text-base sm:text-lg text-black dark:text-white font-normal leading-relaxed max-w-2xl mx-auto">
              {isBM
                ? 'Sewa kiosk modular, pamerkan produk di direktori negeri, dan mohon geran dalam satu portal rasmi.'
                : 'Rent modular kiosks across Kelantan, list products in the state directory, and apply for grants in one portal.'}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* PAMERAN GAMBAR BERGERAK AUTOMATIK (HERO CAROUSEL WITH AUTO-SLIDE) */}
          {/* ========================================================================= */}
          <div 
            id="sorotan-gambar"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="pt-4 w-full mx-auto text-left relative"
          >
            {/* Carousel Frame Card */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-600 bg-slate-950 text-white group">
              
              {/* Background Slide Image with Fade Animation */}
              <div className="relative h-[420px] sm:h-[520px] lg:h-[560px] w-full overflow-hidden">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-900/30" />
                  </div>
                ))}
              </div>

              {/* Top Controls Bar within Slide */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-600 text-white border border-blue-400/40">
                    {activeSlideData.badge}
                  </span>
                  <span className="text-white/40 text-[11px] hidden sm:inline">·</span>
                  <span className="text-white/90 font-bold text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activeSlideData.location}
                  </span>
                </div>
              </div>

              {/* Prev / Next Arrow Navigation */}
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Gambar Sebelum"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Gambar Seterusnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Bottom Content Overlay for Current Slide */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20 space-y-3">
                <div className="max-w-2xl space-y-1.5">
                  <div className="text-white/90 text-xs font-bold uppercase tracking-wider">
                    {activeSlideData.subtitle}
                  </div>
                  <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                    {activeSlideData.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white line-clamp-2 leading-relaxed">
                    {activeSlideData.description}
                  </p>
                </div>

                {/* Actions & Interactive Slide Selectors */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={activeSlideData.onAction}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer active:scale-98 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      <span>{activeSlideData.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dot / Slide Selectors */}
                  <div className="flex items-center gap-2">
                    {heroSlides.map((slide, i) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setCurrentSlide(i)}
                        className={`transition-all duration-300 h-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 ${
                          i === currentSlide 
                            ? 'w-8 bg-amber-400 shadow-xs' 
                            : 'w-2 bg-white/40 hover:bg-white'
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
                  className="h-full bg-blue-600 transition-all duration-500 dark:bg-blue-600"
                  style={{ width: `${((currentSlide + 1) / heroSlides.length) * 100}%` }}
                />
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* STATISTIK EKOSISTEM SEMASA (LIVE METRICS) */}
          {/* ========================================================================= */}
          <div className="pt-6 w-full mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-blue-400/70 dark:hover:border-blue-400/70 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-black dark:text-white leading-tight">{isBM ? 'Seluruh Kelantan' : 'Across Kelantan'}</div>
              <div className="text-xs font-bold text-black dark:text-white mt-1">{isBM ? 'Liputan Negeri' : 'State Coverage'}</div>
              <div className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">{isBM ? 'Rangkaian Hab & Kiosk' : 'Hub & Kiosk Network'}</div>
            </div>

            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-blue-400/70 dark:hover:border-blue-400/70 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-black dark:text-white/75 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white tabular-nums">{slots.length}</div>
              <div className="text-xs font-bold text-black dark:text-white mt-0.5">{isBM ? 'Kiosk Modular' : 'Modular Kiosks'}</div>
              <div className="text-[11px] text-black dark:text-white/75 mt-0.5 font-bold tabular-nums">{availableSlotsCount} {isBM ? 'slot sedia' : 'slots ready'}</div>
            </div>

            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-blue-400/70 dark:hover:border-blue-400/70 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white tabular-nums">{businesses.length}</div>
              <div className="text-xs font-bold text-black dark:text-white mt-0.5">{isBM ? 'Usahawan Direktori' : 'Listed Merchants'}</div>
              <div className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">{isBM ? 'Disahkan SSM' : 'SSM Verified'}</div>
            </div>

            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-amber-300 dark:hover:border-amber-500/40 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-black dark:text-white/75 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white/75 tabular-nums">{programs.length}</div>
              <div className="text-xs font-bold text-black dark:text-white mt-0.5">{isBM ? 'Program & Geran' : 'Programs & Grants'}</div>
              <div className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">{isBM ? 'Inisiatif aktif' : 'Active initiatives'}</div>
            </div>

            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-violet-300 dark:hover:border-violet-500/40 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/60 text-black dark:text-white/75 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white/75 tabular-nums">{INITIAL_MENTOR_PROFILES.length}</div>
              <div className="text-xs font-bold text-black dark:text-white mt-0.5">{isBM ? 'Panel Mentor' : 'Industry Mentors'}</div>
              <div className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">{isBM ? 'Bimbingan berkala' : 'Certified mentors'}</div>
            </div>

            <div className="kbelia-glass-card interactive-card p-4 sm:p-5 rounded-2xl text-left hover:border-emerald-300 dark:hover:border-emerald-500/40 cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-black dark:text-white/75 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white/75 tabular-nums">50%</div>
              <div className="text-xs font-bold text-black dark:text-white mt-0.5">{isBM ? 'Subsidi Sewaan' : 'Rental Subsidy'}</div>
              <div className="text-[11px] text-black/70 dark:text-white/75 mt-0.5">{isBM ? 'Serendah RM12/hari' : 'From RM12/day'}</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3B. REEL GAMBAR BERGERAK BERTERUSAN (CONTINUOUS HORIZONTAL MARQUEE TICKER) */}
      {/* ========================================================================= */}
      <section className="py-6 bg-white dark:bg-zinc-900 text-black dark:text-white overflow-hidden border-b border-slate-300 dark:border-zinc-600 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-black dark:text-white/75" />
            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-black dark:text-white">
              Galeri Kiosk & Produk Tempatan
            </h3>
          </div>
        </div>

        {/* Marquee Track Container */}
        <div className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="animate-marquee-left flex gap-4 py-2">
            {/* Duplicated for seamless infinite looping */}
            {[...movingPhotoCards, ...movingPhotoCards].map((card, idx) => (
              <div
                key={`marquee-${idx}`}
                onClick={() => {
                  if (card.title.includes('Kiosk') || card.title.includes('Kapsul')) {
                    setActiveTab('academic');
                  } else {
                    setActiveTab('hepa');
                  }
                }}
                className="w-64 sm:w-72 shrink-0 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-blue-400/70 rounded-xl overflow-hidden transition-colors cursor-pointer shadow-2xs group"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-white" />
                    <span>{card.location}</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shadow-xs ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white/85 uppercase">
                    {card.type}
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold text-black dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-black/70 dark:text-white truncate">
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
      <section id="masalah-solusi" className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 transition-colors">
        <div className="absolute inset-0 bg-dot-pattern opacity-45 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
              <Layers className="w-3.5 h-3.5" />
              <span>Cabaran & Penyelesaian</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
              Cabaran Lazim vs. Solusi KBelia
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white/75">
              Menangani halangan utama usahawan muda Kelantan memulakan operasi perniagaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Column 1: Cabaran Tradisional */}
            <div className="kbelia-glass-card interactive-card relative overflow-hidden p-7 sm:p-8 rounded-2xl bg-rose-50/50 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-900/50 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-200/80 dark:border-rose-900/50">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-black dark:text-white flex items-center justify-center font-bold">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-black dark:text-white">Cabaran Lazim Belia</h3>
                  <p className="text-xs text-black dark:text-white/75 font-medium">Kekangan memulakan operasi tradisional</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-black dark:text-white">
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Sewa Premis Tinggi</span>
                    <span className="text-black/70 dark:text-white/75 text-xs">Deposit 3+1 bulan dan sewa ribuan ringgit membebankan modal awal.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Prosedur SSM & Lesen PBT</span>
                    <span className="text-black/70 dark:text-white/75 text-xs">Ketiadaan panduan berpusat melambatkan pendaftaran syarikat dan lesen.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Capaian Pasaran Terhad</span>
                    <span className="text-black/70 dark:text-white/75 text-xs">Sukar menembusi pasaran luar jajahan tanpa direktori rasmi.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Kekurangan Bimbingan Mentor</span>
                    <span className="text-black/70 dark:text-white/75 text-xs">Beroperasi tanpa nasihat mentor berpengalaman meningkatkan risiko kegagalan.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-black/70 dark:text-white/75 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Maklumat Geran Tersebar</span>
                    <span className="text-black/70 dark:text-white/75 text-xs">Info geran sukar dicapai dan semakan status memakan masa lama.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 2: Solusi Pintar KBelia */}
            <div className="kbelia-glass-card interactive-card relative overflow-hidden p-7 sm:p-8 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-200/80 dark:border-emerald-900/50 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-200/80 dark:border-emerald-900/50">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-black dark:text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-black dark:text-white">Solusi Bersepadu KBelia</h3>
                  <p className="text-xs text-black dark:text-white/75 font-medium">Ekosistem keusahawanan negeri</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-black dark:text-white">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Kiosk Modular Bersubsidi</span>
                    <span className="text-black dark:text-white text-xs">Sewa RM12–RM25/hari di zon strategik lengkap elektrik 13A dan Wi-Fi.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Panduan SSM & Lesen</span>
                    <span className="text-black dark:text-white text-xs">Rujukan tersusun bagi pendaftaran SSM, sijil Halal, dan lesen PBT.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Direktori Pasaran Digital</span>
                    <span className="text-black dark:text-white text-xs">Pamerkan katalog produk kepada pelanggan di seluruh negeri.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Hab Mentor & Kemahiran</span>
                    <span className="text-black dark:text-white text-xs">Padanan mentor industri serta latihan pemasaran digital dan kewangan.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black dark:text-white block">Penjejak Status Geran</span>
                    <span className="text-black dark:text-white text-xs">Pantau kelulusan Geran Permulaan terus di papan pemuka.</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CIRI-CIRI UTAMA (CORE FEATURES - ASYMMETRIC BENTO GRID) */}
      {/* ========================================================================= */}
      <section id="ciri-utama" className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
              <Zap className="w-3.5 h-3.5" />
              <span>Modul Utama</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
              5 Ciri Utama Portal KBelia
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white/75">
              Infrastruktur digital lengkap daripada analitik jualan hingga pematuhan rasmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            
            {/* Feature 1: Business Analytics (Wide Bento Card - col-span-2) */}
            <div className="lg:col-span-2 kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="space-y-3 max-w-lg relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-black dark:text-white">
                  {isBM ? 'Analitik & Laporan Jualan' : 'Business Analytics & Reporting'}
                </h3>
                <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                  {isBM
                    ? 'Pantau jualan harian, urus inventori produk, dan jana laporan prestasi ringkas untuk semakan pembiaya.'
                    : 'Track daily sales, manage product inventory, and export concise performance reports.'}
                </p>
                <div className="pt-1 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isBM ? 'Graf visual & eksport PDF' : 'Visual charts & PDF export'}</span>
                </div>
              </div>

              {/* Subtle Decorative Vector SVG Chart Illustration */}
              <div className="shrink-0 w-full sm:w-48 h-28 rounded-xl bg-blue-50/70 dark:bg-zinc-900 border border-blue-200/70 dark:border-zinc-600 p-3 flex items-end justify-between gap-1.5 pointer-events-none select-none" aria-hidden="true">
                <svg viewBox="0 0 180 80" className="w-full h-full">
                  <defs>
                    <linearGradient id="bentoChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>
                  <path d="M5,68 L35,52 L65,58 L95,34 L125,38 L155,16 L175,20 L175,78 L5,78 Z" fill="url(#bentoChartGrad)" />
                  <path d="M5,68 L35,52 L65,58 L95,34 L125,38 L155,16 L175,20" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="95" cy="34" r="3.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="155" cy="16" r="4" fill="#10B981" />
                </svg>
              </div>
            </div>

            {/* Feature 2: Funding & Grant Tracker */}
            <div className="kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-amber-300 dark:hover:border-amber-500/40 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-black dark:text-white">
                {isBM ? 'Penjejak Geran & Dana' : 'Funding & Grant Tracker'}
              </h3>
              <p className="text-xs text-black dark:text-white leading-relaxed">
                {isBM
                  ? 'Akses Geran Permulaan Negeri, geran digital MDEC, serta pembiayaan mikro TEKUN dan MARA.'
                  : 'Access state seed grants, MDEC digital grants, and TEKUN/MARA micro-financing schemes.'}
              </p>
              <div className="pt-2 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBM ? 'Semakan status terus' : 'Direct status tracking'}</span>
              </div>
            </div>

            {/* Feature 3: Mentorship & Networking */}
            <div className="kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-black dark:text-white">
                {isBM ? 'Hab Mentor & Rangkaian' : 'Mentorship & Networking Hub'}
              </h3>
              <p className="text-xs text-black dark:text-white leading-relaxed">
                {isBM
                  ? 'Padanan bersama mentor industri dan rangkaian kerjasama dengan usahawan belia Kelantan.'
                  : 'Connect with experienced mentors and build networks across Kelantan youth entrepreneurs.'}
              </p>
              <div className="pt-2 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>{isBM ? 'Sesi 1-ke-1 & berkumpulan' : '1-on-1 & group coaching'}</span>
              </div>
            </div>

            {/* Feature 4: Upskilling & Academy (Wide Bento Card - col-span-2) */}
            <div className="lg:col-span-2 kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="space-y-3 max-w-lg relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-black dark:text-white">
                  {isBM ? 'Akademi Kemahiran Belia' : 'Upskilling & Academy Module'}
                </h3>
                <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                  {isBM
                    ? 'Latihan praktikal TikTok Shop Ads, fotografi produk, penjenamaan, dan asas perakaunan.'
                    : 'Practical workshops covering TikTok Shop Ads, product photography, branding, and bookkeeping.'}
                </p>
                <div className="pt-1 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>{isBM ? 'Sijil penyertaan rasmi' : 'Official completion certificate'}</span>
                </div>
              </div>

              {/* Subtle Decorative Vector SVG Academy Accent */}
              <div className="shrink-0 w-full sm:w-44 h-24 rounded-xl bg-indigo-50/80 dark:bg-zinc-900 border border-indigo-200/70 dark:border-zinc-600 p-3 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                <svg viewBox="0 0 140 70" className="w-full h-full">
                  <rect x="8" y="12" width="124" height="46" rx="8" fill="none" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 3" />
                  <rect x="18" y="22" width="36" height="26" rx="5" fill="#4F46E5" fillOpacity="0.16" />
                  <polygon points="32,29 32,41 42,35" fill="#4F46E5" />
                  <line x1="64" y1="27" x2="120" y2="27" stroke="#4F46E5" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
                  <line x1="64" y1="37" x2="108" y2="37" stroke="#94A3B8" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="64" y1="45" x2="96" y2="45" stroke="#94A3B8" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Feature 5: Compliance & SSM Guide */}
            <div className="kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-black dark:text-white">
                {isBM ? 'Panduan SSM & Lesen' : 'Compliance & SSM Guide'}
              </h3>
              <p className="text-xs text-black dark:text-white leading-relaxed">
                {isBM
                  ? 'Panduan pendaftaran SSM, pematuhan cukai LHDN, pensijilan Halal JAKIM, dan lesen PBT.'
                  : 'Interactive guidance for SSM registration, LHDN tax compliance, Halal JAKIM, and PBT permits.'}
              </p>
              <div className="pt-2 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBM ? 'Templat & senarai semak' : 'Templates & checklists'}</span>
              </div>
            </div>

            {/* Feature 6: Kiosk Modular IoT Hub (Wide Bento Card - col-span-2) */}
            <div className="lg:col-span-2 kbelia-glass-card interactive-card relative overflow-hidden p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
              <div className="space-y-3 max-w-lg relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-black dark:text-white">
                  {isBM ? 'Hab Kiosk Modular Pintar' : 'Modular Capsule IoT Hub'}
                </h3>
                <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                  {isBM
                    ? 'Kunci digital pintar, pemantauan status kiosk dalam talian, dan sokongan teknikal berpusat.'
                    : 'Smart digital access, live kiosk occupancy tracking, and centralized technical support.'}
                </p>
                <div className="pt-1 text-xs font-bold text-black dark:text-white/75 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{isBM ? 'Pengurusan sewaan automatik' : 'Automated lease management'}</span>
                </div>
              </div>

              {/* Subtle Decorative Vector SVG Modular Kiosk Node */}
              <div className="shrink-0 w-full sm:w-44 h-24 rounded-xl bg-emerald-50/70 dark:bg-zinc-900 border border-emerald-200/70 dark:border-zinc-600 p-3 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                <svg viewBox="0 0 140 70" className="w-full h-full">
                  <rect x="20" y="16" width="38" height="38" rx="6" fill="#2563EB" fillOpacity="0.14" stroke="#2563EB" strokeWidth="1.5" />
                  <rect x="82" y="16" width="38" height="38" rx="6" fill="#10B981" fillOpacity="0.14" stroke="#10B981" strokeWidth="1.5" />
                  <line x1="58" y1="35" x2="82" y2="35" stroke="#2563EB" strokeWidth="1.8" strokeDasharray="3 3" />
                  <circle cx="39" cy="35" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="101" cy="35" r="5" fill="#10B981" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LANGKAH BERMULA */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>4 Langkah Mudah</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
              Langkah Mula Beroperasi
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white/75">
              Pendaftaran pantas dan percuma untuk semua usahawan belia Kelantan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="kbelia-glass-card interactive-card p-6 rounded-2xl relative space-y-3 hover:border-blue-400/70 dark:hover:border-blue-400/70">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs dark:bg-teal-600">
                  1
                </div>
                <UserCheck className="w-5 h-5 text-black/70 dark:text-white/75" />
              </div>
              <h4 className="font-extrabold text-base text-black dark:text-white">Daftar Akaun</h4>
              <p className="text-xs text-black dark:text-white/75 leading-relaxed">
                Cipta akaun percuma dengan emel atau Google untuk akses portal belia Kelantan.
              </p>
            </div>

            {/* Step 2 */}
            <div className="kbelia-glass-card interactive-card p-6 rounded-2xl relative space-y-3 hover:border-blue-400/70 dark:hover:border-blue-400/70">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs dark:bg-blue-600">
                  2
                </div>
                <Briefcase className="w-5 h-5 text-black/70 dark:text-white/75" />
              </div>
              <h4 className="font-extrabold text-base text-black dark:text-white">Lengkapkan Profil</h4>
              <p className="text-xs text-black dark:text-white/75 leading-relaxed">
                Isi maklumat kedai, muat naik katalog produk, logo jenama, dan pautan WhatsApp.
              </p>
            </div>

            {/* Step 3 */}
            <div className="kbelia-glass-card interactive-card p-6 rounded-2xl relative space-y-3 hover:border-amber-300 dark:hover:border-amber-500/40">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  3
                </div>
                <Building2 className="w-5 h-5 text-black/70 dark:text-white/75" />
              </div>
              <h4 className="font-extrabold text-base text-black dark:text-white">Pilih Kiosk & Geran</h4>
              <p className="text-xs text-black dark:text-white/75 leading-relaxed">
                Tempah slot kiosk bersubsidi di daerah anda atau mohon Geran Permulaan.
              </p>
            </div>

            {/* Step 4 */}
            <div className="kbelia-glass-card interactive-card p-6 rounded-2xl relative space-y-3 hover:border-emerald-300 dark:hover:border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs dark:bg-indigo-600">
                  4
                </div>
                <TrendingUp className="w-5 h-5 text-black/70 dark:text-white/75" />
              </div>
              <h4 className="font-extrabold text-base text-black dark:text-white">Tingkatkan Prestasi</h4>
              <p className="text-xs text-black dark:text-white/75 leading-relaxed">
                Terima bimbingan mentor, pantau jualan harian, dan luaskan capaian pelanggan.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TIGA INISIATIF TERAS */}
      {/* ========================================================================= */}
      <section id="inisiatif" className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 text-black dark:text-white transition-colors">
        <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
              <Shield className="w-3.5 h-3.5" />
              <span>{isBM ? 'Inisiatif Negeri' : 'State Pillars'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
              {isBM ? 'Teras Ekosistem KBelia' : 'KBelia Ecosystem Pillars'}
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white/75">
              {isBM 
                ? 'Menangani keperluan tapak operasi, pemasaran digital, dan bimbingan.'
                : 'Designed to lower retail overhead, boost digital reach, and provide mentorship.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Kiosk Modular */}
            <div className="kbelia-glass-card interactive-card p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-zinc-900 text-black dark:text-white/75 border border-amber-300 dark:border-zinc-600 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white transition-colors duration-200 group-hover:text-black dark:group-hover:text-white">
                {isBM ? 'Kiosk Belia Modular' : 'Modular Capsule Kiosks'}
              </h3>
              <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                {isBM 
                  ? 'Ruang pasang-siap di lokasi tumpuan lengkap elektrik, Wi-Fi 500Mbps, dan keselamatan serendah RM12–RM25/hari.'
                  : 'Turnkey retail pods at high-footfall hubs with power, 500Mbps Wi-Fi, and security from RM12/day.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToPage('login')}
                  className="text-xs font-bold text-black dark:text-white/75 hover:text-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press dark:hover:text-white"
                >
                  <span>{isBM ? 'Semak Lokasi' : 'View Locations'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Pillar 2: Direktori Digital */}
            <div className="kbelia-glass-card interactive-card p-6 sm:p-7 rounded-2xl hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-zinc-900 text-black dark:text-white/75 border border-amber-300 dark:border-zinc-600 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white transition-colors duration-200 group-hover:text-black dark:group-hover:text-white">
                {isBM ? 'Direktori Pasaran Digital' : 'Digital Market Directory'}
              </h3>
              <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                {isBM 
                  ? 'Katalog rasmi yang memaparkan produk makanan, kraftangan batik, servis digital, dan hasil pertanian belia Kelantan.'
                  : 'Official catalog showcasing youth-crafted products from heritage delicacies to batik and digital services.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToPage('login')}
                  className="text-xs font-bold text-black dark:text-white/75 hover:text-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press dark:hover:text-white"
                >
                  <span>{isBM ? 'Lihat Usahawan' : 'Browse Directory'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Pillar 3: Geran & Bantuan */}
            <div className="kbelia-glass-card interactive-card p-6 sm:p-7 rounded-2xl hover:border-amber-300 dark:hover:border-amber-500/40 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-black dark:text-white/75 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-110">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white transition-colors duration-200 group-hover:text-black dark:group-hover:text-white">
                {isBM ? 'Geran & Modal Permulaan' : 'Grants & Seed Capital'}
              </h3>
              <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                {isBM 
                  ? 'Akses Geran Permulaan Belia, geran digitalisasi, serta latihan intensif bersama mentor industri bagi memperkukuh operasi anda.'
                  : 'Fast-tracked youth seed grants, digitalization subsidies, and structured mentorship programs.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateToPage('login')}
                  className="text-xs font-bold text-black dark:text-white/75 hover:text-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer interactive-press dark:hover:text-white"
                >
                  <span>{isBM ? 'Maklumat Skim' : 'View Schemes'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PREVIEW KIOSK MODULAR */}
      {/* ========================================================================= */}
      <section id="kiosk" className="py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
                <Building2 className="w-3.5 h-3.5" />
                <span>Lokasi Pilihan</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white mt-1 text-balance">
                Kiosk Belia Sedia Dimohon
              </h2>
              <p className="text-xs sm:text-sm text-black dark:text-white/75 mt-1">
                Tapak strategik lengkap dengan elektrik dan internet.
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
                  className="kbelia-glass-card interactive-card rounded-2xl overflow-hidden hover:border-blue-400/70 hover:shadow-md transition-all flex flex-col justify-between h-full group cursor-pointer"
                >
                  <div>
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-zinc-800">
                      <img 
                        src={slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg'} 
                        alt={slot.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-xs flex items-center gap-1 border border-white/10">
                        <MapPin className="w-3 h-3 text-white" />
                        <span>{slot.district}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-emerald-400/30 bg-emerald-900/85 text-white shadow-xs inline-block">
                          Kekosongan Sedia
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-black dark:text-white leading-snug group-hover:text-black dark:group-hover:text-white transition-colors">{slot.name}</h4>
                        <p className="text-xs text-black/70 dark:text-white/75 mt-1 line-clamp-2">{slot.hubLocation}</p>
                      </div>

                      {/* Amenities */}
                      <div className="text-xs text-black/70 dark:text-white/75 flex items-center gap-2 pt-1 border-t border-slate-300 dark:border-zinc-600">
                        <span className="flex items-center gap-1 text-black dark:text-white">
                          <Zap className="w-3 h-3 text-black/70 dark:text-white/75" /> Elektrik
                        </span>
                        <span aria-hidden="true" className="text-black/35 dark:text-white/35">·</span>
                        <span className="flex items-center gap-1 text-black dark:text-white">
                          <Wifi className="w-3 h-3 text-black dark:text-white" /> WiFi 500M
                        </span>
                        <span aria-hidden="true" className="text-black/35 dark:text-white/35">·</span>
                        <span className="text-black/70 dark:text-white/75">{slot.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex items-center justify-between border-t border-slate-300 dark:border-zinc-600">
                    <div>
                      <div className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold">Kadar Sewaan Bersubsidi</div>
                      <div className="text-sm sm:text-base font-extrabold text-black dark:text-white/75 tabular-nums">
                        RM{slot.dailyRate} <span className="text-xs text-black/70 dark:text-white/75 font-normal">/ hari</span>
                      </div>
                    </div>
                  </div>

                </div>
              ));
            })()}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PREVIEW DIREKTORI USAHAWAN BELIA */}
      {/* ========================================================================= */}
      <section id="direktori" className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <div className="absolute inset-0 bg-grid-pattern opacity-45 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
                <Store className="w-3.5 h-3.5" />
                <span>Direktori Produk Tempatan</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white mt-1 text-balance">
                Karya & Produk Belia Kelantan
              </h2>
              <p className="text-xs sm:text-sm text-black dark:text-white/75 mt-1">
                Sokong produk usahawan muda merentasi pelbagai sektor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.slice(0, 3).map((biz) => (
              <div 
                key={biz.id}
                onClick={() => onSelectBusiness(biz)}
                className="kbelia-glass-card interactive-card rounded-2xl p-5 sm:p-6 hover:border-blue-400/70 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={biz.logoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${biz.id}`}
                      alt={biz.businessName}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] text-black dark:text-white/75 font-bold uppercase tracking-wide">{biz.category}</div>
                      <h4 className="text-sm font-bold text-black dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                        {biz.businessName}
                      </h4>
                      <div className="text-[11px] text-black/70 dark:text-white/75 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-black dark:text-white" />
                        <span>{biz.district}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-black dark:text-white line-clamp-2">
                    {biz.description || biz.tagline}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-300 dark:border-zinc-600 mt-3 flex items-center justify-between text-xs">
                  <span className="text-black dark:text-white/75 text-[11px]">{biz.ownerName}</span>
                  <span className="text-[11px] font-semibold text-black dark:text-white bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/70">
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
      <section id="faq" className="py-16 sm:py-24 border-b border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center space-y-2.5 mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan & Panduan</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
              Soalan Lazim
            </h2>
            <p className="text-xs sm:text-sm text-black dark:text-white/75">
              Jawapan pantas mengenai permohonan kiosk, geran, mentor, dan direktori.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="kbelia-glass-card rounded-2xl overflow-hidden transition-colors hover:border-blue-400/70 dark:hover:border-blue-400/70"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-black dark:text-white hover:bg-amber-50/50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-black/70 dark:text-white/75 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-black dark:text-white' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-black dark:text-white leading-relaxed border-t border-slate-300 dark:border-zinc-600 pt-3 bg-white dark:bg-zinc-900">
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
      {/* 10. FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="kbelia-important-header relative overflow-hidden py-16 sm:py-24 text-black dark:text-white border-b border-slate-300 dark:border-zinc-600 transition-colors">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-blue-500/12 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Permohonan 2026/2027 Dibuka</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white text-balance">
            Mulakan Langkah Anda Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-black dark:text-white max-w-xl mx-auto leading-relaxed">
            Sertai usahawan muda Kelantan yang menggunakan fasiliti kiosk modular, bimbingan mentor, dan direktori negeri.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="landing-cta-register-btn"
              onClick={() => navigateToPage('register')}
              className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer active:scale-98 dark:bg-teal-600"
            >
              <Users className="w-4 h-4" />
              <span>{isBM ? 'Daftar Percuma' : 'Register Free'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToPage('login')}
              className="px-6 py-3 rounded-lg bg-white hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <LogIn className="w-4 h-4 text-black dark:text-white/75" />
              <span>{isBM ? 'Log Masuk' : 'Log In'}</span>
            </button>
          </div>

          <div className="pt-2 text-xs text-black dark:text-white/75 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-black dark:text-white/75" />
              <span>Inisiatif Kerajaan Negeri</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-black dark:text-white/75" />
              <span>Tiada Caj Tersembunyi</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-black dark:text-white/75" />
              <span>Semakan Digital Pantas</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. COMPREHENSIVE INSTITUTIONAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-white dark:bg-zinc-950 text-black dark:text-white text-xs border-t border-slate-300 dark:border-zinc-600">

        {/* 4-Column Footer Content */}
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Identity & Intro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs dark:bg-blue-600">
                KB
              </div>
              <span className="text-base font-black text-black dark:text-white tracking-tight">KBelia Kelantan</span>
            </div>
            <p className="text-xs text-black dark:text-white/75 leading-relaxed">
              Portal rasmi kiosk modular, direktori pasaran, dan geran usahawan belia Negeri Kelantan.
            </p>
            <div className="pt-2 text-[11px] text-black/70 dark:text-white/75">
              Kompleks Kota Darulnaim, 15503 Kota Bharu, Kelantan Darul Naim.
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-black dark:text-white">Navigasi Portal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">Laman Utama</a>
              </li>
              <li>
                <button type="button" onClick={() => navigateToPage('register')} className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer">Daftar Akaun Usahawan</button>
              </li>
              <li>
                <button type="button" onClick={() => navigateToPage('login')} className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer">Log Masuk Sistem</button>
              </li>
              <li>
                <a href="#kiosk" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">Kiosk Belia Modular</a>
              </li>
              <li>
                <a href="#direktori" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">Direktori Usahawan</a>
              </li>
              <li>
                <a href="#ciri-utama" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">Ciri-Ciri Utama</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-black dark:text-white dark:hover:text-white transition-colors">Soalan Lazim (FAQ)</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Policy */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-black dark:text-white">Perundangan</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Dasar Privasi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terma & Syarat
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Keselamatan Data
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="hover:text-black dark:text-white dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Penafian Rasmi
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-black dark:text-white">Hubungi Pentadbir</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-black dark:text-white">
                <Phone className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                <span>+60 9-748 1000 (Pejabat Pentadbiran)</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white">
                <Mail className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                <span>urusetia@kbelia.kelantan.gov.my</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white">
                <Clock className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                <span>Ahad - Rabu: 8.00 pagi - 5.00 petang</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <div className="text-[10px] uppercase font-bold text-black dark:text-white/75 mb-2">Ikuti Media Sosial</div>
              <div className="flex items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-transparent flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white transition-colors"
                  title="Facebook KBelia"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-transparent flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white transition-colors"
                  title="Instagram KBelia"
                >
                  <Sparkles className="w-4 h-4" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-transparent flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white transition-colors"
                  title="TikTok KBelia"
                >
                  <Video className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/601123456789"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-transparent flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white transition-colors"
                  title="WhatsApp Khidmat Bantuan"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-slate-300 dark:border-slate-600 py-6 text-center text-[11px] text-black/70 dark:text-white/75">
          <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              Hak Cipta Terpelihara © {new Date().getFullYear()} Kerajaan Negeri Kelantan · Inisiatif Ekonomi Belia.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-black dark:text-white/75">Versi 2.4.0</span>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="hover:text-black dark:text-white dark:hover:text-white transition-colors cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setLegalModalType(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 kbelia-important-header dark:bg-slate-800 text-black dark:text-white flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
              <h3 className="font-extrabold text-base text-black dark:text-white">
                {legalModalType === 'privacy' ? 'Dasar Privasi & Perlindungan Data' : 'Terma & Syarat Perkhidmatan'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-600 text-black dark:text-white hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs text-black dark:text-white space-y-4 max-h-[60vh] overflow-y-auto leading-relaxed">
              {legalModalType === 'privacy' ? (
                <>
                  <p className="font-bold text-black dark:text-white">
                    1. Pengenalan & Komitmen Privasi
                  </p>
                  <p>
                    Portal KBelia diuruskan oleh Pentadbir KBelia Negeri Kelantan. Kami komited untuk melindungi data peribadi anda mengikut Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.
                  </p>
                  <p className="font-bold text-black dark:text-white">
                    2. Pengumpulan Data Peribadi
                  </p>
                  <p>
                    Data yang dikumpulkan termasuk nama penuh, nombor kad pengenalan, nombor pendaftaran SSM, lokasi perniagaan, nombor telefon dan maklumat akaun bank pemohon bagi tujuan penyaluran geran dan pengurusan sewaan kiosk.
                  </p>
                  <p className="font-bold text-black dark:text-white">
                    3. Keselamatan & Perlindungan Data
                  </p>
                  <p>
                    Semua maklumat disimpan dalam pelayan awan berpusat berstandard keselamatan tinggi. Kami tidak akan menjual atau berkongsi maklumat anda dengan mana-mana pihak ketiga tanpa kebenaran bertulis.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-black dark:text-white">
                    1. Syarat Kelayakan Pengguna
                  </p>
                  <p>
                    Pengguna mestilah warganegara Malaysia berumur antara 18 hingga 40 tahun yang beroperasi atau menetap di negeri Kelantan Darul Naim.
                  </p>
                  <p className="font-bold text-black dark:text-white">
                    2. Tanggungjawab Penyewa Kiosk
                  </p>
                  <p>
                    Penyewa bertanggungjawab menjaga kebersihan, keselamatan peralatan, dan mematuhi peraturan waktu operasi yang ditetapkan oleh pihak pengurusan hab dan pihak berkuasa tempatan (PBT).
                  </p>
                  <p className="font-bold text-black dark:text-white">
                    3. Integriti Permohonan Geran
                  </p>
                  <p>
                    Sebarang maklumat palsu dalam permohonan Geran Permulaan boleh mengakibatkan pembatalan geran serta-merta dan tindakan undang-undang di bawah peraturan pentadbiran negeri.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-600 text-right">
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer dark:bg-blue-600"
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
