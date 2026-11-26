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
  passwordHash?: string;
  passwordUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BusinessCategory = 
  | 'Makanan & Minuman (F&B)'
  | 'Fesyen, Batik & Kraf Kelantan'
  | 'Teknologi & Servis Digital'
  | 'Kecantikan & Kesihatan'
  | 'Pertanian & Agrotek'
  | 'Runcit & Gaya Hidup';

export function formatBusinessCategory(category?: string): string {
  if (!category) return 'Makanan & Minuman';
  return category === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : category;
}

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
  createdAt: string;
  updatedAt?: string;
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
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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
  tenancySigned?: boolean;
  tenancySignedAt?: string;
  tenancySignatureName?: string;
  createdAt: string;
  updatedAt?: string;
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
  updatedAt?: string;
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
  imageUrl?: string;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
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
  district?: string;
  ssmNumber?: string;
  bankName: string;
  bankAccountNumber: string;
  fundPurpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminNotes?: string;
  mentorEndorsed?: boolean;
  endorsedByMentorId?: string;
  endorsedByMentorName?: string;
  endorsementId?: string;
  endorsementCode?: string;
  mentorEndorsedAt?: string;
  mentorSupportNotes?: string;
  createdAt: string;
  updatedAt?: string;
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
  ownerId?: string;
  businessName?: string;
  date: string;
  cashSales: number;
  qrSales: number;
  expenses: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface B2BListing {
  id: string;
  ownerId?: string;
  authorName: string;
  authorBusiness: string;
  district: KelantanDistrict;
  type: 'supply' | 'demand';
  title: string;
  description: string;
  whatsapp: string;
  imageUrl?: string;
  date: string;
  updatedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  ownerId?: string;
  slotCode: string;
  kioskName: string;
  reporterName: string;
  reporterPhone: string;
  issueCategory: 'Elektrik & Suis' | 'Paip & Air' | 'Pintu & Kunci' | 'Struktur & Bumbung' | 'Lain-lain';
  description: string;
  status: 'received' | 'in_progress' | 'resolved';
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MentorshipMode = 'Bersemuka di Kampus' | 'Google Meet' | 'Google Meet Maya';

export const normalizeMentorshipMode = (mode?: string): 'Bersemuka di Kampus' | 'Google Meet' => {
  if (!mode) return 'Bersemuka di Kampus';
  const lower = mode.toLowerCase();
  if (lower.includes('google meet') || lower.includes('maya')) return 'Google Meet';
  return 'Bersemuka di Kampus';
};

export interface PublishedMentorSlot {
  id: string;
  date: string;
  time: string;
  mode: MentorshipMode;
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
  publishedSlots?: PublishedMentorSlot[];
  activeMenteesCount?: number;
  pin?: string;
  lastActive?: string;
  updatedAt?: string;
}

export interface MentorshipRegistration {
  id: string;
  applicantId?: string;
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
  mode: MentorshipMode;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  mentorActionPlan?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MentorSession {
  id: string;
  mentorId?: string;
  mentorName: string;
  role: string;
  expertise: string;
  date: string;
  time: string;
  mode: MentorshipMode;
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
  senderRole?: 'admin' | 'mentor' | 'user' | 'system';
  targetRole?: 'youth' | 'mentor' | 'admin' | 'all';
  targetUserId?: string;
  timestamp: string;
  isRead: boolean;
  actionTab?: string;
  updatedAt?: string;
}

export interface PortalSettings {
  id: string;
  adminOfficerName?: string;
  adminHelpdeskPhone?: string;
  portalSubsidyRate: number;
  maxLeaseDurationMonths: number;
  systemStatus: 'operational' | 'maintenance';
  portalAnnouncement: string;
  updatedAt?: string;
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
  | 'events'      // Acara & Tempahan Karnival
  | 'users'       // Urus Pengguna Portal
  | 'news'        // Pengurusan Berita Rasmi
  | 'b2b'         // Ruang Niaga & Iklan Bergambar
  | 'sync'        // Segerak Pangkalan Data
  | 'settings';   // Tetapan Operasi

export type MentorSubTab = 
  | 'overview'       // Ringkasan Dashboard Eksekutif Mentor
  | 'sessions'       // Sesi Bimbingan Mentee
  | 'mentees'        // Senarai Mentee
  | 'schedule'       // Kalendar Jadual & Slot Bimbingan Mentor
  | 'readiness'      // Semak Geran
  | 'endorsements'   // Perakuan Rasmi Geran Belia
  | 'logbook'        // Log Jurnal Minit & Pelan Tindakan
  | 'impact'         // Laporan Ringkas
  | 'profile';       // Profil Mentor

export interface MenteeGrantCheck {
  id: string;
  mentorId: string;
  menteeKey: string;
  menteeName: string;
  businessName: string;
  district: KelantanDistrict | string;
  hasSsm: boolean;
  hasSalesRecord: boolean;
  attendedSession: boolean;
  productReady: boolean;
  notes?: string;
  updatedAt: string;
}

export type NewsCategory =
  | 'Pengumuman'
  | 'Geran & Dana'
  | 'Program & Acara'
  | 'Kapsul Niaga'
  | 'Info Terkini';

export type NewsStatus = 'published' | 'draft';

export interface PortalNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  imageUrl?: string;
  status: NewsStatus;
  isPinned: boolean;
  authorId: string;
  authorName: string;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export type CommunityCategory =
  | 'Soal Jawab Geran'
  | 'Operasi Kapsul'
  | 'Pemasaran & Jualan'
  | 'Lesen & SSM'
  | 'Jaringan Daerah';

export type CommunityStatus = 'open' | 'resolved';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: CommunityCategory;
  district: KelantanDistrict;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  status: CommunityStatus;
  isPinned: boolean;
  helpfulUserIds: string[];
  helpfulCount: number;
  replyCount: number;
  acceptedReplyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  isAccepted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

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
  recommendedAmount: string;
  grantProgramTitle: string;
  justification: string;
  businessReadinessRemark: string;
  grantApplicationId?: string;
  issuedAt: string;
  status: 'active' | 'revoked';
  updatedAt?: string;
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
  updatedAt?: string;
}

export interface EventBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName?: string;
  status: 'booked' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface YouthEvent {
  id: string;
  title: string;
  category: 'karnival' | 'bengkel' | 'pitching' | 'expo';
  date: string;
  time: string;
  district: KelantanDistrict;
  location: string;
  organizer: string;
  boothsAvailable: number;
  totalBooths: number;
  fee: string;
  description: string;
  whatsappContact: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

