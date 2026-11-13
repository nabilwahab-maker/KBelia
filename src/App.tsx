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
  MerchantSubTab,
  AdminSubTab,
  MentorSubTab
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
import { 
  getDeletedIds, 
  seedInitialData, 
  DEFAULT_PORTAL_SETTINGS, 
  loadLocalPortalSettings,
  saveMentorshipRegistrationRecord,
  saveMentorProfileRecord
} from './services/dataService';
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
import { MentorshipClinicModal } from './components/MentorshipClinicModal';
import { KioskMaintenanceModal } from './components/KioskMaintenanceModal';
import { YouthB2BNetworkModal } from './components/YouthB2BNetworkModal';
import { YouthEventsCalendarModal } from './components/YouthEventsCalendarModal';
import { ToastContainer } from './components/ToastNotification';
import { TopProgressBar, triggerTopNavigationProgress } from './components/TopProgressBar';
import { 
  Building2, 
  Store, 
  Award, 
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

function MainApp() {
  const { user, userProfile, isAdmin, isDemoSession } = useAuth();
  const { t, language } = useLanguage();
  const isMentor = userProfile?.role === 'mentor';
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

  // Trigger top progress bar whenever navigating tabs
  useEffect(() => {
    triggerTopNavigationProgress(400);
  }, [activeTab]);

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
  const [selectedGrantTitle, setSelectedGrantTitle] = useState('Dana Benih Usahawan Belia Kelantan (RM3,000)');
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
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);
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

  useEffect(() => {
    try {
      localStorage.setItem('kbelia_mentor_profiles', JSON.stringify(mentors));
    } catch (e) {
      console.warn(e);
    }
  }, [mentors]);

  useEffect(() => {
    try {
      localStorage.setItem('kbelia_mentorship_registrations', JSON.stringify(mentorshipRegistrations));
    } catch (e) {
      console.warn(e);
    }
  }, [mentorshipRegistrations]);

  // Auto-switch to mentor tab when mentor logs in
  useEffect(() => {
    if (userProfile?.role === 'mentor') {
      setActiveTab('mentor');
    }
  }, [userProfile?.role]);

  const handleUpdateMentorProfile = (updated: MentorProfile) => {
    setMentors(prev => prev.map(m => m.id === updated.id ? updated : m));
    saveMentorProfileRecord(updated).catch(() => {});
  };

  const handleUpdateMentorshipRegistration = (updated: MentorshipRegistration) => {
    setMentorshipRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
    saveMentorshipRegistrationRecord(updated).catch(() => {});
  };

  const handleAddMentorshipRegistration = (newReg: MentorshipRegistration) => {
    const withOwner: MentorshipRegistration = {
      ...newReg,
      applicantId: newReg.applicantId || user?.uid
    };
    setMentorshipRegistrations(prev => [withOwner, ...prev]);
    saveMentorshipRegistrationRecord(withOwner).catch(() => {});
  };

  // Helper to normalize legacy /public/assets paths into /assets
  const normalizeAsset = (url?: string, fallback = '') => {
    if (!url) return fallback;
    return url.replace('/public/assets/generated', '/assets/generated');
  };

  // 0. Portal Global Settings Listener
  useEffect(() => {
    const handleLocalSettings = (e: Event) => {
      const custom = e as CustomEvent<PortalSettings>;
      if (custom.detail) setPortalSettings(custom.detail);
    };
    window.addEventListener('kbelia_portal_settings_updated', handleLocalSettings);

    const unsubSettings = onSnapshot(
      doc(db, 'portal_settings', 'global'),
      (snap) => {
        if (snap.exists()) {
          setPortalSettings({ ...DEFAULT_PORTAL_SETTINGS, ...snap.data() } as PortalSettings);
        }
      },
      () => {
        setPortalSettings(loadLocalPortalSettings());
      }
    );

    return () => {
      window.removeEventListener('kbelia_portal_settings_updated', handleLocalSettings);
      unsubSettings();
    };
  }, [refreshTrigger]);

  // 1. Public Catalog Listeners (Slots, Businesses, Products, Programs) + Demo localStorage merge
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const loadDemoSlots = (): CapsuleSlot[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      } catch {
        return [];
      }
    };

    const unsubSlots = onSnapshot(collection(db, 'capsule_slots'), (snapshot) => {
      const deleted = getDeletedIds();
      const loadedSlots: CapsuleSlot[] = [];
      snapshot.forEach((docSnap) => {
        if (!deleted.includes(docSnap.id)) {
          const data = docSnap.data();
          const seedSlot = INITIAL_CAPSULE_SLOTS.find(s => s.id === docSnap.id);
          const rawImg = normalizeAsset(data.imageUrl);
          const imageUrl = (!rawImg || rawImg.includes('kiosk_modular_kbelia'))
            ? (seedSlot?.imageUrl || rawImg || '/assets/generated/kiosk_modular_kbelia.jpg')
            : rawImg;
          loadedSlots.push({
            id: docSnap.id,
            ...data,
            imageUrl,
            amenities: Array.isArray(data.amenities) ? data.amenities : ['Palam Elektrik', 'WiFi 500Mbps', 'Rak Display']
          } as CapsuleSlot);
        }
      });

      const demoExtra = loadDemoSlots();
      const seen = new Set(loadedSlots.map(s => s.id));
      const merged = [
        ...demoExtra.filter(d => !deleted.includes(d.id) && !seen.has(d.id)),
        ...loadedSlots,
        ...INITIAL_CAPSULE_SLOTS.filter(s => !seen.has(s.id) && !demoExtra.some(d => d.id === s.id) && !deleted.includes(s.id))
      ];
      setSlots(merged);
    }, () => {
      const demoExtra = loadDemoSlots();
      const seen = new Set(demoExtra.map(s => s.id));
      setSlots([
        ...demoExtra.filter(d => !deletedIds.includes(d.id)),
        ...INITIAL_CAPSULE_SLOTS.filter(s => !seen.has(s.id) && !deletedIds.includes(s.id))
      ]);
    });

    return () => unsubSlots();
  }, [refreshTrigger]);

  // 2. Real-time Businesses Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const loadDemoBiz = (): BusinessListing[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_businesses') || '[]');
      } catch {
        return [];
      }
    };

    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const deleted = getDeletedIds();
      const loadedBiz: BusinessListing[] = [];
      snapshot.forEach((docSnap) => {
        if (!deleted.includes(docSnap.id)) {
          const data = docSnap.data();
          const seedBiz = INITIAL_BUSINESSES.find(b => b.id === docSnap.id);
          loadedBiz.push({
            id: docSnap.id,
            ...data,
            bannerUrl: normalizeAsset(data.bannerUrl, seedBiz?.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg'),
            logoUrl: normalizeAsset(data.logoUrl, seedBiz?.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg')
          } as BusinessListing);
        }
      });
      const demoExtra = loadDemoBiz();
      const seen = new Set([...demoExtra.map(d => d.id), ...loadedBiz.map(b => b.id)]);
      setBusinesses([
        ...demoExtra.filter(d => !deleted.includes(d.id)),
        ...loadedBiz.filter(b => !demoExtra.some(d => d.id === b.id)),
        ...INITIAL_BUSINESSES.filter(b => !seen.has(b.id) && !deleted.includes(b.id))
      ]);
    }, () => {
      const demoExtra = loadDemoBiz();
      const seen = new Set(demoExtra.map(d => d.id));
      setBusinesses([
        ...demoExtra.filter(d => !deletedIds.includes(d.id)),
        ...INITIAL_BUSINESSES.filter(b => !seen.has(b.id) && !deletedIds.includes(b.id))
      ]);
    });

    return () => unsubBiz();
  }, [refreshTrigger]);

  // 3. Real-time Products Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const loadDemoProd = (): ProductItem[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_products') || '[]');
      } catch {
        return [];
      }
    };

    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      const deleted = getDeletedIds();
      const loadedProd: ProductItem[] = [];
      snapshot.forEach((docSnap) => {
        if (!deleted.includes(docSnap.id)) {
          const data = docSnap.data();
          const seedProd = INITIAL_PRODUCTS.find(p => p.id === docSnap.id);
          loadedProd.push({
            id: docSnap.id,
            ...data,
            imageUrl: normalizeAsset(data.imageUrl, seedProd?.imageUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg')
          } as ProductItem);
        }
      });
      const demoExtra = loadDemoProd();
      const seen = new Set([...demoExtra.map(d => d.id), ...loadedProd.map(p => p.id)]);
      setProducts([
        ...demoExtra.filter(d => !deleted.includes(d.id)),
        ...loadedProd.filter(p => !demoExtra.some(d => d.id === p.id)),
        ...INITIAL_PRODUCTS.filter(p => !seen.has(p.id) && !deleted.includes(p.id))
      ]);
    }, () => {
      const demoExtra = loadDemoProd();
      const seen = new Set(demoExtra.map(d => d.id));
      setProducts([
        ...demoExtra.filter(d => !deletedIds.includes(d.id)),
        ...INITIAL_PRODUCTS.filter(p => !seen.has(p.id) && !deletedIds.includes(p.id))
      ]);
    });

    return () => unsubProd();
  }, [refreshTrigger]);

  // 4. Real-time Programs Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const loadDemoProg = (): YouthProgram[] => {
      try {
        return JSON.parse(localStorage.getItem('kbelia_demo_programs') || '[]');
      } catch {
        return [];
      }
    };

    const unsubProg = onSnapshot(collection(db, 'programs'), (snapshot) => {
      const deleted = getDeletedIds();
      const loadedProg: YouthProgram[] = [];
      snapshot.forEach((docSnap) => {
        if (!deleted.includes(docSnap.id)) {
          loadedProg.push({ id: docSnap.id, ...docSnap.data() } as YouthProgram);
        }
      });
      const demoExtra = loadDemoProg();
      const seen = new Set([...demoExtra.map(d => d.id), ...loadedProg.map(p => p.id)]);
      setPrograms([
        ...demoExtra.filter(d => !deleted.includes(d.id)),
        ...loadedProg.filter(p => !demoExtra.some(d => d.id === p.id)),
        ...INITIAL_PROGRAMS.filter(p => !seen.has(p.id) && !deleted.includes(p.id))
      ]);
    }, () => {
      const demoExtra = loadDemoProg();
      const seen = new Set(demoExtra.map(d => d.id));
      setPrograms([
        ...demoExtra.filter(d => !deletedIds.includes(d.id)),
        ...INITIAL_PROGRAMS.filter(p => !seen.has(p.id) && !deletedIds.includes(p.id))
      ]);
    });

    return () => unsubProg();
  }, [refreshTrigger]);

  // 5. Protected Collections Listeners (Firestore ONLY when Firebase authenticated; Isolated Demo storage otherwise)
  useEffect(() => {
    const loadDemoProtectedState = () => {
      try {
        const deleted = getDeletedIds();
        const demoBookings: CapsuleBooking[] = JSON.parse(localStorage.getItem('kbelia_demo_bookings') || '[]');
        setBookings(demoBookings.filter(b => !deleted.includes(b.id)));

        const demoGrants: GrantApplication[] = JSON.parse(localStorage.getItem('kbelia_demo_grants') || '[]');
        setGrantApplications(demoGrants);

        const demoTickets: MaintenanceTicket[] = JSON.parse(localStorage.getItem('kbelia_demo_maintenance_tickets') || '[]');
        setMaintenanceTickets(demoTickets);

        if (user?.uid) {
          const cfRaw = localStorage.getItem(`kbelia_cashflow_records_${user.uid}`);
          setCashflowRecords(cfRaw ? JSON.parse(cfRaw) : []);
        } else {
          setCashflowRecords([]);
        }
      } catch {
        // ignore
      }
    };

    const handleDemoUpdate = () => {
      loadDemoProtectedState();
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('kbelia_demo_data_updated', handleDemoUpdate);
    window.addEventListener('kbelia_cashflow_updated', handleDemoUpdate);

    // If unauthenticated or in Demo session, never attach protected Firestore snapshot listeners
    if (!user || user.isDemo || !auth.currentUser) {
      loadDemoProtectedState();
      return () => {
        window.removeEventListener('kbelia_demo_data_updated', handleDemoUpdate);
        window.removeEventListener('kbelia_cashflow_updated', handleDemoUpdate);
      };
    }

    const bookingsQuery = (isAdmin || isMentor)
      ? collection(db, 'capsule_bookings')
      : query(collection(db, 'capsule_bookings'), where('applicantId', '==', user.uid));

    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const deleted = getDeletedIds();
      const loadedBookings: CapsuleBooking[] = [];
      snapshot.forEach((docSnap) => {
        if (!deleted.includes(docSnap.id)) {
          loadedBookings.push({ id: docSnap.id, ...docSnap.data() } as CapsuleBooking);
        }
      });
      setBookings(loadedBookings);
    }, (error) => {
      console.warn('Bookings listener notice:', error.message);
      setBookings([]);
    });

    const grantsQuery = (isAdmin || isMentor)
      ? collection(db, 'grant_applications')
      : query(collection(db, 'grant_applications'), where('applicantId', '==', user.uid));

    const unsubGrants = onSnapshot(grantsQuery, (snapshot) => {
      const loaded: GrantApplication[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as GrantApplication);
      });
      setGrantApplications(loaded);
    }, (error) => {
      console.warn('Grants listener notice:', error.message);
      setGrantApplications([]);
    });

    const cashflowQuery = (isAdmin || isMentor)
      ? collection(db, 'cashflow_records')
      : query(collection(db, 'cashflow_records'), where('ownerId', '==', user.uid));

    const unsubCashflow = onSnapshot(cashflowQuery, (snapshot) => {
      const loaded: KioskDailySale[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as KioskDailySale);
      });
      setCashflowRecords(loaded);
    }, (error) => {
      console.warn('Cashflow listener notice:', error.message);
      setCashflowRecords([]);
    });

    const ticketsQuery = isAdmin
      ? collection(db, 'maintenance_tickets')
      : query(collection(db, 'maintenance_tickets'), where('ownerId', '==', user.uid));

    const unsubTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const loaded: MaintenanceTicket[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as MaintenanceTicket);
      });
      setMaintenanceTickets(loaded);
    }, (error) => {
      console.warn('Tickets listener notice:', error.message);
      setMaintenanceTickets([]);
    });

    return () => {
      window.removeEventListener('kbelia_demo_data_updated', handleDemoUpdate);
      window.removeEventListener('kbelia_cashflow_updated', handleDemoUpdate);
      unsubBookings();
      unsubGrants();
      unsubCashflow();
      unsubTickets();
    };
  }, [user?.uid, user?.isDemo, isAdmin, isMentor, refreshTrigger]);

  // Auto-seed catalog once only when authenticated as Firebase Admin
  useEffect(() => {
    if (!user || user.isDemo || !auth.currentUser || !isAdmin) return;
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
    // If slot is occupied, reserved, or has an active tenant, display the Tenant & Capsule details dossier!
    const isOccupied = slot.status !== 'available' || Boolean(slot.currentTenantBusinessName);
    if (isOccupied) {
      setSelectedSlotForTenantDetail(slot);
      setIsTenantDetailModalOpen(true);
      return;
    }

    // Admin cannot apply for capsule booking; booking is strictly for youth
    if (isAdmin) {
      setActiveTab('admin');
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
    if (isAdmin) {
      setActiveTab('admin');
      return;
    }
    const firstAvailable = enrichedSlots.find(s => s.status === 'available' && !s.currentTenantBusinessName);
    setSelectedSlotForBooking(firstAvailable || null);
    setIsBookingModalOpen(true);
  };

  const handleOpenGrantModal = (programTitle?: string, amount?: string) => {
    if (programTitle) setSelectedGrantTitle(programTitle);
    if (amount) setSelectedGrantAmount(amount);
    setIsGrantModalOpen(true);
  };

  const handleViewOfferLetter = (booking: CapsuleBooking) => {
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

  // User-specific data
  const myBusiness = businesses.find(b => b.ownerId === user?.uid) || null;
  const myProducts = products.filter(p => p.ownerId === user?.uid || (myBusiness && p.businessId === myBusiness.id));
  const myBookings = bookings.filter(b => b.applicantId === user?.uid);

  // 0. STANDALONE LANDING PAGE (Welcoming homepage on initial link load)
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
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
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200 overflow-hidden">
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
          onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
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
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-2 sm:p-3.5 lg:p-4 w-full max-w-none min-w-0 scroll-smooth bg-slate-50 dark:bg-slate-900">
          
          {/* Portal Maintenance / Announcement Bar from Admin Settings */}
          {portalSettings.systemStatus === 'maintenance' && !isAdmin && (
            <div className="mb-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
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
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
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
                    onUpdateMentor={handleUpdateMentorProfile}
                    onRefresh={triggerRefresh}
                    activeSubTab={adminSubTab}
                    onSelectSubTab={setAdminSubTab}
                  />
                </div>
              )}

              {/* 2. MENTOR DASHBOARD VIEW */}
              {isMentor && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
                  <MentorPortal
                    mentors={mentors}
                    registrations={mentorshipRegistrations}
                    onUpdateRegistration={handleUpdateMentorshipRegistration}
                    onUpdateMentor={handleUpdateMentorProfile}
                    onAddRegistration={handleAddMentorshipRegistration}
                    onBackToHome={() => setActiveTab('hepa')}
                    onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                    onOpenAdminDashboard={() => setActiveTab('admin')}
                    activeSubTab={mentorSubTab}
                    onSelectSubTab={setMentorSubTab}
                  />
                </div>
              )}

              {/* 3. YOUTH ENTREPRENEUR DASHBOARD VIEW */}
              {isYouth && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
                  <MerchantPortal
                    myBusiness={myBusiness}
                    myProducts={myProducts}
                    myBookings={myBookings}
                    slots={enrichedSlots}
                    grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
                    cashflowRecords={cashflowRecords}
                    maintenanceTickets={maintenanceTickets}
                    mentorshipRegistrations={mentorshipRegistrations.filter(r => r.applicantId === user?.uid || (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))}
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
                    onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                    onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
                    onRefresh={triggerRefresh}
                    activeSubTab={merchantSubTab}
                    onSelectSubTab={setMerchantSubTab}
                  />
                </div>
              )}
            </>
          )}

          {/* KAPSUL NIAGA VIEW */}
          {activeTab === 'academic' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{t('tab_kiosk_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_kiosk_heading')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t('tab_kiosk_desc')}
                </p>
              </div>

              <CapsuleGrid
                slots={enrichedSlots}
                bookings={bookings}
                onSelectSlot={handleOpenBookingForSlot}
                onViewTenantDetail={handleOpenTenantDetail}
                onOpenNewBooking={handleOpenNewBooking}
                onAddSlot={() => setActiveTab('admin')}
                selectedHub={selectedHubFilter}
                onSelectHub={setSelectedHubFilter}
                maxBudget={maxBudgetFilter}
                onBudgetChange={setMaxBudgetFilter}
                isReadOnly={isAdmin}
              />
            </div>
          )}

          {/* DIREKTORI USAHAWAN KELANTAN */}
          {activeTab === 'hepa' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Store className="w-4 h-4" />
                  <span>{t('tab_directory_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_directory_title')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t('tab_directory_desc')}
                </p>
              </div>

              <DirectorySection
                businesses={businesses}
                onSelectBusiness={handleOpenBusinessDetail}
                onRegisterBusiness={() => setActiveTab('merchant')}
              />
            </div>
          )}

          {/* GERAN & DANA BELIA */}
          {activeTab === 'ceed' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 p-4 rounded-xl kbelia-important-header border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4" />
                  <span>{t('tab_grants_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_grants_heading')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t('tab_grants_desc')}
                </p>
              </div>

              <ProgramsSection 
                programs={programs} 
                onOpenGrantModal={handleOpenGrantModal}
                onAddProgram={() => setActiveTab('admin')}
                isReadOnly={isAdmin}
              />
            </div>
          )}

          {/* JADUAL ACARA & KARNIVAL BELIA */}
          {activeTab === 'events' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <EventsSection />
            </div>
          )}

          {/* RUANG IKLAN & PELUANG NIAGA BELIA */}
          {activeTab === 'b2b' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <B2BMarketSection />
            </div>
          )}

          {/* KALKULATOR KELAYAKAN GERAN & PEMBIAYAAN */}
          {activeTab === 'calculator' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
              <GrantCalculatorSection 
                onOpenGrantModal={handleOpenGrantModal}
                onOpenMentorship={() => setIsMentorshipModalOpen(true)}
              />
            </div>
          )}

          {/* PENTADBIRAN (ADMIN) */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Administrator Access Only' : 'Akses Khusus Pentadbir Sistem Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    {isMentor 
                      ? 'Akaun anda adalah Mentor Bertauliah. Modul kawalan pentadbir sistem dikhaskan kepada pihak urus setia kerajaan.'
                      : 'Halaman ini dikhaskan kepada Pentadbir Sistem Kerajaan Negeri & UMK.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isMentor ? 'mentor' : 'home')}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isMentor ? 'Kembali ke Hab Mentor' : 'Kembali ke Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
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
                  onUpdateMentor={handleUpdateMentorProfile}
                  onRefresh={triggerRefresh}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={setAdminSubTab}
                />
              </div>
            )
          )}

          {/* PORTAL MENTOR: HAB BIMBINGAN (STRICT ROLE GUARD) */}
          {activeTab === 'mentor' && (
            !isMentor && !isAdmin ? (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Certified Mentor Access Only' : 'Akses Khusus Mentor Bertauliah Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'The Mentor Coaching Hub is reserved for certified UMK & INSKEN academic mentors.'
                      : 'Hab Bimbingan Mentor dikhaskan kepada panel mentor bertauliah UMK & agensi keusahawanan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Dashboard' : 'Kembali ke Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
                <MentorPortal
                  mentors={mentors}
                  registrations={mentorshipRegistrations}
                  onUpdateRegistration={handleUpdateMentorshipRegistration}
                  onUpdateMentor={handleUpdateMentorProfile}
                  onAddRegistration={handleAddMentorshipRegistration}
                  onBackToHome={() => setActiveTab('hepa')}
                  onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                  onOpenAdminDashboard={() => setActiveTab('admin')}
                  activeSubTab={mentorSubTab}
                  onSelectSubTab={setMentorSubTab}
                />
              </div>
            )
          )}

          {/* MERCHANT PORTAL: BISNES SAYA (KHUSUS BELIA) */}
          {activeTab === 'merchant' && (
            isAdmin ? (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Administrator account. Merchant business operations and kiosk management are reserved for registered youth.'
                      : 'Akaun anda adalah Pentadbir Sistem (Admin). Modul pengurusan bisnes usahawan dikhaskan kepada usahawan belia Kelantan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Admin Control Panel' : 'Kembali ke Pusat Kawalan Pentadbir'}</span>
                </button>
              </div>
            ) : isMentor ? (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Academic Mentor account. Business management is reserved for youth mentees. Please use the Mentor Coaching Hub.'
                      : 'Akaun anda adalah Mentor Bimbingan UMK. Modul pengurusan bisnes dikhaskan kepada usahawan belia. Sila gunakan Hab Mentor untuk menyemak dan membimbing usahawan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Mentor Coaching Hub' : 'Kembali ke Hab Bimbingan Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
                <MerchantPortal
                  myBusiness={myBusiness}
                  myProducts={myProducts}
                  myBookings={myBookings}
                  slots={enrichedSlots}
                  grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
                  cashflowRecords={cashflowRecords}
                  maintenanceTickets={maintenanceTickets}
                  mentorshipRegistrations={mentorshipRegistrations.filter(r => r.applicantId === user?.uid || (user?.email && r.entrepreneurEmail?.toLowerCase() === user.email.toLowerCase()))}
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
                  onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                  onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
                  onRefresh={triggerRefresh}
                  activeSubTab={merchantSubTab}
                  onSelectSubTab={setMerchantSubTab}
                />
              </div>
            )
          )}

          {/* TETAPAN AKAUN & PROFIL */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-800 rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xs transition-colors">
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
        onOpenMentorship={() => setIsMentorshipModalOpen(true)}
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

      {/* 9. Mentorship Clinic Modal */}
      <MentorshipClinicModal
        isOpen={isMentorshipModalOpen}
        onClose={() => setIsMentorshipModalOpen(false)}
        mentors={mentors}
        onBookMentorship={handleAddMentorshipRegistration}
        defaultEntrepreneurName={userProfile?.fullName || user?.displayName || 'Usahawan Belia'}
        defaultBusinessName={myBusiness?.businessName || userProfile?.businessName || 'Perniagaan Anda'}
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

      {/* Floating System-wide Toast Notification Container */}
      <ToastContainer />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
