import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  BusinessListing, 
  CapsuleBooking, 
  CapsuleSlot, 
  GrantApplication,
  ProductItem, 
  YouthProgram 
} from '../types';
import { 
  INITIAL_BUSINESSES, 
  INITIAL_CAPSULE_SLOTS, 
  INITIAL_PRODUCTS, 
  INITIAL_PROGRAMS 
} from '../data/seedData';

// Local Cache helpers for instant UI feedback and fallback
const CACHE_KEYS = {
  BUSINESSES: 'kbelia_businesses_cache',
  SLOTS: 'kbelia_slots_cache',
  PROGRAMS: 'kbelia_programs_cache',
  PRODUCTS: 'kbelia_products_cache',
  BOOKINGS: 'kbelia_bookings_cache',
  DELETED_IDS: 'kbelia_deleted_ids'
};

export function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.DELETED_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
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

// --- SEED INITIAL DATA IF EMPTY ---
export async function seedInitialData() {
  try {
    // Clear soft-deleted records list when resetting/seeding
    localStorage.removeItem(CACHE_KEYS.DELETED_IDS);

    // 1. Seed Slots
    for (const slot of INITIAL_CAPSULE_SLOTS) {
      const slotRef = doc(db, 'capsule_slots', slot.id);
      await setDoc(slotRef, slot, { merge: true });
    }

    // 2. Seed Businesses
    for (const biz of INITIAL_BUSINESSES) {
      const bizRef = doc(db, 'businesses', biz.id);
      await setDoc(bizRef, biz, { merge: true });
    }

    // 3. Seed Products
    for (const prod of INITIAL_PRODUCTS) {
      const prodRef = doc(db, 'products', prod.id);
      await setDoc(prodRef, prod, { merge: true });
    }

    // 4. Seed Programs
    for (const prog of INITIAL_PROGRAMS) {
      const progRef = doc(db, 'programs', prog.id);
      await setDoc(progRef, prog, { merge: true });
    }

    console.log('Seed data successfully initialized.');
    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    return false;
  }
}

// --- BOOKINGS ---
export async function createCapsuleBooking(booking: Omit<CapsuleBooking, 'id' | 'createdAt' | 'status'> & { id?: string }) {
  const id = booking.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'capsule_bookings';
  try {
    const bookingData: CapsuleBooking = {
      ...booking,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
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
  try {
    await setDoc(doc(db, path, bookingId), {
      status,
      adminNotes: adminNotes || (status === 'approved' ? 'Permohonan diluluskan. Sila hadir ke pejabat pentadbiran untuk penyerahan kunci.' : 'Permohonan ditolak.'),
    }, { merge: true });

    // If approved, update the slot status and tenant
    if (status === 'approved' && slotId) {
      await setDoc(doc(db, 'capsule_slots', slotId), {
        status: 'occupied',
        currentTenantBusinessName: businessName || 'Usahawan Belia',
        currentTenantId: applicantId || ''
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// --- BUSINESS LISTINGS ---
export async function saveBusinessListing(business: Partial<BusinessListing> & { id?: string; ownerId: string }) {
  const id = business.id || `biz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'businesses';
  try {
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
      logoUrl: business.logoUrl || '/src/assets/images/product_kelantan_delights_1793924253401.jpg',
      bannerUrl: business.bannerUrl || '/src/assets/images/banner_kelantan_landmark_1793924253242.jpg',
      isApproved: business.isApproved ?? true,
      isFeatured: business.isFeatured ?? false,
      capsuleSlotId: business.capsuleSlotId || '',
      rating: business.rating || 5.0,
      reviewsCount: business.reviewsCount || 1,
      createdAt: business.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), fullData, { merge: true });
    return fullData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteBusinessListing(businessId: string) {
  markIdAsDeleted(businessId);
  const path = 'businesses';
  try {
    await deleteDoc(doc(db, path, businessId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- PRODUCTS ---
export async function saveProduct(product: Partial<ProductItem> & { businessId: string; ownerId: string }) {
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'products';
  try {
    const fullProduct: ProductItem = {
      id,
      businessId: product.businessId,
      ownerId: product.ownerId,
      name: product.name || 'Produk',
      price: product.price || 0,
      description: product.description || '',
      category: product.category || 'Umum',
      imageUrl: product.imageUrl || '/src/assets/images/product_kelantan_delights_1793924253401.jpg',
      inStock: product.inStock ?? true,
      createdAt: product.createdAt || new Date().toISOString()
    };
    await setDoc(doc(db, path, id), fullProduct, { merge: true });
    return fullProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  markIdAsDeleted(productId);
  const path = 'products';
  try {
    await deleteDoc(doc(db, path, productId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- CAPSULE SLOTS (ADMIN) ---
export async function saveCapsuleSlot(slot: Partial<CapsuleSlot> & { code: string; name: string }) {
  const id = slot.id || `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'capsule_slots';
  try {
    const fullSlot: CapsuleSlot = {
      id,
      code: slot.code,
      name: slot.name,
      hubLocation: slot.hubLocation || 'Hub UMK Bachok',
      district: slot.district || 'Bachok',
      size: slot.size || '10ft x 10ft Smart Pod',
      monthlyRate: Number(slot.monthlyRate) || 150,
      dailyRate: Number(slot.dailyRate) || 15,
      status: slot.status || 'available',
      amenities: slot.amenities || ['Palam Elektrik', 'WiFi 500Mbps', 'Rak Display'],
      currentTenantBusinessName: slot.currentTenantBusinessName || '',
      currentTenantId: slot.currentTenantId || '',
      imageUrl: slot.imageUrl || '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg',
      createdAt: slot.createdAt || new Date().toISOString()
    };
    await setDoc(doc(db, path, id), fullSlot, { merge: true });
    return fullSlot;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteCapsuleSlot(slotId: string) {
  markIdAsDeleted(slotId);
  const path = 'capsule_slots';
  try {
    await deleteDoc(doc(db, path, slotId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- PROGRAMS (ADMIN) ---
export async function saveProgram(program: Partial<YouthProgram> & { title: string; category: YouthProgram['category'] }) {
  const id = program.id || `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'programs';
  try {
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
    await setDoc(doc(db, path, id), fullProgram, { merge: true });
    return fullProgram;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProgram(programId: string) {
  markIdAsDeleted(programId);
  const path = 'programs';
  try {
    await deleteDoc(doc(db, path, programId));
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

// --- GRANT APPLICATIONS ---
export async function createGrantApplication(grant: Omit<GrantApplication, 'id' | 'createdAt' | 'status'> & { id?: string }) {
  const id = grant.id || `grant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = 'grant_applications';
  try {
    const grantData: GrantApplication = {
      ...grant,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, path, id), grantData);
    
    // Update local cache
    try {
      const existingRaw = localStorage.getItem('kbelia_grants_cache');
      const existing: GrantApplication[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('kbelia_grants_cache', JSON.stringify([grantData, ...existing.filter(g => g.id !== id)]));
    } catch (e) {
      // ignore
    }
    
    return grantData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function fetchGrantApplications(): Promise<GrantApplication[]> {
  const path = 'grant_applications';
  try {
    const snap = await getDocs(collection(db, path));
    const items: GrantApplication[] = [];
    snap.forEach((doc) => {
      items.push(doc.data() as GrantApplication);
    });
    localStorage.setItem('kbelia_grants_cache', JSON.stringify(items));
    return items;
  } catch (error) {
    try {
      const cached = localStorage.getItem('kbelia_grants_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // ignore
    }
    return [];
  }
}

export async function updateGrantApplicationStatus(
  grantId: string, 
  status: 'approved' | 'rejected', 
  adminNotes?: string
) {
  const path = 'grant_applications';
  try {
    await setDoc(doc(db, path, grantId), {
      status,
      adminNotes: adminNotes || (status === 'approved' ? 'Permohonan geran diluluskan oleh Urusetia KBELIA.' : 'Permohonan ditolak.')
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}
