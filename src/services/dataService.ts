import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BusinessListing,
  CapsuleBooking,
  CapsuleSlot,
  GrantApplication,
  ProductItem,
  YouthProgram,
  KioskDailySale,
  MaintenanceTicket,
  MentorProfile,
  MentorshipRegistration,
  GrantEndorsement,
  MentoringLogEntry,
  B2BListing,
  PortalSettings,
  PortalNews
} from '../types';
import {
  INITIAL_BUSINESSES,
  INITIAL_CAPSULE_SLOTS,
  INITIAL_PRODUCTS,
  INITIAL_PROGRAMS
} from '../data/seedData';
import { INITIAL_PORTAL_NEWS } from '../data/newsData';

const CACHE_KEYS = {
  BUSINESSES: 'kbelia_businesses_cache',
  SLOTS: 'kbelia_slots_cache',
  PROGRAMS: 'kbelia_programs_cache',
  PRODUCTS: 'kbelia_products_cache',
  BOOKINGS: 'kbelia_bookings_cache',
  DELETED_IDS: 'kbelia_deleted_ids'
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  id: 'global',
  portalSubsidyRate: 50,
  maxLeaseDurationMonths: 12,
  systemStatus: 'operational',
  portalAnnouncement: 'Permohonan Kapsul Niaga Belia Kelantan Sesi 2026 kini dibuka dengan subsidi sewaan sehingga 50%.'
};

export function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.DELETED_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markIdAsDeleted(id: string) {
  try {
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(ids));
    }
  } catch (e) {
    console.warn('Failed to save deleted ID to local storage:', e);
  }
}

export function upgradeLocalImageCache() {
  try {
    if (typeof window === 'undefined') return;
    const version = localStorage.getItem('kbelia_streamline_v5');
    if (!version) {
      localStorage.setItem('kbelia_streamline_v5', 'true');
      localStorage.removeItem(CACHE_KEYS.BUSINESSES);
      localStorage.removeItem(CACHE_KEYS.SLOTS);
      localStorage.removeItem(CACHE_KEYS.PRODUCTS);
      localStorage.removeItem(CACHE_KEYS.PROGRAMS);
      localStorage.removeItem('kbelia_mentor_profiles');
      localStorage.removeItem('kbelia_mentorship_registrations');
      localStorage.removeItem(CACHE_KEYS.DELETED_IDS);
    }
  } catch (e) {
    console.warn('Cache upgrade notice:', e);
  }
}
upgradeLocalImageCache();

const isFirebaseAuthenticated = () => Boolean(auth.currentUser);

// --- SEED INITIAL DATA ---
export async function seedInitialData() {
  if (!isFirebaseAuthenticated()) return false;
  try {
    localStorage.removeItem(CACHE_KEYS.DELETED_IDS);

    for (const slot of INITIAL_CAPSULE_SLOTS) {
      await setDoc(doc(db, 'capsule_slots', slot.id), slot, { merge: true });
    }
    for (const biz of INITIAL_BUSINESSES) {
      await setDoc(doc(db, 'businesses', biz.id), biz, { merge: true });
    }
    for (const prod of INITIAL_PRODUCTS) {
      await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
    }
    for (const prog of INITIAL_PROGRAMS) {
      await setDoc(doc(db, 'programs', prog.id), prog, { merge: true });
    }
    for (const newsItem of INITIAL_PORTAL_NEWS) {
      await setDoc(doc(db, 'portal_news', newsItem.id), newsItem, { merge: true });
    }
    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    return false;
  }
}

// --- CAPSULE BOOKINGS ---
export async function createCapsuleBooking(
  booking: Omit<CapsuleBooking, 'id' | 'createdAt' | 'status'> & { id?: string }
) {
  const id = booking.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'capsule_bookings';
  const bookingData: CapsuleBooking = {
    ...booking,
    id,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    // Demo isolation storage
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([bookingData, ...existing]));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return bookingData;
  }

  try {
    await setDoc(doc(db, path, id), bookingData);
    return bookingData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'approved' | 'rejected',
  adminNotes: string,
  slotId?: string,
  businessName?: string,
  applicantId?: string
) {
  const path = 'capsule_bookings';
  const notes =
    adminNotes ||
    (status === 'approved'
      ? 'Permohonan diluluskan. Sila hadir ke pejabat pentadbiran untuk penyerahan kunci.'
      : 'Permohonan ditolak.');

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(b =>
        b.id === bookingId ? { ...b, status, adminNotes: notes } : b
      );
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }

  try {
    await setDoc(doc(db, path, bookingId), { status, adminNotes: notes }, { merge: true });
    if (status === 'approved' && slotId) {
      await setDoc(
        doc(db, 'capsule_slots', slotId),
        {
          status: 'occupied',
          currentTenantBusinessName: businessName || 'Usahawan Belia',
          currentTenantId: applicantId || ''
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function signBookingTenancyAgreement(
  bookingId: string,
  signatureName: string
) {
  const payload = {
    tenancySigned: true,
    tenancySignedAt: new Date().toISOString(),
    tenancySignatureName: signatureName
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(b => (b.id === bookingId ? { ...b, ...payload } : b));
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }

  try {
    await setDoc(doc(db, 'capsule_bookings', bookingId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'capsule_bookings');
    throw error;
  }
}

// --- BUSINESS LISTINGS ---
export async function saveBusinessListing(
  business: Partial<BusinessListing> & { id?: string; ownerId: string }
) {
  const id = business.id || `biz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'businesses';
  const fullData: BusinessListing = {
    id,
    ownerId: business.ownerId,
    ownerName: business.ownerName || 'Usahawan Belia',
    ownerEmail: business.ownerEmail || '',
    ownerPhone: business.ownerPhone || '',
    businessName: business.businessName || 'Perniagaan Baharu',
    tagline: business.tagline || '',
    category: business.category || 'Makanan & Minuman (F&B)',
    district: business.district || 'Kota Bharu',
    description: business.description || '',
    ssmNumber: business.ssmNumber || '',
    whatsapp: business.whatsapp || '',
    instagram: business.instagram || '',
    tiktok: business.tiktok || '',
    logoUrl: business.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg',
    bannerUrl: business.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg',
    isApproved: business.isApproved ?? true,
    isFeatured: business.isFeatured ?? false,
    capsuleSlotId: business.capsuleSlotId || '',
    rating: business.rating || 5.0,
    reviewsCount: business.reviewsCount || 1,
    createdAt: business.createdAt || new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_businesses';
      const existing: BusinessListing[] = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [fullData, ...existing.filter(b => b.id !== id)];
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return fullData;
  }

  try {
    await setDoc(doc(db, path, id), fullData, { merge: true });
    return fullData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteBusinessListing(businessId: string) {
  markIdAsDeleted(businessId);
  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_businesses';
      const existing: BusinessListing[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(b => b.id !== businessId)));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }
  try {
    await deleteDoc(doc(db, 'businesses', businessId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- PRODUCTS ---
export async function saveProduct(
  product: Partial<ProductItem> & { businessId: string; ownerId: string }
) {
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'products';
  const fullProduct: ProductItem = {
    id,
    businessId: product.businessId,
    ownerId: product.ownerId,
    name: product.name || 'Produk',
    price: Number(product.price) || 0,
    description: product.description || '',
    category: product.category || 'Umum',
    imageUrl: product.imageUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg',
    inStock: product.inStock ?? true,
    createdAt: product.createdAt || new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_products';
      const existing: ProductItem[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullProduct, ...existing.filter(p => p.id !== id)]));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return fullProduct;
  }

  try {
    await setDoc(doc(db, path, id), fullProduct, { merge: true });
    return fullProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  markIdAsDeleted(productId);
  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_products';
      const existing: ProductItem[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== productId)));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- CAPSULE SLOTS ---
export async function saveCapsuleSlot(slot: Partial<CapsuleSlot> & { code: string; name: string }) {
  const id = slot.id || `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'capsule_slots';
  const fullSlot: CapsuleSlot = {
    id,
    code: slot.code,
    name: slot.name,
    hubLocation: slot.hubLocation || 'Hub UMK Kampus Bachok',
    district: slot.district || 'Bachok',
    size: slot.size || '10ft x 10ft Smart Pod',
    monthlyRate: Number(slot.monthlyRate) || 150,
    dailyRate: Number(slot.dailyRate) || 15,
    status: slot.status || 'available',
    amenities: slot.amenities || ['Palam Elektrik', 'WiFi 500Mbps', 'Rak Display'],
    currentTenantBusinessName: slot.currentTenantBusinessName || '',
    currentTenantId: slot.currentTenantId || '',
    imageUrl: slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg',
    createdAt: slot.createdAt || new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_slots';
      const existing: CapsuleSlot[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullSlot, ...existing.filter(s => s.id !== id)]));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return fullSlot;
  }

  try {
    await setDoc(doc(db, path, id), fullSlot, { merge: true });
    return fullSlot;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteCapsuleSlot(slotId: string) {
  markIdAsDeleted(slotId);
  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_slots';
      const existing: CapsuleSlot[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(s => s.id !== slotId)));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }
  try {
    await deleteDoc(doc(db, 'capsule_slots', slotId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- PROGRAMS ---
export async function saveProgram(
  program: Partial<YouthProgram> & { title: string; category: YouthProgram['category'] }
) {
  const id = program.id || `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'programs';
  const fullProgram: YouthProgram = {
    id,
    title: program.title,
    category: program.category,
    date: program.date || 'Sepanjang Bulan',
    location: program.location || 'Hub Keusahawanan Belia Kelantan',
    description: program.description || '',
    organizer: program.organizer || 'Unit Belia & Keusahawanan Kelantan',
    grantAmount: program.grantAmount || '',
    registrationLink: program.registrationLink || '#',
    isFeatured: program.isFeatured ?? false,
    createdAt: program.createdAt || new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_programs';
      const existing: YouthProgram[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullProgram, ...existing.filter(p => p.id !== id)]));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return fullProgram;
  }

  try {
    await setDoc(doc(db, path, id), fullProgram, { merge: true });
    return fullProgram;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProgram(programId: string) {
  markIdAsDeleted(programId);
  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_programs';
      const existing: YouthProgram[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== programId)));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }
  try {
    await deleteDoc(doc(db, 'programs', programId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- GRANT APPLICATIONS ---
export async function createGrantApplication(
  grant: Omit<GrantApplication, 'id' | 'createdAt' | 'status'> & { id?: string }
) {
  const id = grant.id || `grant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'grant_applications';
  const grantData: GrantApplication = {
    ...grant,
    id,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([grantData, ...existing.filter(g => g.id !== id)]));
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return grantData;
  }

  try {
    await setDoc(doc(db, path, id), grantData);
    return grantData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function fetchGrantApplications(): Promise<GrantApplication[]> {
  if (!isFirebaseAuthenticated()) {
    try {
      return JSON.parse(localStorage.getItem('kbelia_demo_grants') || '[]');
    } catch {
      return [];
    }
  }
  try {
    const snap = await getDocs(collection(db, 'grant_applications'));
    const items: GrantApplication[] = [];
    snap.forEach(d => items.push(d.data() as GrantApplication));
    return items;
  } catch {
    return [];
  }
}

export async function updateGrantApplicationStatus(
  grantId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
) {
  const notes =
    adminNotes ||
    (status === 'approved' ? 'Permohonan geran diluluskan oleh Urusetia KBelia.' : 'Permohonan ditolak.');

  if (!isFirebaseAuthenticated()) {
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(
        key,
        JSON.stringify(existing.map(g => (g.id === grantId ? { ...g, status, adminNotes: notes } : g)))
      );
      window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    } catch {
      // ignore
    }
    return;
  }

  try {
    await setDoc(doc(db, 'grant_applications', grantId), { status, adminNotes: notes }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'grant_applications');
    throw error;
  }
}

// --- CASHFLOW RECORDS (Firestore + Demo/Owner Isolation) ---
export async function saveCashflowRecord(record: KioskDailySale & { ownerId: string }) {
  const id = record.id || `cf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const full: KioskDailySale = { ...record, id };

  if (!isFirebaseAuthenticated()) {
    const key = `kbelia_cashflow_records_${record.ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing.filter(r => r.id !== id)]));
    window.dispatchEvent(new CustomEvent('kbelia_cashflow_updated', { detail: { ownerId: record.ownerId } }));
    return full;
  }

  try {
    await setDoc(doc(db, 'cashflow_records', id), full, { merge: true });
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'cashflow_records');
    throw error;
  }
}

export async function deleteCashflowRecord(recordId: string, ownerId: string) {
  if (!isFirebaseAuthenticated()) {
    const key = `kbelia_cashflow_records_${ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(r => r.id !== recordId)));
    window.dispatchEvent(new CustomEvent('kbelia_cashflow_updated', { detail: { ownerId } }));
    return;
  }

  try {
    await deleteDoc(doc(db, 'cashflow_records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'cashflow_records');
    throw error;
  }
}

// --- MAINTENANCE TICKETS ---
export async function createMaintenanceTicket(
  ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt'> & { ownerId: string }
) {
  const id = `MT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const full: MaintenanceTicket = {
    ...ticket,
    id,
    status: 'received',
    createdAt: new Date().toISOString()
  };

  if (!isFirebaseAuthenticated()) {
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing]));
    window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    return full;
  }

  try {
    await setDoc(doc(db, 'maintenance_tickets', id), full);
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'maintenance_tickets');
    throw error;
  }
}

export async function updateMaintenanceTicketStatus(
  ticketId: string,
  status: MaintenanceTicket['status'],
  adminNotes?: string
) {
  if (!isFirebaseAuthenticated()) {
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(
      key,
      JSON.stringify(
        existing.map(t => (t.id === ticketId ? { ...t, status, adminNotes: adminNotes || t.adminNotes } : t))
      )
    );
    window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    return;
  }

  try {
    await setDoc(
      doc(db, 'maintenance_tickets', ticketId),
      { status, adminNotes: adminNotes || '' },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'maintenance_tickets');
    throw error;
  }
}

// --- MENTORSHIP, MENTOR PROFILES, ENDORSEMENTS & LOGS ---
export async function saveMentorProfileRecord(profile: MentorProfile) {
  const { pin: _pin, ...safeProfile } = profile as MentorProfile & { pin?: string };
  if (!isFirebaseAuthenticated()) return safeProfile as MentorProfile;
  try {
    await setDoc(doc(db, 'mentor_profiles', safeProfile.id), safeProfile, { merge: true });
    return safeProfile as MentorProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_profiles');
    return safeProfile as MentorProfile;
  }
}

export async function saveMentorshipRegistrationRecord(reg: MentorshipRegistration) {
  if (!isFirebaseAuthenticated()) return reg;
  try {
    await setDoc(doc(db, 'mentor_sessions', reg.id), reg, { merge: true });
    return reg;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_sessions');
    return reg;
  }
}

export async function saveGrantEndorsementRecord(endorsement: GrantEndorsement) {
  if (!isFirebaseAuthenticated()) {
    const key = 'kbelia_mentor_endorsements_v1';
    const existing: GrantEndorsement[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([endorsement, ...existing.filter(e => e.id !== endorsement.id)]));
    return endorsement;
  }
  try {
    await setDoc(doc(db, 'mentor_endorsements', endorsement.id), endorsement, { merge: true });
    return endorsement;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_endorsements');
    throw error;
  }
}

export async function saveMentoringLogRecord(logEntry: MentoringLogEntry) {
  if (!isFirebaseAuthenticated()) {
    const key = 'kbelia_mentor_logs_v1';
    const existing: MentoringLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([logEntry, ...existing.filter(l => l.id !== logEntry.id)]));
    return logEntry;
  }
  try {
    await setDoc(doc(db, 'mentor_logs', logEntry.id), logEntry, { merge: true });
    return logEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_logs');
    throw error;
  }
}

// --- B2B LISTINGS ---
export async function saveB2BListingRecord(item: B2BListing) {
  if (!isFirebaseAuthenticated()) {
    const existing: B2BListing[] = JSON.parse(localStorage.getItem('kbelia_b2b_listings') || '[]');
    localStorage.setItem('kbelia_b2b_listings', JSON.stringify([item, ...existing.filter(x => x.id !== item.id)]));
    return item;
  }
  try {
    await setDoc(doc(db, 'b2b_listings', item.id), item, { merge: true });
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'b2b_listings');
    throw error;
  }
}

// --- PORTAL SETTINGS ---
export async function savePortalSettingsRecord(settings: PortalSettings) {
  const payload: PortalSettings = {
    ...settings,
    id: 'global',
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('kbelia_portal_settings_v1', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('kbelia_portal_settings_updated', { detail: payload }));
  } catch {
    // ignore
  }

  if (!isFirebaseAuthenticated()) return payload;

  try {
    await setDoc(doc(db, 'portal_settings', 'global'), payload, { merge: true });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portal_settings');
    return payload;
  }
}

export function loadLocalPortalSettings(): PortalSettings {
  try {
    const raw = localStorage.getItem('kbelia_portal_settings_v1');
    if (raw) {
      return { ...DEFAULT_PORTAL_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PORTAL_SETTINGS;
}

// --- PORTAL NEWS (Admin Controlled, All Logged-In Users Read Published) ---
const DEMO_NEWS_STORAGE_KEY = 'kbelia_demo_news_v1';

export function loadLocalDemoNews(): PortalNews[] {
  try {
    const raw = localStorage.getItem(DEMO_NEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePortalNewsRecord(
  news: Partial<PortalNews> & {
    title: string;
    summary: string;
    content: string;
    category: PortalNews['category'];
    status: PortalNews['status'];
    authorId: string;
    authorName: string;
  }
): Promise<PortalNews> {
  const id = (news.id || `news-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const now = new Date().toISOString();
  const isPublished = news.status === 'published';

  const sanitized: PortalNews = {
    id,
    title: news.title.trim().slice(0, 200),
    summary: news.summary.trim().slice(0, 500),
    content: news.content.trim().slice(0, 8000),
    category: news.category,
    imageUrl: (news.imageUrl || '').slice(0, 900000),
    status: news.status,
    isPinned: Boolean(news.isPinned),
    authorId: (news.authorId || 'admin').slice(0, 128),
    authorName: (news.authorName || 'Pentadbir KBelia').trim().slice(0, 120),
    publishedAt: isPublished ? (news.publishedAt || now) : '',
    updatedAt: now,
    createdAt: news.createdAt || now
  };

  // Clear from deleted list if re-saving
  try {
    const deleted = getDeletedIds().filter(d => d !== id);
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch {
    // ignore
  }

  if (!isFirebaseAuthenticated()) {
    try {
      const existing = loadLocalDemoNews();
      const updated = [sanitized, ...existing.filter(n => n.id !== id)];
      localStorage.setItem(DEMO_NEWS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('kbelia_demo_news_updated'));
    } catch {
      // ignore
    }
    return sanitized;
  }

  try {
    await setDoc(doc(db, 'portal_news', id), sanitized, { merge: true });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portal_news');
    throw error;
  }
}

export async function deletePortalNewsRecord(newsId: string): Promise<void> {
  markIdAsDeleted(newsId);

  if (!isFirebaseAuthenticated()) {
    try {
      const existing = loadLocalDemoNews();
      localStorage.setItem(
        DEMO_NEWS_STORAGE_KEY,
        JSON.stringify(existing.filter(n => n.id !== newsId))
      );
      window.dispatchEvent(new CustomEvent('kbelia_demo_news_updated'));
    } catch {
      // ignore
    }
    return;
  }

  try {
    await deleteDoc(doc(db, 'portal_news', newsId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'portal_news');
    throw error;
  }
}

export async function restoreDefaultDemoNews(): Promise<void> {
  try {
    const demoIds = new Set(INITIAL_PORTAL_NEWS.map(n => n.id));
    const deleted = getDeletedIds().filter(id => !demoIds.has(id));
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
    const customOnly = loadLocalDemoNews().filter(n => !demoIds.has(n.id));
    localStorage.setItem(DEMO_NEWS_STORAGE_KEY, JSON.stringify(customOnly));
    window.dispatchEvent(new CustomEvent('kbelia_demo_news_updated'));
  } catch {
    // ignore
  }

  if (isFirebaseAuthenticated()) {
    try {
      for (const item of INITIAL_PORTAL_NEWS) {
        await setDoc(doc(db, 'portal_news', item.id), item, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'portal_news');
      throw error;
    }
  }
}
