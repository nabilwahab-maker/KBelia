import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { YouthNotification } from '../types';
import { isProductionAuthenticated } from './dataService';
import {
  broadcastSyncUpdate,
  mergeUniqueById,
  publishDemoSyncRecord,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from './realtimeSync';

const STORAGE_KEY = 'kbelia_live_notifications';

export const INITIAL_NOTIFICATIONS: YouthNotification[] = [
  {
    id: 'notif-youth-1',
    title: 'Pengambilan Kiosk Modular Sesi 2026',
    message: 'Permohonan terbuka di Hab Kota Bharu, Bachok, Tumpat, dan Pasir Mas dengan subsidi sewa sehingga 50% untuk belia Kelantan.',
    category: 'announcement',
    sender: 'Admin KBelia',
    senderRole: 'admin',
    targetRole: 'youth',
    targetUserId: '',
    timestamp: 'Baru sahaja',
    isRead: false,
    actionTab: 'academic'
  },
  {
    id: 'notif-youth-2',
    title: 'Geran Permulaan Belia RM3,000 Dibuka',
    message: 'Skim bantuan modal permulaan tanpa faedah kini dibuka untuk usahawan yang berdaftar.',
    category: 'announcement',
    sender: 'Unit Keusahawanan Belia',
    senderRole: 'admin',
    targetRole: 'youth',
    targetUserId: '',
    timestamp: '1 hari lepas',
    isRead: false,
    actionTab: 'ceed'
  },
  {
    id: 'notif-mentor-1',
    title: 'Jadual Klinik Bimbingan Usahawan',
    message: 'Slot perundingan strategi pemasaran dan pembungkusan produk telah dibuka untuk tempahan mentee usahawan.',
    category: 'reminder',
    sender: 'Sistem Pengurusan Mentor',
    senderRole: 'system',
    targetRole: 'mentor',
    targetUserId: '',
    timestamp: '2 jam lepas',
    isRead: false,
    actionTab: 'mentor'
  },
  {
    id: 'notif-mentor-2',
    title: 'Pelantikan Mentor Industri Kelantan',
    message: 'Selamat bertugas kepada barisan mentor industri bagi sesi bimbingan inkubasi 2026.',
    category: 'status',
    sender: 'Pusat Pembangunan Kerjaya UMK',
    senderRole: 'admin',
    targetRole: 'mentor',
    targetUserId: '',
    timestamp: '2 hari lepas',
    isRead: true,
    actionTab: 'mentor'
  },
  {
    id: 'notif-admin-1',
    title: 'Semakan Permohonan Kiosk & Geran Menunggu',
    message: 'Terdapat permohonan baharu dalam barisan menunggu yang memerlukan semakan dan kelulusan rasmi.',
    category: 'status',
    sender: 'Sistem Integriti Pentadbiran',
    senderRole: 'system',
    targetRole: 'admin',
    targetUserId: '',
    timestamp: '10 minit lepas',
    isRead: false,
    actionTab: 'admin'
  },
  {
    id: 'notif-admin-2',
    title: 'Laporan Kuota Kiosk Bulanan Sedia Dijana',
    message: 'Kadar sewaan dan pematuhan sewa kiosk bagi semua jajahan boleh dijana dalam format PDF.',
    category: 'announcement',
    sender: 'Bahagian Kewangan KBelia',
    senderRole: 'system',
    targetRole: 'admin',
    targetUserId: '',
    timestamp: '3 jam lepas',
    isRead: true,
    actionTab: 'admin'
  }
];

export const getStoredNotifications = (): YouthNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read stored notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
};

export const saveNotifications = (notifs: YouthNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('kbelia_notifications_updated', { detail: notifs }));
    broadcastSyncUpdate('notification');
  } catch (e) {
    console.warn('Could not save notifications', e);
  }
};

export interface NotificationPayload {
  title: string;
  message: string;
  senderRole?: 'admin' | 'mentor' | 'user' | 'system';
  targetRole?: 'youth' | 'mentor' | 'admin' | 'all';
  targetUserId?: string;
  sender?: string;
  senderName?: string;
  type?: string;
  actionTab?: string;
}

export function emitAdminOrMentorNotification(
  titleOrPayload: string | NotificationPayload,
  message?: string,
  senderRole: 'admin' | 'mentor' | 'user' | 'system' = 'admin',
  senderName: string = 'Pentadbir KBelia',
  actionTab: string = 'home'
) {
  let title = '';
  let msg = '';
  let role: 'admin' | 'mentor' | 'user' | 'system' = senderRole;
  let targetRole: 'youth' | 'mentor' | 'admin' | 'all' = 'youth';
  let targetUserId = '';
  let sender = senderName;
  let targetTab = actionTab;
  let category: YouthNotification['category'] = 'announcement';

  if (typeof titleOrPayload === 'string') {
    title = titleOrPayload;
    msg = message || '';
  } else if (titleOrPayload && typeof titleOrPayload === 'object') {
    title = titleOrPayload.title;
    msg = titleOrPayload.message;
    role = titleOrPayload.senderRole || 'admin';
    targetRole = titleOrPayload.targetRole || 'youth';
    targetUserId = titleOrPayload.targetUserId || '';
    sender =
      titleOrPayload.sender ||
      titleOrPayload.senderName ||
      (role === 'mentor'
        ? 'Mentor UMK'
        : role === 'user'
        ? 'Usahawan Belia'
        : 'Admin KBelia');
    targetTab = titleOrPayload.actionTab || 'home';
    if (titleOrPayload.type === 'kiosk' || titleOrPayload.type === 'grant' || role === 'user') {
      category = 'status';
    } else if (role === 'mentor') {
      category = 'reminder';
    }
  }

  const current = getStoredNotifications();
  const newNotif: YouthNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.slice(0, 180),
    message: msg.slice(0, 600),
    category,
    sender: sender.slice(0, 120),
    senderRole: role,
    targetRole,
    targetUserId,
    timestamp: 'Baru sahaja',
    isRead: false,
    actionTab: targetTab
  };

  const updated = [newNotif, ...current.filter((n) => n.id !== newNotif.id).slice(0, 39)];
  saveNotifications(updated);

  if (isProductionAuthenticated()) {
    setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch((err) => {
      console.warn('Firestore notification write fallback:', err?.message || err);
    });
  } else {
    void publishDemoSyncRecord('notification', newNotif.id, newNotif);
  }

  return newNotif;
}

export async function markNotificationReadStatus(
  notifId: string,
  allCurrent: YouthNotification[]
): Promise<YouthNotification[]> {
  const updated = allCurrent.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
  saveNotifications(updated);

  const target = updated.find((n) => n.id === notifId);
  if (isProductionAuthenticated() && !notifId.startsWith('notif-youth-') && !notifId.startsWith('notif-mentor-') && !notifId.startsWith('notif-admin-')) {
    setDoc(doc(db, 'notifications', notifId), { isRead: true }, { merge: true }).catch(() => {});
  } else if (target && !isProductionAuthenticated()) {
    void publishDemoSyncRecord('notification', notifId, target);
  }
  return updated;
}

export async function markAllNotificationsReadStatus(
  activeIds: Set<string>,
  allCurrent: YouthNotification[]
): Promise<YouthNotification[]> {
  const updated = allCurrent.map((n) => (activeIds.has(n.id) ? { ...n, isRead: true } : n));
  saveNotifications(updated);

  for (const item of updated) {
    if (!activeIds.has(item.id)) continue;
    if (isProductionAuthenticated() && !item.id.startsWith('notif-youth-') && !item.id.startsWith('notif-mentor-') && !item.id.startsWith('notif-admin-')) {
      setDoc(doc(db, 'notifications', item.id), { isRead: true }, { merge: true }).catch(() => {});
    } else if (!isProductionAuthenticated()) {
      void publishDemoSyncRecord('notification', item.id, item);
    }
  }
  return updated;
}

export interface NotificationSubscriptionOptions {
  uid?: string;
  isAdmin: boolean;
  isMentor: boolean;
  isDemoSession: boolean;
}

export function subscribeNotifications(
  options: NotificationSubscriptionOptions,
  onUpdate: (notifications: YouthNotification[]) => void
): () => void {
  const { uid, isAdmin, isMentor, isDemoSession } = options;

  let prodDirectItems: YouthNotification[] = [];
  let prodRoleItems: YouthNotification[] = [];
  let demoSyncItems: YouthNotification[] = [];

  const emitMerged = () => {
    const localItems = getStoredNotifications();
    const merged = mergeUniqueById<YouthNotification>([
      prodDirectItems,
      prodRoleItems,
      demoSyncItems,
      localItems,
      INITIAL_NOTIFICATIONS
    ]);
    onUpdate(merged);
  };

  // Emit immediately with local cache
  emitMerged();

  const handleLocalEvent = () => emitMerged();
  window.addEventListener('kbelia_notifications_updated', handleLocalEvent);

  const unsubCrossTab = subscribeCrossTabSync((entity) => {
    if (entity === 'all' || entity === 'notification') {
      emitMerged();
    }
  });

  let unsubProdDirect = () => {};
  let unsubProdRole = () => {};
  let unsubDemoSync = () => {};

  if (isProductionAuthenticated() && auth.currentUser) {
    if (isAdmin) {
      unsubProdDirect = onSnapshot(
        collection(db, 'notifications'),
        (snap) => {
          prodDirectItems = snap.docs.map((d) => ({ id: d.id, ...d.data() } as YouthNotification));
          emitMerged();
        },
        (err) => {
          console.debug('Admin notifications listener notice:', err?.message || err);
        }
      );
    } else {
      const directQ = query(
        collection(db, 'notifications'),
        where('targetUserId', '==', auth.currentUser.uid)
      );
      unsubProdDirect = onSnapshot(
        directQ,
        (snap) => {
          prodDirectItems = snap.docs.map((d) => ({ id: d.id, ...d.data() } as YouthNotification));
          emitMerged();
        },
        (err) => {
          console.debug('Direct notifications listener notice:', err?.message || err);
        }
      );

      const allowedRoles = isMentor ? ['mentor', 'all'] : ['youth', 'all'];
      const roleQ = query(
        collection(db, 'notifications'),
        where('targetUserId', '==', ''),
        where('targetRole', 'in', allowedRoles)
      );
      unsubProdRole = onSnapshot(
        roleQ,
        (snap) => {
          prodRoleItems = snap.docs.map((d) => ({ id: d.id, ...d.data() } as YouthNotification));
          emitMerged();
        },
        (err) => {
          console.debug('Role notifications listener notice:', err?.message || err);
        }
      );
    }
  }

  // Subscribe to demo_sync notifications for Demo accounts and Admins monitoring sandbox submissions
  if (isDemoSession || isAdmin || uid) {
    unsubDemoSync = subscribeDemoSyncCollection<YouthNotification>('notification', (items) => {
      demoSyncItems = items;
      emitMerged();
    });
  }

  return () => {
    window.removeEventListener('kbelia_notifications_updated', handleLocalEvent);
    unsubCrossTab();
    unsubProdDirect();
    unsubProdRole();
    unsubDemoSync();
  };
}
