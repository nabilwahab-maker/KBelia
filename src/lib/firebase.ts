import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Bind to configured firestoreDatabaseId and force HTTP long-polling so
// sandboxed/proxied iframe environments do not fail on initial WebChannel streaming attempts.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safe connection test on boot using getDocFromServer
export async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    if (testDoc.exists()) {
      console.log('Firestore connected.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network connection.');
    }
    // Graceful silent fallback for offline / preview sandbox cache resilience
    console.debug('Firestore running with offline cache resilience.');
  }
}

// Run connection check in background
testConnection().catch(() => {});
