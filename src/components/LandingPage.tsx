import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  LogIn,
  Globe,
  Clock,
  MapPin,
  Mail,
  Phone,
  X,
  Sun,
  Moon,
  Compass,
  Video,
  Camera
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { CapsuleSlot, BusinessListing, YouthProgram, formatBusinessCategory } from '../types';
import { INITIAL_CAPSULE_SLOTS } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useMotion';
import { showToast } from './ToastNotification';
import { KBeliaLogo } from './KBeliaLogo';
import { AcronymText } from './TypographyPrimitives';
import heroArtisanImg from '../assets/images/kbelia_hero_kiosk_artisan_1795363091257.jpg';
import communityHubImg from '../assets/images/kbelia_community_hub_1795363091755.jpg';

const RevealBlock: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}> = ({ children, className = '', delayMs = 0 }) => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal-section ${isVisible ? 'is-revealed' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

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
  onSelectSlot,
  onSelectBusiness,
}) => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isBM = language === 'ms';

  // Signature landing atmosphere defaults to soft warm obsidian-charcoal with emerald & gold gradients
  const [isEditorialDark, setIsEditorialDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kbelia_landing_tone');
      if (saved === 'light' || saved === 'dark') {
        return saved === 'dark';
      }
    } catch {
      // ignore storage failure
    }
    return true;
  });

  const toggleEditorialTone = () => {
    setIsEditorialDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('kbelia_landing_tone', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const markImageFailed = (key: string) => {
    setFailedImages(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const navigateToPage = (tab: UMKTab) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setActiveTab(tab);
  };

  const requireBeliaLogin = (message: string) => {
    showToast({
      type: 'info',
      title: isBM ? 'Akses Komuniti KBelia' : 'KBelia Community Access',
      message,
    });
    navigateToPage('login');
  };

  // Hero visual showcase slides (general, concise, natural formal copy)
  const heroSlides = isBM
    ? [
        {
          id: 'slide-1',
          location: 'Kota Bharu · Kiosk Kraf & Runcit',
          title: 'Kiosk Moden Untuk Usahawan Muda',
          description:
            'Tapak jualan sedia guna untuk produk tempatan dan jenama belia di seluruh Kelantan.',
          imageUrl: heroArtisanImg,
          ctaText: 'Lihat Lokasi Kiosk',
          onAction: () => {
            const el = document.getElementById('kiosk');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'slide-2',
          location: 'Kota Bharu · Batik & Fesyen Tempatan',
          title: 'Produk & Kraf Anak Muda',
          description:
            'Sertai usahawan muda Kelantan memasarkan produk tempatan terus kepada pelanggan.',
          imageUrl: '/assets/generated/batik_canting_kelantan.jpg',
          ctaText: 'Lihat Kedai Belia',
          onAction: () => {
            const el = document.getElementById('direktori');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'slide-3',
          location: 'Bachok · Kopi & Makanan Belia',
          title: 'Kafe Kopi & Makanan Belia',
          description:
            'Mulakan kedai pertama anda dengan kemudahan asas lengkap serta bimbingan mentor.',
          imageUrl: '/assets/generated/kopi_nissem_melaka.jpg',
          ctaText: 'Daftar Akaun Belia',
          onAction: () => navigateToPage('register'),
        },
      ]
    : [
        {
          id: 'slide-1',
          location: 'Kota Bharu · Craft & Retail Kiosks',
          title: 'Modern Kiosks for Young Founders',
          description:
            'Move-in retail kiosks for local products and youth brands across Kelantan.',
          imageUrl: heroArtisanImg,
          ctaText: 'See Kiosk Locations',
          onAction: () => {
            const el = document.getElementById('kiosk');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'slide-2',
          location: 'Kota Bharu · Local Batik & Fashion',
          title: 'Youth-Made Crafts & Products',
          description:
            'Join young Kelantan entrepreneurs selling original local products directly to customers.',
          imageUrl: '/assets/generated/batik_canting_kelantan.jpg',
          ctaText: 'Browse Youth Shops',
          onAction: () => {
            const el = document.getElementById('direktori');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'slide-3',
          location: 'Bachok · Coffee & Food Startups',
          title: 'Youth Coffee & Food Startups',
          description:
            'Start your first shop with essential facilities and practical mentor support.',
          imageUrl: '/assets/generated/kopi_nissem_melaka.jpg',
          ctaText: 'Create Youth Account',
          onAction: () => navigateToPage('register'),
        },
      ];

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, heroSlides.length]);

  const activeSlide = heroSlides[currentSlide];

  // Editorial community photography ribbon
  const galleryRibbon = [
    {
      id: 'rib-1',
      img: heroArtisanImg,
      title: isBM ? 'Kedai Kraf & Anyaman' : 'Craft & Weaving Kiosk',
      meta: 'Kota Bharu · Kraf',
      target: 'academic' as UMKTab,
    },
    {
      id: 'rib-2',
      img: '/assets/generated/batik_canting_kelantan.jpg',
      title: isBM ? 'Batik Moden Belia' : 'Modern Youth Batik',
      meta: 'Kota Bharu · Fesyen',
      target: 'hepa' as UMKTab,
    },
    {
      id: 'rib-3',
      img: '/assets/generated/kopi_nissem_melaka.jpg',
      title: isBM ? 'Kafe Kopi & Kuih Tempatan' : 'Local Coffee & Pastry Shop',
      meta: 'Bachok · Makanan',
      target: 'hepa' as UMKTab,
    },
    {
      id: 'rib-4',
      img: communityHubImg,
      title: isBM ? 'Hab Kiosk Usahawan Belia' : 'Youth Entrepreneur Kiosk Hub',
      meta: 'Kelantan · Hab Kiosk',
      target: 'academic' as UMKTab,
    },
    {
      id: 'rib-5',
      img: '/assets/generated/akok_kelantan_tradisi.jpg',
      title: isBM ? 'Jualan Kuih Tradisi' : 'Traditional Kuih Business',
      meta: 'Pasir Mas · Makanan',
      target: 'hepa' as UMKTab,
    },
    {
      id: 'rib-6',
      img: '/assets/generated/kiosk_modular_kbelia.jpg',
      title: isBM ? 'Unit Kiosk Sedia Masuk' : 'Move-In Ready Kiosk Units',
      meta: 'Bachok · Hab Belia',
      target: 'academic' as UMKTab,
    },
  ];

  // Core benefits (general, concise, natural formal language)
  const storyChapters = isBM
    ? [
        {
          num: '01',
          title: 'Sewa Kiosk Mampu Milik',
          body: 'Dapatkan tapak niaga moden di lokasi tumpuan seluruh negeri Kelantan dengan kadar sewa berpatutan.',
        },
        {
          num: '02',
          title: 'Khidmat Nasihat Mentor',
          body: 'Tempah sesi bimbingan percuma bersama mentor untuk membantu perancangan, harga dan pemasaran kedai anda.',
        },
        {
          num: '03',
          title: 'Daftar Perniagaan & Profil Digital',
          body: 'Ikut langkah mudah untuk mendaftar perniagaan dan berkongsi profil kedai anda bersama pelanggan.',
        },
        {
          num: '04',
          title: 'Bantuan Modal & Rekod Jualan',
          body: 'Semak kelayakan bantuan modal belia, hantar permohonan dan pantau jualan harian di satu tempat.',
        },
      ]
    : [
        {
          num: '01',
          title: 'Affordable Youth Kiosks',
          body: 'Access modern retail spaces at busy locations across Kelantan with affordable rent.',
        },
        {
          num: '02',
          title: 'Free Mentor Guidance',
          body: 'Book free coaching sessions with mentors to plan your pricing, operations, and marketing.',
        },
        {
          num: '03',
          title: 'Business Setup & Digital Profile',
          body: 'Follow simple steps to register your business and share your digital shop card with customers.',
        },
        {
          num: '04',
          title: 'Startup Grants & Sales Tracking',
          body: 'Check grant eligibility, submit funding applications, and keep track of daily sales in one place.',
        },
      ];

  // Pick 3 showcase kiosk slots cleanly
  const displaySlots = (() => {
    const av = slots.filter(slot => slot.status === 'available');
    const fallbackAvailable = INITIAL_CAPSULE_SLOTS.filter(s => s.status === 'available');
    const combined = [...av, ...fallbackAvailable.filter(f => !av.some(a => a.id === f.id))];
    return (combined.length >= 3 ? combined : slots).slice(0, 3);
  })();

  const leadSlot = displaySlots[0];
  const secondarySlots = displaySlots.slice(1, 3);

  // Local theme token classes matching Soft Warm Obsidian-Emerald+Gold vs Warm Ivory+Emerald
  const surfaceTextPrimary = isEditorialDark ? 'text-[#F4F1EA]' : 'text-[#16221D]';
  const surfaceTextMuted = isEditorialDark ? 'text-[#B8B4AA]' : 'text-[#4F5A55]';
  const hairlineBorder = isEditorialDark ? 'border-[#E5B85C]/15' : 'border-[#0B6E52]/14';
  const hairlineBorderStrong = isEditorialDark ? 'border-[#E5B85C]/25' : 'border-[#0B6E52]/22';
  const cardSurface = isEditorialDark
    ? 'bg-[#17201D]/85 border border-[#E5B85C]/16 hover:border-emerald-400/45'
    : 'bg-white/90 border border-[#0B6E52]/14 hover:border-[#0B6E52]/40 shadow-[0_6px_24px_-12px_rgba(16,42,33,0.12)]';
  const softAccentWash = isEditorialDark
    ? 'bg-gradient-to-br from-[#162922]/90 via-[#151F1C]/90 to-[#272115]/85'
    : 'bg-gradient-to-br from-[#EDF5F1] via-[#F7F4EC] to-[#F5EBD6]';

  return (
    <div
      id="kbelia-landing-root"
      className={`min-h-screen flex flex-col font-editorial antialiased transition-colors duration-300 ${
        isEditorialDark ? 'kbelia-editorial-dark' : 'kbelia-editorial-light'
      } selection:bg-emerald-600 selection:text-white`}
    >
      {/* ================================================================= */}
      {/* 1. CLEAN 3-ZONE EDITORIAL TOP BAR                                 */}
      {/* ================================================================= */}
      <header
        className={`sticky top-0 z-40 h-16 backdrop-blur-md border-b transition-colors duration-300 ${
          isEditorialDark
            ? 'bg-[#101614]/88 border-[#E5B85C]/15'
            : 'bg-[#F7F5F0]/90 border-[#0B6E52]/15'
        }`}
      >
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-8">
          {/* Zone 1: Single Official Brand Lockup */}
          <a
            href="#hero"
            className="justify-self-start whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            aria-label="KBelia Kelantan"
          >
            <KBeliaLogo size="md" tone={isEditorialDark ? 'onDark' : 'onLight'} />
          </a>

          {/* Zone 2: Centered Horizontal Navigation Links */}
          <nav
            aria-label={isBM ? 'Navigasi utama' : 'Primary navigation'}
            className={`hidden md:flex items-center justify-center justify-self-center gap-7 text-sm font-medium ${surfaceTextMuted}`}
          >
            <a
              href="#hero"
              className={`inline-flex items-center leading-none py-1.5 kbelia-link whitespace-nowrap shrink-0 transition-colors ${
                isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
              }`}
            >
              {isBM ? 'Utama' : 'Home'}
            </a>
            <a
              href="#inisiatif"
              className={`inline-flex items-center leading-none py-1.5 kbelia-link whitespace-nowrap shrink-0 transition-colors ${
                isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
              }`}
            >
              {isBM ? 'Kelebihan' : 'Benefits'}
            </a>
            <a
              href="#kiosk"
              className={`inline-flex items-center leading-none py-1.5 kbelia-link whitespace-nowrap shrink-0 transition-colors ${
                isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
              }`}
            >
              {isBM ? 'Lokasi Kiosk' : 'Kiosks'}
            </a>
            <a
              href="#direktori"
              className={`inline-flex items-center leading-none py-1.5 kbelia-link whitespace-nowrap shrink-0 transition-colors ${
                isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
              }`}
            >
              {isBM ? 'Kedai Belia' : 'Youth Shops'}
            </a>
          </nav>

          {/* Zone 3: Theme Switcher, Language Switch & Primary Action */}
          <div className="flex items-center justify-self-end gap-2.5 shrink-0">
            <button
              id="landing-darkmode-toggle"
              type="button"
              onClick={toggleEditorialTone}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isEditorialDark
                  ? 'bg-[#18221F] border-[#E5B85C]/20 text-[#E5B85C] hover:bg-[#1F2C28]'
                  : 'bg-white border-[#0B6E52]/20 text-[#0B6E52] hover:bg-[#EDF5F1]'
              }`}
              title={
                isEditorialDark
                  ? isBM
                    ? 'Tukar ke Suasana Cerah Hangat'
                    : 'Switch to Warm Ivory'
                  : isBM
                    ? 'Tukar ke Suasana Gelap Lembut'
                    : 'Switch to Soft Charcoal'
              }
              aria-label={isBM ? 'Tukar suasana warna' : 'Switch color mood'}
            >
              {isEditorialDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div
              className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold shrink-0 ${
                isEditorialDark
                  ? 'bg-[#18221F] border-[#E5B85C]/20'
                  : 'bg-white border-[#0B6E52]/20'
              }`}
            >
              <button
                type="button"
                onClick={() => setLanguage('ms')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isBM
                    ? 'bg-emerald-700 text-white'
                    : `${surfaceTextMuted} ${isEditorialDark ? 'hover:text-white' : 'hover:text-slate-900'}`
                }`}
              >
                BM
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  !isBM
                    ? 'bg-emerald-700 text-white'
                    : `${surfaceTextMuted} ${isEditorialDark ? 'hover:text-white' : 'hover:text-slate-900'}`
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              id="landing-login-btn"
              onClick={() => navigateToPage('login')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isEditorialDark
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-[#F4F1EA]'
                  : 'bg-[#0B6E52] hover:bg-[#085640] text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isBM ? 'Log Masuk' : 'Sign In'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. ASYMMETRICAL EDITORIAL HERO                                    */}
      {/* ================================================================= */}
      <section id="hero" className={`relative pt-10 pb-14 sm:pt-14 sm:pb-20 border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 lg:gap-10">
            {/* Top Centered Editorial Narrative */}
            <div className="max-w-3xl w-full mx-auto text-center space-y-5 flex flex-col items-center">
              <p className={`text-xs sm:text-sm font-semibold tracking-wide ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#9A6B19]'}`}>
                {isBM
                  ? 'Kelantan · Portal Usahawan Belia'
                  : 'Kelantan · Youth Business Portal'}
              </p>

              <h1
                className={`font-display text-fluid-hero font-bold tracking-tight text-balance kbelia-trim ${surfaceTextPrimary}`}
              >
                {isBM
                  ? 'Portal Rasmi Usahawan Belia Kelantan'
                  : 'Official Kelantan Youth Business Portal'}
              </h1>

              <p className={`text-fluid-lead max-w-2xl mx-auto kbelia-prose ${surfaceTextMuted}`}>
                <AcronymText
                  text={
                    isBM
                      ? 'Mohon tapak kiosk belia, dapatkan bantuan modal dan terima bimbingan terus daripada mentor.'
                      : 'Apply for youth kiosks, get startup grants, and receive practical advice from mentors.'
                  }
                />
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                <button
                  type="button"
                  id="landing-register-nav-btn"
                  onClick={() => navigateToPage('register')}
                  className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 interactive-press ${
                    isEditorialDark
                      ? 'bg-[#E5B85C] hover:bg-[#EDC878] text-[#111916]'
                      : 'bg-[#0B6E52] hover:bg-[#085640] text-white'
                  }`}
                >
                  <span>{isBM ? 'Daftar Sekarang' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Typographic Context Strip (Unboxed) */}
              <div className={`pt-5 border-t ${hairlineBorder} w-full flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm ${surfaceTextMuted}`}>
                <span>{isBM ? 'Seluruh Negeri Kelantan' : 'Across Kelantan'}</span>
                <span aria-hidden="true">·</span>
                <span>{isBM ? 'Sewa Kiosk Berpatutan' : 'Affordable Kiosks'}</span>
                <span aria-hidden="true">·</span>
                <span>{isBM ? 'Bantuan Modal & Mentor' : 'Grants & Mentoring'}</span>
              </div>
            </div>

            {/* Bottom Full-Bleed Compact Visual Showcase Carousel */}
            <div
              className="w-full"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div
                className={`relative rounded-2xl overflow-hidden border ${hairlineBorderStrong} shadow-2xl group`}
              >
                <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:max-h-[440px] w-full overflow-hidden bg-[#15201C]">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                        index === currentSlide
                          ? 'opacity-100 z-10'
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {!failedImages[`hero-${slide.id}`] ? (
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(`hero-${slide.id}`)}
                          className={`w-full h-full object-cover object-center ${
                            index === currentSlide ? 'animate-hero-ken-burns' : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#14362B] via-[#1C2A24] to-[#3B2E17] flex items-center justify-center p-8 text-[#F4F1EA]">
                          <div className="text-center space-y-2">
                            <KBeliaLogo size="xl" tone="onDark" />
                            <p className="text-sm text-[#C2BDB2]">{slide.title}</p>
                          </div>
                        </div>
                      )}
                      {/* Measured contrast scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B100E]/92 via-[#0B100E]/35 to-transparent" />
                    </div>
                  ))}
                </div>

                {/* Prev / Next Clean Controls */}
                <button
                  type="button"
                  onClick={() => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#101614]/75 hover:bg-[#101614] text-[#F4F1EA] flex items-center justify-center border border-white/20 transition-opacity opacity-85 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                  aria-label={isBM ? 'Gambar sebelumnya' : 'Previous photo'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide(prev => (prev + 1) % heroSlides.length)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#101614]/75 hover:bg-[#101614] text-[#F4F1EA] flex items-center justify-center border border-white/20 transition-opacity opacity-85 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                  aria-label={isBM ? 'Gambar seterusnya' : 'Next photo'}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Caption & Slide Controls */}
                <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1.5 max-w-lg">
                    <p className="text-xs font-medium text-[#E5B85C]">{activeSlide.location}</p>
                    <h2
                      title={activeSlide.title}
                      className="font-display text-fluid-card font-bold text-[#F4F1EA] kbelia-clamp-2 kbelia-trim"
                    >
                      {activeSlide.title}
                    </h2>
                    <p className="text-sm text-[#D6D2C9] kbelia-clamp-2 kbelia-prose leading-relaxed">
                      <AcronymText text={activeSlide.description} />
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      type="button"
                      onClick={activeSlide.onAction}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4F1EA] hover:text-[#E5B85C] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{activeSlide.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {heroSlides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setCurrentSlide(idx)}
                          aria-label={`${idx + 1}: ${slide.title}`}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === currentSlide
                              ? 'w-7 bg-[#E5B85C]'
                              : 'w-2 bg-white/40 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. FLOWING COMMUNITY PHOTOGRAPHY RIBBON                           */}
      {/* ================================================================= */}
      <section className={`py-8 overflow-hidden border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Camera className={`w-4 h-4 ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#0B6E52]'}`} />
            <span className={surfaceTextPrimary}>
              {isBM ? 'Aktiviti & Kedai Usahawan Belia' : 'Youth Shops & Community Highlights'}
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="animate-marquee-left flex gap-5 pr-5 py-1">
            {[...galleryRibbon, ...galleryRibbon].map((item, idx) => (
              <button
                type="button"
                key={`${item.id}-${idx}`}
                onClick={() => {
                  if (!user) {
                    requireBeliaLogin(
                      isBM
                        ? 'Sila log masuk untuk melihat direktori penuh usahawan dan lokasi kiosk.'
                        : 'Please sign in to explore the full community directory and kiosk locations.'
                    );
                    return;
                  }
                  navigateToPage(item.target);
                }}
                className="w-64 sm:w-72 shrink-0 text-left group cursor-pointer focus-visible:outline-none"
              >
                <div className={`relative aspect-[16/10] rounded-xl overflow-hidden border ${hairlineBorder} bg-[#18211E]`}>
                  {!failedImages[`rib-${item.id}`] ? (
                    <img
                      src={item.img}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed(`rib-${item.id}`)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900/60 to-amber-900/40" />
                  )}
                </div>
                <div className="pt-2.5 px-0.5 space-y-0.5">
                  <div className={`text-xs ${surfaceTextMuted}`}>{item.meta}</div>
                  <div
                    title={item.title}
                    className={`text-sm font-semibold kbelia-clamp-1 ${surfaceTextPrimary} group-hover:underline`}
                  >
                    {item.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. ASYMMETRICAL ECOSYSTEM NARRATIVE (REPLACES RIGID BOX GRIDS)     */}
      {/* ================================================================= */}
      <section id="inisiatif" className={`py-16 sm:py-24 border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Lead Story Column (5 columns) */}
            <RevealBlock className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <p className={`text-xs sm:text-sm font-semibold ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#9A6B19]'}`}>
                {isBM ? 'Apa Yang Anda Dapat' : 'What You Get'}
              </p>

              <h2 className={`font-display text-fluid-title font-bold text-balance kbelia-trim ${surfaceTextPrimary}`}>
                {isBM
                  ? 'Semua Keperluan Asas Untuk Mula Berniaga'
                  : 'Everything You Need to Start Business'}
              </h2>

              <p className={`text-fluid-lead kbelia-prose ${surfaceTextMuted}`}>
                <AcronymText
                  text={
                    isBM
                      ? 'Mulakan perniagaan tanpa modal besar. KBelia menyediakan tapak kiosk, bantuan dana dan bimbingan mentor di satu portal.'
                      : 'Start your business without heavy upfront costs. KBelia brings together kiosks, funding, and mentoring in one portal.'
                  }
                />
              </p>

              <div className={`relative aspect-[16/10] rounded-2xl overflow-hidden border ${hairlineBorderStrong} mt-2`}>
                {!failedImages['story-hub'] ? (
                  <img
                    src={communityHubImg}
                    alt={isBM ? 'Suasana hab kiosk usahawan belia Kelantan' : 'Kelantan youth entrepreneur kiosk hub'}
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed('story-hub')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#16382C] to-[#322714]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B100E]/75 via-transparent to-transparent" />
                <p className="absolute bottom-3.5 left-4 right-4 text-xs sm:text-sm text-[#F4F1EA]/90 font-medium">
                  {isBM
                    ? 'Hab kiosk belia lengkap dengan kawasan jualan, pengunjung dan sesi bimbingan.'
                    : 'Youth kiosk hubs connecting founders, mentors, and local shoppers.'}
                </p>
              </div>
            </RevealBlock>

            {/* Right Flowing Editorial List (7 columns, unboxed with hairline dividers) */}
            <RevealBlock delayMs={80} className="lg:col-span-7">
              <div className={`border-t ${hairlineBorder}`}>
                {storyChapters.map(chapter => (
                  <article
                    key={chapter.num}
                    className={`py-7 sm:py-8 border-b ${hairlineBorder} grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline group`}
                  >
                    <div className="sm:col-span-2">
                      <span
                        className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${
                          isEditorialDark ? 'text-[#E5B85C]' : 'text-[#0B6E52]'
                        }`}
                      >
                        {chapter.num}.
                      </span>
                    </div>
                    <div className="sm:col-span-10 space-y-2">
                      <h3 className={`font-display text-fluid-card font-bold kbelia-trim ${surfaceTextPrimary}`}>
                        {chapter.title}
                      </h3>
                      <p className={`text-[0.95rem] sm:text-base leading-relaxed kbelia-prose ${surfaceTextMuted}`}>
                        <AcronymText text={chapter.body} />
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. ASYMMETRICAL SPACES SHOWCASE (#kiosk)                          */}
      {/* ================================================================= */}
      <section id="kiosk" className={`py-16 sm:py-24 border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
          <RevealBlock className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-xs sm:text-sm font-semibold ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#9A6B19]'}`}>
                {isBM ? 'Pilihan Tapak Niaga' : 'Available Hubs'}
              </p>
              <h2 className={`font-display text-fluid-title font-bold text-balance kbelia-trim ${surfaceTextPrimary}`}>
                {isBM ? 'Pilih Lokasi Kiosk Anda' : 'Pick Your Kiosk Location'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigateToPage('login')}
              className={`inline-flex items-center gap-2 text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0 kbelia-link transition-colors ${
                isEditorialDark
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-[#0B6E52] hover:text-[#085640]'
              }`}
            >
              <span>{isBM ? 'Log masuk untuk mohon kiosk' : 'Sign in to book a kiosk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </RevealBlock>

          {/* Asymmetric 12-Col Layout: 1 Large Feature + 2 Stacked Features */}
          <RevealBlock delayMs={80} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {leadSlot && (
              <div
                onClick={() => {
                  if (!user) {
                    requireBeliaLogin(
                      isBM
                        ? 'Sila log masuk akaun Belia untuk lihat maklumat kiosk dan buat tempahan.'
                        : 'Please sign in with a Belia account to view kiosk details and book.'
                    );
                    return;
                  }
                  onSelectSlot(leadSlot);
                }}
                className={`lg:col-span-7 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 cursor-pointer group ${cardSurface}`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#18211E]">
                  <img
                    src={leadSlot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg'}
                    alt={leadSlot.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1311]/70 via-transparent to-transparent" />
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div className={`flex items-center gap-2 text-xs sm:text-sm ${surfaceTextMuted}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{leadSlot.district}</span>
                    <span aria-hidden="true">·</span>
                    <span>{leadSlot.size}</span>
                  </div>

                  <div>
                    <h3 className={`font-display text-2xl font-bold ${surfaceTextPrimary}`}>
                      {leadSlot.name}
                    </h3>
                    <p className={`text-sm sm:text-[0.95rem] mt-1.5 leading-relaxed ${surfaceTextMuted}`}>
                      {leadSlot.hubLocation}
                    </p>
                  </div>

                  <div className={`pt-4 border-t ${hairlineBorder} flex items-center justify-between gap-4`}>
                    <div>
                      <span className={`text-xs block ${surfaceTextMuted}`}>
                        {isBM ? 'Kadar sewa bermula' : 'Rent starts at'}
                      </span>
                      <span className={`font-display text-lg font-bold tabular-nums ${surfaceTextPrimary}`}>
                        RM{leadSlot.dailyRate}{' '}
                        <span className={`text-sm font-normal ${surfaceTextMuted}`}>
                          / {isBM ? 'hari' : 'day'}
                        </span>
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                        isEditorialDark ? 'text-[#E5B85C]' : 'text-[#0B6E52]'
                      }`}
                    >
                      <span>{isBM ? 'Lihat Kiosk' : 'View Kiosk'}</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="lg:col-span-5 flex flex-col gap-6">
              {secondarySlots.map(slot => (
                <div
                  key={slot.id}
                  onClick={() => {
                    if (!user) {
                      requireBeliaLogin(
                        isBM
                          ? 'Sila log masuk akaun Belia untuk melihat butiran penuh ruang niaga dan membuat tempahan.'
                          : 'Please sign in with a Belia account to view space details and book.'
                      );
                      return;
                    }
                    onSelectSlot(slot);
                  }}
                  className={`flex-1 rounded-2xl overflow-hidden flex flex-col sm:flex-row lg:flex-col xl:flex-row transition-all duration-300 cursor-pointer group ${cardSurface}`}
                >
                  <div className="sm:w-44 lg:w-full xl:w-44 h-44 sm:h-auto lg:h-40 xl:h-auto shrink-0 overflow-hidden bg-[#18211E]">
                    <img
                      src={slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg'}
                      alt={slot.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1.5">
                      <div className={`text-xs ${surfaceTextMuted}`}>
                        {slot.district} · {slot.size}
                      </div>
                      <h3
                        title={slot.name}
                        className={`font-display text-fluid-card font-bold kbelia-clamp-2 kbelia-trim ${surfaceTextPrimary}`}
                      >
                        {slot.name}
                      </h3>
                      <p className={`text-sm kbelia-clamp-2 kbelia-prose ${surfaceTextMuted}`}>
                        {slot.hubLocation}
                      </p>
                    </div>

                    <div className={`pt-3 border-t ${hairlineBorder} flex items-center justify-between text-sm`}>
                      <span className={`font-bold tabular-nums ${surfaceTextPrimary}`}>
                        RM{slot.dailyRate}
                        <span className={`font-normal text-xs ${surfaceTextMuted}`}>
                          {' '}
                          / {isBM ? 'hari' : 'day'}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isEditorialDark ? 'text-emerald-400' : 'text-[#0B6E52]'
                        }`}
                      >
                        <span>{isBM ? 'Butiran' : 'Details'}</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. CREATOR DIRECTORY SPOTLIGHT (#direktori)                       */}
      {/* ================================================================= */}
      <section id="direktori" className={`py-16 sm:py-24 border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
          <RevealBlock className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-xs sm:text-sm font-semibold ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#9A6B19]'}`}>
                {isBM ? 'Kedai & Produk Tempatan' : 'Local Youth Brands'}
              </p>
              <h2 className={`font-display text-fluid-title font-bold text-balance kbelia-trim ${surfaceTextPrimary}`}>
                {isBM ? 'Sokong Bisnes Anak Muda Kelantan' : 'Explore Kelantan Youth Businesses'}
              </h2>
              <p className={`text-fluid-lead kbelia-prose ${surfaceTextMuted}`}>
                {isBM
                  ? 'Kenali usahawan muda tempatan, lihat produk mereka dan hubungi terus melalui WhatsApp.'
                  : 'Discover local youth-run businesses, browse their products, and message them on WhatsApp.'}
              </p>
            </div>
          </RevealBlock>

          <RevealBlock delayMs={80} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businesses.slice(0, 3).map((biz, idx) => {
              const fallbackPhoto =
                idx === 0
                  ? '/assets/generated/kopi_nissem_melaka.jpg'
                  : idx === 1
                    ? '/assets/generated/batik_canting_kelantan.jpg'
                    : '/assets/generated/akok_kelantan_tradisi.jpg';
              const displayImg =
                biz.logoUrl && !biz.logoUrl.includes('dicebear') ? biz.logoUrl : fallbackPhoto;

              return (
                <article
                  key={biz.id}
                  onClick={() => {
                    if (!user) {
                      requireBeliaLogin(
                        isBM
                          ? 'Sila log masuk akaun Belia untuk melihat profil penuh usahawan dan produk mereka.'
                          : 'Please sign in with a Belia account to explore shop profiles and catalogs.'
                      );
                      return;
                    }
                    onSelectBusiness(biz);
                  }}
                  className={`rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 cursor-pointer group ${cardSurface}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={displayImg}
                        alt={biz.businessName}
                        referrerPolicy="no-referrer"
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border ${hairlineBorder}`}
                      />
                      <div className="min-w-0">
                        <div className={`text-xs truncate ${surfaceTextMuted}`}>
                          <AcronymText text={formatBusinessCategory(biz.category)} /> · {biz.district}
                        </div>
                        <h3
                          title={biz.businessName}
                          className={`font-display text-fluid-card font-bold kbelia-clamp-2 kbelia-trim ${surfaceTextPrimary}`}
                        >
                          {biz.businessName}
                        </h3>
                      </div>
                    </div>

                    <p className={`text-sm sm:text-[0.9375rem] leading-relaxed kbelia-clamp-2 kbelia-prose ${surfaceTextMuted}`}>
                      <AcronymText text={biz.description || biz.tagline || ''} />
                    </p>
                  </div>

                  <div className={`pt-4 border-t ${hairlineBorder} flex items-center justify-between gap-3 text-sm`}>
                    <span className={`truncate font-medium ${surfaceTextPrimary}`}>{biz.ownerName}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                        isEditorialDark ? 'text-[#E5B85C]' : 'text-[#0B6E52]'
                      }`}
                    >
                      <span>{isBM ? 'Lihat Kedai' : 'View Shop'}</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </RevealBlock>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. SIMPLE JOURNEY & INVITATION CTA                                */}
      {/* ================================================================= */}
      <section className={`py-16 sm:py-24 border-b ${hairlineBorder}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <RevealBlock className={`rounded-3xl p-8 sm:p-12 lg:p-16 border ${hairlineBorderStrong} ${softAccentWash} space-y-10`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-3">
                <p className={`text-xs sm:text-sm font-semibold ${isEditorialDark ? 'text-[#E5B85C]' : 'text-[#9A6B19]'}`}>
                  {isBM ? 'Mula Hari Ini' : 'Start Today'}
                </p>
                <h2 className={`font-display text-fluid-title font-bold text-balance kbelia-trim ${surfaceTextPrimary}`}>
                  {isBM
                    ? 'Daftar Akaun & Mula Berniaga Sekarang'
                    : 'Sign Up & Start Selling Today'}
                </h2>
                <p className={`text-fluid-lead max-w-xl kbelia-prose ${surfaceTextMuted}`}>
                  <AcronymText
                    text={
                      isBM
                        ? 'Buka akaun percuma untuk mohon sewa kiosk, semak kelayakan geran dan senaraikan produk anda di direktori.'
                        : 'Create a free account to apply for a kiosk, check grant eligibility, and list your products in the directory.'
                    }
                  />
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
                <button
                  type="button"
                  id="landing-cta-register-btn"
                  onClick={() => navigateToPage('register')}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 interactive-press ${
                    isEditorialDark
                      ? 'bg-[#E5B85C] hover:bg-[#EDC878] text-[#111916]'
                      : 'bg-[#0B6E52] hover:bg-[#085640] text-white'
                  }`}
                >
                  <span>{isBM ? 'Daftar Akaun' : 'Sign Up'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateToPage('login')}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isEditorialDark
                      ? 'border-[#E5B85C]/30 text-[#F4F1EA] hover:bg-white/5'
                      : 'border-[#0B6E52]/30 text-[#16221D] hover:bg-white/70'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isBM ? 'Log Masuk' : 'Sign In'}</span>
                </button>
              </div>
            </div>

            {/* Clean 3-Moment Journey Strip */}
            <div className={`pt-8 border-t ${hairlineBorder} grid grid-cols-1 md:grid-cols-3 gap-6`}>
              <div className="space-y-1.5">
                <div className={`text-xs font-semibold ${isEditorialDark ? 'text-emerald-400' : 'text-[#0B6E52]'}`}>
                  01 · {isBM ? 'Daftar Akaun Percuma' : 'Create Free Account'}
                </div>
                <p className={`text-sm leading-relaxed ${surfaceTextMuted}`}>
                  {isBM
                    ? 'Isi maklumat asas anda dalam 1 minit untuk membuka akaun portal.'
                    : 'Enter your basic details in one minute to open your portal account.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className={`text-xs font-semibold ${isEditorialDark ? 'text-emerald-400' : 'text-[#0B6E52]'}`}>
                  02 · {isBM ? 'Mohon Kiosk & Isi Profil Kedai' : 'Apply for Kiosk & Set Up Shop'}
                </div>
                <p className={`text-sm leading-relaxed ${surfaceTextMuted}`}>
                  {isBM
                    ? 'Pilih lokasi kiosk yang sesuai dan senaraikan produk anda.'
                    : 'Choose a suitable kiosk location and list your business products.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className={`text-xs font-semibold ${isEditorialDark ? 'text-emerald-400' : 'text-[#0B6E52]'}`}>
                  03 · {isBM ? 'Rekod Jualan & Jumpa Mentor' : 'Track Sales & Meet Your Mentor'}
                </div>
                <p className={`text-sm leading-relaxed ${surfaceTextMuted}`}>
                  {isBM
                    ? 'Pantau jualan harian, mohon bantuan modal dan tempah sesi mentor.'
                    : 'Track daily sales, apply for grants, and book mentor sessions.'}
                </p>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. QUIET INSTITUTIONAL FOOTER                                     */}
      {/* ================================================================= */}
      <footer className={`text-sm transition-colors ${isEditorialDark ? 'bg-[#0C110F]' : 'bg-[#EFECE4]'}`}>
        <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <KBeliaLogo size="md" tone={isEditorialDark ? 'onDark' : 'onLight'} />
            <p className={`text-sm leading-relaxed ${surfaceTextMuted}`}>
              {isBM
                ? 'Portal tapak kiosk, bantuan modal dan sokongan usahawan belia di seluruh negeri Kelantan.'
                : 'Portal for youth kiosks, startup grants, and business support across Kelantan.'}
            </p>
            <p className={`text-xs ${surfaceTextMuted}`}>
              Kompleks Kota Darulnaim, 15503 Kota Bharu, Kelantan Darul Naim.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className={`font-semibold text-sm ${surfaceTextPrimary}`}>
              {isBM ? 'Navigasi' : 'Navigation'}
            </h4>
            <ul className={`space-y-2 text-sm ${surfaceTextMuted}`}>
              <li>
                <a
                  href="#hero"
                  className={`kbelia-link transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Utama' : 'Home'}
                </a>
              </li>
              <li>
                <a
                  href="#inisiatif"
                  className={`kbelia-link transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Kelebihan KBelia' : 'Benefits'}
                </a>
              </li>
              <li>
                <a
                  href="#kiosk"
                  className={`kbelia-link transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Lokasi Kiosk' : 'Kiosks'}
                </a>
              </li>
              <li>
                <a
                  href="#direktori"
                  className={`kbelia-link transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Kedai Belia' : 'Youth Shops'}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateToPage('login')}
                  className={`kbelia-link cursor-pointer text-left transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Log Masuk Portal' : 'Portal Sign In'}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className={`font-semibold text-sm ${surfaceTextPrimary}`}>
              {isBM ? 'Dasar & Garis Panduan' : 'Policies & Guidelines'}
            </h4>
            <ul className={`space-y-2 text-sm ${surfaceTextMuted}`}>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className={`kbelia-link cursor-pointer text-left transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Dasar Privasi' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className={`kbelia-link cursor-pointer text-left transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Terma & Syarat' : 'Terms & Conditions'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className={`kbelia-link cursor-pointer text-left transition-colors ${
                    isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
                  }`}
                >
                  {isBM ? 'Keselamatan Maklumat' : 'Data Protection'}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className={`font-semibold text-sm ${surfaceTextPrimary}`}>
              {isBM ? 'Hubungi Urusetia' : 'Secretariat'}
            </h4>
            <div className={`space-y-2 text-sm ${surfaceTextMuted}`}>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>+60 9-748 1000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>urusetia@kbelia.kelantan.gov.my</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{isBM ? 'Ahad - Rabu: 8.00 pagi - 5.00 petang' : 'Sun - Wed: 8.00 am - 5.00 pm'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Laman Komuniti"
                className={`w-9 h-9 rounded-xl border ${hairlineBorder} flex items-center justify-center ${surfaceTextMuted} hover:text-emerald-400 transition-colors`}
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Saluran Video Komuniti"
                className={`w-9 h-9 rounded-xl border ${hairlineBorder} flex items-center justify-center ${surfaceTextMuted} hover:text-emerald-400 transition-colors`}
              >
                <Video className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/601123456789"
                target="_blank"
                rel="noreferrer"
                aria-label="Talian Bantuan"
                className={`w-9 h-9 rounded-xl border ${hairlineBorder} flex items-center justify-center ${surfaceTextMuted} hover:text-emerald-400 transition-colors`}
              >
                <Compass className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className={`border-t ${hairlineBorder} py-5 text-xs ${surfaceTextMuted}`}>
          <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              {isBM
                ? `Hak Cipta Terpelihara © ${new Date().getFullYear()} Portal KBelia Kelantan · Inisiatif Pembangunan Ekonomi Belia`
                : `Copyright © ${new Date().getFullYear()} KBelia Kelantan Portal · Youth Economic Initiative`}
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`cursor-pointer transition-colors ${
                isEditorialDark ? 'hover:text-[#F4F1EA]' : 'hover:text-[#16221D]'
              }`}
            >
              {isBM ? 'Kembali ke Atas ↑' : 'Back to Top ↑'}
            </button>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* LEGAL & PRIVACY MODAL                                             */}
      {/* ================================================================= */}
      {legalModalType && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setLegalModalType(null)}
        >
          <div
            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border ${hairlineBorderStrong} overflow-hidden my-8 ${
              isEditorialDark ? 'bg-[#141D1A] text-[#F4F1EA]' : 'bg-[#FBF9F5] text-[#16221D]'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-5 flex items-center justify-between border-b ${hairlineBorder}`}>
              <h3 className="font-display font-bold text-lg">
                {legalModalType === 'privacy'
                  ? isBM
                    ? 'Dasar Privasi & Perlindungan Data'
                    : 'Privacy & Data Protection Policy'
                  : isBM
                    ? 'Terma & Syarat Penggunaan'
                    : 'Terms & Conditions'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className={`w-9 h-9 rounded-xl border ${hairlineBorder} inline-flex items-center justify-center cursor-pointer`}
                aria-label={isBM ? 'Tutup' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-6 text-sm space-y-4 max-h-[60vh] overflow-y-auto leading-relaxed kbelia-prose ${surfaceTextMuted}`}>
              {legalModalType === 'privacy' ? (
                <>
                  <p className={`font-semibold ${surfaceTextPrimary}`}>1. Komitmen Privasi</p>
                  <p>
                    Portal KBelia Negeri Kelantan komited untuk melindungi maklumat peribadi pengguna selaras dengan Akta Perlindungan Data Peribadi 2010 (<span className="kbelia-acro">PDPA</span>).
                  </p>
                  <p className={`font-semibold ${surfaceTextPrimary}`}>2. Tujuan Penggunaan Maklumat</p>
                  <p>
                    Maklumat pendaftaran hanya digunakan bagi tujuan pengurusan penyertaan ruang niaga, bimbingan keusahawanan, dan urusan rasmi program belia negeri.
                  </p>
                </>
              ) : (
                <>
                  <p className={`font-semibold ${surfaceTextPrimary}`}>1. Kelayakan Penyertaan</p>
                  <p>
                    Terbuka kepada belia warganegara Malaysia berumur antara 18 hingga 40 tahun yang menetap atau menjalankan usaha niaga di Negeri Kelantan.
                  </p>
                  <p className={`font-semibold ${surfaceTextPrimary}`}>2. Tatasusila Komuniti</p>
                  <p>
                    Setiap peserta bertanggungjawab menjaga kebersihan ruang bersama serta mematuhi garis panduan pengurusan hab dan pihak berkuasa tempatan.
                  </p>
                </>
              )}
            </div>

            <div className={`p-4 border-t ${hairlineBorder} text-right`}>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="px-5 py-2.5 bg-[#0B6E52] hover:bg-[#085640] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                {isBM ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
