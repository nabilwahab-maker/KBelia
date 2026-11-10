import { YouthNotification } from '../types';

const STORAGE_KEY = 'kbelia_live_notifications';

export const INITIAL_NOTIFICATIONS: YouthNotification[] = [
  // Pemberitahuan Khusus Belia
  {
    id: 'notif-youth-1',
    title: 'Pengambilan Kiosk Modular Sesi 2026',
    message: 'Permohonan terbuka di Hab Kota Bharu, Bachok, dan Pasir Mas dengan subsidi sewa 50% untuk belia Kelantan.',
    category: 'announcement',
    sender: 'Urusetia Pentadbir Belia',
    senderRole: 'admin',
    targetRole: 'youth',
    timestamp: 'Baru sahaja',
    isRead: false,
    actionTab: 'academic'
  },
  {
    id: 'notif-youth-2',
    title: 'Dana Benih Belia RM3,000 Dibuka',
    message: 'Skim bantuan modal permulaan tanpa faedah kini sedia untuk dipohon oleh usahawan berdaftar.',
    category: 'announcement',
    sender: 'Unit Pembangunan Keusahawanan',
    senderRole: 'admin',
    targetRole: 'youth',
    timestamp: '1 hari lepas',
    isRead: false,
    actionTab: 'ceed'
  },
  // Pemberitahuan Khusus Mentor
  {
    id: 'notif-mentor-1',
    title: 'Jadual Klinik Bimbingan Usahawan',
    message: 'Slot perundingan strategi pemasaran dan pembungkusan produk telah dibuka untuk tempahan mentee usahawan.',
    category: 'reminder',
    sender: 'Sistem Pengurusan Mentor',
    senderRole: 'system',
    targetRole: 'mentor',
    timestamp: '2 jam lepas',
    isRead: false,
    actionTab: 'mentor'
  },
  {
    id: 'notif-mentor-2',
    title: 'Pelantikan Mentor Pakar Industri Kelantan',
    message: 'Selamat bertugas kepada barisan mentor pakar industri bagi sesi bimbingan inkubasi 2026.',
    category: 'status',
    sender: 'Pusat Pembangunan Kerjaya UMK',
    senderRole: 'admin',
    targetRole: 'mentor',
    timestamp: '2 hari lepas',
    isRead: true,
    actionTab: 'mentor'
  },
  // Pemberitahuan Khusus Pentadbir
  {
    id: 'notif-admin-1',
    title: 'Audit Permohonan Kiosk & Geran Menunggu',
    message: 'Terdapat permohonan baharu dalam barisan menunggu yang memerlukan semakan dan kelulusan rasmi.',
    category: 'status',
    sender: 'Sistem Integriti Pentadbiran',
    senderRole: 'system',
    targetRole: 'admin',
    timestamp: '10 minit lepas',
    isRead: false,
    actionTab: 'admin'
  },
  {
    id: 'notif-admin-2',
    title: 'Laporan Kuota Kiosk Bulanan Sedia Dijana',
    message: 'Kadar sewaan dan pematuhan sewa kiosk bagi jajahan Kota Bharu dan Bachok boleh dijana dalam format PDF.',
    category: 'announcement',
    sender: 'Urusetia Kewangan',
    senderRole: 'system',
    targetRole: 'admin',
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
    // Trigger custom window event for instant header sync
    window.dispatchEvent(new CustomEvent('kbelia_notifications_updated', { detail: notifs }));
  } catch (e) {
    console.warn('Could not save notifications', e);
  }
};

export interface NotificationPayload {
  title: string;
  message: string;
  senderRole?: 'admin' | 'mentor';
  targetRole?: 'youth' | 'mentor' | 'admin' | 'all';
  sender?: string;
  senderName?: string;
  type?: string;
  actionTab?: string;
}

export function emitAdminOrMentorNotification(
  titleOrPayload: string | NotificationPayload,
  message?: string,
  senderRole: 'admin' | 'mentor' = 'admin',
  senderName: string = 'Pentadbir KBELIA',
  actionTab: string = 'home'
) {
  let title = '';
  let msg = '';
  let role: 'admin' | 'mentor' = senderRole;
  let targetRole: 'youth' | 'mentor' | 'admin' | 'all' = 'all';
  let sender = senderName;
  let targetTab = actionTab;

  if (typeof titleOrPayload === 'string') {
    title = titleOrPayload;
    msg = message || '';
  } else if (titleOrPayload && typeof titleOrPayload === 'object') {
    title = titleOrPayload.title;
    msg = titleOrPayload.message;
    role = titleOrPayload.senderRole || 'admin';
    targetRole = titleOrPayload.targetRole || (role === 'admin' ? 'youth' : 'mentor');
    sender = titleOrPayload.sender || titleOrPayload.senderName || (role === 'mentor' ? 'Mentor UMK' : 'Pentadbir Urusetia');
    targetTab = titleOrPayload.actionTab || 'home';
  }

  const current = getStoredNotifications();
  const newNotif: YouthNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    message: msg,
    category: role === 'admin' ? 'announcement' : 'reminder',
    sender,
    senderRole: role,
    targetRole,
    timestamp: 'Baru sahaja',
    isRead: false,
    actionTab: targetTab
  };

  const updated = [newNotif, ...current.slice(0, 24)];
  saveNotifications(updated);
  return newNotif;
}
