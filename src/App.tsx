import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CommunityPost,
  CommunityReply,
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
  INITIAL_PROGRAMS,
  normalizeCapsuleSlot,
  normalizeLegacySlotName
} from './data/seedData';
import { 
  INITIAL_MENTOR_PROFILES, 
  INITIAL_MENTORSHIP_REGISTRATIONS 
} from './data/mentorData';
import { INITIAL_PORTAL_NEWS } from './data/newsData';
import { INITIAL_COMMUNITY_POSTS, INITIAL_COMMUNITY_REPLIES } from './data/communityData';
import { 
  getDeletedIds, 
  isProductionAuthenticated,
  seedInitialData, 
  DEFAULT_PORTAL_SETTINGS, 
  loadLocalPortalSettings,
  loadLocalDemoNews,
  loadLocalDemoCommunityPosts,
  loadLocalDemoCommunityReplies,
  saveMentorshipRegistrationRecord,
  saveMentorProfileRecord,
  updateGrantApplicationStatus,
  getSeededDemoCashflowRecords
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
import { CommunityPage } from './components/CommunityPage';
import { DashboardBannerHeader } from './components/DashboardBannerHeader';
import { PageSkeleton } from './components/PageSkeleton';
import { SettingsPage } from './components/SettingsPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { LandingPage } from './components/LandingPage';
import { KioskBookingPage, KioskPageView } from './components/KioskBookingPage';
import { getRoleTheme } from './utils/roleTheme';
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
  const { user, userProfile, isAdmin, isMentor, isYouth: isAuthenticatedYouth, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const isYouth = !isAdmin && !isMentor;
  const { theme } = useTheme();

  // Default to 'landing' page so opening the link presents a welcoming landing page
  const [activeTab, setActiveTab] = useState<UMKTab>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Youth Merchant, Admin, and Mentor Sub-Navigation States
  const [merchantSubTab, setMerchantSubTab] = useState<MerchantSubTab>('overview');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('queue');
  const [mentorSubTab, setMentorSubTab] = useState<MentorSubTab>('overview');
  const [kioskPageView, setKioskPageView] = useState<KioskPageView>('browse');

  const [isPageSkeletonVisible, setIsPageSkeletonVisible] = useState(false);
  const [skeletonTransitionKey, setSkeletonTransitionKey] = useState('home');
  const mainScrollRef = useRef<HTMLElement>(null);
  const skeletonTimerRef = useRef<number | null>(null);

  const triggerSkeletonTransition = useCallback((targetTab: UMKTab, overrideSubTab?: string) => {
    if (skeletonTimerRef.current !== null) {
      window.clearTimeout(skeletonTimerRef.current);
      skeletonTimerRef.current = null;
    }

    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (targetTab === 'landing' || targetTab === 'login' || targetTab === 'register') {
      setIsPageSkeletonVisible(false);
      triggerTopNavigationProgress(300);
      return;
    }

    const currentRole = isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia';
    const subKey = overrideSubTab || `${adminSubTab}:${mentorSubTab}:${merchantSubTab}`;
    setSkeletonTransitionKey(`${targetTab}:${currentRole}:${subKey}:${Date.now()}`);
    setIsPageSkeletonVisible(true);
    triggerTopNavigationProgress(800);

    skeletonTimerRef.current = window.setTimeout(() => {
      setIsPageSkeletonVisible(false);
      skeletonTimerRef.current = null;
    }, 800);
  }, [isAdmin, isMentor, merchantSubTab, mentorSubTab, adminSubTab]);

  const navigateWithSkeleton = useCallback((tab: UMKTab, overrideSubTab?: string) => {
    if (tab === 'academic' && !overrideSubTab) {
      setKioskPageView('browse');
    }
    if (tab === 'home' && !overrideSubTab) {
      setAdminSubTab('queue');
      setMentorSubTab('overview');
      setMerchantSubTab('overview');
    }
    setActiveTab(tab);
    triggerSkeletonTransition(tab, overrideSubTab);
  }, [triggerSkeletonTransition]);

  useEffect(() => {
    return () => {
      if (skeletonTimerRef.current !== null) {
        window.clearTimeout(skeletonTimerRef.current);
      }
    };
  }, []);

  // Sync dark mode class consistently across all tabs
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Reset scroll position whenever navigating tabs
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Handle idle session termination: close open modals and redirect to login
  useEffect(() => {
    const handleSessionTerminated = () => {
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

  // Strict Portal Auth Guard: Only 'landing', 'login', and 'register' are accessible without an authenticated account
  useEffect(() => {
    if (authLoading) return;
    if (!user && activeTab !== 'landing' && activeTab !== 'login' && activeTab !== 'register') {
      setActiveTab('login');
    }
  }, [authLoading, user, activeTab]);

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
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [communityReplies, setCommunityReplies] = useState<CommunityReply[]>(INITIAL_COMMUNITY_REPLIES);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [grantEndorsements, setGrantEndorsements] = useState<GrantEndorsement[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters for Kapsul Niaga
  const [selectedHubFilter, setSelectedHubFilter] = useState('Semua');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState(500);

  // Modals state
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<CapsuleSlot | null>(null);
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
  const [verificationRefCode, setVerificationRefCode] = useState('');
  
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

    const adminAllowedTabs: UMKTab[] = ['home', 'admin', 'academic', 'ceed', 'hepa', 'news', 'community', 'settings'];
    const mentorAllowedTabs: UMKTab[] = ['home', 'mentor', 'news', 'community', 'settings'];
    const youthAllowedTabs: UMKTab[] = ['home', 'merchant', 'academic', 'ceed', 'hepa', 'events', 'b2b', 'calculator', 'mentorship', 'news', 'community', 'settings'];

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
    setMentors(prev =>
      prev.some(m => m.id === updated.id)
        ? prev.map(m => (m.id === updated.id ? updated : m))
        : [updated, ...prev]
    );
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
      const toTime = (s?: PortalSettings | null) => {
        if (!s?.updatedAt) return 0;
        const t = new Date(s.updatedAt).getTime();
        return Number.isNaN(t) ? 0 : t;
      };
      const prodAuth = isProductionAuthenticated();
      if (remoteSettings && demoSyncSettings) {
        const remoteTs = toTime(remoteSettings);
        const demoTs = toTime(demoSyncSettings);
        const winner =
          remoteTs > demoTs
            ? remoteSettings
            : demoTs > remoteTs
            ? demoSyncSettings
            : prodAuth
            ? remoteSettings
            : demoSyncSettings;
        setPortalSettings({ ...DEFAULT_PORTAL_SETTINGS, ...winner });
      } else if (remoteSettings) {
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
      const mergedSlots = mergeUniqueById<CapsuleSlot>(priorityLists, deleted).map((s) =>
        normalizeCapsuleSlot(s)
      );
      setSlots(mergedSlots);
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

    const unsubProd = user && auth.currentUser
      ? onSnapshot(
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
        )
      : () => {};

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

  // 4b2. Real-time Community Forum Listener (Posts & Replies, All Signed-In Users)
  useEffect(() => {
    let firestorePosts: CommunityPost[] = [];
    let firestoreReplies: CommunityReply[] = [];
    let demoSyncPosts: CommunityPost[] = [];
    let demoSyncReplies: CommunityReply[] = [];
    let demoSyncDeletedPosts: string[] = [];
    let demoSyncDeletedReplies: string[] = [];

    const recomputeCommunity = () => {
      const deleted = [...getDeletedIds(), ...demoSyncDeletedPosts, ...demoSyncDeletedReplies];
      const localPosts = loadLocalDemoCommunityPosts();
      const localReplies = loadLocalDemoCommunityReplies();
      const prodAuth = isProductionAuthenticated();

      const postPriority = prodAuth
        ? [firestorePosts, demoSyncPosts, localPosts, INITIAL_COMMUNITY_POSTS]
        : [demoSyncPosts, localPosts, firestorePosts, INITIAL_COMMUNITY_POSTS];
      const replyPriority = prodAuth
        ? [firestoreReplies, demoSyncReplies, localReplies, INITIAL_COMMUNITY_REPLIES]
        : [demoSyncReplies, localReplies, firestoreReplies, INITIAL_COMMUNITY_REPLIES];

      setCommunityPosts(mergeUniqueById<CommunityPost>(postPriority, deleted));
      setCommunityReplies(mergeUniqueById<CommunityReply>(replyPriority, deleted));
    };

    recomputeCommunity();

    const handleDemoCommunityUpdate = () => recomputeCommunity();
    window.addEventListener('kbelia_demo_community_updated', handleDemoCommunityUpdate);

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (
        entity === 'all' ||
        entity === 'community_post' ||
        entity === 'community_reply' ||
        entity === 'deleted'
      ) {
        recomputeCommunity();
      }
    });

    let unsubPosts = () => {};
    let unsubReplies = () => {};

    if (auth.currentUser) {
      setIsCommunityLoading(true);
      unsubPosts = onSnapshot(
        collection(db, 'community_posts'),
        (snapshot) => {
          const loaded: CommunityPost[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as CommunityPost);
          });
          firestorePosts = loaded;
          setIsCommunityLoading(false);
          recomputeCommunity();
        },
        (err) => {
          console.debug('Community posts listener notice:', err?.message || err);
          setIsCommunityLoading(false);
          recomputeCommunity();
        }
      );

      unsubReplies = onSnapshot(
        collection(db, 'community_replies'),
        (snapshot) => {
          const loaded: CommunityReply[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as CommunityReply);
          });
          firestoreReplies = loaded;
          recomputeCommunity();
        },
        (err) => {
          console.debug('Community replies listener notice:', err?.message || err);
          recomputeCommunity();
        }
      );
    }

    const unsubDemoPosts = subscribeDemoSyncCollection<CommunityPost>('community_post', (items, delIds) => {
      demoSyncPosts = items;
      demoSyncDeletedPosts = delIds;
      recomputeCommunity();
    });

    const unsubDemoReplies = subscribeDemoSyncCollection<CommunityReply>('community_reply', (items, delIds) => {
      demoSyncReplies = items;
      demoSyncDeletedReplies = delIds;
      recomputeCommunity();
    });

    return () => {
      window.removeEventListener('kbelia_demo_community_updated', handleDemoCommunityUpdate);
      unsubCrossTab();
      unsubPosts();
      unsubReplies();
      unsubDemoPosts();
      unsubDemoReplies();
    };
  }, [user?.uid, user?.isDemo, refreshTrigger]);

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
    let demoSyncDeleted: string[] = [];

    const recomputeMentors = () => {
      const localMentors = loadLocalMentors();
      const deleted = [...getDeletedIds(), ...demoSyncDeleted];
      const prodAuth = isProductionAuthenticated();
      const priorityLists = prodAuth
        ? [firestoreMentors, demoSyncMentors, localMentors, INITIAL_MENTOR_PROFILES]
        : [demoSyncMentors, localMentors, firestoreMentors, INITIAL_MENTOR_PROFILES];
      setMentors(mergeUniqueById<MentorProfile>(priorityLists, deleted));
    };

    recomputeMentors();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'mentor' || entity === 'deleted') {
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

    const unsubDemoMentors = subscribeDemoSyncCollection<MentorProfile>('mentor', (items, delIds) => {
      demoSyncMentors = items;
      demoSyncDeleted = delIds;
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
    let demoSyncDeletedBookings: string[] = [];
    let prodGrants: GrantApplication[] = [];
    let demoSyncGrants: GrantApplication[] = [];
    let demoSyncDeletedGrants: string[] = [];
    let prodTickets: MaintenanceTicket[] = [];
    let demoSyncTickets: MaintenanceTicket[] = [];
    let demoSyncDeletedTickets: string[] = [];
    let prodCashflow: KioskDailySale[] = [];
    let demoSyncCashflow: KioskDailySale[] = [];
    let demoSyncDeletedCashflow: string[] = [];
    let prodSessions: MentorshipRegistration[] = [];
    let demoSyncSessions: MentorshipRegistration[] = [];
    let demoSyncDeletedSessions: string[] = [];
    let prodEndorsements: GrantEndorsement[] = [];
    let demoSyncEndorsements: GrantEndorsement[] = [];
    let demoSyncDeletedEndorsements: string[] = [];

    const readLocalArray = <T,>(key: string, fallback: T[] = []): T[] => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };

    const recomputeProtectedState = () => {
      const baseDeleted = getDeletedIds();
      const bookingDeleted = [...baseDeleted, ...demoSyncDeletedBookings];
      const grantDeleted = [...baseDeleted, ...demoSyncDeletedGrants];
      const ticketDeleted = [...baseDeleted, ...demoSyncDeletedTickets];
      const cashflowDeleted = [...baseDeleted, ...demoSyncDeletedCashflow];
      const sessionDeleted = [...baseDeleted, ...demoSyncDeletedSessions];
      const endorsementDeleted = [...baseDeleted, ...demoSyncDeletedEndorsements];

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
        const mentorSessionSource = mergeUniqueById<MentorshipRegistration>(
          prodAuth
            ? [prodSessions, demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS]
            : [demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS],
          sessionDeleted
        ).filter(r => !userProfile?.mentorId || r.mentorId === userProfile.mentorId);
        setMentorshipRegistrations(mentorSessionSource);

        const mentorEndSource = mergeUniqueById<GrantEndorsement>(
          prodAuth
            ? [prodEndorsements, demoSyncEndorsements, demoEndorsementsLocal]
            : [demoSyncEndorsements, demoEndorsementsLocal],
          endorsementDeleted
        ).filter(e => !userProfile?.mentorId || e.mentorId === userProfile.mentorId);
        setGrantEndorsements(mentorEndSource);
        return;
      }

      const normalizeBookingList = (list: CapsuleBooking[]) =>
        list.map((b) => {
          const normalizedSlotName = normalizeLegacySlotName(b.slotId || b.slotCode, b.slotName);
          return normalizedSlotName === b.slotName ? b : { ...b, slotName: normalizedSlotName };
        });

      if (isAdmin) {
        // Admin sees governance queues across BOTH production & Demo/sandbox real-time streams
        setBookings(normalizeBookingList(mergeUniqueById<CapsuleBooking>([prodBookings, demoSyncBookings, demoBookingsLocal], bookingDeleted)));
        setGrantApplications(mergeUniqueById<GrantApplication>([prodGrants, demoSyncGrants, demoGrantsLocal], grantDeleted));
        setMaintenanceTickets(mergeUniqueById<MaintenanceTicket>([prodTickets, demoSyncTickets, demoTicketsLocal], ticketDeleted));
        setCashflowRecords([]); // Privacy isolation: personal daily cashflow belongs strictly to owner
        setMentorshipRegistrations(
          mergeUniqueById<MentorshipRegistration>(
            [prodSessions, demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS],
            sessionDeleted
          )
        );
        setGrantEndorsements(
          mergeUniqueById<GrantEndorsement>([prodEndorsements, demoSyncEndorsements, demoEndorsementsLocal], endorsementDeleted)
        );
        return;
      }

      // Youth Entrepreneur: strictly scoped to own UID across BOTH production & Demo/sandbox real-time streams
      const allDemoBookings = mergeUniqueById<CapsuleBooking>([demoSyncBookings, demoBookingsLocal], bookingDeleted)
        .filter(b => b.applicantId === user.uid);
      setBookings(normalizeBookingList(prodAuth ? mergeUniqueById<CapsuleBooking>([prodBookings, allDemoBookings], bookingDeleted) : allDemoBookings));

      const allDemoGrants = mergeUniqueById<GrantApplication>([demoSyncGrants, demoGrantsLocal], grantDeleted)
        .filter(g => g.applicantId === user.uid || (user.email && g.applicantEmail?.toLowerCase() === user.email.toLowerCase()));
      setGrantApplications(prodAuth ? mergeUniqueById<GrantApplication>([prodGrants, allDemoGrants], grantDeleted) : allDemoGrants);

      const allDemoTickets = mergeUniqueById<MaintenanceTicket>([demoSyncTickets, demoTicketsLocal], ticketDeleted)
        .filter(t => t.ownerId === user.uid);
      setMaintenanceTickets(prodAuth ? mergeUniqueById<MaintenanceTicket>([prodTickets, allDemoTickets], ticketDeleted) : allDemoTickets);

      const cfLocal = getSeededDemoCashflowRecords(user.uid, Boolean(user.isDemo));
      const scopedDemoCashflow = mergeUniqueById<KioskDailySale>([demoSyncCashflow, cfLocal], cashflowDeleted)
        .filter(r => !r.ownerId || r.ownerId === user.uid);
      setCashflowRecords(
        prodAuth
          ? mergeUniqueById<KioskDailySale>([prodCashflow, scopedDemoCashflow], cashflowDeleted)
          : scopedDemoCashflow
      );

      const youthSessionsSource = mergeUniqueById<MentorshipRegistration>(
        prodAuth
          ? [prodSessions, demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS]
          : [demoSyncSessions, demoSessionsLocal, INITIAL_MENTORSHIP_REGISTRATIONS],
        sessionDeleted
      ).filter(r => r.applicantId === user.uid || (user.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()));
      setMentorshipRegistrations(youthSessionsSource);

      const youthEndSource = mergeUniqueById<GrantEndorsement>(
        prodAuth
          ? [prodEndorsements, demoSyncEndorsements, demoEndorsementsLocal]
          : [demoSyncEndorsements, demoEndorsementsLocal],
        endorsementDeleted
      ).filter(e => e.menteeId === user.uid);
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

    if (auth.currentUser || user) {
      if (!isMentor) {
        unsubDemoBookings = subscribeDemoSyncCollection<CapsuleBooking>('booking', (items, delIds) => {
          demoSyncBookings = items;
          demoSyncDeletedBookings = delIds;
          recomputeProtectedState();
        });
        unsubDemoGrants = subscribeDemoSyncCollection<GrantApplication>('grant', (items, delIds) => {
          demoSyncGrants = items;
          demoSyncDeletedGrants = delIds;
          recomputeProtectedState();
        });
        unsubDemoTickets = subscribeDemoSyncCollection<MaintenanceTicket>('ticket', (items, delIds) => {
          demoSyncTickets = items;
          demoSyncDeletedTickets = delIds;
          recomputeProtectedState();
        });
        if (!isAdmin) {
          unsubDemoCashflow = subscribeDemoSyncCollection<KioskDailySale>('cashflow', (items, delIds) => {
            demoSyncCashflow = items;
            demoSyncDeletedCashflow = delIds;
            recomputeProtectedState();
          });
        }
      }
      unsubDemoSessions = subscribeDemoSyncCollection<MentorshipRegistration>('session', (items, delIds) => {
        demoSyncSessions = items;
        demoSyncDeletedSessions = delIds;
        recomputeProtectedState();
      });
      unsubDemoEndorsements = subscribeDemoSyncCollection<GrantEndorsement>('endorsement', (items, delIds) => {
        demoSyncEndorsements = items;
        demoSyncDeletedEndorsements = delIds;
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
      const seeded = localStorage.getItem('kbelia_seeded_v31');
      if (!seeded) {
        seedInitialData().then((ok) => {
          if (ok) {
            localStorage.setItem('kbelia_seeded_v31', 'true');
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

  const hasActiveYouthBooking =
    isYouth &&
    Boolean(user) &&
    bookings.some(
      (b) =>
        (b.applicantId === user?.uid ||
          (user?.email && b.applicantEmail?.toLowerCase() === user.email.toLowerCase())) &&
        (b.status === 'pending' || b.status === 'approved')
    );

  const promptBeliaLoginForAction = (message: string) => {
    showToast({
      type: 'info',
      title: language === 'en' ? 'Belia Login Required' : 'Log Masuk Belia Diperlukan',
      message
    });
    setActiveTab('login');
  };

  const handleOpenBookingForSlot = (slot: CapsuleSlot) => {
    if (!user) {
      promptBeliaLoginForAction(
        language === 'en'
          ? 'Please sign in with a Belia account to view full kiosk details or submit an application.'
          : 'Sila log masuk akaun Belia Kelantan untuk melihat butiran penuh kiosk atau membuat permohonan.'
      );
      return;
    }

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

    if (hasActiveYouthBooking) {
      showToast({
        type: 'warning',
        title: 'Had 1 Tempahan Kiosk Aktif',
        message: 'Anda sudah mempunyai 1 tempahan kiosk aktif. Sila batalkan tempahan sedia ada di halaman Urus & Batal Tempahan sebelum memilih unit baharu.'
      });
      setKioskPageView('manage');
      navigateWithSkeleton('academic', 'manage');
      return;
    }

    setSelectedSlotForBooking(slot);
    setKioskPageView('book');
    navigateWithSkeleton('academic', 'book');
  };

  const handleOpenTenantDetail = (slot: CapsuleSlot) => {
    if (!user) {
      promptBeliaLoginForAction(
        language === 'en'
          ? 'Please sign in with a Belia account to view tenant details.'
          : 'Sila log masuk akaun Belia Kelantan untuk melihat profil penyewa kiosk.'
      );
      return;
    }
    setSelectedSlotForTenantDetail(slot);
    setIsTenantDetailModalOpen(true);
  };

  const handleOpenNewBooking = () => {
    if (!user) {
      promptBeliaLoginForAction(
        language === 'en'
          ? 'Please sign in with a Belia account to apply for a kiosk.'
          : 'Sila log masuk akaun Belia Kelantan untuk memohon tapak kiosk.'
      );
      return;
    }

    if (isAdmin || isMentor) {
      showToast({
        type: 'warning',
        title: 'Batas Peranan Sistem',
        message: 'Borang permohonan tapak kiosk dikhaskan untuk Usahawan Belia sahaja.'
      });
      return;
    }

    if (hasActiveYouthBooking) {
      showToast({
        type: 'warning',
        title: 'Had 1 Tempahan Kiosk Aktif',
        message: 'Anda sudah mempunyai 1 tempahan kiosk aktif. Sila batalkan tempahan sedia ada terlebih dahulu.'
      });
      setKioskPageView('manage');
      navigateWithSkeleton('academic', 'manage');
      return;
    }

    const firstAvailable = enrichedSlots.find(s => s.status === 'available' && !s.currentTenantBusinessName);
    setSelectedSlotForBooking(firstAvailable || null);
    setKioskPageView('book');
    navigateWithSkeleton('academic', 'book');
  };

  const handleOpenGrantModal = (programTitle?: string, amount?: string) => {
    if (!user) {
      promptBeliaLoginForAction(
        language === 'en'
          ? 'Please sign in with a Belia account to apply for grants.'
          : 'Sila log masuk akaun Belia Kelantan untuk membuat permohonan geran.'
      );
      return;
    }

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
    navigateWithSkeleton('mentorship');
  };

  const handleViewOfferLetter = (booking: CapsuleBooking) => {
    if (isMentor) return;
    setSelectedBookingForOffer(booking);
    setIsOfferLetterOpen(true);
  };

  const handleOpenBusinessDetail = (biz: BusinessListing) => {
    if (!user) {
      promptBeliaLoginForAction(
        language === 'en'
          ? 'Please sign in with a Belia account to inspect entrepreneur product details.'
          : 'Sila log masuk akaun Belia Kelantan untuk melihat butiran produk dan berhubung dengan rakan usahawan.'
      );
      return;
    }
    setSelectedBusinessForDetail(biz);
    setIsBusinessDetailModalOpen(true);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelGrantApplication = async (grant: GrantApplication) => {
    try {
      await updateGrantApplicationStatus(grant.id, 'cancelled', 'Permohonan geran dibatalkan oleh pemohon.', grant);
      triggerRefresh();
      showToast({
        type: 'info',
        title: language === 'en' ? 'Grant Request Cancelled' : 'Permohonan Geran Dibatalkan',
        message: grant.programTitle
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: language === 'en' ? 'Cancellation Failed' : 'Gagal Membatalkan',
        message: err?.message || 'Sila cuba lagi.'
      });
    }
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

  // Hard Auth Guard: Prevent any unauthenticated access to internal portal/dashboard modules
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-black dark:text-white font-sans antialiased transition-colors duration-200">
        <LoginPage
          setActiveTab={setActiveTab}
          onOpenBooking={handleOpenNewBooking}
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
        setActiveTab={navigateWithSkeleton}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSelectMerchantSubTab={(sub) => {
          setMerchantSubTab(sub);
          navigateWithSkeleton('merchant', sub);
        }}
        onSelectAdminSubTab={(sub) => {
          setAdminSubTab(sub);
          navigateWithSkeleton('admin', sub);
        }}
        onSelectMentorSubTab={(sub) => {
          setMentorSubTab(sub);
          navigateWithSkeleton('mentor', sub);
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
          setActiveTab={navigateWithSkeleton}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenBooking={handleOpenNewBooking}
          onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
          merchantSubTab={merchantSubTab}
          onSelectMerchantSubTab={(sub) => {
            setMerchantSubTab(sub);
            navigateWithSkeleton('merchant', sub);
          }}
          adminSubTab={adminSubTab}
          onSelectAdminSubTab={(sub) => {
            setAdminSubTab(sub);
            navigateWithSkeleton('admin', sub);
          }}
          mentorSubTab={mentorSubTab}
          onSelectMentorSubTab={(sub) => {
            setMentorSubTab(sub);
            navigateWithSkeleton('mentor', sub);
          }}
          notificationData={{
            userId: user?.uid,
            userEmail: user?.email || userProfile?.email,
            myBusiness,
            myProducts,
            myBookings,
            myGrants: myYouthGrants,
            myMentorships: scopedMentorRegistrations,
            cashflowRecords,
            businesses,
            bookings,
            slots: enrichedSlots,
            grantApplications,
            mentorshipRegistrations: scopedMentorRegistrations,
            maintenanceTickets,
            newsItems,
            portalSettings,
            currentMentor: isMentor
              ? mentors.find((m) => m.id === (userProfile?.mentorId || mentors[0]?.id)) || mentors[0] || null
              : null,
            grantEndorsements
          }}
        />

        {/* Center/Right Dynamic Body */}
        <main
          ref={mainScrollRef}
          className={`flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 w-full max-w-none min-w-0 scroll-smooth transition-colors ${
            getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia').canvasClass
          }`}
        >
          <div className="w-full">
          {/* Portal Maintenance / Announcement Bar from Admin Settings */}
          {portalSettings.systemStatus === 'maintenance' && !isAdmin && (
            <div className="mb-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-black dark:text-white text-sm flex items-center justify-between gap-3">
              <span className="font-semibold">
                Mod Penyelenggaraan Sistem Aktif: Sebahagian permohonan baharu ditutup buat sementara waktu. {portalSettings.portalAnnouncement}
              </span>
            </div>
          )}

          {/* Universal Dashboard Banner Header */}
          <DashboardBannerHeader
            activeTab={activeTab}
            role={isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia'}
            userName={userProfile?.fullName || user?.displayName || 'Pengguna KBelia'}
            onNavigateHome={() => navigateWithSkeleton('home')}
            onNavigateTab={navigateWithSkeleton}
          />

          <PageSkeleton
            active={isPageSkeletonVisible}
            transitionKey={`${skeletonTransitionKey}:${activeTab}:${adminSubTab}:${mentorSubTab}:${merchantSubTab}`}
          >
          {/* Tab Route Content: Home View strictly routed by role */}
          {activeTab === 'home' && (
            <>
              {/* 1. ADMIN DASHBOARD VIEW */}
              {isAdmin && (
                <div className="pt-0.5">
                  <AdminDashboard
                    slots={enrichedSlots}
                    businesses={businesses}
                    products={products}
                    bookings={bookings}
                    programs={programs}
                    grantApplications={grantApplications}
                    mentorshipRegistrations={mentorshipRegistrations}
                    mentors={mentors}
                    maintenanceTickets={maintenanceTickets}
                    portalSettings={portalSettings}
                    newsItems={newsItems}
                    communityPosts={communityPosts}
                    onUpdateMentor={handleUpdateMentorProfile}
                    onRefresh={triggerRefresh}
                    activeSubTab={adminSubTab}
                    onSelectSubTab={(sub) => {
                      setAdminSubTab(sub);
                      triggerSkeletonTransition('admin', sub);
                    }}
                  />
                </div>
              )}

              {/* 2. MENTOR DASHBOARD VIEW */}
              {isMentor && (
                <div className="pt-0.5">
                  <MentorPortal
                    mentors={mentors}
                    registrations={scopedMentorRegistrations}
                    businesses={businesses}
                    onUpdateRegistration={handleUpdateMentorshipRegistration}
                    onUpdateMentor={handleUpdateMentorProfile}
                    activeSubTab={mentorSubTab}
                    onSelectSubTab={(sub) => {
                      setMentorSubTab(sub);
                      triggerSkeletonTransition('mentor', sub);
                    }}
                  />
                </div>
              )}

              {/* 3. YOUTH ENTREPRENEUR DASHBOARD VIEW */}
              {isYouth && (
                <div className="pt-0.5">
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
                    onOpenBookingTab={(viewOverride) => {
                      const targetView: KioskPageView = viewOverride || (hasActiveYouthBooking ? 'manage' : 'browse');
                      setKioskPageView(targetView);
                      navigateWithSkeleton('academic', targetView);
                    }}
                    onOpenSettingsTab={() => navigateWithSkeleton('settings')}
                    onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
                    onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
                    onRefresh={triggerRefresh}
                    activeSubTab={merchantSubTab}
                    onSelectSubTab={(sub) => {
                      setMerchantSubTab(sub);
                      triggerSkeletonTransition('merchant', sub);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* KAPSUL NIAGA VIEW */}
          {activeTab === 'academic' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return isMentor ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Ruang Ini Khusus untuk Usahawan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Akaun Mentor tertumpu kepada sesi bimbingan, jadual pertemuan, dan sokongan usahawan di Ruang Bimbingan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton('mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Ruang Bimbingan</span>
                </button>
              </div>
            ) : isAdmin ? (
              <div className="pt-0.5">
                <CapsuleGrid
                  slots={enrichedSlots}
                  bookings={bookings}
                  portalSettings={portalSettings}
                  onSelectSlot={handleOpenBookingForSlot}
                  onViewTenantDetail={handleOpenTenantDetail}
                  onOpenNewBooking={handleOpenNewBooking}
                  onAddSlot={() => { setAdminSubTab('slots'); navigateWithSkeleton('admin', 'slots'); }}
                  selectedHub={selectedHubFilter}
                  onSelectHub={setSelectedHubFilter}
                  maxBudget={maxBudgetFilter}
                  onBudgetChange={setMaxBudgetFilter}
                  isReadOnly={true}
                />
              </div>
            ) : (
              <div className="pt-0.5">
                <KioskBookingPage
                  slots={enrichedSlots}
                  bookings={bookings}
                  maintenanceTickets={maintenanceTickets}
                  portalSettings={portalSettings}
                  view={kioskPageView}
                  onChangeView={setKioskPageView}
                  preselectedSlot={selectedSlotForBooking}
                  onSelectSlotForBooking={(slot) => setSelectedSlotForBooking(slot)}
                  onViewTenantDetail={handleOpenTenantDetail}
                  selectedHub={selectedHubFilter}
                  onSelectHub={setSelectedHubFilter}
                  maxBudget={maxBudgetFilter}
                  onBudgetChange={setMaxBudgetFilter}
                  onRefresh={triggerRefresh}
                  onViewOfferLetter={handleViewOfferLetter}
                  onOpenTenancyAgreement={(booking) => {
                    setSelectedBookingForTenancy(booking);
                    setIsTenancyModalOpen(true);
                  }}
                  onOpenVerification={(refCode) => {
                    setVerificationRefCode(refCode || myBookings[0]?.id || 'KBN-KB-2026-8819');
                    setIsVerificationModalOpen(true);
                  }}
                  onOpenMaintenanceModal={() => { if (isYouth) setIsMaintenanceModalOpen(true); }}
                />
              </div>
            );
          })()}

          {/* DIREKTORI USAHAWAN KELANTAN */}
          {activeTab === 'hepa' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return isMentor ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Senarai Usahawan Anda di Ruang Bimbingan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Untuk menjaga privasi komuniti, Mentor melihat senarai usahawan di bawah bimbingan sendiri terus dari Ruang Bimbingan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton('mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Ruang Bimbingan</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <DirectorySection
                  businesses={businesses}
                  onSelectBusiness={handleOpenBusinessDetail}
                  onRegisterBusiness={isYouth ? () => navigateWithSkeleton('merchant') : undefined}
                />
              </div>
            );
          })()}

          {/* SOKONGAN MODAL & INISIATIF */}
          {activeTab === 'ceed' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return isMentor ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Urusan Sokongan Melalui Ruang Bimbingan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Mentor mengurus pengesahan sokongan usahawan melalui tab Sokongan Usahawan di Ruang Bimbingan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton('mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Ruang Bimbingan</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <ProgramsSection 
                  programs={programs} 
                  grantApplications={isAdmin ? grantApplications : myYouthGrants}
                  onOpenGrantModal={isYouth ? handleOpenGrantModal : undefined}
                  onCancelGrant={isYouth ? handleCancelGrantApplication : undefined}
                  onAddProgram={isAdmin ? () => { setAdminSubTab('programs'); navigateWithSkeleton('admin', 'programs'); } : undefined}
                  onRefresh={triggerRefresh}
                  isReadOnly={isAdmin}
                />
              </div>
            );
          })()}

          {/* ACARA & EKSPO KOMUNITI */}
          {activeTab === 'events' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isYouth ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Penyertaan Acara Khusus untuk Usahawan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Halaman penyertaan acara dan ekspo komuniti ini disediakan khusus untuk akaun Usahawan Belia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isAdmin ? 'admin' : 'mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <span>{isAdmin ? 'Ke Pusat Penyelarasan' : 'Ke Ruang Bimbingan'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <EventsSection />
              </div>
            );
          })()}

          {/* JARINGAN PEMBEKAL & NIAGA */}
          {activeTab === 'b2b' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isYouth ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Jaringan Niaga Khusus untuk Usahawan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Jaringan pembekal dan kerjasama niaga ini dikhaskan untuk komuniti usahawan belia Kelantan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isAdmin ? 'admin' : 'mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <span>{isAdmin ? 'Ke Pusat Penyelarasan' : 'Ke Ruang Bimbingan'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <B2BMarketSection />
              </div>
            );
          })()}

          {/* ANGGARAN KELAYAKAN SOKONGAN */}
          {activeTab === 'calculator' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isYouth ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">Anggaran Sokongan Khusus untuk Usahawan</h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Alat semakan anggaran kelayakan ini dikhaskan untuk pemohon Usahawan Belia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isAdmin ? 'admin' : 'mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <span>{isAdmin ? 'Ke Pusat Penyelarasan' : 'Ke Ruang Bimbingan'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <GrantCalculatorSection 
                  onOpenGrantModal={handleOpenGrantModal}
                  onOpenMentorship={handleOpenMentorshipClinicGuarded}
                />
              </div>
            );
          })()}

          {/* PUSAT PENYELARASAN (ADMIN ONLY) */}
          {activeTab === 'admin' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isAdmin ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">
                    {language === 'en' ? 'Coordinator Access Only' : 'Khusus untuk Penyelaras Ekosistem'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {isMentor 
                      ? 'Akaun anda ialah akaun Mentor. Ruangan penyelarasan ekosistem ini dikhaskan untuk pihak pentadbir.'
                      : 'Ruangan ini dikhaskan kepada Penyelaras Ekosistem Portal KBelia.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isMentor ? 'mentor' : 'home')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isMentor ? 'Kembali ke Ruang Bimbingan' : 'Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <AdminDashboard
                  slots={enrichedSlots}
                  businesses={businesses}
                  products={products}
                  bookings={bookings}
                  programs={programs}
                  grantApplications={grantApplications}
                  mentorshipRegistrations={mentorshipRegistrations}
                  mentors={mentors}
                  maintenanceTickets={maintenanceTickets}
                  portalSettings={portalSettings}
                  newsItems={newsItems}
                  communityPosts={communityPosts}
                  onUpdateMentor={handleUpdateMentorProfile}
                  onRefresh={triggerRefresh}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={(sub) => {
                    setAdminSubTab(sub);
                    triggerSkeletonTransition('admin', sub);
                  }}
                />
              </div>
            );
          })()}

          {/* RUANG BIMBINGAN (MENTOR ONLY) */}
          {activeTab === 'mentor' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isMentor ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">
                    {language === 'en' ? 'Mentor Access Only' : 'Khusus untuk Panel Mentor'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {isAdmin
                      ? 'Penyelaras boleh mengurus senarai mentor melalui tab Mentor di Pusat Penyelarasan, manakala ruang bimbingan ini dikhaskan untuk Mentor.'
                      : 'Ruang Bimbingan ini dikhaskan untuk panel mentor dan pembimbing keusahawanan KBelia.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isAdmin ? 'admin' : 'home')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAdmin ? 'Ke Pusat Penyelarasan' : 'Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
                <MentorPortal
                  mentors={mentors}
                  registrations={scopedMentorRegistrations}
                  businesses={businesses}
                  onUpdateRegistration={handleUpdateMentorshipRegistration}
                  onUpdateMentor={handleUpdateMentorProfile}
                  activeSubTab={mentorSubTab}
                  onSelectSubTab={(sub) => {
                    setMentorSubTab(sub);
                    triggerSkeletonTransition('mentor', sub);
                  }}
                />
              </div>
            );
          })()}

          {/* RUANG USAHA ANDA (KHUSUS BELIA) */}
          {activeTab === 'merchant' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return isAdmin ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">
                    {language === 'en' ? 'Youth Entrepreneur Space Only' : 'Khusus untuk Usahawan Belia'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in as Coordinator. Business and product workspaces are reserved for youth entrepreneurs.'
                      : 'Akaun anda ialah Penyelaras Ekosistem. Ruang pengurusan perniagaan ini dikhaskan untuk usahawan belia Kelantan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton('admin')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Ecosystem Hub' : 'Ke Pusat Penyelarasan'}</span>
                </button>
              </div>
            ) : isMentor ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">
                    {language === 'en' ? 'Youth Entrepreneur Space Only' : 'Khusus untuk Usahawan Belia'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with a Mentor account. Please use your Mentorship Space to review sessions and support requests.'
                      : 'Akaun anda ialah Mentor KBelia. Sila gunakan Ruang Bimbingan untuk menyemak sesi dan memberi panduan kepada usahawan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton('mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'en' ? 'Mentorship Space' : 'Ke Ruang Bimbingan'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
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
                  onOpenBookingTab={(viewOverride) => {
                    const targetView: KioskPageView = viewOverride || (hasActiveYouthBooking ? 'manage' : 'browse');
                    setKioskPageView(targetView);
                    navigateWithSkeleton('academic', targetView);
                  }}
                  onOpenSettingsTab={() => navigateWithSkeleton('settings')}
                  onOpenMentorshipClinic={handleOpenMentorshipClinicGuarded}
                  onOpenMaintenanceModal={() => { if (isYouth) setIsMaintenanceModalOpen(true); }}
                  onRefresh={triggerRefresh}
                  activeSubTab={merchantSubTab}
                  onSelectSubTab={(sub) => {
                    setMerchantSubTab(sub);
                    triggerSkeletonTransition('merchant', sub);
                  }}
                />
              </div>
            );
          })()}

          {/* SESI & SENARAI MENTOR (YOUTH ONLY) */}
          {activeTab === 'mentorship' && (() => {
            const roleTheme = getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia');
            return !isYouth ? (
              <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 ${roleTheme.surfaceClass}`}>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${roleTheme.surfaceMutedClass} ${roleTheme.dividerClass} ${roleTheme.accentTextClass}`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F5F3EE]">
                    {language === 'en' ? 'Youth Entrepreneur Access Only' : 'Khusus untuk Usahawan Belia'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {language === 'en'
                      ? 'Mentor session booking is reserved for Youth Entrepreneur accounts.'
                      : 'Halaman tempahan sesi bimbingan dikhaskan kepada akaun Usahawan Belia.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithSkeleton(isAdmin ? 'admin' : 'mentor')}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAdmin ? 'Ke Pusat Penyelarasan' : 'Ke Ruang Bimbingan'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-0.5">
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
            );
          })()}

          {/* BERITA & PERKONGSIAN */}
          {activeTab === 'news' && (
            <div className="pt-0.5">
              <NewsPage
                newsItems={newsItems}
                onRefresh={triggerRefresh}
                onOpenAdminNewsTab={
                  isAdmin
                    ? () => {
                        setAdminSubTab('news');
                        navigateWithSkeleton('admin', 'news');
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* FORUM & PERBINCANGAN KOMUNITI */}
          {activeTab === 'community' && (
            <div className="pt-0.5">
              <CommunityPage
                posts={communityPosts}
                replies={communityReplies}
                isLoading={isCommunityLoading}
                onRefresh={triggerRefresh}
              />
            </div>
          )}

          {/* TETAPAN AKAUN & PROFIL */}
          {activeTab === 'settings' && (
            <div className="pt-0.5">
              <SettingsPage
                myBusiness={myBusiness}
                onRefresh={triggerRefresh}
              />
            </div>
          )}
          </PageSkeleton>
          </div>
        </main>
      </div>

      {/* Global Modals */}
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
        grantApplications={grantApplications}
        grantEndorsements={grantEndorsements}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* 7. Application Status & Official Documents Modal */}
      <ApplicationStatusDocumentsModal
        isOpen={isStatusDocumentsModalOpen}
        onClose={() => setIsStatusDocumentsModalOpen(false)}
        userBooking={myBookings.find(b => b.status === 'pending' || b.status === 'approved') || null}
        grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
        mentorshipRegistrations={mentorshipRegistrations.filter(r => r.applicantId === user?.uid || (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))}
        onOpenBooking={handleOpenNewBooking}
        onOpenGrantModal={handleOpenGrantModal}
        onOpenMentorship={() => {
          setIsStatusDocumentsModalOpen(false);
          if (isYouth) navigateWithSkeleton('mentorship');
        }}
        onOpenVerification={(refCode) => {
          const fallbackRef = myBookings[0]
            ? `KBN-${myBookings[0].slotCode}-${new Date(myBookings[0].createdAt || Date.now()).getFullYear()}-8819`
            : `REG-${new Date().getFullYear()}-BELIA`;
          setVerificationRefCode(refCode || fallbackRef);
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
        defaultSlotCode={myBookings[0]?.slotCode || 'CAP-BCH-01'}
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
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ConfirmDeleteProvider>
          {quotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-[0.8125rem] md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-3">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
              <button
                type="button"
                onClick={() => setQuotaExceeded(false)}
                className="text-[0.8125rem] font-bold px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 cursor-pointer shrink-0"
              >
                Tutup
              </button>
            </div>
          )}
          <MainApp />
          <SessionTimeoutModal />
          <ToastContainer />
        </ConfirmDeleteProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
