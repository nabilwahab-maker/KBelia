export type UserRole = 'user' | 'admin' | 'mentor';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  district?: string;
  role: UserRole;
  mentorId?: string;
  avatarUrl?: string;
  logoUrl?: string;
  icNumber?: string;
  businessName?: string;
  category?: BusinessCategory;
  ssmNumber?: string;
  ssmStatus?: 'registered' | 'in_progress' | 'not_registered';
  businessStage?: 'idea' | 'startup' | 'growth';
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  businessHours?: string;
  businessAddress?: string;
  notifyWhatsApp?: boolean;
  notifyEmail?: boolean;
  hidePhonePublic?: boolean;
  businessStatus?: 'active' | 'temporary_closed';
  department?: string;
  expertise?: string;
  designation?: string;
  institution?: string;
  createdAt?: string;
}

export type BusinessCategory = 
  | 'Makanan & Minuman (F&B)'
  | 'Fesyen, Batik & Kraf Kelantan'
  | 'Teknologi & Servis Digital'
  | 'Kecantikan & Kesihatan'
  | 'Pertanian & Agrotek'
  | 'Runcit & Gaya Hidup';

export type KelantanDistrict = 
  | 'Semua Jajahan'
  | 'Kota Bharu'
  | 'Bachok'
  | 'Pasir Mas'
  | 'Tumpat'
  | 'Tanah Merah'
  | 'Machang'
  | 'Pasir Puteh'
  | 'Kuala Krai'
  | 'Gua Musang'
  | 'Jeli';

export interface BusinessListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessName: string;
  tagline: string;
  category: BusinessCategory;
  district: KelantanDistrict;
  description: string;
  ssmNumber?: string;
  whatsapp: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  businessHours?: string;
  businessAddress?: string;
  isApproved: boolean;
  isFeatured: boolean;
  capsuleSlotId?: string;
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
}

export type SlotStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface CapsuleSlot {
  id: string;
  code: string; // e.g. 'CAP-KB-01', 'CAP-UMK-04'
  name: string;
  hubLocation: string; // e.g. 'Hub Kapsul UMK Bachok', 'Hub Belia KB Sentral', 'Hub Digital Jeli'
  district: KelantanDistrict;
  size: string; // e.g. '8ft x 8ft Kiosk', '10ft x 10ft Smart Pod'
  monthlyRate: number; // RM
  dailyRate: number; // RM
  status: SlotStatus;
  amenities: string[]; // e.g. ['Elektrik & Palam', 'High-Speed WiFi', 'Sistem POS Bersepadu', 'Rak Display Bertingkat', 'Kunci Digital Pintar']
  currentTenantBusinessName?: string;
  currentTenantId?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface CapsuleBooking {
  id: string;
  slotId: string;
  slotCode: string;
  slotName: string;
  hubLocation: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantMyKad?: string;
  businessName: string;
  businessCategory: BusinessCategory;
  durationMonths: number;
  startDate: string;
  monthlyRate?: number;
  pitchNotes: string;
  status: BookingStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  businessId: string;
  ownerId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
  createdAt: string;
}

export interface YouthProgram {
  id: string;
  title: string;
  category: 'Geran & Dana' | 'Bengkel & Latihan' | 'Pameran & Ekspo' | 'Pitching & Inkubasi';
  date: string;
  location: string;
  description: string;
  organizer: string;
  grantAmount?: string;
  registrationLink?: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface GrantApplication {
  id: string;
  programId?: string;
  programTitle: string;
  grantAmount: string;
  amount?: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  businessCategory: BusinessCategory;
  ssmNumber?: string;
  bankName: string;
  bankAccountNumber: string;
  fundPurpose: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export interface DistrictSummary {
  district: KelantanDistrict;
  code: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  hubCount: number;
  featuredHub: string;
  popularNiche: string;
  centerCoords: { x: number; y: number };
}

export interface KioskDailySale {
  id: string;
  date: string;
  cashSales: number;
  qrSales: number;
  expenses: number;
  notes?: string;
  createdAt: string;
}

export interface B2BListing {
  id: string;
  authorName: string;
  authorBusiness: string;
  district: KelantanDistrict;
  type: 'supply' | 'demand';
  title: string;
  description: string;
  whatsapp: string;
  date: string;
}

export interface MaintenanceTicket {
  id: string;
  slotCode: string;
  kioskName: string;
  reporterName: string;
  reporterPhone: string;
  issueCategory: 'Elektrik & Suis' | 'Paip & Air' | 'Pintu & Kunci' | 'Struktur & Bumbung' | 'Lain-lain';
  description: string;
  status: 'received' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  agency: string;
  expertise: string[];
  avatarUrl?: string;
  email: string;
  phone: string;
  bio: string;
  availableDays: string;
  activeMenteesCount?: number;
  pin?: string;
  lastActive?: string;
}

export interface MentorshipRegistration {
  id: string;
  mentorId: string;
  mentorName: string;
  entrepreneurName: string;
  entrepreneurPhone: string;
  entrepreneurEmail: string;
  businessName: string;
  district: KelantanDistrict;
  businessCategory: string;
  topic: string;
  challenges?: string;
  preferredDate: string;
  preferredTime: string;
  mode: 'Bersemuka di Kampus' | 'Google Meet Maya';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  mentorActionPlan?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface MentorSession {
  id: string;
  mentorId?: string;
  mentorName: string;
  role: string;
  expertise: string;
  date: string;
  time: string;
  mode: 'Bersemuka di Kampus' | 'Google Meet Maya';
  status: 'open' | 'booked';
  bookedBy?: string;
  bookedPhone?: string;
}

export interface YouthNotification {
  id: string;
  title: string;
  message: string;
  category: 'status' | 'announcement' | 'reminder';
  sender?: string;
  senderRole?: 'admin' | 'mentor' | 'system';
  targetRole?: 'youth' | 'mentor' | 'admin' | 'all';
  timestamp: string;
  isRead: boolean;
  actionTab?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  merchantBusinessName?: string;
  merchantWhatsApp?: string;
}

export type MerchantSubTab = 
  | 'overview'   // Ringkasan Eksekutif
  | 'profile'    // Profil Perniagaan
  | 'products'   // Katalog Produk
  | 'bookings'   // Permohonan Kapsul
  | 'cashflow'   // Buku Tunai Jualan
  | 'vault'      // Buat Dokumen Sah
  | 'card';      // Kad Digital WhatsApp Link

export type AdminSubTab = 
  | 'queue'       // Giliran Kelulusan
  | 'bookings'    // Permohonan Kapsul
  | 'businesses'  // Direktori Usahawan
  | 'slots'       // Pengurusan Kapsul
  | 'programs'    // Geran & Inisiatif
  | 'mentors'     // Bimbingan Mentor
  | 'sync'        // Segerak Pangkalan Data
  | 'settings';   // Tetapan Operasi

export type MentorSubTab = 
  | 'overview'       // Ringkasan Dashboard Eksekutif Mentor
  | 'sessions'       // Sesi Bimbingan Mentee
  | 'endorsements'   // Perakuan Rasmi Geran Belia
  | 'logbook'        // Log Jurnal Minit & Pelan Tindakan
  | 'profile';       // Profil & Waktu Bimbingan

export interface GrantEndorsementLetter {
  id: string;
  endorsementCode: string; // e.g. 'PERAKUAN-UMK-2026-0814'
  mentorId: string;
  mentorName: string;
  mentorAgency: string;
  mentorDesignation?: string;
  menteeId: string;
  menteeName: string;
  menteePhone?: string;
  businessName: string;
  businessCategory: string;
  district: KelantanDistrict;
  recommendedAmount: 'RM3,000' | 'RM5,000' | 'RM10,000';
  grantProgramTitle: string;
  justification: string;
  businessReadinessRemark: string;
  issuedAt: string;
  status: 'active' | 'revoked';
}

export type GrantEndorsement = GrantEndorsementLetter;

export interface MentoringLogEntry {
  id: string;
  mentorId: string;
  menteeName: string;
  businessName: string;
  sessionDate: string;
  topic: string;
  minutes: string;
  actionItems: { id: string; task: string; completed: boolean; dueDate: string }[];
  createdAt: string;
}

