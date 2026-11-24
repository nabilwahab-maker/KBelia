import {
  B2BListing,
  BusinessListing,
  CapsuleBooking,
  CapsuleSlot,
  GrantApplication,
  GrantEndorsement,
  KioskDailySale,
  MaintenanceTicket,
  MenteeGrantCheck,
  MentorProfile,
  MentoringLogEntry,
  MentorshipRegistration,
  PortalNews,
  PortalSettings,
  ProductItem,
  YouthEvent,
  YouthNotification
} from '../types';
import { INITIAL_B2B_LISTINGS } from '../data/b2bData';
import { INITIAL_YOUTH_EVENTS, loadLocalEventBookings } from '../services/dataService';
import { getStoredNotifications } from '../services/notificationStore';

export interface SidebarNotificationContextData {
  userId?: string;
  userEmail?: string;
  isAdmin: boolean;
  isMentor: boolean;
  isYouth: boolean;
  myBusiness?: BusinessListing | null;
  myProducts?: ProductItem[];
  myBookings?: CapsuleBooking[];
  myGrants?: GrantApplication[];
  myMentorships?: MentorshipRegistration[];
  cashflowRecords?: KioskDailySale[];
  businesses?: BusinessListing[];
  bookings?: CapsuleBooking[];
  slots?: CapsuleSlot[];
  grantApplications?: GrantApplication[];
  mentorshipRegistrations?: MentorshipRegistration[];
  maintenanceTickets?: MaintenanceTicket[];
  newsItems?: PortalNews[];
  portalSettings?: PortalSettings;
  currentMentor?: MentorProfile | null;
  grantEndorsements?: GrantEndorsement[];
}

const SEEN_STORAGE_PREFIX = 'kbelia_sidebar_seen_v1_';

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readLocalJsonArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function getSidebarUserKey(userId?: string, userEmail?: string): string {
  const raw = (userId || userEmail || 'guest').trim().toLowerCase();
  return raw.replace(/[^a-z0-9_.-]/g, '_');
}

export function loadSeenSidebarIds(userKey: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(`${SEEN_STORAGE_PREFIX}${userKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string[]>;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveSeenSidebarIds(userKey: string, seen: Record<string, string[]>): void {
  try {
    localStorage.setItem(`${SEEN_STORAGE_PREFIX}${userKey}`, JSON.stringify(seen));
  } catch {
    // ignore
  }
}

export function markSidebarMenusSeen(
  userKey: string,
  menuKeys: string[],
  itemIdsByMenu: Record<string, string[]>,
  prevSeen: Record<string, string[]>
): Record<string, string[]> {
  let changed = false;
  const next: Record<string, string[]> = { ...prevSeen };

  for (const menuKey of menuKeys) {
    const activeIds = itemIdsByMenu[menuKey] || [];
    if (activeIds.length === 0) continue;
    const existingSet = new Set(next[menuKey] || []);
    let menuChanged = false;
    for (const id of activeIds) {
      if (!existingSet.has(id)) {
        existingSet.add(id);
        menuChanged = true;
      }
    }
    if (menuChanged) {
      next[menuKey] = Array.from(existingSet);
      changed = true;
    }
  }

  if (changed) {
    saveSeenSidebarIds(userKey, next);
  }
  return changed ? next : prevSeen;
}

export function getUnseenMenuCount(
  menuKey: string,
  itemIdsByMenu: Record<string, string[]>,
  seenByMenu: Record<string, string[]>
): number {
  const activeIds = itemIdsByMenu[menuKey] || [];
  if (activeIds.length === 0) return 0;
  const seenSet = new Set(seenByMenu[menuKey] || []);
  let count = 0;
  for (const id of activeIds) {
    if (!seenSet.has(id)) count += 1;
  }
  return count;
}

export function computeSidebarActionableIds(
  data: SidebarNotificationContextData
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const notifications: YouthNotification[] = getStoredNotifications();
  const b2bListings = readLocalJsonArray<B2BListing>('kbelia_b2b_listings', INITIAL_B2B_LISTINGS);
  const youthEvents = readLocalJsonArray<YouthEvent>('kbelia_youth_events', INITIAL_YOUTH_EVENTS);

  // =========================================================================
  // ROLE A: PENTADBIR URUSETIA
  // =========================================================================
  if (data.isAdmin) {
    const bookings = data.bookings || [];
    const grants = data.grantApplications || [];
    const tickets = data.maintenanceTickets || [];
    const businesses = data.businesses || [];
    const slots = data.slots || [];
    const newsItems = data.newsItems || [];
    const mentorships = data.mentorshipRegistrations || [];

    const pendingBookings = bookings.filter((b) => b && b.status === 'pending');
    const pendingGrants = grants.filter((g) => g && g.status === 'pending');
    const openTickets = tickets.filter((t) => t && t.status !== 'resolved');
    const unapprovedBusinesses = businesses.filter((b) => b && !b.isApproved);
    const missingSsmBusinesses = businesses.filter((b) => b && (!b.isApproved || !b.ssmNumber?.trim()));
    const attentionSlots = slots.filter((s) => s && (s.status === 'maintenance' || s.status === 'reserved'));
    const draftNews = newsItems.filter((n) => n && n.status === 'draft');
    const pendingMentorships = mentorships.filter((r) => r && r.status === 'pending');

    map['admin:queue'] = [
      ...pendingBookings.map((b) => `aq_b_${b.id}`),
      ...pendingGrants.map((g) => `aq_g_${g.id}`),
      ...openTickets.map((t) => `aq_t_${t.id}`)
    ];
    map['admin:bookings'] = pendingBookings.map((b) => `ab_${b.id}`);
    map['admin:businesses'] = unapprovedBusinesses.map((b) => `abiz_${b.id}`);
    map['admin:slots'] = attentionSlots.map((s) => `aslot_${s.id}_${s.status}`);
    map['admin:news'] = draftNews.map((n) => `anews_${n.id}`);
    map['admin:b2b'] = b2bListings.slice(0, 2).map((item) => `ab2b_${item.id}`);
    map['admin:events'] = youthEvents.slice(0, 2).map((ev) => `aev_${ev.id}`);
    map['admin:users'] = [];
    map['admin:settings'] =
      data.portalSettings?.systemStatus === 'maintenance' ? ['aset_maint_active'] : [];

    map['admin:academic'] = openTickets.map((t) => `aacad_${t.id}`);
    map['admin:ceed'] = pendingGrants.map((g) => `aceed_${g.id}`);
    map['admin:programs'] = pendingGrants.map((g) => `aprog_${g.id}`);
    map['admin:mentors'] = pendingMentorships.map((r) => `amentor_${r.id}`);
    map['admin:hepa'] = missingSsmBusinesses.map((b) => `ahepa_${b.id}`);
    return map;
  }

  // =========================================================================
  // ROLE B: MENTOR
  // =========================================================================
  if (data.isMentor) {
    const registrations = data.mentorshipRegistrations || [];
    const endorsements = data.grantEndorsements || [];
    const mentorId = data.currentMentor?.id;
    const rawSavedLogs = readLocalJsonArray<MentoringLogEntry>('kbelia_mentor_logs_v1', []);
    const mentorLogs = rawSavedLogs.filter((l) => !mentorId || l.mentorId === mentorId);

    const unreadMentorNotifs = notifications.filter(
      (n) => !n.isRead && (n.targetRole === 'mentor' || n.targetRole === 'all') && n.actionTab !== 'mentor'
    );
    map['mentor:overview'] = unreadMentorNotifs.map((n) => `mnotif_${n.id}`);

    const pendingSessions = registrations.filter((r) => r.status === 'pending');
    const confirmedSessions = registrations.filter((r) => r.status === 'confirmed');
    map['mentor:sessions'] = [
      ...pendingSessions.map((r) => `msess_pending_${r.id}`),
      ...confirmedSessions.map((r) => `msess_confirmed_${r.id}`)
    ];

    const incompleteLogs =
      rawSavedLogs.length > 0
        ? mentorLogs
            .filter((log) => Array.isArray(log.actionItems) && log.actionItems.some((a) => !a.completed))
            .map((log) => `mlog_todo_${log.id}`)
        : !mentorId || mentorId === 'mentor-1'
          ? ['mlog_todo_log-1', 'mlog_todo_log-2', 'mlog_todo_log-3']
          : [];
    map['mentor:logbook'] = incompleteLogs;

    const completedWithoutEndorsement = registrations.filter(
      (r) =>
        r.status === 'completed' &&
        !endorsements.some(
          (e) =>
            e.status === 'active' &&
            e.businessName?.toLowerCase() === r.businessName?.toLowerCase()
        )
    );
    map['mentor:endorsements'] = completedWithoutEndorsement.map((r) => `mendorse_${r.id}`);

    const savedChecks = readLocalJsonArray<MenteeGrantCheck>('kbelia_mentor_grant_checks_v1', []);
    const mentorChecks = savedChecks.filter((c) => !mentorId || c.mentorId === mentorId);
    const activeMenteesPendingLog = registrations.filter(
      (r) =>
        r.status !== 'cancelled' &&
        !mentorLogs.some(
          (l) => l.businessName?.toLowerCase() === r.businessName?.toLowerCase()
        )
    );
    map['mentor:mentees'] = activeMenteesPendingLog.map((r) => `mmentee_${r.id}`);

    const needingReadinessCheck = completedWithoutEndorsement.filter(
      (r) =>
        !mentorChecks.some(
          (c) => c.businessName?.toLowerCase() === r.businessName?.toLowerCase()
        )
    );
    map['mentor:readiness'] = needingReadinessCheck.map((r) => `mready_${r.id}`);
    map['mentor:impact'] = [];

    const hasPublishedSlots =
      Boolean(data.currentMentor?.publishedSlots && data.currentMentor.publishedSlots.length > 0);
    map['mentor:schedule'] = [
      ...pendingSessions.map((r) => `msched_pending_${r.id}`),
      ...(!hasPublishedSlots ? ['msched_no_open_slots'] : [])
    ];

    const isProfileIncomplete =
      !data.currentMentor?.bio?.trim() || !data.currentMentor?.phone?.trim();
    map['mentor:profile'] = isProfileIncomplete ? ['mprof_incomplete'] : [];
    return map;
  }

  // =========================================================================
  // ROLE C: USAHAWAN BELIA
  // =========================================================================
  const myBusiness = data.myBusiness || null;
  const myProducts = data.myProducts || [];
  const myBookings = data.myBookings || [];
  const myGrants = data.myGrants || [];
  const myMentorships = data.myMentorships || [];
  const cashflowRecords = data.cashflowRecords || [];
  const todayIso = getTodayIsoDate();

  // 1. Overview
  const unreadOverviewNotifs = notifications.filter(
    (n) =>
      !n.isRead &&
      (n.targetRole === 'youth' || n.targetRole === 'all') &&
      (n.actionTab === 'home' || n.actionTab === 'merchant')
  );
  map['youth:overview'] = unreadOverviewNotifs.map((n) => `ynotif_${n.id}`);

  // 2. Profil Kedai
  const profileIds: string[] = [];
  if (!myBusiness) {
    profileIds.push('ybiz_setup_required');
  } else {
    if (!myBusiness.ssmNumber?.trim()) profileIds.push('ybiz_ssm_missing');
    if (!myBusiness.businessAddress?.trim() || !myBusiness.businessHours?.trim()) {
      profileIds.push('ybiz_ops_incomplete');
    }
  }
  map['youth:profile'] = profileIds;

  // 3. Produk Saya
  const productIds: string[] = [];
  if (myProducts.length === 0) {
    productIds.push('yprod_add_first');
  } else {
    for (const p of myProducts) {
      if (!p.inStock) productIds.push(`yprod_oos_${p.id}`);
      if ((p.description || '').trim().length < 15) productIds.push(`yprod_desc_${p.id}`);
    }
    if (myProducts.length < 4) {
      productIds.push('yprod_expand_catalog');
    }
  }
  map['youth:products'] = productIds;

  // 4. Dokumen Saya (Vault)
  const vaultIds: string[] = [];
  for (const b of myBookings) {
    if (b.status === 'approved' && !b.tenancySigned) vaultIds.push(`yvault_sign_${b.id}`);
  }
  for (const g of myGrants) {
    if (g.status === 'approved') vaultIds.push(`yvault_grant_${g.id}`);
  }
  map['youth:vault'] = vaultIds;

  // 5. Kad Digital
  const cardIds: string[] = [];
  if (myBusiness && (!myBusiness.instagram?.trim() || !myBusiness.tiktok?.trim())) {
    cardIds.push('ycard_social_missing');
  }
  map['youth:card'] = cardIds;

  // 6. Kiosk Saya (Main academic tab — unified kiosk bookings, tenancy signing, tickets & notifications)
  const academicNotifs = notifications.filter(
    (n) => !n.isRead && (n.targetRole === 'youth' || n.targetRole === 'all') && n.actionTab === 'academic'
  );
  const academicIds: string[] = academicNotifs.map((n) => `ynotif_acad_${n.id}`);
  for (const b of myBookings) {
    if (b.status === 'approved' && !b.tenancySigned) academicIds.push(`yb_sign_${b.id}`);
    else if (b.status === 'pending') academicIds.push(`yb_pending_${b.id}`);
    else if (b.status === 'rejected') academicIds.push(`yb_rejected_${b.id}`);
  }
  const mySlotCodes = new Set(myBookings.map((b) => b.slotCode).filter(Boolean));
  for (const t of data.maintenanceTickets || []) {
    const belongsToYouth =
      (data.userId && t.ownerId === data.userId) || (t.slotCode && mySlotCodes.has(t.slotCode));
    if (belongsToYouth && (t.status === 'received' || t.status === 'in_progress')) {
      academicIds.push(`yticket_${t.id}_${t.status}`);
    }
  }
  if (myBookings.length === 0) {
    academicIds.push('yacad_apply_kiosk');
  }
  map['youth:academic'] = academicIds;

  // 8. Rekod Jualan & POS (Cashflow)
  const hasTodayCashflow = cashflowRecords.some((r) => r.date === todayIso);
  map['youth:cashflow'] = !hasTodayCashflow ? [`ycashflow_due_${todayIso}`] : [];

  // 9. Permohonan Geran (ceed)
  const ceedNotifs = notifications.filter(
    (n) => !n.isRead && (n.targetRole === 'youth' || n.targetRole === 'all') && n.actionTab === 'ceed'
  );
  const ceedIds: string[] = ceedNotifs.map((n) => `ynotif_ceed_${n.id}`);
  if (myGrants.length === 0) {
    ceedIds.push('yceed_apply_open');
  } else {
    for (const g of myGrants) {
      if (g.status === 'pending' || g.status === 'approved' || g.status === 'rejected') {
        ceedIds.push(`yceed_${g.id}_${g.status}`);
      }
    }
  }
  map['youth:ceed'] = ceedIds;

  // 10. Sesi Bimbingan (mentorship)
  const mentorshipIds: string[] = [];
  if (myMentorships.length === 0) {
    mentorshipIds.push('ymentor_book_open');
  } else {
    for (const r of myMentorships) {
      if (r.status === 'pending' || r.status === 'confirmed') {
        mentorshipIds.push(`ymentor_${r.id}_${r.status}`);
      }
    }
  }
  map['youth:mentorship'] = mentorshipIds;

  // 11. Ruang Niaga (b2b)
  const externalB2B = b2bListings.filter((item) => !data.userId || item.ownerId !== data.userId);
  map['youth:b2b'] = externalB2B.slice(0, 2).map((item) => `yb2b_${item.id}`);

  // 12. Acara & Karnival (events)
  const eventBookings = loadLocalEventBookings(data.userId);
  const bookedEventIds = new Set(
    eventBookings.filter((eb) => eb.status === 'booked').map((eb) => eb.eventId)
  );
  const openEvents = youthEvents.filter((ev) => ev.boothsAvailable > 0 && !bookedEventIds.has(ev.id));
  map['youth:events'] = openEvents.slice(0, 2).map((ev) => `yevent_${ev.id}`);

  // 13. Direktori Usahawan (hepa)
  map['youth:hepa'] = myBusiness && !myBusiness.isApproved ? [`yhepa_pending_${myBusiness.id}`] : [];

  return map;
}
