import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmDeleteProvider } from './context/ConfirmDeleteContext';
import { useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { 
  BusinessListing, 
  CapsuleBooking, 
  CapsuleSlot, 
  SlotStatus,
  ProductItem, 
  YouthProgram,
  GrantApplication,
  MentorProfile,
  MentorshipRegistration,
  KioskDailySale,
  MaintenanceTicket,
  PortalSettings,
  PortalNews,
  GrantEndorsement,
  MerchantSubTab,
  AdminSubTab,
  MentorSubTab,
  KelantanDistrict
} from './types';
import { 
  INITIAL_BUSINESSES, 
  INITIAL_CAPSULE_SLOTS, 
  INITIAL_PRODUCTS, 
  INITIAL_PROGRAMS 
} from './data/seedData';
import { 
  INITIAL_MENTOR_PROFILES, 
  INITIAL_MENTORSHIP_REGISTRATIONS 
} from './data/mentorData';
import { INITIAL_PORTAL_NEWS } from './data/newsData';
import { 
  getDeletedIds, 
  isProductionAuthenticated,
  seedInitialData, 
  DEFAULT_PORTAL_SETTINGS, 
  loadLocalPortalSettings,
  loadLocalDemoNews,
  saveMentorshipRegistrationRecord,
  saveMentorProfileRecord
} from './services/dataService';
import { emitAdminOrMentorNotification } from './services/notificationStore';
import {
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from './services/realtimeSync';
import { UMKHeader, UMKTab } from './components/UMKHeader';
import { UMKSidebar } from './components/UMKSidebar';
import { UMKHomeFeed } from './components/UMKHomeFeed';
import { UMKRightWidgets } from './components/UMKRightWidgets';
import { CapsuleGrid } from './components/CapsuleGrid';
import { DirectorySection } from './components/DirectorySection';
import { ProgramsSection } from './components/ProgramsSection';
import { EventsSection } from './components/EventsSection';
import { B2BMarketSection } from './components/B2BMarketSection';
import { GrantCalculatorSection } from './components/GrantCalculatorSection';
import { MerchantPortal } from './components/MerchantPortal';
import { MentorPortal } from './components/MentorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { NewsPage } from './components/NewsPage';
import { DashboardBannerHeader } from './components/DashboardBannerHeader';
import { SettingsPage } from './components/SettingsPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { LandingPage } from './components/LandingPage';
import { BookingModal } from './components/BookingModal';
import { CapsuleTenantDetailModal } from './components/CapsuleTenantDetailModal';
import { BusinessDetailModal } from './components/BusinessDetailModal';
import { GrantModal } from './components/GrantModal';
import { OfferLetterModal } from './components/OfferLetterModal';
import { LoginModal } from './components/LoginModal';
import { DigitalTenancyAgreementModal } from './components/DigitalTenancyAgreementModal';
import { PublicVerificationModal } from './components/PublicVerificationModal';
import { ApplicationStatusDocumentsModal } from './components/ApplicationStatusDocumentsModal';
import { KioskCashflowModal } from './components/KioskCashflowModal';
import { MicroLearningAcademyModal } from './components/MicroLearningAcademyModal';
import { MentorshipPage } from './components/MentorshipPage';
import { KioskMaintenanceModal } from './components/KioskMaintenanceModal';
import { YouthB2BNetworkModal } from './components/YouthB2BNetworkModal';
import { YouthEventsCalendarModal } from './components/YouthEventsCalendarModal';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { ToastContainer, showToast } from './components/ToastNotification';
import { TopProgressBar, triggerTopNavigationProgress } from './components/TopProgressBar';
import { 
  Building2, 
  Store, 
  Award, 
  GraduationCap,
  ShieldCheck,
  Lock
} from 'lucide-react';

function MainApp() {
  const { user, userProfile, isAdmin, isMentor, isYouth: isAuthenticatedYouth } = useAuth();
  const { t, language } = useLanguage();
  const isYouth = !isAdmin && !isMentor;
  const { theme } = useTheme();

  // Default to 'landing' page so opening the link presents a welcoming landing page
  const [activeTab, setActiveTab] = useState<UMKTab>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync dark mode class consistently across all tabs
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Trigger top progress bar and reset scroll position whenever navigating tabs
  useEffect(() => {
    triggerTopNavigationProgress(400);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Handle idle session termination: close open modals and redirect to login
  useEffect(() => {
    const handleSessionTerminated = () => {
      setIsBookingModalOpen(false);
      setIsTenantDetailModalOpen(false);
      setIsBusinessDetailModalOpen(false);
      setIsGrantModalOpen(false);
      setIsOfferLetterOpen(false);
      setIsTenancyModalOpen(false);
      setIsVerificationModalOpen(false);
      setIsStatusDocumentsModalOpen(false);
      setIsCashflowModalOpen(false);
      setIsAcademyModalOpen(false);
      setIsMaintenanceModalOpen(false);
      setIsB2BModalOpen(false);
      setIsEventsModalOpen(false);
      setIsMobileSidebarOpen(false);
      setActiveTab((prev) => (prev === 'landing' || prev === 'register' ? prev : 'login'));
    };

    window.addEventListener('kbelia_session_terminated', handleSessionTerminated);
    return () => window.removeEventListener('kbelia_session_terminated', handleSessionTerminated);
  }, []);

  // Core States
  const [slots, setSlots] = useState<CapsuleSlot[]>(INITIAL_CAPSULE_SLOTS);
  const [businesses, setBusinesses] = useState<BusinessListing[]>(INITIAL_BUSINESSES);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [programs, setPrograms] = useState<YouthProgram[]>(INITIAL_PROGRAMS);
  const [bookings, setBookings] = useState<CapsuleBooking[]>([]);
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([]);
  const [cashflowRecords, setCashflowRecords] = useState<KioskDailySale[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(() => loadLocalPortalSettings());
  const [newsItems, setNewsItems] = useState<PortalNews[]>(INITIAL_PORTAL_NEWS);
  const [grantEndorsements, setGrantEndorsements] = useState<GrantEndorsement[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters for Kapsul Niaga
  const [selectedHubFilter, setSelectedHubFilter] = useState('Semua');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState(500);

  // Youth Merchant Sub-Navigation State (Executive Summary, Profile, Products, Bookings, Cashflow, Vault, Card)
  const [merchantSubTab, setMerchantSubTab] = useState<MerchantSubTab>('overview');

  // Admin Sub-Navigation State (Queue, Bookings, Businesses, Slots, Programs, Mentors, Sync, Settings)
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('queue');

  // Mentor Sub-Navigation State (Overview, Sessions, Endorsements, Logbook, Profile)
  const [mentorSubTab, setMentorSubTab] = useState<MentorSubTab>('overview');

  // Modals state
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<CapsuleSlot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlotForTenantDetail, setSelectedSlotForTenantDetail] = useState<CapsuleSlot | null>(null);
  const [isTenantDetailModalOpen, setIsTenantDetailModalOpen] = useState(false);
  const [selectedBusinessForDetail, setSelectedBusinessForDetail] = useState<BusinessListing | null>(null);
  const [isBusinessDetailModalOpen, setIsBusinessDetailModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedGrantTitle, setSelectedGrantTitle] = useState('Geran Permulaan Usahawan Belia Kelantan (RM3,000)');
  const [selectedGrantAmount, setSelectedGrantAmount] = useState('RM3,000');
  const [isOfferLetterOpen, setIsOfferLetterOpen] = useState(false);
  const [selectedBookingForOffer, setSelectedBookingForOffer] = useState<CapsuleBooking | null>(null);

  // Additional Ecosystem Modals State
  const [isTenancyModalOpen, setIsTenancyModalOpen] = useState(false);
  const [selectedBookingForTenancy, setSelectedBookingForTenancy] = useState<CapsuleBooking | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationRefCode, setVerificationRefCode] = useState('KBN-KB-2026-8819');
  
  // Quick Counter Interactive Modals
  const [isStatusDocumentsModalOpen, setIsStatusDocumentsModalOpen] = useState(false);
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);

  // Mentor Portal & Mentorship State (v4 - streamlined to 3 mentors & 3 registrations)
  const [mentors, setMentors] = useState<MentorProfile[]>(() => {
    try {
      const version = localStorage.getItem('kbelia_mentor_v4');
      if (!version) {
        localStorage.setItem('kbelia_mentor_v4', 'true');
        localStorage.setItem('kbelia_mentor_profiles', JSON.stringify(INITIAL_MENTOR_PROFILES));
        return INITIAL_MENTOR_PROFILES;
      }
      const saved = localStorage.getItem('kbelia_mentor_profiles');
      return saved ? JSON.parse(saved) : INITIAL_MENTOR_PROFILES;
    } catch {
      return INITIAL_MENTOR_PROFILES;
    }
  });

  const [mentorshipRegistrations, setMentorshipRegistrations] = useState<MentorshipRegistration[]>(() => {
    try {
      const version = localStorage.getItem('kbelia_mentor_v4');
      if (!version) {
        localStorage.setItem('kbelia_mentorship_registrations', JSON.stringify(INITIAL_MENTORSHIP_REGISTRATIONS));
        return INITIAL_MENTORSHIP_REGISTRATIONS;
      }
      const saved = localStorage.getItem('kbelia_mentorship_registrations');
      return saved ? JSON.parse(saved) : INITIAL_MENTORSHIP_REGISTRATIONS;
    } catch {
      return INITIAL_MENTORSHIP_REGISTRATIONS;
    }
  });

  // Strict role-based auto-routing & boundary enforcement
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'landing' || activeTab === 'login' || activeTab === 'register') return;

    const adminAllowedTabs: UMKTab[] = ['home', 'admin', 'academic', 'ceed', 'hepa', 'news', 'settings'];
    const mentorAllowedTabs: UMKTab[] = ['home', 'mentor', 'news', 'settings'];
    const youthAllowedTabs: UMKTab[] = ['home', 'merchant', 'academic', 'ceed', 'hepa', 'events', 'b2b', 'calculator', 'mentorship', 'news', 'settings'];

    if (isAdmin && !adminAllowedTabs.includes(activeTab)) {
      setActiveTab('admin');
    } else if (isMentor && !mentorAllowedTabs.includes(activeTab)) {
      setActiveTab('mentor');
    } else if (isAuthenticatedYouth && !youthAllowedTabs.includes(activeTab)) {
      setActiveTab('merchant');
    }
  }, [user, isAdmin, isMentor, isAuthenticatedYouth, activeTab]);

  // Snap directly to Mentor Hub upon mentor login
  useEffect(() => {
    if (isMentor && (activeTab === 'login' || activeTab === 'register' || activeTab === 'home')) {
      setActiveTab('mentor');
    }
  }, [isMentor]);

  const handleUpdateMentorProfile = (updated: MentorProfile) => {
    if (!isAdmin && (!isMentor || updated.id !== userProfile?.mentorId)) {
      return;
    }
    setMentors(prev => prev.map(m => m.id === updated.id ? updated : m));
    saveMentorProfileRecord(updated).catch(() => {});
  };

  const handleUpdateMentorshipRegistration = (updated: MentorshipRegistration) => {
    // Only assigned Mentor or Admin (or Youth cancelling own booking) may update mentorship sessions
    if (isMentor && updated.mentorId !== userProfile?.mentorId) {
      return;
    }
    if (isAuthenticatedYouth && updated.applicantId !== user?.uid && updated.status !== 'cancelled') {
      return;
    }
    setMentorshipRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
    saveMentorshipRegistrationRecord(updated).catch(() => {});
    if (updated.status === 'cancelled' && isYouth) {
      showToast({
        type: 'info',
        title: 'Temu Janji Dibatalkan',
        message: 'Temu janji bimbingan anda telah dibatalkan. Anda kini boleh memilih mentor lain.'
      });
    }
  };

  const handleAddMentorshipRegistration = (newReg: MentorshipRegistration): boolean => {
    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Akses Terhad Mengikut Peranan',
        message: 'Tempahan klinik bimbingan hanya dibuka untuk akaun Usahawan Belia.'
      });
      return false;
    }
    const existingActive = mentorshipRegistrations.find(
      (r) =>
        (r.status === 'pending' || r.status === 'confirmed') &&
        (r.applicantId === user?.uid ||
          (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))
    );
    if (existingActive) {
      showToast({
        type: 'warning',
        title: 'Had Satu Temu Janji Aktif',
        message: 'Anda sudah mempunyai satu temu janji aktif. Sila batalkan temu janji sedia ada terlebih dahulu.'
      });
      return false;
    }
    const withOwner: MentorshipRegistration = {
      ...newReg,
      applicantId: newReg.applicantId || user?.uid,
      entrepreneurEmail: newReg.entrepreneurEmail || user?.email || userProfile?.email || 'usahawan@kbelia.my'
    };
    setMentorshipRegistrations(prev => [withOwner, ...prev.filter(r => r.id !== withOwner.id)]);
    saveMentorshipRegistrationRecord(withOwner).catch(() => {});
    showToast({
      type: 'success',
      title: 'Temu Janji Dihantar',
      message: `Permohonan sesi bersama ${withOwner.mentorName} telah direkodkan.`
    });
    emitAdminOrMentorNotification({
      title: `Tempahan Sesi Mentor Baharu: ${withOwner.businessName}`,
      message: `${withOwner.entrepreneurName} memohon sesi bimbingan (${withOwner.topic}) pada ${withOwner.preferredDate} (${withOwner.preferredTime}).`,
      senderRole: 'user',
      targetRole: 'mentor',
      targetUserId: '',
      sender: withOwner.entrepreneurName || 'Usahawan Belia',
      type: 'mentorship',
      actionTab: 'mentor'
    });
    return true;
  };

  // Helper to normalize legacy /public/assets paths into /assets
  const normalizeAsset = (url?: string, fallback = '') => {
    if (!url) return fallback;
    return url.replace('/public/assets/generated', '/assets/generated');
  };

  // 0. Portal Global Settings Listener (Firestore + DemoSync + Cross-Tab)
  useEffect(() => {
    let remoteSettings: PortalSettings | null = null;
    let demoSyncSettings: PortalSettings | null = null;

    const recomputeSettings = () => {
      if (isProductionAuthenticated() && remoteSettings) {
        setPortalSettings({ ...DEFAULT_PORTAL_SETTINGS, ...remoteSettings });
      } else if (demoSyncSettings) {
        setPortalSettings({ ...DEFAULT_PORTAL_SETTINGS, ...demoSyncSettings });
      } else {
        setPortalSettings(loadLocalPortalSettings());
      }
    };

    const handleLocalSettings = (e: Event) => {
      const custom = e as CustomEvent<PortalSettings>;
      if (custom.detail) setPortalSettings(custom.detail);
    };
    window.addEventListener('kbelia_portal_settings_updated', handleLocalSettings);

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'settings') {
        recomputeSettings();
      }
    });

    const unsubSettings = onSnapshot(
      doc(db, 'portal_settings', 'global'),
      (snap) => {
        if (snap.exists()) {
          remoteSettings = { ...DEFAULT_PORTAL_SETTINGS, ...snap.data() } as PortalSettings;
          recomputeSettings();
        }
      },
      () => {
        recomputeSettings();
      }
    );

    const unsubDemoSettings = subscribeDemoSyncCollection<PortalSettings>('settings', (items) => {
      const found = items.find((item) => item.id === 'global') || items[0] || null;
      demoSyncSettings = found;
      recomputeSettings();
    });

    return () => {
      window.removeEventListener('kbelia_portal_settings_updated', handleLocalSettings);
      unsubCrossTab();
      unsubSettings();
      unsubDemoSettings();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 1. Public Catalog Listeners (Slots, Businesses, Products, Programs) + DemoSync + Cross-Tab merge
  useEffect(() => {
    const loadDemoSlots = (): CapsuleSlot[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      } catch {
        return [];
      }
    };

    let firestoreSlots: CapsuleSlot[] = [];
    let demoSyncSlots: CapsuleSlot[] = [];
    let demoSyncDeleted: string[] = [];

    const recomputeSlots = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const demoExtra = loadDemoSlots();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreSlots, demoSyncSlots, demoExtra, INITIAL_CAPSULE_SLOTS]
        : [demoSyncSlots, demoExtra, firestoreSlots, INITIAL_CAPSULE_SLOTS];
      setSlots(mergeUniqueById<CapsuleSlot>(priorityLists, deleted));
    };

    recomputeSlots();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'slot' || entity === 'booking' || entity === 'deleted') {
        recomputeSlots();
      }
    });

    const unsubSlots = onSnapshot(
      collection(db, 'capsule_slots'),
      (snapshot) => {
        const loaded: CapsuleSlot[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const seedSlot = INITIAL_CAPSULE_SLOTS.find(s => s.id === docSnap.id);
          const rawImg = normalizeAsset(data.imageUrl);
          const isLegacyImage =
            !rawImg ||
            rawImg.includes('kiosk_modular_kbelia') ||
            rawImg.includes('madu_kelulut_rimba') ||
            rawImg.includes('wau_bulan_kelantan') ||
            rawImg.includes('keropok_lekor_kelantan');
          const imageUrl = isLegacyImage
            ? (seedSlot?.imageUrl || rawImg || '/assets/generated/kiosk_modular_kbelia.jpg')
            : rawImg;
          loaded.push({
            id: docSnap.id,
            ...data,
            imageUrl,
            amenities: Array.isArray(data.amenities) ? data.amenities : ['Palam Elektrik', 'WiFi 500Mbps', 'Rak Display']
          } as CapsuleSlot);
        });
        firestoreSlots = loaded;
        recomputeSlots();
      },
      (err) => {
        console.debug('Slots listener notice:', err?.message || err);
        recomputeSlots();
      }
    );

    const unsubDemoSlots = subscribeDemoSyncCollection<CapsuleSlot>('slot', (items, delIds) => {
      demoSyncSlots = items;
      demoSyncDeleted = delIds;
      recomputeSlots();
    });

    return () => {
      unsubCrossTab();
      unsubSlots();
      unsubDemoSlots();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 2. Real-time Businesses Listener
  useEffect(() => {
    const loadDemoBiz = (): BusinessListing[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_businesses') || '[]');
      } catch {
        return [];
      }
    };

    let firestoreBiz: BusinessListing[] = [];
    let demoSyncBiz: BusinessListing[] = [];
    let demoSyncDeleted: string[] = [];

    const recomputeBiz = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const demoExtra = loadDemoBiz();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreBiz, demoSyncBiz, demoExtra, INITIAL_BUSINESSES]
        : [demoSyncBiz, demoExtra, firestoreBiz, INITIAL_BUSINESSES];
      setBusinesses(mergeUniqueById<BusinessListing>(priorityLists, deleted));
    };

    recomputeBiz();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'business' || entity === 'deleted') {
        recomputeBiz();
      }
    });

    const unsubBiz = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const loaded: BusinessListing[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const seedBiz = INITIAL_BUSINESSES.find(b => b.id === docSnap.id);
          loaded.push({
            id: docSnap.id,
            ...data,
            bannerUrl: normalizeAsset(data.bannerUrl, seedBiz?.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg'),
            logoUrl: normalizeAsset(data.logoUrl, seedBiz?.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg')
          } as BusinessListing);
        });
        firestoreBiz = loaded;
        recomputeBiz();
      },
      (err) => {
        console.debug('Businesses listener notice:', err?.message || err);
        recomputeBiz();
      }
    );

    const unsubDemoBiz = subscribeDemoSyncCollection<BusinessListing>('business', (items, delIds) => {
      demoSyncBiz = items;
      demoSyncDeleted = delIds;
      recomputeBiz();
    });

    return () => {
      unsubCrossTab();
      unsubBiz();
      unsubDemoBiz();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 3. Real-time Products Listener
  useEffect(() => {
    const loadDemoProd = (): ProductItem[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_products') || '[]');
      } catch {
        return [];
      }
    };

    let firestoreProd: ProductItem[] = [];
    let demoSyncProd: ProductItem[] = [];
    let demoSyncDeleted: string[] = [];

    const recomputeProd = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const demoExtra = loadDemoProd();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreProd, demoSyncProd, demoExtra, INITIAL_PRODUCTS]
        : [demoSyncProd, demoExtra, firestoreProd, INITIAL_PRODUCTS];
      setProducts(mergeUniqueById<ProductItem>(priorityLists, deleted));
    };

    recomputeProd();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'product' || entity === 'deleted') {
        recomputeProd();
      }
    });

    const unsubProd = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const loaded: ProductItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const seedProd = INITIAL_PRODUCTS.find(p => p.id === docSnap.id);
          loaded.push({
            id: docSnap.id,
            ...data,
            imageUrl: normalizeAsset(data.imageUrl, seedProd?.imageUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg')
          } as ProductItem);
        });
        firestoreProd = loaded;
        recomputeProd();
      },
      (err) => {
        console.debug('Products listener notice:', err?.message || err);
        recomputeProd();
      }
    );

    const unsubDemoProd = subscribeDemoSyncCollection<ProductItem>('product', (items, delIds) => {
      demoSyncProd = items;
      demoSyncDeleted = delIds;
      recomputeProd();
    });

    return () => {
      unsubCrossTab();
      unsubProd();
      unsubDemoProd();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 4. Real-time Programs Listener
  useEffect(() => {
    const loadDemoProg = (): YouthProgram[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_programs') || '[]');
      } catch {
        return [];
      }
    };

    let firestoreProg: YouthProgram[] = [];
    let demoSyncProg: YouthProgram[] = [];
    let demoSyncDeleted: string[] = [];

    const recomputeProg = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const demoExtra = loadDemoProg();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreProg, demoSyncProg, demoExtra, INITIAL_PROGRAMS]
        : [demoSyncProg, demoExtra, firestoreProg, INITIAL_PROGRAMS];
      setPrograms(mergeUniqueById<YouthProgram>(priorityLists, deleted));
    };

    recomputeProg();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'program' || entity === 'deleted') {
        recomputeProg();
      }
    });

    const unsubProg = onSnapshot(
      collection(db, 'programs'),
      (snapshot) => {
        const loaded: YouthProgram[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const seedProg = INITIAL_PROGRAMS.find(p => p.id === docSnap.id);
          loaded.push({
            id: docSnap.id,
            ...data,
            imageUrl: normalizeAsset(data.imageUrl, seedProg?.imageUrl)
          } as YouthProgram);
        });
        firestoreProg = loaded;
        recomputeProg();
      },
      (err) => {
        console.debug('Programs listener notice:', err?.message || err);
        recomputeProg();
      }
    );

    const unsubDemoProg = subscribeDemoSyncCollection<YouthProgram>('program', (items, delIds) => {
      demoSyncProg = items;
      demoSyncDeleted = delIds;
      recomputeProg();
    });

    return () => {
      unsubCrossTab();
      unsubProg();
      unsubDemoProg();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 4b. Real-time Portal News Listener (Published visible to all users; Admin sees drafts too)
  useEffect(() => {
    let firestoreNews: PortalNews[] = [];
    let demoSyncNews: PortalNews[] = [];
    let demoSyncDeleted: string[] = [];

    const recomputeNews = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const demoNews = loadLocalDemoNews();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreNews, demoSyncNews, demoNews, INITIAL_PORTAL_NEWS]
        : [demoSyncNews, demoNews, firestoreNews, INITIAL_PORTAL_NEWS];
      const merged = mergeUniqueById<PortalNews>(priorityLists, deleted);
      setNewsItems(isAdmin ? merged : merged.filter(n => n.status === 'published'));
    };

    recomputeNews();

    const handleDemoNewsUpdate = () => recomputeNews();
    window.addEventListener('kbelia_demo_news_updated', handleDemoNewsUpdate);

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'news' || entity === 'deleted') {
        recomputeNews();
      }
    });

    const newsQuery = (isAdmin && isProductionAuthenticated())
      ? collection(db, 'portal_news')
      : query(collection(db, 'portal_news'), where('status', '==', 'published'));

    const unsubNews = onSnapshot(
      newsQuery,
      (snapshot) => {
        const loaded: PortalNews[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as PortalNews);
        });
        firestoreNews = loaded;
        recomputeNews();
      },
      (err) => {
        console.debug('News listener notice:', err?.message || err);
        recomputeNews();
      }
    );

    const unsubDemoNews = subscribeDemoSyncCollection<PortalNews>('news', (items, delIds) => {
      demoSyncNews = items;
      demoSyncDeleted = delIds;
      recomputeNews();
    });

    return () => {
      window.removeEventListener('kbelia_demo_news_updated', handleDemoNewsUpdate);
      unsubCrossTab();
      unsubNews();
      unsubDemoNews();
    };
  }, [user?.uid, user?.isDemo, isAdmin, refreshTrigger]);

  // 4c. Real-time Mentor Profiles Listener
  useEffect(() => {
    const loadLocalMentors = (): MentorProfile[] => {
      try {
        const raw = localStorage.getItem('kbelia_mentor_profiles');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };

    let firestoreMentors: MentorProfile[] = [];
    let demoSyncMentors: MentorProfile[] = [];

    const recomputeMentors = () => {
      const localMentors = loadLocalMentors();
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreMentors, demoSyncMentors, localMentors, INITIAL_MENTOR_PROFILES]
        : [demoSyncMentors, localMentors, firestoreMentors, INITIAL_MENTOR_PROFILES];
      setMentors(mergeUniqueById<MentorProfile>(priorityLists));
    };

    recomputeMentors();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'mentor') {
        recomputeMentors();
      }
    });

    const unsubMentors = onSnapshot(
      collection(db, 'mentor_profiles'),
      (snapshot) => {
        const loaded: MentorProfile[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as MentorProfile);
        });
        firestoreMentors = loaded;
        recomputeMentors();
      },
      (err) => {
        console.debug('Mentor profiles listener notice:', err?.message || err);
        recomputeMentors();
      }
    );

    const unsubDemoMentors = subscribeDemoSyncCollection<MentorProfile>('mentor', (items) => {
      demoSyncMentors = items;
      recomputeMentors();
    });

    return () => {
      unsubCrossTab();
      unsubMentors();
      unsubDemoMentors();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

  // 5. Protected Collections Listeners (Real-Time Firestore + DemoSync + Cross-Tab)
  useEffect(() => {
    const prodAuth = isProductionAuthenticated();

    let prodBookings: CapsuleBooking[] = [];
    let demoSyncBookings: CapsuleBooking[] = [];
    let prodGrants: GrantApplication[] = [];
    let demoSyncGrants: GrantApplication[] = [];
    let prodTickets: MaintenanceTicket[] = [];
    let demoSyncTickets: MaintenanceTicket[] = [];
    let prodCashflow: KioskDailySale[] = [];
    let demoSyncCashflow: KioskDailySale[] = [];
    let prodSessions: MentorshipRegistration[] = [];
    let demoSyncSessions: MentorshipRegistration[] = [];
    let prodEndorsements: GrantEndorsement[] = [];
    let demoSyncEndorsements: GrantEndorsement[] = [];

    const readLocalArray = <T,>(key: string, fallback: T[] = []): T[] => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };

    const recomputeProtectedState = () => {
      const deleted = getDeletedIds();
      const demoBookingsLocal = readLocalArray<CapsuleBooking>('kbelia_demo_bookings');
      const demoGrantsLocal = readLocalArray<GrantApplication>('kbelia_demo_grants');
      const demoTicketsLocal = readLocalArray<MaintenanceTicket>('kbelia_demo_maintenance_tickets');
      const demoSessionsLocal = readLocalArray<MentorshipRegistration>('kbelia_mentorship_registrations', INITIAL_MENTORSHIP_REGISTRATIONS);
      const demoEndorsementsLocal = readLocalArray<GrantEndorsement>('kbelia_mentor_endorsements_v1');

      if (!user) {
        setBookings([]);
        setGrantApplications([]);
        setMaintenanceTickets([]);
        setCashflowRecords([]);
        setMentorshipRegistrations([]);
        setGrantEndorsements([]);
        return;
      }

      if (isMentor) {
        // Mentors never see bookings, grants, tickets, or cashflow
        setBookings([]);
        setGrantApplications([]);
        setMaintenanceTickets([]);
        setCashflowRecords([]);
        const mentorSessionSource = prodAuth
          ? mergeUniqueById<MentorshipRegistration>([prodSessions, demoSyncSessions], deleted)
          : mergeUniqueById<MentorshipRegistration>([demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS], deleted);
        setMentorshipRegistrations(mentorSessionSource);
        const mentorEndSource = prodAuth
          ? mergeUniqueById<GrantEndorsement>([prodEndorsements, demoSyncEndorsements], deleted)
          : mergeUniqueById<GrantEndorsement>([demoSyncEndorsements, demoEndorsementsLocal], deleted);
        setGrantEndorsements(mentorEndSource);
        return;
      }

      if (isAdmin) {
        // Admin sees governance queues across BOTH production & Demo/sandbox real-time streams
        setBookings(mergeUniqueById<CapsuleBooking>([prodBookings, demoSyncBookings, demoBookingsLocal], deleted));
        setGrantApplications(mergeUniqueById<GrantApplication>([prodGrants, demoSyncGrants, demoGrantsLocal], deleted));
        setMaintenanceTickets(mergeUniqueById<MaintenanceTicket>([prodTickets, demoSyncTickets, demoTicketsLocal], deleted));
        setCashflowRecords([]); // Privacy isolation: personal daily cashflow belongs strictly to owner
        setMentorshipRegistrations(
          mergeUniqueById<MentorshipRegistration>(
            [prodSessions, demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS],
            deleted
          )
        );
        setGrantEndorsements(
          mergeUniqueById<GrantEndorsement>([prodEndorsements, demoSyncEndorsements, demoEndorsementsLocal], deleted)
        );
        return;
      }

      // Youth Entrepreneur: strictly scoped to own UID
      const allDemoBookings = mergeUniqueById<CapsuleBooking>([demoSyncBookings, demoBookingsLocal], deleted)
        .filter(b => b.applicantId === user.uid);
      setBookings(prodAuth ? mergeUniqueById<CapsuleBooking>([prodBookings, allDemoBookings], deleted) : allDemoBookings);

      const allDemoGrants = mergeUniqueById<GrantApplication>([demoSyncGrants, demoGrantsLocal], deleted)
        .filter(g => g.applicantId === user.uid || (user.email && g.applicantEmail?.toLowerCase() === user.email.toLowerCase()));
      setGrantApplications(prodAuth ? mergeUniqueById<GrantApplication>([prodGrants, allDemoGrants], deleted) : allDemoGrants);

      const allDemoTickets = mergeUniqueById<MaintenanceTicket>([demoSyncTickets, demoTicketsLocal], deleted)
        .filter(t => t.ownerId === user.uid);
      setMaintenanceTickets(prodAuth ? mergeUniqueById<MaintenanceTicket>([prodTickets, allDemoTickets], deleted) : allDemoTickets);

      const cfLocal = readLocalArray<KioskDailySale>(`kbelia_cashflow_records_${user.uid}`);
      const scopedDemoCashflow = mergeUniqueById<KioskDailySale>([demoSyncCashflow, cfLocal], deleted)
        .filter(r => !r.ownerId || r.ownerId === user.uid);
      setCashflowRecords(prodAuth ? prodCashflow : scopedDemoCashflow);

      const youthSessionsSource = prodAuth
        ? mergeUniqueById<MentorshipRegistration>([prodSessions, demoSyncSessions], deleted)
        : mergeUniqueById<MentorshipRegistration>([demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS], deleted)
            .filter(r => r.applicantId === user.uid || (user.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()));
      setMentorshipRegistrations(youthSessionsSource);

      const youthEndSource = prodAuth
        ? mergeUniqueById<GrantEndorsement>([prodEndorsements, demoSyncEndorsements], deleted)
        : mergeUniqueById<GrantEndorsement>([demoSyncEndorsements, demoEndorsementsLocal], deleted)
            .filter(e => e.menteeId === user.uid);
      setGrantEndorsements(youthEndSource);
    };

    recomputeProtectedState();

    const handleLocalDemoUpdate = () => recomputeProtectedState();
    window.addEventListener('kbelia_demo_data_updated', handleLocalDemoUpdate);
    window.addEventListener('kbelia_cashflow_updated', handleLocalDemoUpdate);

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (['all', 'booking', 'grant', 'ticket', 'cashflow', 'session', 'endorsement', 'deleted'].includes(entity)) {
        recomputeProtectedState();
      }
    });

    if (!user) {
      return () => {
        window.removeEventListener('kbelia_demo_data_updated', handleLocalDemoUpdate);
        window.removeEventListener('kbelia_cashflow_updated', handleLocalDemoUpdate);
        unsubCrossTab();
      };
    }

    let unsubBookings = () => {};
    let unsubGrants = () => {};
    let unsubCashflow = () => {};
    let unsubTickets = () => {};
    let unsubMentorSessions = () => {};
    let unsubEndorsements = () => {};

    if (prodAuth && auth.currentUser) {
      if (isAdmin) {
        unsubBookings = onSnapshot(
          collection(db, 'capsule_bookings'),
          (snap) => {
            prodBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as CapsuleBooking));
            recomputeProtectedState();
          },
          (err) => console.error('Bookings admin listener error:', err)
        );

        unsubGrants = onSnapshot(
          collection(db, 'grant_applications'),
          (snap) => {
            prodGrants = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantApplication));
            recomputeProtectedState();
          },
          (err) => console.error('Grants admin listener error:', err)
        );

        unsubTickets = onSnapshot(
          collection(db, 'maintenance_tickets'),
          (snap) => {
            prodTickets = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceTicket));
            recomputeProtectedState();
          },
          (err) => console.error('Tickets admin listener error:', err)
        );

        unsubMentorSessions = onSnapshot(
          collection(db, 'mentor_sessions'),
          (snap) => {
            prodSessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorshipRegistration));
            recomputeProtectedState();
          },
          (err) => console.error('Mentor sessions admin listener error:', err)
        );

        unsubEndorsements = onSnapshot(
          collection(db, 'mentor_endorsements'),
          (snap) => {
            prodEndorsements = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantEndorsement));
            recomputeProtectedState();
          },
          (err) => console.error('Mentor endorsements admin listener error:', err)
        );
      } else if (isMentor && userProfile?.mentorId) {
        unsubMentorSessions = onSnapshot(
          query(collection(db, 'mentor_sessions'), where('mentorId', '==', userProfile.mentorId)),
          (snap) => {
            prodSessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorshipRegistration));
            recomputeProtectedState();
          },
          (err) => console.error('Mentor sessions listener error:', err)
        );

        unsubEndorsements = onSnapshot(
          query(collection(db, 'mentor_endorsements'), where('mentorId', '==', userProfile.mentorId)),
          (snap) => {
            prodEndorsements = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantEndorsement));
            recomputeProtectedState();
          },
          (err) => console.error('Mentor endorsements listener error:', err)
        );
      } else if (isAuthenticatedYouth) {
        unsubBookings = onSnapshot(
          query(collection(db, 'capsule_bookings'), where('applicantId', '==', user.uid)),
          (snap) => {
            prodBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as CapsuleBooking));
            recomputeProtectedState();
          },
          (err) => console.error('Youth bookings listener error:', err)
        );

        unsubGrants = onSnapshot(
          query(collection(db, 'grant_applications'), where('applicantId', '==', user.uid)),
          (snap) => {
            prodGrants = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantApplication));
            recomputeProtectedState();
          },
          (err) => console.error('Youth grants listener error:', err)
        );

        unsubCashflow = onSnapshot(
          query(collection(db, 'cashflow_records'), where('ownerId', '==', user.uid)),
          (snap) => {
            prodCashflow = snap.docs.map(d => ({ id: d.id, ...d.data() } as KioskDailySale));
            recomputeProtectedState();
          },
          (err) => console.error('Youth cashflow listener error:', err)
        );

        unsubTickets = onSnapshot(
          query(collection(db, 'maintenance_tickets'), where('ownerId', '==', user.uid)),
          (snap) => {
            prodTickets = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceTicket));
            recomputeProtectedState();
          },
          (err) => console.error('Youth tickets listener error:', err)
        );

        unsubMentorSessions = onSnapshot(
          query(collection(db, 'mentor_sessions'), where('applicantId', '==', user.uid)),
          (snap) => {
            prodSessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorshipRegistration));
            recomputeProtectedState();
          },
          (err) => console.error('Youth sessions listener error:', err)
        );

        unsubEndorsements = onSnapshot(
          query(collection(db, 'mentor_endorsements'), where('menteeId', '==', user.uid)),
          (snap) => {
            prodEndorsements = snap.docs.map(d => ({ id: d.id, ...d.data() } as GrantEndorsement));
            recomputeProtectedState();
          },
          (err) => console.error('Youth endorsements listener error:', err)
        );
      }
    }

    // Real-time DemoSync listeners for Demo sessions and Admin monitoring
    let unsubDemoBookings = () => {};
    let unsubDemoGrants = () => {};
    let unsubDemoTickets = () => {};
    let unsubDemoCashflow = () => {};
    let unsubDemoSessions = () => {};
    let unsubDemoEndorsements = () => {};

    if (!prodAuth || isAdmin) {
      if (!isMentor) {
        unsubDemoBookings = subscribeDemoSyncCollection<CapsuleBooking>('booking', (items) => {
          demoSyncBookings = items;
          recomputeProtectedState();
        });
        unsubDemoGrants = subscribeDemoSyncCollection<GrantApplication>('grant', (items) => {
          demoSyncGrants = items;
          recomputeProtectedState();
        });
        unsubDemoTickets = subscribeDemoSyncCollection<MaintenanceTicket>('ticket', (items) => {
          demoSyncTickets = items;
          recomputeProtectedState();
        });
        if (!isAdmin) {
          unsubDemoCashflow = subscribeDemoSyncCollection<KioskDailySale>('cashflow', (items) => {
            demoSyncCashflow = items;
            recomputeProtectedState();
          });
        }
      }
      unsubDemoSessions = subscribeDemoSyncCollection<MentorshipRegistration>('session', (items) => {
        demoSyncSessions = items;
        recomputeProtectedState();
      });
      unsubDemoEndorsements = subscribeDemoSyncCollection<GrantEndorsement>('endorsement', (items) => {
        demoSyncEndorsements = items;
        recomputeProtectedState();
      });
    }

    return () => {
      window.removeEventListener('kbelia_demo_data_updated', handleLocalDemoUpdate);
      window.removeEventListener('kbelia_cashflow_updated', handleLocalDemoUpdate);
      unsubCrossTab();
      unsubBookings();
      unsubGrants();
      unsubCashflow();
      unsubTickets();
      unsubMentorSessions();
      unsubEndorsements();
      unsubDemoBookings();
      unsubDemoGrants();
      unsubDemoTickets();
      unsubDemoCashflow();
      unsubDemoSessions();
      unsubDemoEndorsements();
    };
  }, [user?.uid, user?.isDemo, user?.email, isAdmin, isMentor, isAuthenticatedYouth, userProfile?.mentorId, refreshTrigger]);

  // Auto-seed catalog once only when authenticated as Firebase Production Admin
  useEffect(() => {
    if (!user || !isProductionAuthenticated() || !isAdmin) return;
    try {
      const seeded = localStorage.getItem('kbelia_seeded_v30');
      if (!seeded) {
        seedInitialData().then((ok) => {
          if (ok) {
            localStorage.setItem('kbelia_seeded_v30', 'true');
          }
        });
      }
    } catch {
      // ignore
    }
  }, [user?.uid, user?.isDemo, isAdmin]);

  // Synchronize slot occupancy with approved/pending bookings and active registered tenants
  const enrichedSlots = React.useMemo(() => {
    return slots.map(slot => {
      // 1. Check if there is an approved booking for this slot
      const approvedBooking = bookings.find(b => 
        b.status === 'approved' && (b.slotId === slot.id || b.slotCode === slot.code)
      );
      if (approvedBooking) {
        return {
          ...slot,
          status: 'occupied' as SlotStatus,
          currentTenantBusinessName: approvedBooking.businessName || slot.currentTenantBusinessName,
          currentTenantId: approvedBooking.applicantId || slot.currentTenantId
        };
      }

      // 2. Check if there is a pending booking for this slot
      const pendingBooking = bookings.find(b => 
        b.status === 'pending' && (b.slotId === slot.id || b.slotCode === slot.code)
      );
      if (pendingBooking && slot.status === 'available') {
        return {
          ...slot,
          status: 'reserved' as SlotStatus,
          currentTenantBusinessName: pendingBooking.businessName || slot.currentTenantBusinessName
        };
      }

      // 3. If slot has registered tenant name, ensure status is strictly 'occupied'
      if (slot.currentTenantBusinessName && slot.status === 'available') {
        return {
          ...slot,
          status: 'occupied' as SlotStatus
        };
      }

      return slot;
    });
  }, [slots, bookings]);

  const handleOpenBookingForSlot = (slot: CapsuleSlot) => {
    // If slot is occupied, reserved, or has an active tenant, display the Tenant & Capsule details dossier
    const isOccupied = slot.status !== 'available' || Boolean(slot.currentTenantBusinessName);
    if (isOccupied) {
      setSelectedSlotForTenantDetail(slot);
      setIsTenantDetailModalOpen(true);
      return;
    }

    // Strict role guard: Only Youth Entrepreneurs can apply for capsule bookings
    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Batas Peranan Sistem',
        message: isAdmin
          ? 'Pentadbir hanya mengurus kelulusan slot dan tidak dibenarkan memohon tapak kiosk.'
          : 'Mentor bimbingan tidak dibenarkan membuat permohonan sewaan kiosk usahawan.'
      });
      return;
    }
    setSelectedSlotForBooking(slot);
    setIsBookingModalOpen(true);
  };

  const handleOpenTenantDetail = (slot: CapsuleSlot) => {
    setSelectedSlotForTenantDetail(slot);
    setIsTenantDetailModalOpen(true);
  };

  const handleOpenNewBooking = () => {
    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Batas Peranan Sistem',
        message: 'Borang permohonan tapak kiosk dikhaskan untuk Usahawan Belia sahaja.'
      });
      return;
    }
    const firstAvailable = enrichedSlots.find(s => s.status === 'available' && !s.currentTenantBusinessName);
    setSelectedSlotForBooking(firstAvailable || null);
    setIsBookingModalOpen(true);
  };

  const handleOpenGrantModal = (programTitle?: string, amount?: string) => {
    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Batas Peranan Sistem',
        message: isMentor
          ? 'Mentor menggunakan modul Perakuan Geran di Portal Mentor dan tidak memohon geran sebagai belia.'
          : 'Pentadbir hanya mengurus kelulusan geran dan tidak membuat permohonan dana.'
      });
      return;
    }
    if (programTitle) setSelectedGrantTitle(programTitle);
    if (amount) setSelectedGrantAmount(amount);
    setIsGrantModalOpen(true);
  };

  const handleOpenMentorshipClinicGuarded = () => {
    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Batas Peranan Sistem',
        message: 'Halaman bimbingan mentor hanya dibuka untuk akaun Usahawan Belia.'
      });
      return;
    }
    setActiveTab('mentorship');
  };

  const handleViewOfferLetter = (booking: CapsuleBooking) => {
    if (isMentor) return;
    setSelectedBookingForOffer(booking);
    setIsOfferLetterOpen(true);
  };

  const handleOpenBusinessDetail = (biz: BusinessListing) => {
    setSelectedBusinessForDetail(biz);
    setIsBusinessDetailModalOpen(true);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Strictly role-scoped derived collections
  const myBusiness = isYouth ? (businesses.find(b => b.ownerId === user?.uid) || null) : null;
  const myProducts = isYouth ? products.filter(p => p.ownerId === user?.uid || (myBusiness && p.businessId === myBusiness.id)) : [];
  const myBookings = isYouth ? bookings.filter(b => b.applicantId === user?.uid) : [];
  const myYouthGrants = isYouth
    ? grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))
    : [];
  const scopedMentorRegistrations = isMentor
    ? mentorshipRegistrations.filter(r => r.mentorId === (userProfile?.mentorId || ''))
    : isYouth
    ? mentorshipRegistrations.filter(r => r.applicantId === user?.uid || (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))
    : mentorshipRegistrations;

  // 0. STANDALONE LANDING PAGE (Welcoming homepage on initial link load)
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-black dark:text-white font-sans antialiased transition-colors duration-200">
        <TopProgressBar />
        <LandingPage
          setActiveTab={setActiveTab}
          slots={enrichedSlots}
          businesses={businesses}
          programs={programs}
          onSelectSlot={handleOpenBookingForSlot}
          onSelectBusiness={handleOpenBusinessDetail}
          onOpenNewBooking={handleOpenNewBooking}
          onOpenGrantModal={handleOpenGrantModal}
        />

        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlotForBooking}
          allSlots={enrichedSlots}
          portalSettings={portalSettings}
          onBookingSuccess={triggerRefresh}
        />

        <BusinessDetailModal
          isOpen={isBusinessDetailModalOpen}
          onClose={() => setIsBusinessDetailModalOpen(false)}
          business={selectedBusinessForDetail}
          products={products.filter(p => selectedBusinessForDetail && p.businessId === selectedBusinessForDetail.id)}
        />

        <GrantModal
          isOpen={isGrantModalOpen}
          onClose={() => setIsGrantModalOpen(false)}
          initialProgramTitle={selectedGrantTitle}
          initialGrantAmount={selectedGrantAmount}
          onSuccess={() => {
            triggerRefresh();
            setIsGrantModalOpen(false);
          }}
        />

        <LoginModal />
      </div>
    );
  }

  // 1. STANDALONE LOGIN PAGE (Separated from dashboard)
  if (activeTab === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-black dark:text-white font-sans antialiased transition-colors duration-200">
        <LoginPage 
          setActiveTab={setActiveTab} 
          onOpenBooking={handleOpenNewBooking} 
        />
        
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlotForBooking}
          allSlots={enrichedSlots}
          portalSettings={portalSettings}
          onBookingSuccess={triggerRefresh}
        />

        <BusinessDetailModal
          isOpen={isBusinessDetailModalOpen}
          onClose={() => setIsBusinessDetailModalOpen(false)}
          business={selectedBusinessForDetail}
          products={products.filter(p => selectedBusinessForDetail && p.businessId === selectedBusinessForDetail.id)}
        />

        <LoginModal />
      </div>
    );
  }

  // 1b. STANDALONE REGISTER PAGE (Dedicated Laman Pendaftaran Usahawan Belia)
  if (activeTab === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-black dark:text-white font-sans antialiased transition-colors duration-200">
        <RegisterPage 
          setActiveTab={setActiveTab} 
          onOpenBooking={handleOpenNewBooking} 
        />
        
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlotForBooking}
          allSlots={enrichedSlots}
          portalSettings={portalSettings}
          onBookingSuccess={triggerRefresh}
        />

        <BusinessDetailModal
          isOpen={isBusinessDetailModalOpen}
          onClose={() => setIsBusinessDetailModalOpen(false)}
          business={selectedBusinessForDetail}
          products={products.filter(p => selectedBusinessForDetail && p.businessId === selectedBusinessForDetail.id)}
        />

        <LoginModal />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col text-black dark:text-white font-sans antialiased transition-colors duration-200 overflow-hidden">
      <TopProgressBar />
      {/* 1. TOP HEADER BAR */}
      <UMKHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSelectMerchantSubTab={(sub) => {
          setActiveTab('merchant');
          setMerchantSubTab(sub);
        }}
        onSelectMentorSubTab={(sub) => {
          setActiveTab('mentor');
          setMentorSubTab(sub);
        }}
        onOpenBooking={handleOpenNewBooking}
        slots={enrichedSlots}
        businesses={businesses}
        programs={programs}
        onSelectSlot={handleOpenBookingForSlot}
        onSelectBusiness={handleOpenBusinessDetail}
        onOpenGrantModal={handleOpenGrantModal}
      />

      {/* 2. MAIN APPLICATION CONTAINER (Sidebar + Content Grid) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left Collapsible Sidebar + Responsive Mobile Drawer */}
        <UMKSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenBooking={handleOpenNewBooking}
          onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
          merchantSubTab={merchantSubTab}
          onSelectMerchantSubTab={(sub) => {
            setActiveTab('merchant');
            setMerchantSubTab(sub);
          }}
          adminSubTab={adminSubTab}
          onSelectAdminSubTab={(sub) => {
            setActiveTab('admin');
            setAdminSubTab(sub);
          }}
          mentorSubTab={mentorSubTab}
          onSelectMentorSubTab={(sub) => {
            setActiveTab('mentor');
            setMentorSubTab(sub);
          }}
        />

        {/* Center/Right Dynamic Body */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-2 sm:p-3.5 lg:p-4 w-full max-w-none min-w-0 scroll-smooth bg-slate-50 dark:bg-zinc-950 bg-grid-pattern">
          
          {/* Portal Maintenance / Announcement Bar from Admin Settings */}
          {portalSettings.systemStatus === 'maintenance' && !isAdmin && (
            <div className="mb-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-black dark:text-white text-xs flex items-center justify-between gap-3">
              <span className="font-semibold">
                Mod Penyelenggaraan Sistem Aktif — Sebahagian permohonan baharu ditutup buat sementara waktu. {portalSettings.portalAnnouncement}
              </span>
            </div>
          )}

          {/* Universal Dashboard Banner Header */}
          <DashboardBannerHeader
            activeTab={activeTab}
            role={isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia'}
            userName={userProfile?.fullName || user?.displayName || 'Pengguna KBelia'}
            onNavigateHome={() => setActiveTab('home')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />

          {/* Tab Route Content: Home View strictly routed by role */}
          {activeTab === 'home' && (
            <>
              {/* 1. ADMIN DASHBOARD VIEW */}
              {isAdmin && (
                <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                  <AdminDashboard
                    slots={enrichedSlots}
                    businesses={businesses}
                    bookings={bookings}
                    programs={programs}
                    grantApplications={grantApplications}
                    mentorshipRegistrations={mentorshipRegistrations}
                    mentors={mentors}
                    maintenanceTickets={maintenanceTickets}
                    portalSettings={portalSettings}
                    newsItems={newsItems}
                    onUpdateMentor={handleUpdateMentorProfile}
                    onRefresh={triggerRefresh}
                    activeSubTab={adminSubTab}
                    onSelectSubTab={setAdminSubTab}
                  />
                </div>
              )}

              {/* 2. MENTOR DASHBOARD VIEW */}
              {isMentor && (
                <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                  <MentorPortal
                    mentors={mentors}
                    registrations={scopedMentorRegistrations}
                    businesses={businesses}
                    onUpdateRegistration={handleUpdateMentorshipRegistration}
                    onUpdateMentor={handleUpdateMentorProfile}
                    activeSubTab={mentorSubTab}
                    onSelectSubTab={setMentorSubTab}
                  />
                </div>
              )}

              {/* 3. YOUTH ENTREPRENEUR DASHBOARD VIEW */}
              {isYouth && (
                <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                  <MerchantPortal
                    myBusiness={myBusiness}
                    myProducts={myProducts}
                    myBookings={myBookings}
                    slots={enrichedSlots}
                    grantApplications={myYouthGrants}
                    cashflowRecords={cashflowRecords}
                    maintenanceTickets={maintenanceTickets}
                    mentorshipRegistrations={scopedMentorRegistrations}
                    onViewOfferLetter={handleViewOfferLetter}
                    onOpenTenancyAgreement={(booking) => {
                      setSelectedBookingForTenancy(booking);
                      setIsTenancyModalOpen(true);
                    }}
                    onOpenVerification={(refCode) => {
                      setVerificationRefCode(refCode || myBookings[0]?.id || 'KBN-KB-2026-8819');
                      setIsVerificationModalOpen(true);
                    }}
                    onOpenBookingModal={handleOpenNewBooking}
                    onOpenBookingTab={() => setActiveTab('academic')}
                    onOpenSettingsTab={() => setActiveTab('settings')}
                    onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
                    onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
                    onRefresh={triggerRefresh}
                    activeSubTab={merchantSubTab}
                    onSelectSubTab={setMerchantSubTab}
                  />
                </div>
              )}
            </>
          )}

          {/* KAPSUL NIAGA VIEW (Strictly Belia / Admin Monitoring Only - Blocked for Mentor) */}
          {activeTab === 'academic' && (
            isMentor ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Modul Kiosk Belia Disekat</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Akaun Mentor dihadkan kepada portal bimbingan, surat sokongan geran, dan rekod sesi usahawan sahaja tanpa capaian modul sewaan kiosk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Portal Mentor</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-300 dark:border-zinc-600">
                  <div className="flex items-center gap-2 text-black dark:text-white/75 text-xs font-bold uppercase tracking-wider mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>{t('tab_kiosk_title')}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">
                    {t('tab_kiosk_heading')}
                  </h1>
                  <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
                    {t('tab_kiosk_desc')}
                  </p>
                </div>

                <CapsuleGrid
                  slots={enrichedSlots}
                  bookings={bookings}
                  onSelectSlot={handleOpenBookingForSlot}
                  onViewTenantDetail={handleOpenTenantDetail}
                  onOpenNewBooking={handleOpenNewBooking}
                  onAddSlot={isAdmin ? () => { setActiveTab('admin'); setAdminSubTab('slots'); } : undefined}
                  selectedHub={selectedHubFilter}
                  onSelectHub={setSelectedHubFilter}
                  maxBudget={maxBudgetFilter}
                  onBudgetChange={setMaxBudgetFilter}
                  isReadOnly={isAdmin}
                />
              </div>
            )
          )}

          {/* DIREKTORI USAHAWAN KELANTAN (Belia / Admin Audit Only - Blocked for Mentor) */}
          {activeTab === 'hepa' && (
            isMentor ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Direktori Awam Disekat</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Untuk keselamatan dan batas peranan, Mentor hanya melihat usahawan mentee di bawah seliaan sendiri di Portal Mentor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Portal Mentor</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-300 dark:border-zinc-600">
                  <div className="flex items-center gap-2 text-black dark:text-white/75 text-xs font-bold uppercase tracking-wider mb-1">
                    <Store className="w-4 h-4" />
                    <span>{t('tab_directory_title')}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">
                    {t('tab_directory_title')}
                  </h1>
                  <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
                    {t('tab_directory_desc')}
                  </p>
                </div>

                <DirectorySection
                  businesses={businesses}
                  onSelectBusiness={handleOpenBusinessDetail}
                  onRegisterBusiness={isYouth ? () => setActiveTab('merchant') : undefined}
                />
              </div>
            )
          )}

          {/* GERAN & DANA BELIA (Belia / Admin Monitoring Only - Blocked for Mentor) */}
          {activeTab === 'ceed' && (
            isMentor ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Modul Permohonan Geran Disekat</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Mentor hanya mengurus surat perakuan rasmi melalui tab Perakuan Geran di Portal Mentor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Portal Mentor</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-300 dark:border-zinc-600">
                  <div className="flex items-center gap-2 text-black dark:text-white/75 text-xs font-bold uppercase tracking-wider mb-1">
                    <Award className="w-4 h-4" />
                    <span>{t('tab_grants_title')}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">
                    {t('tab_grants_heading')}
                  </h1>
                  <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
                    {t('tab_grants_desc')}
                  </p>
                </div>

                <ProgramsSection 
                  programs={programs} 
                  onOpenGrantModal={isYouth ? handleOpenGrantModal : undefined}
                  onAddProgram={isAdmin ? () => { setActiveTab('admin'); setAdminSubTab('programs'); } : undefined}
                  isReadOnly={isAdmin}
                />
              </div>
            )
          )}

          {/* JADUAL ACARA & KARNIVAL BELIA (Strictly Youth Portal Only) */}
          {activeTab === 'events' && (
            !isYouth ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Modul Acara Belia Sahaja</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Halaman penyertaan acara & karnival ini dikhaskan untuk Usahawan Belia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <span>{isAdmin ? 'Kembali ke Pusat Kawalan Pentadbir' : 'Kembali ke Portal Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <EventsSection />
              </div>
            )
          )}

          {/* RUANG IKLAN & PELUANG NIAGA BELIA (Strictly Youth Portal Only) */}
          {activeTab === 'b2b' && (
            !isYouth ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Ruang Niaga Usahawan Sahaja</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Ruang Niaga dikhaskan untuk rantaian bekalan dan kerjasama antara usahawan belia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <span>{isAdmin ? 'Kembali ke Pusat Kawalan Pentadbir' : 'Kembali ke Portal Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <B2BMarketSection />
              </div>
            )
          )}

          {/* KALKULATOR KELAYAKAN GERAN & PEMBIAYAAN (Strictly Youth Portal Only) */}
          {activeTab === 'calculator' && (
            !isYouth ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Akses Kalkulator Geran Usahawan Sahaja</h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    Simulasi kelayakan geran ini dikhaskan kepada pemohon Usahawan Belia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <span>{isAdmin ? 'Kembali ke Pusat Kawalan Pentadbir' : 'Kembali ke Portal Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <GrantCalculatorSection 
                  onOpenGrantModal={handleOpenGrantModal}
                  onOpenMentorship={handleOpenMentorshipClinicGuarded}
                />
              </div>
            )
          )}

          {/* PENTADBIRAN (ADMIN - STRICTLY ADMIN ROLE ONLY) */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {language === 'en' ? 'Administrator Access Only' : 'Akses Khusus Pentadbir Sistem Sahaja'}
                  </h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    {isMentor 
                      ? 'Akaun anda adalah akaun Mentor. Modul kawalan pentadbir sistem hanya dikhaskan kepada pihak pentadbir KBelia.'
                      : 'Halaman ini dikhaskan kepada Pentadbir Sistem Kerajaan Negeri & UMK.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isMentor ? 'mentor' : 'home')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-rose-600"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isMentor ? 'Kembali ke Hab Mentor' : 'Kembali ke Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <AdminDashboard
                  slots={enrichedSlots}
                  businesses={businesses}
                  bookings={bookings}
                  programs={programs}
                  grantApplications={grantApplications}
                  mentorshipRegistrations={mentorshipRegistrations}
                  mentors={mentors}
                  maintenanceTickets={maintenanceTickets}
                  portalSettings={portalSettings}
                  newsItems={newsItems}
                  onUpdateMentor={handleUpdateMentorProfile}
                  onRefresh={triggerRefresh}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={setAdminSubTab}
                />
              </div>
            )
          )}

          {/* PORTAL MENTOR: HAB BIMBINGAN (STRICT ROLE GUARD - MENTOR ONLY) */}
          {activeTab === 'mentor' && (
            !isMentor ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {language === 'en' ? 'Certified Mentor Access Only' : 'Akses Khusus Mentor Sahaja'}
                  </h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    {isAdmin
                      ? 'Akaun Pentadbir menggunakan modul Panel Mentor di Pusat Kawalan Pentadbir untuk melantik serta memantau mentor, manakala ruang bimbingan ini dikhaskan kepada Mentor sahaja.'
                      : 'Hab Bimbingan Mentor dikhaskan kepada panel mentor rasmi UMK & agensi keusahawanan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'home')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-blue-600"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAdmin ? 'Kembali ke Pusat Kawalan Pentadbir' : 'Kembali ke Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <MentorPortal
                  mentors={mentors}
                  registrations={scopedMentorRegistrations}
                  businesses={businesses}
                  onUpdateRegistration={handleUpdateMentorshipRegistration}
                  onUpdateMentor={handleUpdateMentorProfile}
                  activeSubTab={mentorSubTab}
                  onSelectSubTab={setMentorSubTab}
                />
              </div>
            )
          )}

          {/* MERCHANT PORTAL: BISNES SAYA (KHUSUS BELIA) */}
          {activeTab === 'merchant' && (
            isAdmin ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Administrator account. Merchant business operations and kiosk management are reserved for registered youth.'
                      : 'Akaun anda adalah Pentadbir Sistem (Admin). Modul pengurusan bisnes usahawan dikhaskan kepada usahawan belia Kelantan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-rose-600"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Admin Control Panel' : 'Kembali ke Pusat Kawalan Pentadbir'}</span>
                </button>
              </div>
            ) : isMentor ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Academic Mentor account. Business management is reserved for youth mentees. Please use the Mentor Coaching Hub.'
                      : 'Akaun anda adalah Mentor Bimbingan UMK. Modul pengurusan bisnes dikhaskan kepada usahawan belia. Sila gunakan Hab Mentor untuk menyemak dan membimbing usahawan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs dark:bg-teal-600"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Mentor Coaching Hub' : 'Kembali ke Hab Bimbingan Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <MerchantPortal
                  myBusiness={myBusiness}
                  myProducts={myProducts}
                  myBookings={myBookings}
                  slots={enrichedSlots}
                  grantApplications={myYouthGrants}
                  cashflowRecords={cashflowRecords}
                  maintenanceTickets={maintenanceTickets}
                  mentorshipRegistrations={scopedMentorRegistrations}
                  onViewOfferLetter={handleViewOfferLetter}
                  onOpenTenancyAgreement={(booking) => {
                    setSelectedBookingForTenancy(booking);
                    setIsTenancyModalOpen(true);
                  }}
                  onOpenVerification={(refCode) => {
                    setVerificationRefCode(refCode || myBookings[0]?.id || 'KBN-KB-2026-8819');
                    setIsVerificationModalOpen(true);
                  }}
                  onOpenBookingModal={handleOpenNewBooking}
                  onOpenBookingTab={() => setActiveTab('academic')}
                  onOpenSettingsTab={() => setActiveTab('settings')}
                  onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
                  onOpenMaintenanceModal={() => { if (isYouth) setIsMaintenanceModalOpen(true); }}
                  onRefresh={triggerRefresh}
                  activeSubTab={merchantSubTab}
                  onSelectSubTab={setMerchantSubTab}
                />
              </div>
            )
          )}

          {/* HALAMAN BIMBINGAN BEBAS (STRICTLY YOUTH ROLE ONLY) */}
          {activeTab === 'mentorship' && (
            !isYouth ? (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/70 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Access Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-black dark:text-white max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'Mentor appointment booking is reserved for Youth Entrepreneur accounts.'
                      : 'Halaman tempahan dan pengurusan temu janji mentor dikhaskan kepada akaun Usahawan Belia.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'mentor')}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAdmin ? 'Kembali ke Pusat Kawalan Pentadbir' : 'Kembali ke Portal Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
                <MentorshipPage
                  mentors={mentors}
                  registrations={scopedMentorRegistrations}
                  onBookMentorship={handleAddMentorshipRegistration}
                  onCancelMentorship={handleUpdateMentorshipRegistration}
                  defaultEntrepreneurName={userProfile?.fullName || user?.displayName || 'Usahawan Belia'}
                  defaultEntrepreneurEmail={user?.email || userProfile?.email || 'usahawan@kbelia.my'}
                  defaultBusinessName={myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Anda'}
                  defaultPhone={userProfile?.phone || userProfile?.whatsapp || ''}
                  defaultDistrict={(userProfile?.district as KelantanDistrict) || 'Kota Bharu'}
                />
              </div>
            )
          )}

          {/* DEDICATED NEWS PAGE (Accessible to All Logged-In Roles, Controlled by Admin) */}
          {activeTab === 'news' && (
            <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
              <NewsPage
                newsItems={newsItems}
                onRefresh={triggerRefresh}
                onOpenAdminNewsTab={
                  isAdmin
                    ? () => {
                        setActiveTab('admin');
                        setAdminSubTab('news');
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* TETAPAN AKAUN & PROFIL */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-zinc-900 rounded-b-2xl rounded-t-none border border-t-0 border-slate-300 dark:border-zinc-600 p-4 sm:p-6 shadow-sm transition-colors">
              <SettingsPage
                myBusiness={myBusiness}
                onRefresh={triggerRefresh}
              />
            </div>
          )}

        </main>
      </div>

      {/* Global Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedSlot={selectedSlotForBooking}
        allSlots={enrichedSlots}
        portalSettings={portalSettings}
        onBookingSuccess={triggerRefresh}
      />

      {/* Capsule Tenant & Premises Details Modal */}
      <CapsuleTenantDetailModal
        isOpen={isTenantDetailModalOpen}
        onClose={() => setIsTenantDetailModalOpen(false)}
        slot={selectedSlotForTenantDetail}
        businesses={businesses}
        products={products}
        onSelectBusiness={(biz) => {
          setSelectedBusinessForDetail(biz);
          setIsBusinessDetailModalOpen(true);
        }}
      />

      <BusinessDetailModal
        isOpen={isBusinessDetailModalOpen}
        onClose={() => setIsBusinessDetailModalOpen(false)}
        business={selectedBusinessForDetail}
        products={products.filter(p => selectedBusinessForDetail && p.businessId === selectedBusinessForDetail.id)}
      />

      <GrantModal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        initialProgramTitle={selectedGrantTitle}
        initialGrantAmount={selectedGrantAmount}
        onSuccess={() => {
          triggerRefresh();
          setIsGrantModalOpen(false);
        }}
      />

      <OfferLetterModal
        isOpen={isOfferLetterOpen}
        booking={selectedBookingForOffer}
        slots={enrichedSlots}
        onClose={() => setIsOfferLetterOpen(false)}
        onOpenVerification={(refCode) => {
          if (refCode) setVerificationRefCode(refCode);
          setIsVerificationModalOpen(true);
        }}
      />

      {/* 5. Tenancy Agreement Modal */}
      {selectedBookingForTenancy && (
        <DigitalTenancyAgreementModal
          isOpen={isTenancyModalOpen}
          booking={selectedBookingForTenancy}
          slots={enrichedSlots}
          onClose={() => setIsTenancyModalOpen(false)}
          onAgreementSigned={() => triggerRefresh()}
        />
      )}

      {/* 6. Public QR Verification Modal */}
      <PublicVerificationModal
        isOpen={isVerificationModalOpen}
        defaultRefCode={verificationRefCode}
        bookings={bookings}
        businesses={businesses}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* 7. Application Status & Official Documents Modal */}
      <ApplicationStatusDocumentsModal
        isOpen={isStatusDocumentsModalOpen}
        onClose={() => setIsStatusDocumentsModalOpen(false)}
        userBooking={myBookings[0] || null}
        grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
        mentorshipRegistrations={mentorshipRegistrations.filter(r => r.applicantId === user?.uid || (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))}
        onOpenBooking={handleOpenNewBooking}
        onOpenGrantModal={handleOpenGrantModal}
        onOpenMentorship={() => {
          setIsStatusDocumentsModalOpen(false);
          if (isYouth) setActiveTab('mentorship');
        }}
        onOpenVerification={(refCode) => {
          setVerificationRefCode(refCode || myBookings[0]?.id || 'KBN-KB-2026-8819');
          setIsVerificationModalOpen(true);
        }}
        onCancelMentorship={(regId) => {
          const target = mentorshipRegistrations.find(r => r.id === regId);
          if (target) handleUpdateMentorshipRegistration({ ...target, status: 'cancelled' });
        }}
      />

      {/* 7b. Kiosk Cashflow & DuitNow QR Modal */}
      <KioskCashflowModal
        isOpen={isCashflowModalOpen}
        onClose={() => setIsCashflowModalOpen(false)}
        kioskName={myBookings[0]?.slotName || 'Kiosk Modular KBelia'}
        businessName={myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Anda'}
      />

      {/* 8. Micro-Learning Academy Modal */}
      <MicroLearningAcademyModal
        isOpen={isAcademyModalOpen}
        onClose={() => setIsAcademyModalOpen(false)}
      />

      {/* 10. Kiosk Maintenance Modal */}
      <KioskMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        defaultSlotCode={myBookings[0]?.slotCode || 'CAP-UMK-01'}
        defaultKioskName={myBookings[0]?.slotName || 'Kiosk Modular KBelia'}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />

      {/* 11. Youth B2B Matching Modal */}
      <YouthB2BNetworkModal
        isOpen={isB2BModalOpen}
        onClose={() => setIsB2BModalOpen(false)}
      />

      {/* 12. Youth Events Calendar Modal */}
      <YouthEventsCalendarModal
        isOpen={isEventsModalOpen}
        onClose={() => setIsEventsModalOpen(false)}
      />

      <LoginModal />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ConfirmDeleteProvider>
          <MainApp />
          <SessionTimeoutModal />
          <ToastContainer />
        </ConfirmDeleteProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
