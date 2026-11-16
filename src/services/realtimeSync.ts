import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type SyncEntityType =
  | 'booking'
  | 'grant'
  | 'ticket'
  | 'session'
  | 'endorsement'
  | 'log'
  | 'cashflow'
  | 'notification'
  | 'business'
  | 'product'
  | 'slot'
  | 'program'
  | 'b2b'
  | 'news'
  | 'community_post'
  | 'community_reply'
  | 'mentor'
  | 'settings'
  | 'event_booking'
  | 'event'
  | 'user_account'
  | 'deleted';

export interface DemoSyncDoc<T = Record<string, unknown>> {
  id: string;
  entityType: SyncEntityType;
  actorId: string;
  scope: 'demo';
  payload: T;
  deleted?: boolean;
  updatedAt: string;
}

const CHANNEL_NAME = 'kbelia_realtime_sync_v1';
const STORAGE_PING_KEY = 'kbelia_realtime_ping';

let sharedChannel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return sharedChannel;
}

export function broadcastSyncUpdate(entityType: SyncEntityType | 'all' = 'all') {
  if (typeof window === 'undefined') return;
  try {
    const ch = getChannel();
    ch?.postMessage({ entityType, ts: Date.now() });
  } catch {
    // ignore BroadcastChannel failures
  }
  try {
    localStorage.setItem(STORAGE_PING_KEY, JSON.stringify({ entityType, ts: Date.now() }));
  } catch {
    // ignore storage quota issues
  }
  try {
    window.dispatchEvent(new CustomEvent('kbelia_realtime_sync', { detail: { entityType } }));
    window.dispatchEvent(new CustomEvent('kbelia_demo_data_updated'));
    if (entityType === 'cashflow') {
      window.dispatchEvent(new CustomEvent('kbelia_cashflow_updated'));
    }
    if (entityType === 'news') {
      window.dispatchEvent(new CustomEvent('kbelia_demo_news_updated'));
    }
    if (entityType === 'community_post' || entityType === 'community_reply') {
      window.dispatchEvent(new CustomEvent('kbelia_demo_community_updated'));
    }
  } catch {
    // ignore
  }
}

export function subscribeCrossTabSync(onTrigger: (entityType: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleLocalEvent = (e: Event) => {
    const custom = e as CustomEvent<{ entityType?: string }>;
    onTrigger(custom.detail?.entityType || 'all');
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (
      e.key === STORAGE_PING_KEY ||
      e.key?.startsWith('kbelia_')
    ) {
      let entityType = 'all';
      if (e.key === STORAGE_PING_KEY && e.newValue) {
        try {
          entityType = JSON.parse(e.newValue).entityType || 'all';
        } catch {
          // ignore
        }
      }
      onTrigger(entityType);
    }
  };

  const ch = getChannel();
  const handleChannelMessage = (e: MessageEvent<{ entityType?: string }>) => {
    onTrigger(e.data?.entityType || 'all');
  };

  window.addEventListener('kbelia_realtime_sync', handleLocalEvent);
  window.addEventListener('storage', handleStorageEvent);
  ch?.addEventListener('message', handleChannelMessage);

  return () => {
    window.removeEventListener('kbelia_realtime_sync', handleLocalEvent);
    window.removeEventListener('storage', handleStorageEvent);
    ch?.removeEventListener('message', handleChannelMessage);
  };
}

function sanitizeSyncId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
}

function stripSensitiveDemoFields<T extends Record<string, any>>(payload: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  const entries = Object.entries(payload || {}).slice(0, 38);
  for (const [key, val] of entries) {
    if (val === undefined) continue;
    if (key === 'pin') continue;
    if (key === 'applicantMyKad' || key === 'icNumber') {
      cleaned[key] = typeof val === 'string' && val ? '******-**-****' : '';
      continue;
    }
    if (key === 'bankAccountNumber') {
      cleaned[key] = typeof val === 'string' && val.length > 4 ? `****${val.slice(-4)}` : '****';
      continue;
    }
    cleaned[key] = val;
  }
  return cleaned;
}

export async function publishDemoSyncRecord<T extends Record<string, any>>(
  entityType: SyncEntityType,
  recordId: string,
  payload: T,
  deleted = false
): Promise<void> {
  broadcastSyncUpdate(entityType);

  if (!auth.currentUser) return;

  const syncId = sanitizeSyncId(`${entityType}__${recordId}`);
  const syncRef = doc(db, 'demo_sync', syncId);
  const cleanedPayload = stripSensitiveDemoFields(payload);

  let mergedPayload = cleanedPayload;
  if (!deleted && Object.keys(cleanedPayload).length <= 8) {
    try {
      const existingSnap = await getDoc(syncRef);
      if (existingSnap.exists()) {
        const prevPayload = existingSnap.data()?.payload;
        if (prevPayload && typeof prevPayload === 'object') {
          mergedPayload = { ...prevPayload, ...cleanedPayload };
        }
      }
    } catch {
      // proceed with incoming payload
    }
  }

  const now = new Date().toISOString();
  const docData: DemoSyncDoc<Record<string, any>> = {
    id: syncId,
    entityType,
    actorId: auth.currentUser.uid,
    scope: 'demo',
    payload: {
      ...mergedPayload,
      ...(!deleted ? { updatedAt: (mergedPayload as any).updatedAt || now } : {})
    },
    deleted,
    updatedAt: now
  };

  try {
    await setDoc(syncRef, docData, { merge: true });
  } catch (err) {
    // Graceful fallback: cross-tab BroadcastChannel + localStorage remains active even if rules/anonymous auth aren't deployed yet
    console.debug(`Demo sync Firestore write fallback (${entityType}):`, err);
  }
}

export function subscribeDemoSyncCollection<T extends { id: string }>(
  entityType: SyncEntityType,
  onUpdate: (items: T[], deletedIds: string[]) => void
): () => void {
  if (!auth.currentUser) {
    return () => {};
  }

  const q = query(collection(db, 'demo_sync'), where('entityType', '==', entityType));
  return onSnapshot(
    q,
    (snap) => {
      const items: T[] = [];
      const deletedIds: string[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as DemoSyncDoc<T>;
        if (!data?.payload) return;
        const rawId = (data.payload as any).id || docSnap.id.replace(`${entityType}__`, '');
        if (data.deleted) {
          deletedIds.push(rawId);
        } else {
          items.push({
            ...(data.payload as any),
            id: rawId,
            updatedAt: (data.payload as any).updatedAt || data.updatedAt
          } as T);
        }
      });
      onUpdate(items, deletedIds);
    },
    (err) => {
      console.debug(`Demo sync listener notice (${entityType}):`, err?.message || err);
    }
  );
}

function getRecordTimestampMs(item: any): number {
  if (!item || typeof item !== 'object') return 0;
  const candidate = item.updatedAt || item.syncedAt || item.issuedAt || item.createdAt;
  if (typeof candidate !== 'string' || !candidate) return 0;
  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Timestamp-aware deterministic merge across Demo & Real streams:
 * newer updatedAt/createdAt always wins regardless of source array order;
 * earlier arrays break ties when timestamps match or are absent.
 */
export function mergeUniqueById<T extends { id: string }>(
  arraysInPriorityOrder: T[][],
  deletedIds: string[] = []
): T[] {
  const deletedSet = new Set(deletedIds);
  const map = new Map<string, { item: T; ts: number }>();
  for (const list of arraysInPriorityOrder) {
    for (const item of list) {
      if (!item?.id || deletedSet.has(item.id)) continue;
      const incomingTs = getRecordTimestampMs(item);
      const existing = map.get(item.id);
      if (!existing || incomingTs > existing.ts) {
        map.set(item.id, { item, ts: incomingTs });
      }
    }
  }
  return Array.from(map.values()).map((entry) => entry.item);
}
