import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where
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
  CommunityReply,
  EventBooking,
  UserProfile,
  YouthEvent
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
import {
  broadcastSyncUpdate,
  mergeUniqueById,
  publishDemoSyncRecord,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from './realtimeSync';

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
  portalAnnouncement: 'Permohonan Kiosk Belia Kelantan Sesi 2026 kini dibuka dengan subsidi sewaan sehingga 50%.',
  updatedAt: '2026-03-01T08:00:00.000Z'
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

function unmarkIdAsDeleted(id: string) {
  try {
    const deleted = getDeletedIds().filter(d => d !== id);
    localStorage.setItem(CACHE_KEYS.DELETED_IDS, JSON.stringify(deleted));
  } catch {
    // ignore
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

/**
 * Writes a Firestore document with updatedAt. If remote security rules have not yet
 * been redeployed to allow updatedAt on that collection, transparently retries
 * without updatedAt while demo_sync still carries the authoritative updatedAt.
 */
async function setDocWithUpdatedAtFallback(
  docRef: ReturnType<typeof doc>,
  data: Record<string, any>,
  merge = false
) {
  try {
    if (merge) {
      await setDoc(docRef, data, { merge: true });
    } else {
      await setDoc(docRef, data);
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied' && 'updatedAt' in data && Object.keys(data).length > 1) {
      const { updatedAt: _omit, ...withoutUpdatedAt } = data;
      if (merge) {
        await setDoc(docRef, withoutUpdatedAt, { merge: true });
      } else {
        await setDoc(docRef, withoutUpdatedAt);
      }
      return;
    }
    throw error;
  }
}

// --- SEED INITIAL DATA (Non-Destructive: only creates missing docs, respects deletions) ---
export async function seedInitialData() {
  if (!isProductionAuthenticated()) return false;
  try {
    const deletedSet = new Set(getDeletedIds());

    const seedIfMissing = async (colName: string, id: string, item: Record<string, any>) => {
      if (deletedSet.has(id)) return;
      const ref = doc(db, colName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDocWithUpdatedAtFallback(ref, item, false);
      }
    };

    for (const slot of INITIAL_CAPSULE_SLOTS) {
      await seedIfMissing('capsule_slots', slot.id, slot);
    }
    for (const biz of INITIAL_BUSINESSES) {
      await seedIfMissing('businesses', biz.id, biz);
    }
    for (const prod of INITIAL_PRODUCTS) {
      await seedIfMissing('products', prod.id, prod);
    }
    for (const prog of INITIAL_PROGRAMS) {
      await seedIfMissing('programs', prog.id, prog);
    }
    for (const newsItem of INITIAL_PORTAL_NEWS) {
      await seedIfMissing('portal_news', newsItem.id, newsItem);
    }
    for (const post of INITIAL_COMMUNITY_POSTS) {
      await seedIfMissing('community_posts', post.id, post);
    }
    for (const reply of INITIAL_COMMUNITY_REPLIES) {
      await seedIfMissing('community_replies', reply.id, reply);
    }
    for (const mentor of INITIAL_MENTOR_PROFILES) {
      await seedIfMissing('mentor_profiles', mentor.id, mentor);
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
  const now = new Date().toISOString();
  const bookingData: CapsuleBooking = {
    ...booking,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now
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
    await setDocWithUpdatedAtFallback(doc(db, path, id), bookingData, false);
    await publishDemoSyncRecord('booking', id, bookingData);
    return bookingData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  adminNotes: string,
  slotId?: string,
  businessName?: string,
  applicantId?: string,
  baseBooking?: CapsuleBooking
) {
  const path = 'capsule_bookings';
  const now = new Date().toISOString();
  const notes =
    adminNotes ||
    (status === 'approved'
      ? 'Permohonan diluluskan. Sila hadir ke pejabat pentadbiran untuk penyerahan kunci.'
      : status === 'cancelled'
      ? 'Tempahan dibatalkan.'
      : status === 'pending'
      ? 'Status dikembalikan kepada menunggu semakan.'
      : 'Permohonan ditolak.');

  const releaseOrOccupyLocalSlot = async (targetApplicantId?: string) => {
    if (status === 'approved' && slotId) {
      const slotList: CapsuleSlot[] = JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      const existingSlot = slotList.find(s => s.id === slotId) || INITIAL_CAPSULE_SLOTS.find(s => s.id === slotId);
      if (existingSlot) {
        const updatedSlot: CapsuleSlot = {
          ...existingSlot,
          status: 'occupied',
          currentTenantBusinessName: businessName || 'Usahawan Belia',
          currentTenantId: applicantId || '',
          updatedAt: now
        };
        if (!isProductionAuthenticated()) {
          localStorage.setItem('kbelia_demo_slots', JSON.stringify([updatedSlot, ...slotList.filter(s => s.id !== slotId)]));
        }
        await publishDemoSyncRecord('slot', slotId, updatedSlot);
      }
    } else if ((status === 'cancelled' || status === 'rejected' || status === 'pending') && slotId) {
      const slotList: CapsuleSlot[] = JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      const existingSlot = slotList.find(s => s.id === slotId) || INITIAL_CAPSULE_SLOTS.find(s => s.id === slotId);
      if (
        existingSlot &&
        (existingSlot.currentTenantId === (targetApplicantId || applicantId) ||
          existingSlot.status === 'reserved' ||
          existingSlot.status === 'occupied')
      ) {
        const releasedSlot: CapsuleSlot = {
          ...existingSlot,
          status: 'available',
          currentTenantBusinessName: '',
          currentTenantId: '',
          updatedAt: now
        };
        if (!isProductionAuthenticated()) {
          localStorage.setItem('kbelia_demo_slots', JSON.stringify([releasedSlot, ...slotList.filter(s => s.id !== slotId)]));
        }
        await publishDemoSyncRecord('slot', slotId, releasedSlot);
      }
    }
  };

  if (!isProductionAuthenticated()) {
    let targetBooking: CapsuleBooking | undefined = baseBooking
      ? { ...baseBooking, status, adminNotes: notes, updatedAt: now }
      : undefined;
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      let foundLocal = false;
      const updated = existing.map(b => {
        if (b.id === bookingId) {
          foundLocal = true;
          targetBooking = { ...b, status, adminNotes: notes, updatedAt: now };
          return targetBooking;
        }
        return b;
      });
      if (!foundLocal && targetBooking) {
        updated.unshift(targetBooking);
      }
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord(
      'booking',
      bookingId,
      targetBooking || { id: bookingId, status, adminNotes: notes, slotId, businessName, applicantId, updatedAt: now }
    );
    await releaseOrOccupyLocalSlot(targetBooking?.applicantId);
    return;
  }

  try {
    const bookingRef = doc(db, path, bookingId);
    const existingSnap = await getDoc(bookingRef);
    let syncedPayload: Record<string, any>;

    if (existingSnap.exists()) {
      await setDocWithUpdatedAtFallback(bookingRef, { status, adminNotes: notes, updatedAt: now }, true);
      syncedPayload = { ...existingSnap.data(), status, adminNotes: notes, updatedAt: now };
    } else if (baseBooking) {
      syncedPayload = { ...baseBooking, status, adminNotes: notes, updatedAt: now };
    } else {
      syncedPayload = { id: bookingId, status, adminNotes: notes, slotId, businessName, applicantId, updatedAt: now };
    }

    await publishDemoSyncRecord('booking', bookingId, syncedPayload);

    if (status === 'approved' && slotId) {
      const slotRef = doc(db, 'capsule_slots', slotId);
      const slotSnap = await getDoc(slotRef);
      const slotPatch = {
        status: 'occupied' as const,
        currentTenantBusinessName: businessName || 'Usahawan Belia',
        currentTenantId: applicantId || '',
        updatedAt: now
      };
      if (slotSnap.exists()) {
        await setDocWithUpdatedAtFallback(slotRef, slotPatch, true);
        await publishDemoSyncRecord('slot', slotId, { ...slotSnap.data(), ...slotPatch });
      } else {
        await releaseOrOccupyLocalSlot(applicantId);
      }
    } else if ((status === 'cancelled' || status === 'rejected' || status === 'pending') && slotId) {
      const slotRef = doc(db, 'capsule_slots', slotId);
      const slotSnap = await getDoc(slotRef).catch(() => null);
      const releasePatch = {
        status: 'available' as const,
        currentTenantBusinessName: '',
        currentTenantId: '',
        updatedAt: now
      };
      if (slotSnap?.exists()) {
        try {
          await setDocWithUpdatedAtFallback(slotRef, releasePatch, true);
        } catch {
          // Non-admin youth cancellation relies on derived enrichedSlots when capsule_slots is admin-only
        }
        await publishDemoSyncRecord('slot', slotId, { ...slotSnap.data(), ...releasePatch });
      } else {
        await releaseOrOccupyLocalSlot(applicantId);
      }
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
  const now = new Date().toISOString();
  const payload = {
    tenancySigned: true,
    tenancySignedAt: now,
    tenancySignatureName: signatureName,
    updatedAt: now
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
    const ref = doc(db, 'capsule_bookings', bookingId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDocWithUpdatedAtFallback(ref, payload, true);
      await publishDemoSyncRecord('booking', bookingId, { ...snap.data(), ...payload });
    } else {
      await publishDemoSyncRecord('booking', bookingId, { id: bookingId, ...payload });
    }
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
  const now = new Date().toISOString();
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
    createdAt: business.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

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
    await setDocWithUpdatedAtFallback(doc(db, path, id), fullData, true);
    await publishDemoSyncRecord('business', id, fullData);
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
  await publishDemoSyncRecord('business', businessId, { id: businessId }, true);
}

// --- PRODUCTS ---
export async function saveProduct(
  product: Partial<ProductItem> & { businessId: string; ownerId: string }
) {
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'products';
  const now = new Date().toISOString();
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
    createdAt: product.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

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
    await setDocWithUpdatedAtFallback(doc(db, path, id), fullProduct, true);
    await publishDemoSyncRecord('product', id, fullProduct);
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
  await publishDemoSyncRecord('product', productId, { id: productId }, true);
}

// --- CAPSULE SLOTS ---
export async function saveCapsuleSlot(slot: Partial<CapsuleSlot> & { code: string; name: string }) {
  const id = slot.id || `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'capsule_slots';
  const now = new Date().toISOString();
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
    createdAt: slot.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

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
    await setDocWithUpdatedAtFallback(doc(db, path, id), fullSlot, true);
    await publishDemoSyncRecord('slot', id, fullSlot);
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
  await publishDemoSyncRecord('slot', slotId, { id: slotId }, true);
}

// --- PROGRAMS ---
export async function saveProgram(
  program: Partial<YouthProgram> & { title: string; category: YouthProgram['category'] }
) {
  const id = program.id || `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'programs';
  const now = new Date().toISOString();
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
    imageUrl: program.imageUrl || '',
    isFeatured: program.isFeatured ?? false,
    createdAt: program.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

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
    await setDocWithUpdatedAtFallback(doc(db, path, id), fullProgram, true);
    await publishDemoSyncRecord('program', id, fullProgram);
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
  await publishDemoSyncRecord('program', programId, { id: programId }, true);
}

// --- GRANT APPLICATIONS ---
export async function createGrantApplication(
  grant: Omit<GrantApplication, 'id' | 'createdAt' | 'status'> & { id?: string }
) {
  const id = grant.id || `grant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'grant_applications';
  const now = new Date().toISOString();
  const grantData: GrantApplication = {
    ...grant,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now
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
    await setDocWithUpdatedAtFallback(doc(db, path, id), grantData, false);
    await publishDemoSyncRecord('grant', id, grantData);
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  adminNotes?: string,
  baseGrant?: GrantApplication
) {
  const now = new Date().toISOString();
  const notes =
    adminNotes ||
    (status === 'approved'
      ? 'Permohonan geran diluluskan oleh Admin KBelia.'
      : status === 'cancelled'
      ? 'Permohonan geran dibatalkan.'
      : status === 'pending'
      ? 'Status dikembalikan kepada menunggu semakan.'
      : 'Permohonan ditolak.');

  if (!isProductionAuthenticated()) {
    let updatedGrant: GrantApplication | undefined = baseGrant
      ? { ...baseGrant, status, adminNotes: notes, updatedAt: now }
      : undefined;
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      let foundLocal = false;
      const next = existing.map(g => {
        if (g.id === grantId) {
          foundLocal = true;
          updatedGrant = { ...g, status, adminNotes: notes, updatedAt: now };
          return updatedGrant;
        }
        return g;
      });
      if (!foundLocal && updatedGrant) {
        next.unshift(updatedGrant);
      }
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('grant', grantId, updatedGrant || { id: grantId, status, adminNotes: notes, updatedAt: now });
    return;
  }

  try {
    const grantRef = doc(db, 'grant_applications', grantId);
    const snap = await getDoc(grantRef);
    let syncedPayload: Record<string, any>;
    if (snap.exists()) {
      await setDocWithUpdatedAtFallback(grantRef, { status, adminNotes: notes, updatedAt: now }, true);
      syncedPayload = { ...snap.data(), status, adminNotes: notes, updatedAt: now };
    } else if (baseGrant) {
      syncedPayload = { ...baseGrant, status, adminNotes: notes, updatedAt: now };
    } else {
      syncedPayload = { id: grantId, status, adminNotes: notes, updatedAt: now };
    }
    await publishDemoSyncRecord('grant', grantId, syncedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'grant_applications');
    throw error;
  }
}

// --- CASHFLOW RECORDS (Firestore + DemoSync Bidirectional Isolation) ---
export const DEMO_SAMPLE_SALES: KioskDailySale[] = [
  {
    id: 'demo-cf-1',
    date: '2026-03-24',
    cashSales: 180,
    qrSales: 220,
    expenses: 90,
    notes: 'Restok cawan biodegradasi & serbuk kopi',
    createdAt: '2026-03-24T20:00:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'demo-cf-2',
    date: '2026-03-25',
    cashSales: 150,
    qrSales: 280,
    expenses: 40,
    notes: 'Jualan waktu petang rancak',
    createdAt: '2026-03-25T20:00:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'demo-cf-3',
    date: '2026-03-26',
    cashSales: 210,
    qrSales: 310,
    expenses: 110,
    notes: 'Beli bahan mentah segar & ais',
    createdAt: '2026-03-26T20:00:00Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  }
];

export function getSeededDemoCashflowRecords(ownerId: string, isDemoSession: boolean): KioskDailySale[] {
  const storageKey = `kbelia_cashflow_records_${ownerId}`;
  try {
    const savedRaw = localStorage.getItem(storageKey);
    if (savedRaw !== null) {
      const parsed = JSON.parse(savedRaw);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (isDemoSession) {
      const seeded = DEMO_SAMPLE_SALES.map((item) => ({ ...item, ownerId }));
      localStorage.setItem(storageKey, JSON.stringify(seeded));
      return seeded;
    }
  } catch {
    return [];
  }
  return [];
}

export async function saveCashflowRecord(record: KioskDailySale & { ownerId: string }) {
  const id = record.id || `cf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const full: KioskDailySale = {
    ...record,
    id,
    createdAt: record.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

  if (!isProductionAuthenticated()) {
    const key = `kbelia_cashflow_records_${record.ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing.filter(r => r.id !== id)]));
    await publishDemoSyncRecord('cashflow', id, { ...full, ownerId: record.ownerId });
    return full;
  }

  try {
    await setDocWithUpdatedAtFallback(doc(db, 'cashflow_records', id), full, true);
    await publishDemoSyncRecord('cashflow', id, { ...full, ownerId: record.ownerId });
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'cashflow_records');
    throw error;
  }
}

export async function deleteCashflowRecord(recordId: string, ownerId: string) {
  markIdAsDeleted(recordId);
  if (!isProductionAuthenticated()) {
    const key = `kbelia_cashflow_records_${ownerId}`;
    const existing: KioskDailySale[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(r => r.id !== recordId)));
    await publishDemoSyncRecord('cashflow', recordId, { id: recordId, ownerId }, true);
    return;
  }

  try {
    const cfRef = doc(db, 'cashflow_records', recordId);
    const snap = await getDoc(cfRef);
    if (snap.exists()) {
      await deleteDoc(cfRef);
    }
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, 'cashflow_records');
      throw error;
    }
  }
  await publishDemoSyncRecord('cashflow', recordId, { id: recordId, ownerId }, true);
}

// --- MAINTENANCE TICKETS ---
export async function createMaintenanceTicket(
  ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt'> & { ownerId: string }
) {
  const id = `MT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();
  const full: MaintenanceTicket = {
    ...ticket,
    id,
    status: 'received',
    createdAt: now,
    updatedAt: now
  };

  if (!isProductionAuthenticated()) {
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([full, ...existing]));
    await publishDemoSyncRecord('ticket', id, full);
    return full;
  }

  try {
    await setDocWithUpdatedAtFallback(doc(db, 'maintenance_tickets', id), full, false);
    await publishDemoSyncRecord('ticket', id, full);
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'maintenance_tickets');
    throw error;
  }
}

export async function updateMaintenanceTicketStatus(
  ticketId: string,
  status: MaintenanceTicket['status'],
  adminNotes?: string,
  baseTicket?: MaintenanceTicket
) {
  const now = new Date().toISOString();
  if (!isProductionAuthenticated()) {
    let updatedTicket: MaintenanceTicket | undefined = baseTicket
      ? { ...baseTicket, status, adminNotes: adminNotes || baseTicket.adminNotes, updatedAt: now }
      : undefined;
    const key = 'kbelia_demo_maintenance_tickets';
    const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
    let foundLocal = false;
    const next = existing.map(t => {
      if (t.id === ticketId) {
        foundLocal = true;
        updatedTicket = { ...t, status, adminNotes: adminNotes || t.adminNotes, updatedAt: now };
        return updatedTicket;
      }
      return t;
    });
    if (!foundLocal && updatedTicket) {
      next.unshift(updatedTicket);
    }
    localStorage.setItem(key, JSON.stringify(next));
    await publishDemoSyncRecord('ticket', ticketId, updatedTicket || { id: ticketId, status, adminNotes: adminNotes || '', updatedAt: now });
    return;
  }

  try {
    const ticketRef = doc(db, 'maintenance_tickets', ticketId);
    const snap = await getDoc(ticketRef);
    let syncedPayload: Record<string, any>;
    if (snap.exists()) {
      await setDocWithUpdatedAtFallback(ticketRef, { status, adminNotes: adminNotes || '', updatedAt: now }, true);
      syncedPayload = { ...snap.data(), status, adminNotes: adminNotes || '', updatedAt: now };
    } else if (baseTicket) {
      syncedPayload = { ...baseTicket, status, adminNotes: adminNotes || '', updatedAt: now };
    } else {
      syncedPayload = { id: ticketId, status, adminNotes: adminNotes || '', updatedAt: now };
    }
    await publishDemoSyncRecord('ticket', ticketId, syncedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'maintenance_tickets');
    throw error;
  }
}

// --- MENTORSHIP, MENTOR PROFILES, ENDORSEMENTS & LOGS ---
export async function saveMentorProfileRecord(profile: MentorProfile) {
  const { pin: _pin, ...rest } = profile as MentorProfile & { pin?: string };
  const safeProfile: MentorProfile = {
    ...rest,
    updatedAt: new Date().toISOString()
  };

  if (!isProductionAuthenticated()) {
    try {
      const existing: MentorProfile[] = JSON.parse(localStorage.getItem('kbelia_mentor_profiles') || '[]');
      const next = existing.some(m => m.id === safeProfile.id)
        ? existing.map(m => (m.id === safeProfile.id ? safeProfile : m))
        : [safeProfile, ...existing];
      localStorage.setItem('kbelia_mentor_profiles', JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('mentor', safeProfile.id, safeProfile);
    return safeProfile;
  }
  try {
    await setDocWithUpdatedAtFallback(doc(db, 'mentor_profiles', safeProfile.id), safeProfile, true);
    await publishDemoSyncRecord('mentor', safeProfile.id, safeProfile);
    return safeProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_profiles');
    return safeProfile;
  }
}

export async function saveMentorshipRegistrationRecord(reg: MentorshipRegistration) {
  const now = new Date().toISOString();
  const stampedReg: MentorshipRegistration = {
    ...reg,
    createdAt: reg.createdAt || now,
    updatedAt: now
  };

  if (!isProductionAuthenticated()) {
    try {
      const existing: MentorshipRegistration[] = JSON.parse(localStorage.getItem('kbelia_mentorship_registrations') || '[]');
      const next = [stampedReg, ...existing.filter(r => r.id !== stampedReg.id)];
      localStorage.setItem('kbelia_mentorship_registrations', JSON.stringify(next));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('session', stampedReg.id, stampedReg);
    return stampedReg;
  }
  try {
    const sessionRef = doc(db, 'mentor_sessions', stampedReg.id);
    const snap = await getDoc(sessionRef);
    if (snap.exists() || !stampedReg.id.startsWith('mentee-reg-')) {
      await setDocWithUpdatedAtFallback(sessionRef, stampedReg, true);
    }
    await publishDemoSyncRecord('session', stampedReg.id, stampedReg);
    return stampedReg;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_sessions');
    return stampedReg;
  }
}

export async function saveGrantEndorsementRecord(endorsement: GrantEndorsement) {
  const now = new Date().toISOString();
  const stamped: GrantEndorsement = {
    ...endorsement,
    updatedAt: now
  };

  if (!isProductionAuthenticated()) {
    const key = 'kbelia_mentor_endorsements_v1';
    const existing: GrantEndorsement[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([stamped, ...existing.filter(e => e.id !== stamped.id)]));
    await publishDemoSyncRecord('endorsement', stamped.id, stamped);
    return stamped;
  }
  try {
    await setDocWithUpdatedAtFallback(doc(db, 'mentor_endorsements', stamped.id), stamped, true);
    await publishDemoSyncRecord('endorsement', stamped.id, stamped);
    return stamped;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_endorsements');
    throw error;
  }
}

export async function saveMentoringLogRecord(logEntry: MentoringLogEntry) {
  const now = new Date().toISOString();
  const stamped: MentoringLogEntry = {
    ...logEntry,
    createdAt: logEntry.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(stamped.id);

  if (!isProductionAuthenticated()) {
    const key = 'kbelia_mentor_logs_v1';
    const existing: MentoringLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([stamped, ...existing.filter(l => l.id !== stamped.id)]));
    await publishDemoSyncRecord('log', stamped.id, stamped);
    return stamped;
  }
  try {
    await setDocWithUpdatedAtFallback(doc(db, 'mentor_logs', stamped.id), stamped, true);
    await publishDemoSyncRecord('log', stamped.id, stamped);
    return stamped;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mentor_logs');
    throw error;
  }
}

export async function deleteMentoringLogRecord(logId: string): Promise<void> {
  markIdAsDeleted(logId);

  try {
    const key = 'kbelia_mentor_logs_v1';
    const existing: MentoringLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(l => l.id !== logId)));
  } catch {
    // ignore
  }

  if (!isProductionAuthenticated()) {
    await publishDemoSyncRecord('log', logId, { id: logId }, true);
    return;
  }

  try {
    await deleteDoc(doc(db, 'mentor_logs', logId));
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, 'mentor_logs');
      throw error;
    }
  }
  await publishDemoSyncRecord('log', logId, { id: logId }, true);
}

// --- B2B / RUANG NIAGA LISTINGS ---
export async function saveB2BListingRecord(item: B2BListing): Promise<B2BListing> {
  const cleanId = (item.id || `b2b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const now = new Date().toISOString();

  const sanitized: B2BListing = {
    id: cleanId,
    ownerId: (item.ownerId || auth.currentUser?.uid || 'guest').slice(0, 128),
    authorName: (item.authorName || 'Usahawan Belia').trim().slice(0, 120),
    authorBusiness: (item.authorBusiness || 'Perniagaan Belia').trim().slice(0, 150),
    district: item.district || 'Kota Bharu',
    type: item.type === 'supply' ? 'supply' : 'demand',
    title: item.title.trim().slice(0, 200),
    description: (item.description || '').trim().slice(0, 1500),
    whatsapp: (item.whatsapp || '').trim().slice(0, 30),
    imageUrl: (item.imageUrl || '').slice(0, 900000),
    date: (item.date || 'Hari ini').slice(0, 50),
    updatedAt: now
  };

  unmarkIdAsDeleted(cleanId);

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
    await setDocWithUpdatedAtFallback(doc(db, 'b2b_listings', cleanId), sanitized, true);
  } catch (error: any) {
    // Allow fallback to demo_sync if remote rules haven't opened owner writes on b2b_listings yet
    if (error?.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, 'b2b_listings');
      throw error;
    }
  }
  await publishDemoSyncRecord('b2b', cleanId, sanitized);
  return sanitized;
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
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('Firestore B2B delete notice:', error);
    }
  }
  await publishDemoSyncRecord('b2b', listingId, { id: listingId }, true);
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
    await publishDemoSyncRecord('settings', 'global', payload);
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

  unmarkIdAsDeleted(id);

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
    await publishDemoSyncRecord('news', id, sanitized);
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
    console.warn('Firestore delete news notice:', error);
  }
  await publishDemoSyncRecord('news', newsId, { id: newsId }, true);
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

  unmarkIdAsDeleted(id);

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
    await publishDemoSyncRecord('community_post', id, sanitized);
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
    console.warn('Firestore delete community post notice:', error);
  }
  await publishDemoSyncRecord('community_post', postId, { id: postId }, true);
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
    const postRef = doc(db, 'community_posts', post.id);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      await setDoc(
        postRef,
        {
          ...updatedPost,
          helpfulUserIds: nextIds,
          helpfulCount: nextCount,
          updatedAt
        },
        { merge: true }
      );
    }
    await publishDemoSyncRecord('community_post', post.id, updatedPost);
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
    if (nextParent) {
      const postRef = doc(db, 'community_posts', nextParent.id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await setDoc(doc(db, 'community_replies', id), sanitizedReply, { merge: true });
        if (isNewReply) {
          await setDoc(
            postRef,
            { ...nextParent, replyCount: nextParent.replyCount, updatedAt: now },
            { merge: true }
          );
        }
      }
    } else {
      await setDoc(doc(db, 'community_replies', id), sanitizedReply, { merge: true });
    }
    await publishDemoSyncRecord('community_reply', id, sanitizedReply);
    if (nextParent) {
      await publishDemoSyncRecord('community_post', nextParent.id, nextParent);
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
  } catch (error) {
    console.warn('Firestore delete community reply notice:', error);
  }
  if (nextParent) {
    try {
      const postRef = doc(db, 'community_posts', nextParent.id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await setDoc(
          postRef,
          { ...nextParent, replyCount: nextParent.replyCount, updatedAt: now },
          { merge: true }
        );
      }
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('community_post', nextParent.id, nextParent);
  }
  await publishDemoSyncRecord('community_reply', replyId, { id: replyId }, true);
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
    const postRef = doc(db, 'community_posts', nextPost.id);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      await setDoc(postRef, nextPost, { merge: true });
      for (const r of allRepliesForPost) {
        const nextAccepted = !isUnmarking && r.id === reply.id;
        if (Boolean(r.isAccepted) !== nextAccepted) {
          const repRef = doc(db, 'community_replies', r.id);
          const repSnap = await getDoc(repRef);
          if (repSnap.exists()) {
            await setDoc(repRef, { ...r, isAccepted: nextAccepted, updatedAt: now }, { merge: true });
          }
        }
      }
    }
    await publishDemoSyncRecord('community_post', nextPost.id, nextPost);
    for (const r of allRepliesForPost) {
      await publishDemoSyncRecord('community_reply', r.id, {
        ...r,
        isAccepted: !isUnmarking && r.id === reply.id,
        updatedAt: now
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'community_posts');
    throw error;
  }
}

// --- EVENT & CARNIVAL BOOKINGS (EventsSection + YouthEventsCalendarModal) ---
const EVENT_BOOKINGS_STORAGE_KEY = 'kbelia_event_bookings_v1';

export function loadLocalEventBookings(userId?: string): EventBooking[] {
  try {
    const raw = localStorage.getItem(EVENT_BOOKINGS_STORAGE_KEY);
    const list: EventBooking[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];
    return userId ? safeList.filter(b => b.userId === userId) : safeList;
  } catch {
    return [];
  }
}

export async function saveEventBookingRecord(
  eventId: string,
  eventTitle: string,
  userId: string,
  userName?: string,
  status: 'booked' | 'cancelled' = 'booked'
): Promise<EventBooking> {
  const safeId = `${userId}__${eventId}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const now = new Date().toISOString();
  const record: EventBooking = {
    id: safeId,
    eventId: eventId.slice(0, 128),
    eventTitle: (eventTitle || 'Acara KBelia').trim().slice(0, 200),
    userId: userId.slice(0, 128),
    ...(userName ? { userName: userName.trim().slice(0, 120) } : {}),
    status,
    createdAt: now,
    updatedAt: now
  };

  try {
    const existing = loadLocalEventBookings();
    const next = [record, ...existing.filter(b => b.id !== safeId)];
    localStorage.setItem(EVENT_BOOKINGS_STORAGE_KEY, JSON.stringify(next));
    // Maintain simple ID array for fast initial render compatibility
    const bookedIds = next.filter(b => b.userId === userId && b.status === 'booked').map(b => b.eventId);
    localStorage.setItem('kbelia_booked_events', JSON.stringify(bookedIds));
  } catch {
    // ignore
  }

  if (isProductionAuthenticated() && auth.currentUser) {
    try {
      await setDoc(doc(db, 'event_bookings', safeId), record, { merge: true });
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('Firestore event booking write notice:', err);
      }
    }
  }

  await publishDemoSyncRecord('event_booking', safeId, record);
  return record;
}

export function subscribeEventBookings(
  userId: string | undefined,
  isAdmin: boolean,
  onUpdate: (bookings: EventBooking[]) => void
): () => void {
  let prodBookings: EventBooking[] = [];
  let demoSyncBookings: EventBooking[] = [];
  let demoSyncDeleted: string[] = [];

  const emit = () => {
    const deleted = [...getDeletedIds(), ...demoSyncDeleted];
    const local = loadLocalEventBookings();
    const merged = mergeUniqueById<EventBooking>([prodBookings, demoSyncBookings, local], deleted);
    const scoped = isAdmin
      ? merged
      : userId
      ? merged.filter(b => b.userId === userId)
      : [];
    onUpdate(scoped);
  };

  emit();

  const unsubCrossTab = subscribeCrossTabSync((entity) => {
    if (entity === 'all' || entity === 'event_booking' || entity === 'deleted') {
      emit();
    }
  });

  let unsubProd = () => {};
  let unsubDemoSync = () => {};

  if (isProductionAuthenticated() && auth.currentUser) {
    const q = isAdmin
      ? collection(db, 'event_bookings')
      : query(collection(db, 'event_bookings'), where('userId', '==', auth.currentUser.uid));
    unsubProd = onSnapshot(
      q,
      (snap) => {
        prodBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventBooking));
        emit();
      },
      (err) => {
        console.debug('Event bookings listener notice:', err?.message || err);
      }
    );
  }

  if (auth.currentUser) {
    unsubDemoSync = subscribeDemoSyncCollection<EventBooking>('event_booking', (items, delIds) => {
      demoSyncBookings = items;
      demoSyncDeleted = delIds;
      emit();
    });
  }

  return () => {
    unsubCrossTab();
    unsubProd();
    unsubDemoSync();
  };
}

export async function deleteEventBookingRecord(bookingId: string): Promise<void> {
  markIdAsDeleted(bookingId);
  try {
    const existing = loadLocalEventBookings();
    localStorage.setItem(
      EVENT_BOOKINGS_STORAGE_KEY,
      JSON.stringify(existing.filter(b => b.id !== bookingId))
    );
  } catch {
    // ignore
  }

  if (isProductionAuthenticated() && auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'event_bookings', bookingId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'event_bookings');
      }
    }
  }
  await publishDemoSyncRecord('event_booking', bookingId, { id: bookingId }, true);
}

// --- ADMIN FULL CRUD HELPERS: BOOKINGS, GRANTS, TICKETS, MENTORS, SESSIONS ---
export async function updateCapsuleBookingRecord(
  booking: Partial<CapsuleBooking> & { slotId: string; applicantName: string; businessName: string }
): Promise<CapsuleBooking> {
  const id = booking.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const full: CapsuleBooking = {
    id,
    slotId: booking.slotId,
    slotCode: booking.slotCode || '',
    slotName: booking.slotName || '',
    hubLocation: booking.hubLocation || 'Hub UMK Kampus Bachok',
    applicantId: booking.applicantId || `admin-entry-${id}`,
    applicantName: booking.applicantName.trim(),
    applicantEmail: (booking.applicantEmail || '').trim(),
    applicantPhone: (booking.applicantPhone || '').trim(),
    applicantMyKad: booking.applicantMyKad,
    businessName: booking.businessName.trim(),
    businessCategory: booking.businessCategory || 'Makanan & Minuman (F&B)',
    durationMonths: Number(booking.durationMonths) || 6,
    startDate: booking.startDate || new Date().toISOString().slice(0, 10),
    monthlyRate: booking.monthlyRate !== undefined ? Number(booking.monthlyRate) : 150,
    pitchNotes: booking.pitchNotes || '',
    status: booking.status || 'pending',
    adminNotes: booking.adminNotes || '',
    tenancySigned: booking.tenancySigned,
    tenancySignedAt: booking.tenancySignedAt,
    tenancySignatureName: booking.tenancySignatureName,
    createdAt: booking.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([full, ...existing.filter(b => b.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('booking', id, full);
  } else {
    try {
      await setDocWithUpdatedAtFallback(doc(db, 'capsule_bookings', id), full, true);
      await publishDemoSyncRecord('booking', id, full);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'capsule_bookings');
      throw error;
    }
  }

  if (full.slotId) {
    if (full.status === 'approved') {
      await updateBookingStatus(
        full.id,
        'approved',
        full.adminNotes || '',
        full.slotId,
        full.businessName,
        full.applicantId,
        full
      );
    } else if (full.status === 'rejected' || full.status === 'cancelled' || full.status === 'pending') {
      const slotList: CapsuleSlot[] = JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      const targetSlot = slotList.find(s => s.id === full.slotId) || INITIAL_CAPSULE_SLOTS.find(s => s.id === full.slotId);
      if (targetSlot && (targetSlot.currentTenantId === full.applicantId || targetSlot.currentTenantBusinessName === full.businessName)) {
        await saveCapsuleSlot({
          ...targetSlot,
          status: 'available',
          currentTenantBusinessName: '',
          currentTenantId: ''
        });
      }
    }
  }

  return full;
}

export async function deleteCapsuleBooking(bookingOrId: CapsuleBooking | string): Promise<void> {
  const bookingId = typeof bookingOrId === 'string' ? bookingOrId : bookingOrId.id;
  const bookingObj = typeof bookingOrId === 'string' ? undefined : bookingOrId;
  markIdAsDeleted(bookingId);

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_bookings';
      const existing: CapsuleBooking[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(b => b.id !== bookingId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('booking', bookingId, { id: bookingId }, true);
  } else {
    try {
      await deleteDoc(doc(db, 'capsule_bookings', bookingId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'capsule_bookings');
      }
    }
    await publishDemoSyncRecord('booking', bookingId, { id: bookingId }, true);
  }

  if (bookingObj?.slotId && bookingObj.status === 'approved') {
    try {
      const slotList: CapsuleSlot[] = JSON.parse(localStorage.getItem('kbelia_demo_slots') || '[]');
      const targetSlot = slotList.find(s => s.id === bookingObj.slotId) || INITIAL_CAPSULE_SLOTS.find(s => s.id === bookingObj.slotId);
      if (targetSlot) {
        await saveCapsuleSlot({
          ...targetSlot,
          status: 'available',
          currentTenantBusinessName: '',
          currentTenantId: ''
        });
      }
    } catch {
      // ignore slot cleanup error
    }
  }
}

export async function updateGrantApplicationRecord(
  grant: Partial<GrantApplication> & { programTitle: string; applicantName: string; businessName: string }
): Promise<GrantApplication> {
  const id = grant.id || `grant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const full: GrantApplication = {
    id,
    programId: grant.programId || '',
    programTitle: grant.programTitle.trim(),
    grantAmount: grant.grantAmount || 'RM3,000',
    amount: grant.amount || grant.grantAmount || 'RM3,000',
    applicantId: grant.applicantId || `admin-entry-${id}`,
    applicantName: grant.applicantName.trim(),
    applicantEmail: (grant.applicantEmail || '').trim(),
    applicantPhone: (grant.applicantPhone || '').trim(),
    businessName: grant.businessName.trim(),
    businessCategory: grant.businessCategory || 'Makanan & Minuman (F&B)',
    district: grant.district || 'Kota Bharu',
    ssmNumber: grant.ssmNumber || '',
    bankName: grant.bankName || 'Maybank',
    bankAccountNumber: grant.bankAccountNumber || '',
    fundPurpose: grant.fundPurpose || '',
    status: grant.status || 'pending',
    adminNotes: grant.adminNotes || '',
    createdAt: grant.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([full, ...existing.filter(g => g.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('grant', id, full);
    return full;
  }

  try {
    await setDocWithUpdatedAtFallback(doc(db, 'grant_applications', id), full, true);
    await publishDemoSyncRecord('grant', id, full);
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'grant_applications');
    throw error;
  }
}

export async function deleteGrantApplication(grantId: string): Promise<void> {
  markIdAsDeleted(grantId);
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_grants';
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(g => g.id !== grantId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('grant', grantId, { id: grantId }, true);
    return;
  }

  try {
    await deleteDoc(doc(db, 'grant_applications', grantId));
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, 'grant_applications');
    }
  }
  await publishDemoSyncRecord('grant', grantId, { id: grantId }, true);
}

export async function saveOrUpdateMaintenanceTicket(
  ticket: Partial<MaintenanceTicket> & {
    slotCode: string;
    kioskName: string;
    reporterName: string;
    description: string;
  }
): Promise<MaintenanceTicket> {
  const id = ticket.id || `MT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();
  const full: MaintenanceTicket = {
    id,
    ownerId: ticket.ownerId || auth.currentUser?.uid || 'admin',
    slotCode: ticket.slotCode.trim().toUpperCase(),
    kioskName: ticket.kioskName.trim(),
    reporterName: ticket.reporterName.trim(),
    reporterPhone: (ticket.reporterPhone || '').trim(),
    issueCategory: ticket.issueCategory || 'Lain-lain',
    description: ticket.description.trim(),
    status: ticket.status || 'received',
    adminNotes: ticket.adminNotes || '',
    createdAt: ticket.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_maintenance_tickets';
      const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([full, ...existing.filter(t => t.id !== id)]));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('ticket', id, full);
    return full;
  }

  try {
    await setDocWithUpdatedAtFallback(doc(db, 'maintenance_tickets', id), full, true);
    await publishDemoSyncRecord('ticket', id, full);
    return full;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'maintenance_tickets');
    throw error;
  }
}

export async function deleteMaintenanceTicket(ticketId: string): Promise<void> {
  markIdAsDeleted(ticketId);
  if (!isProductionAuthenticated()) {
    try {
      const key = 'kbelia_demo_maintenance_tickets';
      const existing: MaintenanceTicket[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(t => t.id !== ticketId)));
    } catch {
      // ignore
    }
    await publishDemoSyncRecord('ticket', ticketId, { id: ticketId }, true);
    return;
  }

  try {
    await deleteDoc(doc(db, 'maintenance_tickets', ticketId));
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, 'maintenance_tickets');
    }
  }
  await publishDemoSyncRecord('ticket', ticketId, { id: ticketId }, true);
}

export async function deleteMentorProfileRecord(mentorId: string): Promise<void> {
  markIdAsDeleted(mentorId);
  try {
    const existing: MentorProfile[] = JSON.parse(localStorage.getItem('kbelia_mentor_profiles') || '[]');
    localStorage.setItem('kbelia_mentor_profiles', JSON.stringify(existing.filter(m => m.id !== mentorId)));
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      await deleteDoc(doc(db, 'mentor_profiles', mentorId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'mentor_profiles');
      }
    }
  }
  await publishDemoSyncRecord('mentor', mentorId, { id: mentorId }, true);
}

export async function deleteMentorshipRegistrationRecord(regId: string): Promise<void> {
  markIdAsDeleted(regId);
  try {
    const existing: MentorshipRegistration[] = JSON.parse(
      localStorage.getItem('kbelia_mentorship_registrations') || '[]'
    );
    localStorage.setItem(
      'kbelia_mentorship_registrations',
      JSON.stringify(existing.filter(r => r.id !== regId))
    );
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      await deleteDoc(doc(db, 'mentor_sessions', regId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'mentor_sessions');
      }
    }
  }
  await publishDemoSyncRecord('session', regId, { id: regId }, true);
}

// --- YOUTH EVENTS CATALOG (Firestore + DemoSync + Cross-Tab Real-Time) ---
const YOUTH_EVENTS_STORAGE_KEY = 'kbelia_youth_events_v1';

export const INITIAL_YOUTH_EVENTS: YouthEvent[] = [
  {
    id: 'evt-1',
    title: 'Karnival Niaga Belia Kelantan (Zon Timur)',
    category: 'karnival',
    date: '11 - 13 Disember 2026',
    time: '10.00 PG - 11.00 MLM',
    district: 'Kota Bharu',
    location: 'Dataran Muhammadi & Perkarangan Stadium Sultan Muhammad IV',
    organizer: 'Pihak Penganjur Belia & Sukan Kelantan',
    boothsAvailable: 8,
    totalBooths: 40,
    fee: 'Percuma (Tajaan Penuh Penganjur)',
    description:
      'Peluang jualan mega terbuka untuk 40 usahawan makanan tradisi, batik kontemporari, dan kraf belia dengan sasaran 20,000 pengunjung.',
    whatsappContact: '601120508890',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'evt-2',
    title: 'Bengkel Pensijilan Halal & Digital Taweez Makanan',
    category: 'bengkel',
    date: '22 Januari 2027',
    time: '9.00 PG - 4.30 PTG',
    district: 'Bachok',
    location: 'Dewan Keusahawanan Kampus UMK Bachok',
    organizer: 'Institut Penyelidikan & Pengurusan Halal (IHRAM) UMK',
    boothsAvailable: 15,
    totalBooths: 60,
    fee: 'RM30 (Sijil & Modul)',
    description:
      'Panduan langkah demi langkah memohon sijil Halal JAKIM untuk premis makanan, kiosk kapsul, dan produk bungkusan sejuk beku.',
    whatsappContact: '60199887766',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'evt-3',
    title: 'Hari Terbuka Pemadanan Pelabur & Demo Day Belia',
    category: 'pitching',
    date: '14 Februari 2027',
    time: '9.30 PG - 1.00 PTG',
    district: 'Kota Bharu',
    location: 'Auditorium Hab Digital KB Cyber, Kota Bharu',
    organizer: 'Pusat Keusahawanan Universiti Malaysia Kelantan (UMK)',
    boothsAvailable: 4,
    totalBooths: 12,
    fee: 'Percuma (Atas Jemputan)',
    description:
      'Sesi pembentangan 5-minit pitch di hadapan panel geran permulaan MARA, TEKUN, dan pelabur untuk pembiayaan sehingga RM50,000.',
    whatsappContact: '60133445566',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'cal-2',
    title: 'Festival Seni Batik, Kraf & Songket Tradisi Pantai Timur',
    category: 'expo',
    date: '15 - 17 Januari 2027',
    time: '10.00 PG - 10.00 MLM',
    district: 'Kota Bharu',
    location: 'Pusat Kraftangan Pantai Cahaya Bulan (PCB), Kota Bharu',
    organizer: 'Perbadanan Kemajuan Iktisad Negeri Kelantan (PKINK)',
    boothsAvailable: 8,
    totalBooths: 35,
    fee: 'RM50 (Deposit Tapak)',
    description:
      'Pameran fesyen belia, bengkel canting batik percuma dan jualan langsung produk seni kraf tempatan.',
    whatsappContact: '601120508890',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'cal-3',
    title: 'Ekspo Agropreneur Belia Gua Musang & Jeli',
    category: 'expo',
    date: '12 - 13 Februari 2027',
    time: '8.30 PG - 6.00 PTG',
    district: 'Gua Musang',
    location: 'Dewan Sivik Gua Musang',
    organizer: 'Fakulti Agro Sains UMK Jeli & KESEDAR',
    boothsAvailable: 20,
    totalBooths: 50,
    fee: 'Kemasukan Percuma',
    description:
      'Pameran dron pertanian, jualan anak benih madu kelulut & teknologi baja moden untuk usahawan agro belia.',
    whatsappContact: '60145556677',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  }
];

export function loadLocalYouthEvents(): YouthEvent[] {
  try {
    const raw = localStorage.getItem(YOUTH_EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveYouthEventRecord(
  eventData: Partial<YouthEvent> & { title: string; category: YouthEvent['category'] }
): Promise<YouthEvent> {
  const id = eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const full: YouthEvent = {
    id,
    title: eventData.title.trim().slice(0, 200),
    category: eventData.category || 'karnival',
    date: (eventData.date || 'Akan Diumumkan').trim().slice(0, 100),
    time: (eventData.time || '9.00 PG - 5.00 PTG').trim().slice(0, 100),
    district: eventData.district || 'Kota Bharu',
    location: (eventData.location || 'Kota Bharu, Kelantan').trim().slice(0, 200),
    organizer: (eventData.organizer || 'Pihak Penganjur KBelia Kelantan').trim().slice(0, 150),
    boothsAvailable: Math.max(0, Number(eventData.boothsAvailable) || 0),
    totalBooths: Math.max(1, Number(eventData.totalBooths) || 20),
    fee: (eventData.fee || 'Percuma').trim().slice(0, 100),
    description: (eventData.description || '').trim().slice(0, 2000),
    whatsappContact: (eventData.whatsappContact || '601120508890').trim().slice(0, 30),
    ...(eventData.imageUrl ? { imageUrl: eventData.imageUrl.slice(0, 900000) } : {}),
    createdAt: eventData.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(id);

  try {
    const existing = loadLocalYouthEvents();
    localStorage.setItem(YOUTH_EVENTS_STORAGE_KEY, JSON.stringify([full, ...existing.filter(e => e.id !== id)]));
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      await setDocWithUpdatedAtFallback(doc(db, 'youth_events', id), full, true);
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, 'youth_events');
        throw error;
      }
    }
  }

  await publishDemoSyncRecord('event', id, full);
  return full;
}

export async function deleteYouthEventRecord(eventId: string): Promise<void> {
  markIdAsDeleted(eventId);
  try {
    const existing = loadLocalYouthEvents();
    localStorage.setItem(YOUTH_EVENTS_STORAGE_KEY, JSON.stringify(existing.filter(e => e.id !== eventId)));
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      await deleteDoc(doc(db, 'youth_events', eventId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'youth_events');
      }
    }
  }
  await publishDemoSyncRecord('event', eventId, { id: eventId }, true);
}

export function subscribeYouthEvents(onUpdate: (events: YouthEvent[]) => void): () => void {
  let prodEvents: YouthEvent[] = [];
  let demoSyncEvents: YouthEvent[] = [];
  let demoSyncDeleted: string[] = [];

  const emit = () => {
    const deleted = [...getDeletedIds(), ...demoSyncDeleted];
    const local = loadLocalYouthEvents();
    const prodAuth = isProductionAuthenticated();
    const priority = prodAuth
      ? [prodEvents, demoSyncEvents, local, INITIAL_YOUTH_EVENTS]
      : [demoSyncEvents, local, prodEvents, INITIAL_YOUTH_EVENTS];
    onUpdate(mergeUniqueById<YouthEvent>(priority, deleted));
  };

  emit();

  const unsubCrossTab = subscribeCrossTabSync((entity) => {
    if (entity === 'all' || entity === 'event' || entity === 'deleted') {
      emit();
    }
  });

  const unsubProd = onSnapshot(
    collection(db, 'youth_events'),
    (snap) => {
      prodEvents = snap.docs.map(d => ({ id: d.id, ...d.data() } as YouthEvent));
      emit();
    },
    (err) => {
      console.debug('Youth events listener notice:', err?.message || err);
    }
  );

  let unsubDemoSync = () => {};
  if (auth.currentUser) {
    unsubDemoSync = subscribeDemoSyncCollection<YouthEvent>('event', (items, delIds) => {
      demoSyncEvents = items;
      demoSyncDeleted = delIds;
      emit();
    });
  }

  return () => {
    unsubCrossTab();
    unsubProd();
    unsubDemoSync();
  };
}

// --- PORTAL USER ACCOUNTS DIRECTORY (ADMIN FULL CRUD) ---
const PORTAL_USERS_STORAGE_KEY = 'kbelia_portal_users_v1';
const REGISTERED_USERS_STORAGE_KEY = 'kbelia_registered_users_v2';

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    userId: 'admin-nabil-01',
    fullName: 'Nabil Wahab (Pentadbir KBelia)',
    email: 'nabilwahab03020302@gmail.com',
    role: 'admin',
    phone: '+60199001122',
    district: 'Kota Bharu',
    designation: 'Pentadbir Utama Portal',
    avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'admin-urusetia-02',
    fullName: 'Pegawai Admin KBelia Kelantan',
    email: 'urusetia@kbelia.kelantan.gov.my',
    role: 'admin',
    phone: '+6097481000',
    district: 'Kota Bharu',
    designation: 'Pegawai Penyelaras Negeri',
    avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'demo-tenant-1',
    fullName: 'Ahmad Faizul Bin Razak',
    email: 'faizul.artisan@gmail.com',
    role: 'user',
    phone: '+601123456789',
    district: 'Bachok',
    businessName: "D'Kelate Artisan Coffee & Pastry",
    ssmNumber: '202303123456 (TR0234123-X)',
    avatarUrl: '/assets/generated/avatar_youth_male_1793924250192.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'demo-tenant-2',
    fullName: 'Nur Syafiqah Binti Zakaria',
    email: 'syafiqah.batik@gmail.com',
    role: 'user',
    phone: '+60198765432',
    district: 'Kota Bharu',
    businessName: 'Batik Belia Kontemporari',
    ssmNumber: '202403987654 (KT0192837-W)',
    avatarUrl: '/assets/generated/avatar_youth_female_1793924250745.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'demo-tenant-3',
    fullName: 'Muhammad Harith Bin Yusoff',
    email: 'harith.multimedia@gmail.com',
    role: 'user',
    phone: '+60139988776',
    district: 'Kota Bharu',
    businessName: 'Studio Belia Multimedia KB',
    ssmNumber: '202403445566 (KT0298112-D)',
    avatarUrl: '/assets/generated/avatar_youth_male_1793924250192.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'user-mentor-1',
    fullName: 'Prof. Madya Dr. Wan Azhar',
    email: 'wanazhar@umk.edu.my',
    role: 'mentor',
    mentorId: 'mentor-1',
    phone: '60199887711',
    district: 'Kota Bharu',
    institution: 'Universiti Malaysia Kelantan (UMK)',
    avatarUrl: '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'user-mentor-2',
    fullName: 'Puan Siti Aminah Binti Yusof',
    email: 'sitiaminah.coach@insken.gov.my',
    role: 'mentor',
    mentorId: 'mentor-2',
    phone: '60129876543',
    district: 'Kota Bharu',
    institution: 'INSKEN Kelantan',
    avatarUrl: '/assets/generated/usahawan_belia_wanita.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'user-mentor-3',
    fullName: 'En. Khairul Hafiz Bin Razali, CA',
    email: 'khairul.audit@smeadvisor.my',
    role: 'mentor',
    mentorId: 'mentor-3',
    phone: '60139123456',
    district: 'Kota Bharu',
    institution: 'SME Corp / Penasihat Akaun',
    avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    userId: 'user-mentor-4',
    fullName: 'Ts. Dr. Norazila Binti Mat Deris',
    email: 'norazila.fiat@umk.edu.my',
    role: 'mentor',
    mentorId: 'mentor-4',
    phone: '60145556677',
    district: 'Jeli',
    institution: 'UMK Kampus Jeli',
    avatarUrl: '/assets/generated/avatar_youth_female_1793924250745.jpg',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  }
];

function loadRegisteredAccountsAsProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map((u: any) => ({
      userId: u.userId,
      fullName: u.fullName || 'Pengguna Berdaftar',
      email: u.email || '',
      role: (u.role || 'user') as UserProfile['role'],
      phone: u.phone || '',
      district: u.district || 'Kota Bharu',
      businessName: u.businessName || '',
      avatarUrl: u.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt
    }));
  } catch {
    return [];
  }
}

export function loadLocalPortalUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(PORTAL_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function buildSanitizedFirestoreUser(profile: UserProfile): Record<string, any> {
  const allowedKeys: (keyof UserProfile)[] = [
    'userId', 'fullName', 'email', 'phone', 'whatsapp', 'district', 'role', 'mentorId',
    'avatarUrl', 'logoUrl', 'icNumber', 'businessName', 'category', 'ssmNumber', 'ssmStatus',
    'businessStage', 'businessHours', 'businessAddress', 'businessStatus', 'facebook',
    'instagram', 'tiktok', 'bankName', 'bankAccountNumber', 'bankAccountHolder',
    'notifyWhatsApp', 'notifyEmail', 'hidePhonePublic', 'department', 'expertise',
    'designation', 'institution', 'createdAt', 'updatedAt'
  ];
  const out: Record<string, any> = {};
  for (const k of allowedKeys) {
    const v = profile[k];
    if (v !== undefined && v !== '') {
      out[k] = v;
    }
  }
  return out;
}

export async function savePortalUserRecord(
  profile: Partial<UserProfile> & { fullName: string; email: string; role: UserProfile['role'] }
): Promise<UserProfile> {
  const userId = profile.userId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const full: UserProfile = {
    ...profile,
    userId,
    fullName: profile.fullName.trim().slice(0, 120),
    email: profile.email.trim().toLowerCase().slice(0, 120),
    role: profile.role || 'user',
    phone: (profile.phone || '').trim().slice(0, 30),
    district: (profile.district || 'Kota Bharu').trim().slice(0, 50),
    businessName: (profile.businessName || '').trim().slice(0, 150),
    ssmNumber: (profile.ssmNumber || '').trim().slice(0, 50),
    avatarUrl: profile.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg',
    createdAt: profile.createdAt || now,
    updatedAt: now
  };

  unmarkIdAsDeleted(userId);

  try {
    const existing = loadLocalPortalUsers();
    localStorage.setItem(PORTAL_USERS_STORAGE_KEY, JSON.stringify([full, ...existing.filter(u => u.userId !== userId)]));
    const regRaw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      if (Array.isArray(regList)) {
        const updatedReg = regList.map((r: any) =>
          r.userId === userId
            ? {
                ...r,
                fullName: full.fullName,
                email: full.email,
                phone: full.phone,
                district: full.district,
                businessName: full.businessName,
                role: full.role,
                updatedAt: now
              }
            : r
        );
        localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(updatedReg));
      }
    }
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      const firestorePayload = buildSanitizedFirestoreUser(full);
      await setDocWithUpdatedAtFallback(doc(db, 'users', userId), firestorePayload, true);
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, 'users');
        throw error;
      }
    }
  }

  await publishDemoSyncRecord('user_account', userId, { ...full, id: userId });
  return full;
}

export async function deletePortalUserRecord(userId: string): Promise<void> {
  markIdAsDeleted(userId);

  try {
    const existing = loadLocalPortalUsers();
    localStorage.setItem(PORTAL_USERS_STORAGE_KEY, JSON.stringify(existing.filter(u => u.userId !== userId)));
    const regRaw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      if (Array.isArray(regList)) {
        localStorage.setItem(
          REGISTERED_USERS_STORAGE_KEY,
          JSON.stringify(regList.filter((r: any) => r.userId !== userId))
        );
      }
    }
  } catch {
    // ignore
  }

  if (isProductionAuthenticated()) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.DELETE, 'users');
      }
    }
  }

  await publishDemoSyncRecord('user_account', userId, { id: userId, userId }, true);
}

export function subscribePortalUsers(
  isAdmin: boolean,
  onUpdate: (users: UserProfile[]) => void
): () => void {
  if (!isAdmin) {
    onUpdate([]);
    return () => {};
  }

  let prodUsers: (UserProfile & { id: string })[] = [];
  let demoSyncUsers: (UserProfile & { id: string })[] = [];
  let demoSyncDeleted: string[] = [];

  const withId = (u: UserProfile): UserProfile & { id: string } => ({
    ...u,
    id: u.userId
  });

  const emit = () => {
    const deleted = [...getDeletedIds(), ...demoSyncDeleted];
    const localSaved = loadLocalPortalUsers().map(withId);
    const registered = loadRegisteredAccountsAsProfiles().map(withId);
    const fallbackDemo = INITIAL_DEMO_USERS.map(withId);
    const prodAuth = isProductionAuthenticated();
    const priority = prodAuth
      ? [prodUsers, demoSyncUsers, localSaved, registered, fallbackDemo]
      : [demoSyncUsers, localSaved, registered, prodUsers, fallbackDemo];
    const merged = mergeUniqueById<UserProfile & { id: string }>(priority, deleted);
    onUpdate(merged.map(({ id: _id, ...rest }) => rest as UserProfile));
  };

  emit();

  const unsubCrossTab = subscribeCrossTabSync((entity) => {
    if (entity === 'all' || entity === 'user_account' || entity === 'deleted') {
      emit();
    }
  });

  let unsubProd = () => {};
  if (isProductionAuthenticated() && auth.currentUser) {
    unsubProd = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        prodUsers = snap.docs.map(d => {
          const data = d.data() as UserProfile;
          return { ...data, userId: data.userId || d.id, id: data.userId || d.id };
        });
        emit();
      },
      (err) => {
        console.debug('Portal users listener notice:', err?.message || err);
      }
    );
  }

  let unsubDemoSync = () => {};
  if (auth.currentUser) {
    unsubDemoSync = subscribeDemoSyncCollection<UserProfile & { id: string }>(
      'user_account',
      (items, delIds) => {
        demoSyncUsers = items.map(u => ({ ...u, userId: u.userId || u.id, id: u.userId || u.id }));
        demoSyncDeleted = delIds;
        emit();
      }
    );
  }

  return () => {
    unsubCrossTab();
    unsubProd();
    unsubDemoSync();
  };
}

