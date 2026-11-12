import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { 
  BusinessListing, 
  CapsuleBooking, 
  CapsuleSlot, 
  ProductItem, 
  YouthProgram,
  GrantApplication,
  MentorProfile,
  MentorshipRegistration,
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
import { getDeletedIds, seedInitialData } from './services/dataService';
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
  const { user, userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;
  const { theme } = useTheme();

  // Default to 'landing' page so opening the link presents a welcoming landing page
  const [activeTab, setActiveTab] = useState<UMKTab>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync dark mode class consistently across all tabs
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Trigger YouTube-style top progress bar whenever navigating tabs
  useEffect(() => {
    triggerTopNavigationProgress(400);
  }, [activeTab]);

  // Core Firestore States
  const [slots, setSlots] = useState<CapsuleSlot[]>(INITIAL_CAPSULE_SLOTS);
  const [businesses, setBusinesses] = useState<BusinessListing[]>(INITIAL_BUSINESSES);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [programs, setPrograms] = useState<YouthProgram[]>(INITIAL_PROGRAMS);
  const [bookings, setBookings] = useState<CapsuleBooking[]>([]);
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([]);
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
  };

  const handleUpdateMentorshipRegistration = (updated: MentorshipRegistration) => {
    setMentorshipRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleAddMentorshipRegistration = (newReg: MentorshipRegistration) => {
    setMentorshipRegistrations(prev => [newReg, ...prev]);
  };

  // 1. Real-time Slots Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const unsubSlots = onSnapshot(collection(db, 'capsule_slots'), (snapshot) => {
      const deleted = getDeletedIds();
      if (!snapshot.empty) {
        const loadedSlots: CapsuleSlot[] = [];
        snapshot.forEach((doc) => {
          // Exclude pruned demo slots
          if (doc.id.startsWith('cap-') && !INITIAL_CAPSULE_SLOTS.some(s => s.id === doc.id)) {
            return;
          }
          if (!deleted.includes(doc.id)) {
            const data = doc.data();
            const seedSlot = INITIAL_CAPSULE_SLOTS.find(s => s.id === doc.id);
            const imageUrl = (seedSlot?.imageUrl?.startsWith('/public/assets/generated') || !data.imageUrl || data.imageUrl.includes('kiosk_modular_kbelia')) 
              ? (seedSlot?.imageUrl || data.imageUrl) 
              : data.imageUrl;
            loadedSlots.push({
              id: doc.id,
              ...data,
              imageUrl,
              amenities: Array.isArray(data.amenities) ? data.amenities : ['Palam Elektrik', 'WiFi 500Mbps', 'Rak Display']
            } as CapsuleSlot);
          }
        });
        const existingSlotIds = new Set(loadedSlots.map(s => s.id));
        const mergedSlots = [
          ...loadedSlots, 
          ...INITIAL_CAPSULE_SLOTS.filter(s => !existingSlotIds.has(s.id) && !deleted.includes(s.id))
        ];
        setSlots(mergedSlots);
      } else {
        setSlots(INITIAL_CAPSULE_SLOTS.filter(s => !deleted.includes(s.id)));
      }
    }, (error) => {
      console.warn('Using local slots cache:', error.message);
      setSlots(INITIAL_CAPSULE_SLOTS.filter(s => !deletedIds.includes(s.id)));
    });

    return () => unsubSlots();
  }, [refreshTrigger]);

  // 2. Real-time Businesses Listener (Merges with INITIAL_BUSINESSES to ensure active 3 demo stores appear)
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const deleted = getDeletedIds();
      if (!snapshot.empty) {
        const loadedBiz: BusinessListing[] = [];
        snapshot.forEach((doc) => {
          // Exclude pruned demo businesses
          if (doc.id.startsWith('biz-') && !INITIAL_BUSINESSES.some(b => b.id === doc.id)) {
            return;
          }
          if (!deleted.includes(doc.id)) {
            const data = doc.data();
            const seedBiz = INITIAL_BUSINESSES.find(b => b.id === doc.id);
            const bannerUrl = (seedBiz?.bannerUrl?.startsWith('/public/assets/generated') || !data.bannerUrl || data.bannerUrl.includes('banner_kelantan_landmark') || data.bannerUrl.includes('kiosk_modular'))
              ? (seedBiz?.bannerUrl || data.bannerUrl)
              : data.bannerUrl;
            const logoUrl = (seedBiz?.logoUrl?.startsWith('/public/assets/generated') || !data.logoUrl || data.logoUrl.includes('avatar_youth_') || data.logoUrl.includes('product_kelantan_delights') || data.logoUrl.includes('banner_kelantan'))
              ? (seedBiz?.logoUrl || data.logoUrl)
              : data.logoUrl;
            loadedBiz.push({ 
              id: doc.id, 
              ...data,
              bannerUrl,
              logoUrl
            } as BusinessListing);
          }
        });
        const existingBizIds = new Set(loadedBiz.map(b => b.id));
        const mergedBiz = [
          ...loadedBiz,
          ...INITIAL_BUSINESSES.filter(b => !existingBizIds.has(b.id) && !deleted.includes(b.id))
        ];
        setBusinesses(mergedBiz);
      } else {
        setBusinesses(INITIAL_BUSINESSES.filter(b => !deleted.includes(b.id)));
      }
    }, (error) => {
      console.warn('Using local businesses cache:', error.message);
      setBusinesses(INITIAL_BUSINESSES.filter(b => !deletedIds.includes(b.id)));
    });

    return () => unsubBiz();
  }, [refreshTrigger]);

  // 3. Real-time Products Listener (Merges with INITIAL_PRODUCTS to ensure active 3 demo products appear)
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      const deleted = getDeletedIds();
      if (!snapshot.empty) {
        const loadedProd: ProductItem[] = [];
        snapshot.forEach((doc) => {
          // Exclude pruned demo products
          if (doc.id.startsWith('prod-') && !INITIAL_PRODUCTS.some(p => p.id === doc.id)) {
            return;
          }
          if (!deleted.includes(doc.id)) {
            const data = doc.data();
            const seedProd = INITIAL_PRODUCTS.find(p => p.id === doc.id);
            const imageUrl = (seedProd?.imageUrl?.startsWith('/public/assets/generated') || !data.imageUrl || data.imageUrl.includes('product_kelantan_delights') || data.imageUrl.includes('kiosk_modular') || data.imageUrl.includes('avatar_') || data.imageUrl.includes('banner_kelantan'))
              ? (seedProd?.imageUrl || data.imageUrl)
              : data.imageUrl;
            loadedProd.push({ 
              id: doc.id, 
              ...data,
              imageUrl
            } as ProductItem);
          }
        });
        const existingProdIds = new Set(loadedProd.map(p => p.id));
        const mergedProd = [
          ...loadedProd,
          ...INITIAL_PRODUCTS.filter(p => !existingProdIds.has(p.id) && !deleted.includes(p.id))
        ];
        setProducts(mergedProd);
      } else {
        setProducts(INITIAL_PRODUCTS.filter(p => !deleted.includes(p.id)));
      }
    }, (error) => {
      console.warn('Using local products cache:', error.message);
      setProducts(INITIAL_PRODUCTS.filter(p => !deletedIds.includes(p.id)));
    });

    return () => unsubProd();
  }, [refreshTrigger]);

  // 4. Real-time Programs Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const unsubProg = onSnapshot(collection(db, 'programs'), (snapshot) => {
      const deleted = getDeletedIds();
      if (!snapshot.empty) {
        const loadedProg: YouthProgram[] = [];
        snapshot.forEach((doc) => {
          // Exclude pruned demo programs
          if (doc.id.startsWith('prog-') && !INITIAL_PROGRAMS.some(p => p.id === doc.id)) {
            return;
          }
          if (!deleted.includes(doc.id)) {
            loadedProg.push({ id: doc.id, ...doc.data() } as YouthProgram);
          }
        });
        const existingProgIds = new Set(loadedProg.map(p => p.id));
        const mergedProg = [
          ...loadedProg,
          ...INITIAL_PROGRAMS.filter(p => !existingProgIds.has(p.id) && !deleted.includes(p.id))
        ];
        setPrograms(mergedProg);
      } else {
        setPrograms(INITIAL_PROGRAMS.filter(p => !deleted.includes(p.id)));
      }
    }, (error) => {
      console.warn('Using local programs cache:', error.message);
      setPrograms(prev => prev.filter(p => !deletedIds.includes(p.id)));
    });

    return () => unsubProg();
  }, [refreshTrigger]);

  // 5. Real-time Bookings Listener
  useEffect(() => {
    const deletedIds = getDeletedIds();
    const unsubBookings = onSnapshot(collection(db, 'capsule_bookings'), (snapshot) => {
      const deleted = getDeletedIds();
      if (!snapshot.empty) {
        const loadedBookings: CapsuleBooking[] = [];
        snapshot.forEach((doc) => {
          if (!deleted.includes(doc.id)) {
            loadedBookings.push({ id: doc.id, ...doc.data() } as CapsuleBooking);
          }
        });
        setBookings(loadedBookings);
      }
    }, (error) => {
      console.warn('Bookings fetch note:', error.message);
    });

    return () => unsubBookings();
  }, [refreshTrigger]);

  // 6. Real-time Grant Applications Listener
  useEffect(() => {
    const unsubGrant = onSnapshot(collection(db, 'grant_applications'), (snapshot) => {
      if (!snapshot.empty) {
        const loadedGrants: GrantApplication[] = [];
        snapshot.forEach((doc) => {
          loadedGrants.push({ id: doc.id, ...doc.data() } as GrantApplication);
        });
        setGrantApplications(loadedGrants);
      } else {
        setGrantApplications([]);
      }
    }, (error) => {
      console.warn('Grant applications fetch note:', error.message);
    });

    return () => unsubGrant();
  }, [refreshTrigger]);

  // Auto-sync initial 30 demo stores and 40 products to Firestore once
  useEffect(() => {
    try {
      const seeded = localStorage.getItem('kbelia_seeded_v30');
      if (!seeded) {
        seedInitialData().then((ok) => {
          if (ok) {
            localStorage.setItem('kbelia_seeded_v30', 'true');
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleOpenBookingForSlot = (slot: CapsuleSlot) => {
    // If slot is occupied, reserved, or has an active tenant, display the Tenant & Capsule details dossier!
    if (slot.status !== 'available' || Boolean(slot.currentTenantBusinessName)) {
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
    setSelectedSlotForBooking(slots.find(s => s.status === 'available') || slots[0] || null);
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
        <TopProgressBar />
        <LandingPage
          setActiveTab={setActiveTab}
          slots={slots}
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
          allSlots={slots}
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
        <LoginPage 
          setActiveTab={setActiveTab} 
          onOpenBooking={handleOpenNewBooking} 
        />
        
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlotForBooking}
          allSlots={slots}
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
        <RegisterPage 
          setActiveTab={setActiveTab} 
          onOpenBooking={handleOpenNewBooking} 
        />
        
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlotForBooking}
          allSlots={slots}
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
    <div className="h-screen bg-[#F8FAFC] dark:bg-[#0B132B] flex flex-col text-slate-900 dark:text-[#E2E8F0] font-sans antialiased transition-colors duration-200 overflow-hidden">
      <TopProgressBar />
      {/* 1. TOP HEADER BAR */}
      <UMKHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onOpenBooking={handleOpenNewBooking}
        slots={slots}
        businesses={businesses}
        programs={programs}
        onSelectSlot={handleOpenBookingForSlot}
        onSelectBusiness={handleOpenBusinessDetail}
        onOpenGrantModal={handleOpenGrantModal}
      />

      {/* 2. MAIN APPLICATION CONTAINER (Sidebar + Content Grid) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left Collapsible Sidebar */}
        <UMKSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onOpenBooking={handleOpenNewBooking}
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

        {/* Center/Right Dynamic Body - Fully stretched for full-screen mode */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-2 sm:p-3.5 lg:p-4 w-full max-w-none min-w-0 scroll-smooth bg-[#F8FAFC] dark:bg-[#0B132B]">
          
          {/* Universal Dashboard Banner Header following reference layout */}
          <DashboardBannerHeader
            activeTab={activeTab}
            role={isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia'}
            userName={userProfile?.fullName || user?.displayName || 'MUHAMMAD NABIL BIN ABDUL WAHAB'}
            onNavigateHome={() => setActiveTab('home')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />

          {/* Tab Route Content: Home View strictly routed by role */}
          {activeTab === 'home' && (
            <>
              {/* 1. ADMIN DASHBOARD VIEW */}
              {isAdmin && (
                <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
                  <AdminDashboard
                    slots={slots}
                    businesses={businesses}
                    bookings={bookings}
                    programs={programs}
                    grantApplications={grantApplications}
                    mentorshipRegistrations={mentorshipRegistrations}
                    mentors={mentors}
                    onUpdateMentor={handleUpdateMentorProfile}
                    onRefresh={triggerRefresh}
                    activeSubTab={adminSubTab}
                    onSelectSubTab={setAdminSubTab}
                  />
                </div>
              )}

              {/* 2. MENTOR DASHBOARD VIEW */}
              {isMentor && (
                <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
                  <MentorPortal
                    mentors={mentors}
                    registrations={mentorshipRegistrations}
                    onUpdateRegistration={handleUpdateMentorshipRegistration}
                    onUpdateMentor={handleUpdateMentorProfile}
                    onAddRegistration={handleAddMentorshipRegistration}
                    onBackToHome={() => setActiveTab('merchant')}
                    onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                    onOpenAdminDashboard={() => setActiveTab('admin')}
                    activeSubTab={mentorSubTab}
                    onSelectSubTab={setMentorSubTab}
                  />
                </div>
              )}

              {/* 3. YOUTH ENTREPRENEUR DASHBOARD VIEW */}
              {isYouth && (
                <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
                  <MerchantPortal
                    myBusiness={myBusiness}
                    myProducts={myProducts}
                    myBookings={myBookings}
                    slots={slots}
                    grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
                    onViewOfferLetter={handleViewOfferLetter}
                    onOpenTenancyAgreement={(booking) => {
                      setSelectedBookingForTenancy(booking);
                      setIsTenancyModalOpen(true);
                    }}
                    onOpenVerification={(refCode) => {
                      setVerificationRefCode(refCode || 'KBN-KB-2026-8819');
                      setIsVerificationModalOpen(true);
                    }}
                    onOpenBookingModal={handleOpenNewBooking}
                    onOpenBookingTab={() => setActiveTab('academic')}
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
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 pb-4 border-b border-slate-200 dark:border-[#2E3A47]">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{t('tab_kiosk_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_kiosk_heading')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8A99AD] mt-1">
                  {t('tab_kiosk_desc')}
                </p>
              </div>

              <CapsuleGrid
                slots={slots}
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
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 pb-4 border-b border-slate-200 dark:border-[#2E3A47]">
                <div className="flex items-center gap-2 text-red-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Store className="w-4 h-4" />
                  <span>{t('tab_directory_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_directory_title')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#CBD5E1] mt-1">
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
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <div className="mb-6 pb-4 border-b border-slate-200 dark:border-[#2E3A47]">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4" />
                  <span>{t('tab_grants_title')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('tab_grants_heading')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8A99AD] mt-1">
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
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <EventsSection />
            </div>
          )}

          {/* RUANG IKLAN & PELUANG NIAGA BELIA */}
          {activeTab === 'b2b' && (
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <B2BMarketSection />
            </div>
          )}

          {/* KALKULATOR KELAYAKAN GERAN & PEMBIAYAAN */}
          {activeTab === 'calculator' && (
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <GrantCalculatorSection 
                onOpenGrantModal={handleOpenGrantModal}
                onOpenMentorship={() => setIsMentorshipModalOpen(true)}
              />
            </div>
          )}

          {/* PENTADBIRAN (ADMIN) */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Administrator Access Only' : 'Akses Khusus Pentadbir Sistem Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    {isMentor 
                      ? 'Akaun anda adalah Mentor Bertauliah. Modul kawalan pentadbir sistem dikhaskan kepada pihak urus setia kerajaan.'
                      : 'Halaman ini dikhaskan kepada Pentadbir Sistem Kerajaan Negeri & UMK.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isMentor ? 'mentor' : 'home')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{isMentor ? 'Kembali ke Hab Mentor' : 'Kembali ke Laman Utama'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
                <AdminDashboard
                  slots={slots}
                  businesses={businesses}
                  bookings={bookings}
                  programs={programs}
                  grantApplications={grantApplications}
                  mentorshipRegistrations={mentorshipRegistrations}
                  mentors={mentors}
                  onUpdateMentor={handleUpdateMentorProfile}
                  onRefresh={triggerRefresh}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={setAdminSubTab}
                />
              </div>
            )
          )}

          {/* PORTAL MENTOR: HAB BIMBINGAN */}
          {activeTab === 'mentor' && (
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
              <MentorPortal
                mentors={mentors}
                registrations={mentorshipRegistrations}
                onUpdateRegistration={handleUpdateMentorshipRegistration}
                onUpdateMentor={handleUpdateMentorProfile}
                onAddRegistration={handleAddMentorshipRegistration}
                onBackToHome={() => setActiveTab('home')}
                onOpenMentorshipClinic={() => setIsMentorshipModalOpen(true)}
                onOpenAdminDashboard={() => setActiveTab('admin')}
                activeSubTab={mentorSubTab}
                onSelectSubTab={setMentorSubTab}
              />
            </div>
          )}

          {/* MERCHANT PORTAL: BISNES SAYA (KHUSUS BELIA) */}
          {activeTab === 'merchant' && (
            isAdmin ? (
              <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Administrator account. Merchant business operations and kiosk management are reserved for registered youth.'
                      : 'Akaun anda adalah Pentadbir Sistem (Admin). Modul pengurusan bisnes usahawan dikhaskan kepada usahawan belia Kelantan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Admin Control Panel' : 'Kembali ke Pusat Kawalan Pentadbir'}</span>
                </button>
              </div>
            ) : isMentor ? (
              <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Youth Entrepreneur Portal Only' : 'Akses Khusus Usahawan Belia Sahaja'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'You are logged in with an Academic Mentor account. Business management is reserved for youth mentees. Please use the Mentor Coaching Hub.'
                      : 'Akaun anda adalah Mentor Bimbingan UMK. Modul pengurusan bisnes dikhaskan kepada usahawan belia. Sila gunakan Hab Mentor untuk menyemak dan membimbing usahawan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mentor')}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'en' ? 'Back to Mentor Coaching Hub' : 'Kembali ke Hab Bimbingan Mentor'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
                <MerchantPortal
                  myBusiness={myBusiness}
                  myProducts={myProducts}
                  myBookings={myBookings}
                  slots={slots}
                  grantApplications={grantApplications.filter(g => g.applicantId === user?.uid || (user?.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase()))}
                  onViewOfferLetter={handleViewOfferLetter}
                  onOpenTenancyAgreement={(booking) => {
                    setSelectedBookingForTenancy(booking);
                    setIsTenancyModalOpen(true);
                  }}
                  onOpenVerification={(refCode) => {
                    setVerificationRefCode(refCode || 'KBN-KB-2026-8819');
                    setIsVerificationModalOpen(true);
                  }}
                  onOpenBookingModal={handleOpenNewBooking}
                  onOpenBookingTab={() => setActiveTab('academic')}
                  onRefresh={triggerRefresh}
                  activeSubTab={merchantSubTab}
                  onSelectSubTab={setMerchantSubTab}
                />
              </div>
            )
          )}

          {/* TETAPAN AKAUN & PROFIL */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#24303F] rounded-b-2xl rounded-t-none border border-t-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-6 shadow-2xs transition-colors">
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
        allSlots={slots}
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
          onClose={() => setIsTenancyModalOpen(false)}
          onAgreementSigned={() => triggerRefresh()}
        />
      )}

      {/* 6. Public QR Verification Modal */}
      <PublicVerificationModal
        isOpen={isVerificationModalOpen}
        defaultRefCode={verificationRefCode}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* 7. Application Status & Official Documents Modal */}
      <ApplicationStatusDocumentsModal
        isOpen={isStatusDocumentsModalOpen}
        onClose={() => setIsStatusDocumentsModalOpen(false)}
        userBooking={myBookings[0] || null}
        grantApplications={grantApplications}
        mentorshipRegistrations={mentorshipRegistrations}
        onOpenBooking={handleOpenNewBooking}
        onOpenGrantModal={handleOpenGrantModal}
        onOpenMentorship={() => setIsMentorshipModalOpen(true)}
        onOpenVerification={(refCode) => {
          setVerificationRefCode(refCode || 'KBN-KB-2026-8819');
          setIsVerificationModalOpen(true);
        }}
        onCancelMentorship={(regId) => {
          setMentorshipRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'cancelled' } : r));
        }}
      />

      {/* 7b. Kiosk Cashflow & DuitNow QR Modal */}
      <KioskCashflowModal
        isOpen={isCashflowModalOpen}
        onClose={() => setIsCashflowModalOpen(false)}
        kioskName={myBookings[0]?.slotName || 'Kiosk Modular #CAP-KB-01'}
        businessName={myBusiness?.businessName || 'Kopi Tok Bali & Pastri Pantai'}
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
        defaultEntrepreneurName={user?.displayName || 'Ahmad Nabil Bin Yusoff'}
        defaultBusinessName={myBusiness?.businessName || 'Kopi Tok Bali & Pastri Pantai'}
      />

      {/* 10. Kiosk Maintenance Modal */}
      <KioskMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        defaultSlotCode={myBookings[0]?.slotCode || 'CAP-KB-01'}
        defaultKioskName={myBookings[0]?.slotName || 'Hub Belia KB Sentral'}
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
