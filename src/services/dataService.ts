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
  PortalNews,
  CommunityPost,
  CommunityReply
} from '../types';
import {
  INITIAL_BUSINESSES,
  INITIAL_CAPSULE_SLOTS,
  INITIAL_PRODUCTS,
  INITIAL_PROGRAMS
} from '../data/seedData';
import { INITIAL_PORTAL_NEWS } from '../data/newsData';
import { INITIAL_COMMUNITY_POSTS, INITIAL_COMMUNITY_REPLIES } from '../data/communityData';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
import { broadcastSyncUpdate, publishDemoSyncRecord } from './realtimeSync';

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
  portalAnnouncement: 'Permohonan Kiosk Belia Kelantan Sesi 2026 kini dibuka dengan subsidi sewaan sehingga 50%.'
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
    broadcastSyncUpdate('deleted');
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

export const isProductionAuthenticated = () => {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return false;
  try {
    const raw = sessionStorage.getItem('niagabelia_auth_session') || localStorage.getItem('niagabelia_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.isDemo) return false;
    }
  } catch {
    // ignore
  }
  return true;
};

// --- SEED INITIAL DATA ---
export async function seedInitialData() {
  if (!isProductionAuthenticated()) return false;
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
    for (const post of INITIAL_COMMUNITY_POSTS) {
      await setDoc(doc(db, 'community_posts', post.id), post, { merge: true });
    }
    for (const reply of INITIAL_COMMUNITY_REPLIES) {
      await setDoc(doc(db, 'community_replies', reply.id), reply, { merge: true });
    }
    for (const mentor of INITIAL_MENTOR_PROFILES) {
      await setDoc(doc(db, 'mentor_profiles', mentor.id), mentor, { merge: true });
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([bookingData, ...existing]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('booking', id, bookingData);
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

  if (!isProductionAuthenticated()) {
    let targetBooking: CapsuleBooking | undefined;
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(b => {
        if (b.id === bookingId) {
          targetBooking = { ...b, status, adminNotes: notes };
          return targetBooking;
        }
        return b;
      });
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('booking', bookingId, targetBooking || { id: bookingId, status, adminNotes: notes, slotId, businessName, applicantId });
    if (status === 'approved' && slotId) {
      const slotList: CapsuleSlot[] = JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      const existingSlot = slotList.find(s => s.id === slotId) || INITIAL_CAPSULE_SLOTS.find(s => s.id === slotId);
      if (existingSlot) {
        const updatedSlot: CapsuleSlot = {
          ...existingSlot,
          status: 'occupied',
          currentTenantBusinessName: businessName || 'Usahawan Belia',
          currentTenantId: applicantId || ''
        };
        localStorage.setItem('kbelia_demo_slots', JSON.stringify([updatedSlot, ...slotList.filter(s => s.id !== slotId)]));
        await publishDemoSyncRecord('slot', slotId, updatedSlot);
      }
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

  if (!isProductionAuthenticated()) {
    let targetBooking: CapsuleBooking | undefined;
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(b => {
        if (b.id === bookingId) {
          targetBooking = { ...b, ...payload };
          return targetBooking;
        }
        return b;
      });
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('booking', bookingId, targetBooking || { id: bookingId, ...payload });
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_businesses';
      const existing: BusinessListing[] = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [fullData, ...existing.filter(b => b.id !== id)];
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('business', id, fullData);
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
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_businesses';
      const existing: BusinessListing[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(b => b.id !== businessId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('business', businessId, { id: businessId }, true);
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_products';
      const existing: ProductItem[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullProduct, ...existing.filter(p => p.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('product', id, fullProduct);
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
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_products';
      const existing: ProductItem[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== productId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('product', productId, { id: productId }, true);
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_slots';
      const existing: CapsuleSlot[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullSlot, ...existing.filter(s => s.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('slot', id, fullSlot);
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
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_slots';
      const existing: CapsuleSlot[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(s => s.id !== slotId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('slot', slotId, { id: slotId }, true);
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_programs';
      const existing: YouthProgram[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([fullProgram, ...existing.filter(p => p.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('program', id, fullProgram);
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
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_programs';
      const existing: YouthProgram[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== programId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('program', programId, { id: programId }, true);
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

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([grantData, ...existing.filter(g => g.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('grant', id, grantData);
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
  if (!isProductionAuthenticated()) {
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
    (status === 'approved' ? 'Permohonan geran diluluskan oleh Admin KBelia.' : 'Permohonan ditolak.');

  if (!isProductionAuthenticated()) {
    let updatedGrant: GrantApplication | undefined;
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(
        key,
        JSON.stringify(
          existing.map(g => {
            if (g.id === grantId) {
              updatedGrant = { ...g, status, adminNotes: notes };
              return updatedGrant;
            }
            return g;
          })
        )
      );
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('grant', grantId, updatedGrant || { id: grantId, status, adminNotes: notes });
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

  if (!isProductionAuthenticated()) {
    const key = `kbelia_cashflow_records_${record.ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing.filter(r => r.id !== id)]));
    await publishDemoSyncRecord('cashflow', id, { ...full, ownerId: record.ownerId });
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
  if (!isProductionAuthenticated()) {
    const key = `kbelia_cashflow_records_${ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(r => r.id !== recordId)));
    await publishDemoSyncRecord('cashflow', recordId, { id: recordId, ownerId }, true);
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

  if (!isProductionAuthenticated()) {
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing]));
    await publishDemoSyncRecord('ticket', id, full);
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
  if (!isProductionAuthenticated()) {
    let updatedTicket: MaintenanceTicket | undefined;
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(
      key,
      JSON.stringify(
        existing.map(t => {
          if (t.id === ticketId) {
            updatedTicket = { ...t, status, adminNotes: adminNotes || t.adminNotes };
            return updatedTicket;
          }
          return t;
        })
      )
    );
    await publishDemoSyncRecord('ticket', ticketId, updatedTicket || { id: ticketId, status, adminNotes: adminNotes || '' });
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
  if (!isProductionAuthenticated()) {
    try {
      const existing: MentorProfile[] = JSON.parse(localStorage.getItem('kbelia_mentor_profiles') || '[]');
      const next = existing.some(m => m.id === safeProfile.id)
        ? existing.map(m => (m.id === safeProfile.id ? (safeProfile as MentorProfile) : m))
        : [safeProfile as MentorProfile, ...existing];
      localStorage.setItem('kbelia_mentor_profiles', JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('mentor', safeProfile.id, safeProfile);
    return safeProfile as MentorProfile;
  }
  try {
    await setDoc(doc(db, 'mentor_profiles', safeProfile.id), safeProfile, { merge: true });
    return safeProfile as MentorProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_profiles');
    return safeProfile as MentorProfile;
  }
}

export async function saveMentorshipRegistrationRecord(reg: MentorshipRegistration) {
  if (!isProductionAuthenticated()) {
    try {
      const existing: MentorshipRegistration[] = JSON.parse(localStorage.getItem('kbelia_mentorship_registrations') || '[]');
      const next = [reg, ...existing.filter(r => r.id !== reg.id)];
      localStorage.setItem('kbelia_mentorship_registrations', JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('session', reg.id, reg);
    return reg;
  }
  try {
    await setDoc(doc(db, 'mentor_sessions', reg.id), reg, { merge: true });
    return reg;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_sessions');
    return reg;
  }
}

export async function saveGrantEndorsementRecord(endorsement: GrantEndorsement) {
  if (!isProductionAuthenticated()) {
    const key = 'kbelia_mentor_endorsements_v1';
    const existing: GrantEndorsement[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([endorsement, ...existing.filter(e => e.id !== endorsement.id)]));
    await publishDemoSyncRecord('endorsement', endorsement.id, endorsement);
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
  if (!isProductionAuthenticated()) {
    const key = 'kbelia_mentor_logs_v1';
    const existing: MentoringLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([logEntry, ...existing.filter(l => l.id !== logEntry.id)]));
    await publishDemoSyncRecord('log', logEntry.id, logEntry);
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

// --- B2B / RUANG NIAGA LISTINGS ---
export async function saveB2BListingRecord(item: B2BListing): Promise<B2BListing> {
  const cleanId = (item.id || `b2b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);

  const sanitized: B2BListing = {
    id: cleanId,
    ownerId: (item.ownerId || 'guest').slice(0, 128),
    authorName: (item.authorName || 'Usahawan Belia').trim().slice(0, 120),
    authorBusiness: (item.authorBusiness || 'Perniagaan Belia').trim().slice(0, 150),
    district: item.district || 'Kota Bharu',
    type: item.type === 'supply' ? 'supply' : 'demand',
    title: item.title.trim().slice(0, 200),
    description: (item.description || '').trim().slice(0, 1500),
    whatsapp: (item.whatsapp || '').trim().slice(0, 30),
    imageUrl: (item.imageUrl || '').slice(0, 900000),
    date: (item.date || 'Hari ini').slice(0, 50)
  };

  try {
    const deleted = getDeletedIds().filter(d => d !== cleanId);
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch {
    // ignore
  }

  if (!isProductionAuthenticated()) {
    const existing: B2BListing[] = JSON.parse(localStorage.getItem('kbelia_b2b_listings') || '[]');
    localStorage.setItem(
      'kbelia_b2b_listings',
      JSON.stringify([sanitized, ...existing.filter(x => x.id !== cleanId)])
    );
    await publishDemoSyncRecord('b2b', cleanId, sanitized);
    return sanitized;
  }

  try {
    await setDoc(doc(db, 'b2b_listings', cleanId), sanitized, { merge: true });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'b2b_listings');
    throw error;
  }
}

export async function deleteB2BListingRecord(listingId: string): Promise<void> {
  markIdAsDeleted(listingId);

  if (!isProductionAuthenticated()) {
    try {
      const existing: B2BListing[] = JSON.parse(localStorage.getItem('kbelia_b2b_listings') || '[]');
      localStorage.setItem(
        'kbelia_b2b_listings',
        JSON.stringify(existing.filter(x => x.id !== listingId))
      );
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('b2b', listingId, { id: listingId }, true);
    return;
  }

  try {
    await deleteDoc(doc(db, 'b2b_listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'b2b_listings');
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

  if (!isProductionAuthenticated()) {
    await publishDemoSyncRecord('settings', 'global', payload);
    return payload;
  }

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

// --- PORTAL NEWS (Admin Controlled, All Users Read Published) ---
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

  try {
    const deleted = getDeletedIds().filter(d => d !== id);
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch {
    // ignore
  }

  if (!isProductionAuthenticated()) {
    try {
      const existing = loadLocalDemoNews();
      const updated = [sanitized, ...existing.filter(n => n.id !== id)];
      localStorage.setItem(DEMO_NEWS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('news', id, sanitized);
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

  if (!isProductionAuthenticated()) {
    try {
      const existing = loadLocalDemoNews();
      localStorage.setItem(
        DEMO_NEWS_STORAGE_KEY,
        JSON.stringify(existing.filter(n => n.id !== newsId))
      );
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('news', newsId, { id: newsId }, true);
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
    broadcastSyncUpdate('news');
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      for (const item of INITIAL_PORTAL_NEWS) {
        await setDoc(doc(db, 'portal_news', item.id), item, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'portal_news');
      throw error;
    }
  } else {
    for (const item of INITIAL_PORTAL_NEWS) {
      await publishDemoSyncRecord('news', item.id, item, false);
    }
  }
}

// --- COMMUNITY FORUM (Posts & Replies, All Signed-In Users) ---
const DEMO_COMMUNITY_POSTS_KEY = 'kbelia_demo_community_posts_v1';
const DEMO_COMMUNITY_REPLIES_KEY = 'kbelia_demo_community_replies_v1';

export function loadLocalDemoCommunityPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(DEMO_COMMUNITY_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadLocalDemoCommunityReplies(): CommunityReply[] {
  try {
    const raw = localStorage.getItem(DEMO_COMMUNITY_REPLIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCommunityPostRecord(
  post: Partial<CommunityPost> & {
    title: string;
    content: string;
    category: CommunityPost['category'];
    district: CommunityPost['district'];
    authorId: string;
    authorName: string;
    authorRole: CommunityPost['authorRole'];
  }
): Promise<CommunityPost> {
  const id = (post.id || `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const now = new Date().toISOString();
  const helpfulIds = Array.isArray(post.helpfulUserIds)
    ? Array.from(new Set(post.helpfulUserIds.filter((x): x is string => typeof x === 'string'))).slice(0, 500)
    : [];

  const sanitized: CommunityPost = {
    id,
    title: post.title.trim().slice(0, 200),
    content: post.content.trim().slice(0, 5000),
    category: post.category,
    district: post.district || 'Kota Bharu',
    authorId: (post.authorId || auth.currentUser?.uid || 'guest').slice(0, 128),
    authorName: (post.authorName || 'Usahawan Belia').trim().slice(0, 120),
    authorRole: post.authorRole || 'user',
    status: post.status === 'resolved' ? 'resolved' : 'open',
    isPinned: Boolean(post.isPinned),
    helpfulUserIds: helpfulIds,
    helpfulCount: typeof post.helpfulCount === 'number' ? Math.max(0, post.helpfulCount) : helpfulIds.length,
    replyCount: typeof post.replyCount === 'number' ? Math.max(0, post.replyCount) : 0,
    ...(post.acceptedReplyId ? { acceptedReplyId: post.acceptedReplyId.slice(0, 128) } : {}),
    createdAt: post.createdAt || now,
    updatedAt: now
  };

  try {
    const deleted = getDeletedIds().filter(d => d !== id);
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch {
    // ignore
  }

  if (!isProductionAuthenticated()) {
    try {
      const existing = loadLocalDemoCommunityPosts();
      const updated = [sanitized, ...existing.filter(p => p.id !== id)];
      localStorage.setItem(DEMO_COMMUNITY_POSTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_post', id, sanitized);
    return sanitized;
  }

  try {
    await setDoc(doc(db, 'community_posts', id), sanitized, { merge: true });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'community_posts');
    throw error;
  }
}

export async function deleteCommunityPostRecord(postId: string): Promise<void> {
  markIdAsDeleted(postId);

  if (!isProductionAuthenticated()) {
    try {
      const existingPosts = loadLocalDemoCommunityPosts();
      localStorage.setItem(
        DEMO_COMMUNITY_POSTS_KEY,
        JSON.stringify(existingPosts.filter(p => p.id !== postId))
      );
      const existingReplies = loadLocalDemoCommunityReplies();
      localStorage.setItem(
        DEMO_COMMUNITY_REPLIES_KEY,
        JSON.stringify(existingReplies.filter(r => r.postId !== postId))
      );
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_post', postId, { id: postId }, true);
    return;
  }

  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'community_posts');
    throw error;
  }
}

export async function toggleCommunityHelpfulRecord(
  post: CommunityPost,
  userId: string
): Promise<CommunityPost> {
  const alreadyVoted = post.helpfulUserIds.includes(userId);
  const nextIds = alreadyVoted
    ? post.helpfulUserIds.filter(id => id !== userId)
    : [...post.helpfulUserIds, userId].slice(0, 500);
  const delta = alreadyVoted ? -1 : 1;
  const nextCount = Math.max(0, (post.helpfulCount || 0) + delta);
  const updatedAt = new Date().toISOString();

  const updatedPost: CommunityPost = {
    ...post,
    helpfulUserIds: nextIds,
    helpfulCount: nextCount,
    updatedAt
  };

  if (!isProductionAuthenticated()) {
    try {
      const existing = loadLocalDemoCommunityPosts();
      localStorage.setItem(
        DEMO_COMMUNITY_POSTS_KEY,
        JSON.stringify([updatedPost, ...existing.filter(p => p.id !== post.id)])
      );
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_post', post.id, updatedPost);
    return updatedPost;
  }

  try {
    await setDoc(
      doc(db, 'community_posts', post.id),
      {
        ...updatedPost,
        helpfulUserIds: nextIds,
        helpfulCount: nextCount,
        updatedAt
      },
      { merge: true }
    );
    return updatedPost;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'community_posts');
    throw error;
  }
}

export async function saveCommunityReplyRecord(
  reply: Partial<CommunityReply> & {
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: CommunityReply['authorRole'];
  },
  parentPost?: CommunityPost
): Promise<CommunityReply> {
  const id = (reply.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const now = new Date().toISOString();

  const sanitizedReply: CommunityReply = {
    id,
    postId: reply.postId.slice(0, 128),
    content: reply.content.trim().slice(0, 3000),
    authorId: (reply.authorId || auth.currentUser?.uid || 'guest').slice(0, 128),
    authorName: (reply.authorName || 'Usahawan Belia').trim().slice(0, 120),
    authorRole: reply.authorRole || 'user',
    isAccepted: Boolean(reply.isAccepted),
    createdAt: reply.createdAt || now,
    updatedAt: now
  };

  const isNewReply = !reply.id;
  const nextParent: CommunityPost | undefined = parentPost
    ? {
        ...parentPost,
        replyCount: isNewReply ? (parentPost.replyCount || 0) + 1 : parentPost.replyCount,
        updatedAt: now
      }
    : undefined;

  if (!isProductionAuthenticated()) {
    try {
      const existingReplies = loadLocalDemoCommunityReplies();
      localStorage.setItem(
        DEMO_COMMUNITY_REPLIES_KEY,
        JSON.stringify([...existingReplies.filter(r => r.id !== id), sanitizedReply])
      );
      if (nextParent) {
        const existingPosts = loadLocalDemoCommunityPosts();
        localStorage.setItem(
          DEMO_COMMUNITY_POSTS_KEY,
          JSON.stringify([nextParent, ...existingPosts.filter(p => p.id !== nextParent.id)])
        );
      }
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_reply', id, sanitizedReply);
    if (nextParent) {
      await publishDemoSyncRecord('community_post', nextParent.id, nextParent);
    }
    return sanitizedReply;
  }

  try {
    await setDoc(doc(db, 'community_replies', id), sanitizedReply, { merge: true });
    if (nextParent && isNewReply) {
      await setDoc(
        doc(db, 'community_posts', nextParent.id),
        { ...nextParent, replyCount: nextParent.replyCount, updatedAt: now },
        { merge: true }
      );
    }
    return sanitizedReply;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'community_replies');
    throw error;
  }
}

export async function deleteCommunityReplyRecord(
  replyId: string,
  parentPost?: CommunityPost
): Promise<void> {
  markIdAsDeleted(replyId);
  const now = new Date().toISOString();

  const nextParent: CommunityPost | undefined = parentPost
    ? {
        ...parentPost,
        replyCount: Math.max(0, (parentPost.replyCount || 1) - 1),
        ...(parentPost.acceptedReplyId === replyId ? { acceptedReplyId: '', status: 'open' as const } : {}),
        updatedAt: now
      }
    : undefined;

  if (!isProductionAuthenticated()) {
    try {
      const existingReplies = loadLocalDemoCommunityReplies();
      localStorage.setItem(
        DEMO_COMMUNITY_REPLIES_KEY,
        JSON.stringify(existingReplies.filter(r => r.id !== replyId))
      );
      if (nextParent) {
        const existingPosts = loadLocalDemoCommunityPosts();
        localStorage.setItem(
          DEMO_COMMUNITY_POSTS_KEY,
          JSON.stringify([nextParent, ...existingPosts.filter(p => p.id !== nextParent.id)])
        );
      }
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_reply', replyId, { id: replyId }, true);
    if (nextParent) {
      await publishDemoSyncRecord('community_post', nextParent.id, nextParent);
    }
    return;
  }

  try {
    await deleteDoc(doc(db, 'community_replies', replyId));
    if (nextParent) {
      await setDoc(
        doc(db, 'community_posts', nextParent.id),
        { ...nextParent, replyCount: nextParent.replyCount, updatedAt: now },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'community_replies');
    throw error;
  }
}

export async function markAcceptedCommunityReplyRecord(
  post: CommunityPost,
  reply: CommunityReply,
  allRepliesForPost: CommunityReply[]
): Promise<void> {
  const isUnmarking = post.acceptedReplyId === reply.id;
  const now = new Date().toISOString();
  const nextPost: CommunityPost = {
    ...post,
    acceptedReplyId: isUnmarking ? '' : reply.id,
    status: isUnmarking ? 'open' : 'resolved',
    updatedAt: now
  };

  if (!isProductionAuthenticated()) {
    try {
      const existingPosts = loadLocalDemoCommunityPosts();
      localStorage.setItem(
        DEMO_COMMUNITY_POSTS_KEY,
        JSON.stringify([nextPost, ...existingPosts.filter(p => p.id !== post.id)])
      );
      const existingReplies = loadLocalDemoCommunityReplies();
      const updatedMap = new Map(existingReplies.map(r => [r.id, r]));
      for (const r of allRepliesForPost) {
        updatedMap.set(r.id, {
          ...r,
          isAccepted: !isUnmarking && r.id === reply.id,
          updatedAt: now
        });
      }
      localStorage.setItem(DEMO_COMMUNITY_REPLIES_KEY, JSON.stringify(Array.from(updatedMap.values())));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_post', nextPost.id, nextPost);
    for (const r of allRepliesForPost) {
      await publishDemoSyncRecord('community_reply', r.id, {
        ...r,
        isAccepted: !isUnmarking && r.id === reply.id,
        updatedAt: now
      });
    }
    return;
  }

  try {
    await setDoc(doc(db, 'community_posts', nextPost.id), nextPost, { merge: true });
    for (const r of allRepliesForPost) {
      const nextAccepted = !isUnmarking && r.id === reply.id;
      if (Boolean(r.isAccepted) !== nextAccepted) {
        await setDoc(
          doc(db, 'community_replies', r.id),
          { ...r, isAccepted: nextAccepted, updatedAt: now },
          { merge: true }
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'community_posts');
    throw error;
  }
}

export async function restoreDefaultDemoCommunity(): Promise<void> {
  try {
    const demoPostIds = new Set(INITIAL_COMMUNITY_POSTS.map(p => p.id));
    const demoReplyIds = new Set(INITIAL_COMMUNITY_REPLIES.map(r => r.id));
    const deleted = getDeletedIds().filter(id => !demoPostIds.has(id) && !demoReplyIds.has(id));
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));

    const customPosts = loadLocalDemoCommunityPosts().filter(p => !demoPostIds.has(p.id));
    localStorage.setItem(DEMO_COMMUNITY_POSTS_KEY, JSON.stringify(customPosts));

    const customReplies = loadLocalDemoCommunityReplies().filter(r => !demoReplyIds.has(r.id));
    localStorage.setItem(DEMO_COMMUNITY_REPLIES_KEY, JSON.stringify(customReplies));

    broadcastSyncUpdate('community_post');
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      for (const post of INITIAL_COMMUNITY_POSTS) {
        await setDoc(doc(db, 'community_posts', post.id), post, { merge: true });
      }
      for (const reply of INITIAL_COMMUNITY_REPLIES) {
        await setDoc(doc(db, 'community_replies', reply.id), reply, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'community_posts');
      throw error;
    }
  } else {
    for (const post of INITIAL_COMMUNITY_POSTS) {
      await publishDemoSyncRecord('community_post', post.id, post, false);
    }
    for (const reply of INITIAL_COMMUNITY_REPLIES) {
      await publishDemoSyncRecord('community_reply', reply.id, reply, false);
    }
  }
}
