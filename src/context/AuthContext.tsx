import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { MentorProfile, UserProfile } from '../types';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';
import { showToast } from '../components/ToastNotification';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export type DemoAccountType =
  | 'admin'
  | 'admin_sec'
  | 'merchant_faizul'
  | 'merchant_syafiqah'
  | 'merchant_harith'
  | 'guest'
  | 'mentor_wanazhar'
  | 'mentor_sitiaminah'
  | 'mentor_khairul'
  | 'mentor_norazila';

interface StoredLocalAccount {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  district?: string;
  businessName?: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isMentor: boolean;
  isYouth: boolean;
  userRole: 'admin' | 'mentor' | 'user' | 'guest';
  isDemoSession: boolean;
  loading: boolean;
  authError: string | null;
  isLoginModalOpen: boolean;
  loginInitialTab: 'user' | 'admin' | 'mentor';
  openLoginModal: (tab?: 'user' | 'admin' | 'mentor') => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (
    email: string,
    pass: string,
    targetRole: 'admin' | 'user' | 'mentor'
  ) => Promise<{ success: boolean; error?: string }>;
  registerNewUser: (
    name: string,
    email: string,
    district: string,
    phone: string,
    businessName?: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (type: DemoAccountType, customData?: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  isSessionWarningOpen: boolean;
  sessionCountdownSeconds: number;
  keepSessionActive: () => void;
  terminateSessionNow: () => Promise<void>;
  clearAuthError: () => void;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  changeUserPassword: (
    newPassword: string,
    currentPassword?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_EMAIL = 'nabilwahab03020302@gmail.com';
const REGISTERED_USERS_KEY = 'kbelia_registered_users_v2';

const checkIsAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return (
    cleanEmail === ADMIN_EMAIL.trim().toLowerCase() ||
    cleanEmail === 'wahabnabil35@gmail.com' ||
    cleanEmail === 's24b0382@siswa.umk.edu.my' ||
    cleanEmail === 'admin@kbelia.gov.my' ||
    cleanEmail === 'urusetia@kbelia.kelantan.gov.my'
  );
};

async function findMentorByEmail(email?: string | null): Promise<MentorProfile | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const initialMatch = INITIAL_MENTOR_PROFILES.find(m => m.email.toLowerCase() === cleanEmail);
  try {
    const snap = await getDocs(query(collection(db, 'mentor_profiles'), where('email', '==', cleanEmail)));
    if (!snap.empty) {
      return snap.docs[0].data() as MentorProfile;
    }
  } catch {
    // ignore and fall back to initial list
  }
  return initialMatch || null;
}

let anonymousAuthDisabled = false;
async function ensureDemoFirebaseAuth(): Promise<void> {
  if (anonymousAuthDisabled || auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
      anonymousAuthDisabled = true;
    }
  }
}

async function hashSecret(raw: string): Promise<string> {
  const salted = `kbelia_2026_salt::${raw}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(salted);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback when WebCrypto subtle is unavailable
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

const DEMO_MENTOR_PINS: Record<string, string> = {
  'mentor-1': '4821',
  'mentor-2': '5932',
  'mentor-3': '6714',
  'mentor-4': '7390'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialTab, setLoginInitialTab] = useState<'user' | 'admin' | 'mentor'>('user');
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);
  const [sessionCountdownSeconds, setSessionCountdownSeconds] = useState(60);

  const IDLE_WARNING_MS = 15 * 60 * 1000;
  const WARNING_COUNTDOWN_SEC = 60;
  const HARD_TIMEOUT_MS = IDLE_WARNING_MS + WARNING_COUNTDOWN_SEC * 1000;

  const userRef = useRef<AuthUser | null>(null);
  const warningOpenRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageSyncRef = useRef<number>(0);
  const warningDeadlineRef = useRef<number>(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    warningOpenRef.current = isSessionWarningOpen;
  }, [isSessionWarningOpen]);

  const clearStoredSession = useCallback(() => {
    try {
      sessionStorage.removeItem('niagabelia_session_token');
      sessionStorage.removeItem('niagabelia_auth_session');
      localStorage.removeItem('niagabelia_auth_session');
      localStorage.removeItem('niagabelia_last_activity');
    } catch {
      // ignore
    }
  }, []);

  const saveSession = useCallback((authUserObj: AuthUser, profileObj: UserProfile) => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastStorageSyncRef.current = now;
    warningOpenRef.current = false;
    setIsSessionWarningOpen(false);
    setSessionCountdownSeconds(WARNING_COUNTDOWN_SEC);

    const sessionToken = `kbelia_sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionPayload = JSON.stringify({ user: authUserObj, profile: profileObj, token: sessionToken });
    try {
      sessionStorage.setItem('niagabelia_session_token', sessionToken);
      sessionStorage.setItem('niagabelia_auth_session', sessionPayload);
      localStorage.setItem('niagabelia_auth_session', sessionPayload);
      localStorage.setItem('niagabelia_last_activity', now.toString());
    } catch (e) {
      console.warn('Session write error:', e);
    }
  }, []);

  const keepSessionActive = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastStorageSyncRef.current = now;
    warningOpenRef.current = false;
    setIsSessionWarningOpen(false);
    setSessionCountdownSeconds(WARNING_COUNTDOWN_SEC);
    try {
      if (localStorage.getItem('niagabelia_auth_session') || sessionStorage.getItem('niagabelia_auth_session')) {
        localStorage.setItem('niagabelia_last_activity', now.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  const terminateSessionDueToIdle = useCallback(async (manualSignOut = false) => {
    warningOpenRef.current = false;
    setIsSessionWarningOpen(false);
    setSessionCountdownSeconds(WARNING_COUNTDOWN_SEC);
    clearStoredSession();
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    setAuthError(null);
    if (!manualSignOut) {
      showToast({
        type: 'warning',
        title: 'Sesi Ditamatkan',
        message: 'Sesi anda telah ditamatkan secara automatik kerana tidak aktif selama 15 minit.'
      });
    }
    window.dispatchEvent(new CustomEvent('kbelia_session_terminated', { detail: { manual: manualSignOut } }));
  }, [clearStoredSession]);

  useEffect(() => {
    let unsubProfileDoc: (() => void) | null = null;

    // 1. Restore saved non-expired session cleanly
    try {
      const activeSessionStr =
        sessionStorage.getItem('niagabelia_auth_session') ||
        localStorage.getItem('niagabelia_auth_session');
      const lastActivityStr = localStorage.getItem('niagabelia_last_activity');
      const now = Date.now();

      if (activeSessionStr && lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (now - lastActivity > HARD_TIMEOUT_MS) {
          clearStoredSession();
          setUser(null);
          setUserProfile(null);
        } else {
          const parsed = JSON.parse(activeSessionStr);
          if (parsed.user && parsed.profile) {
            const normalizedUser =
              parsed.user.uid?.startsWith('demo-tenant-') && parsed.profile.fullName
                ? { ...parsed.user, displayName: parsed.profile.fullName }
                : parsed.user;
            setUser(normalizedUser);
            setUserProfile(parsed.profile);
            saveSession(normalizedUser, parsed.profile);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
      setUser(null);
      setUserProfile(null);
    }

    // 2. Activity Tracker for 15-minute idle warning + 60s countdown (for ALL user roles)
    const updateActivity = () => {
      if (!userRef.current || warningOpenRef.current) return;
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastStorageSyncRef.current >= 5000) {
        lastStorageSyncRef.current = now;
        try {
          if (localStorage.getItem('niagabelia_auth_session') || sessionStorage.getItem('niagabelia_auth_session')) {
            localStorage.setItem('niagabelia_last_activity', now.toString());
          }
        } catch {
          // ignore
        }
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    const intervalCheck = setInterval(() => {
      if (!userRef.current) return;

      const now = Date.now();
      if (!warningOpenRef.current) {
        const elapsed = now - lastActivityRef.current;
        if (elapsed >= HARD_TIMEOUT_MS) {
          terminateSessionDueToIdle(false);
        } else if (elapsed >= IDLE_WARNING_MS) {
          const remainingMs = Math.max(0, HARD_TIMEOUT_MS - elapsed);
          warningDeadlineRef.current = now + remainingMs;
          warningOpenRef.current = true;
          setIsSessionWarningOpen(true);
          setSessionCountdownSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
        }
      } else {
        const remainingSec = Math.max(0, Math.ceil((warningDeadlineRef.current - now) / 1000));
        setSessionCountdownSeconds(remainingSec);
        if (remainingSec <= 0) {
          terminateSessionDueToIdle(false);
        }
      }
    }, 1000);

    // 3. Real Firebase Auth State Listener with clean nested listener cleanup
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubProfileDoc) {
        unsubProfileDoc();
        unsubProfileDoc = null;
      }

      if (currentUser) {
        if (currentUser.isAnonymous) {
          // Preserve active Demo/Sandbox persona while keeping Firebase Anonymous transport alive
          try {
            const saved =
              sessionStorage.getItem('niagabelia_auth_session') ||
              localStorage.getItem('niagabelia_auth_session');
            const lastAct = localStorage.getItem('niagabelia_last_activity');
            if (saved && lastAct && Date.now() - parseInt(lastAct, 10) <= HARD_TIMEOUT_MS) {
              const parsed = JSON.parse(saved);
              if (parsed.user && parsed.profile && parsed.user.isDemo) {
                setUser(parsed.user);
                setUserProfile(parsed.profile);
                lastActivityRef.current = parseInt(lastAct, 10);
                setLoading(false);
                return;
              }
            }
          } catch {
            // ignore
          }
          setLoading(false);
          return;
        }

        const lastActivityStr = localStorage.getItem('niagabelia_last_activity');
        if (lastActivityStr && Date.now() - parseInt(lastActivityStr, 10) > HARD_TIMEOUT_MS) {
          clearStoredSession();
          await fbSignOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        const authUserObj: AuthUser = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          isDemo: false
        };
        setUser(authUserObj);
        lastActivityRef.current = Date.now();
        localStorage.setItem('niagabelia_last_activity', lastActivityRef.current.toString());

        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            const prof = snapshot.data() as UserProfile;
            setUserProfile(prof);
            saveSession(authUserObj, prof);
          } else {
            const isUserAdmin = checkIsAdminEmail(currentUser.email);
            const matchedMentor = !isUserAdmin && currentUser.emailVerified
              ? await findMentorByEmail(currentUser.email)
              : null;
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              fullName: matchedMentor?.name || currentUser.displayName || 'Belia Kelantan',
              email: currentUser.email || '',
              role: isUserAdmin ? 'admin' : matchedMentor ? 'mentor' : 'user',
              ...(matchedMentor ? { mentorId: matchedMentor.id, phone: matchedMentor.phone } : {}),
              avatarUrl: matchedMentor?.avatarUrl || currentUser.photoURL || '/assets/generated/avatar_youth_male_1793924250192.jpg',
              district: 'Kota Bharu',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            saveSession(authUserObj, newProfile);
          }
        } catch (err) {
          console.warn('Notice: Firestore user profile fallback activated:', err);
          const isUserAdmin = checkIsAdminEmail(currentUser.email);
          const fallbackProfile: UserProfile = {
            userId: currentUser.uid,
            fullName: currentUser.displayName || 'Belia Kelantan',
            email: currentUser.email || '',
            role: isUserAdmin ? 'admin' : 'user',
            avatarUrl: currentUser.photoURL || '/assets/generated/avatar_youth_male_1793924250192.jpg',
            district: 'Kota Bharu',
            createdAt: new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
        }

        unsubProfileDoc = onSnapshot(
          userDocRef,
          docSnap => {
            if (docSnap.exists()) {
              const updatedProf = docSnap.data() as UserProfile;
              setUserProfile(updatedProf);
              saveSession(authUserObj, updatedProf);
            }
          },
          err => {
            console.warn('Realtime profile listener notice:', err.message);
          }
        );

        setLoading(false);
      } else {
        // Restore Demo or Local Registered session if still valid
        try {
          const saved =
            sessionStorage.getItem('niagabelia_auth_session') ||
            localStorage.getItem('niagabelia_auth_session');
          const lastAct = localStorage.getItem('niagabelia_last_activity');
          if (saved && lastAct && Date.now() - parseInt(lastAct, 10) <= HARD_TIMEOUT_MS) {
            const parsed = JSON.parse(saved);
            if (parsed.user && parsed.profile && parsed.user.isDemo) {
              setUser(parsed.user);
              setUserProfile(parsed.profile);
              lastActivityRef.current = parseInt(lastAct, 10);
              setLoading(false);
              void ensureDemoFirebaseAuth();
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfileDoc) unsubProfileDoc();
      activityEvents.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(intervalCheck);
    };
  }, [clearStoredSession, saveSession, terminateSessionDueToIdle]);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;

      const authUserData: AuthUser = {
        uid: loggedUser.uid,
        displayName: loggedUser.displayName,
        email: loggedUser.email,
        photoURL: loggedUser.photoURL,
        isDemo: false
      };
      setUser(authUserData);

      const isUserAdmin = checkIsAdminEmail(loggedUser.email);
      const matchedMentor = !isUserAdmin && loggedUser.emailVerified
        ? await findMentorByEmail(loggedUser.email)
        : null;
      let profile: UserProfile = {
        userId: loggedUser.uid,
        fullName: matchedMentor?.name || loggedUser.displayName || 'Belia Kelantan',
        email: loggedUser.email || '',
        role: isUserAdmin ? 'admin' : matchedMentor ? 'mentor' : 'user',
        ...(matchedMentor ? { mentorId: matchedMentor.id, phone: matchedMentor.phone } : {}),
        avatarUrl: matchedMentor?.avatarUrl || loggedUser.photoURL || '/assets/generated/avatar_youth_male_1793924250192.jpg',
        district: 'Kota Bharu',
        createdAt: new Date().toISOString()
      };

      try {
        const userDocRef = doc(db, 'users', loggedUser.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          profile = snapshot.data() as UserProfile;
        } else {
          await setDoc(userDocRef, profile);
        }
      } catch (err) {
        console.warn('Could not sync user profile to remote database:', err);
      }

      setUserProfile(profile);
      saveSession(authUserData, profile);
      setIsLoginModalOpen(false);
      return { success: true };
    } catch (error: any) {
      const code = error?.code || '';
      let message = 'Gagal log masuk dengan Google.';
      if (code === 'auth/network-request-failed') {
        message =
          'Popup Google disekat oleh tetapan rangkaian atau sandbox iframe. Gunakan Mod Demo Pembangunan di bawah jika mahu menguji aliran sistem.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Tetingkap popup disekat oleh pelayar web. Sila benarkan popup atau gunakan Mod Demo Pembangunan.';
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'Tetingkap log masuk Google telah ditutup sebelum selesai.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (
    email: string,
    pass: string,
    targetRole: 'admin' | 'user' | 'mentor'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        const msg = 'Sila masukkan alamat emel rasmi anda.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
      if (!pass || pass.length < 4) {
        const msg = 'Sila masukkan kata laluan atau PIN keselamatan sekurang-kurangnya 4 aksara.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // 1. MENTOR LOGIN (Strict email match — NO fallback to mentorList[0])
      if (targetRole === 'mentor') {
        let mentorList = INITIAL_MENTOR_PROFILES;
        try {
          const cached = localStorage.getItem('kbelia_mentor_profiles');
          if (cached) mentorList = JSON.parse(cached);
        } catch {
          // ignore
        }

        const matchedMentor = mentorList.find(m => m.email.toLowerCase() === cleanEmail);
        if (!matchedMentor) {
          const msg = `Emel "${cleanEmail}" tidak didaftarkan sebagai Mentor bertauliah. Gunakan butang Demo Mentor di bawah untuk ujian pembangunan.`;
          setAuthError(msg);
          return { success: false, error: msg };
        }

        const expectedPin = DEMO_MENTOR_PINS[matchedMentor.id] || matchedMentor.pin;
        if (!expectedPin || pass !== expectedPin) {
          const msg = 'PIN keselamatan Mentor tidak tepat. Untuk ujian pantas, gunakan butang Demo Mentor di bawah.';
          setAuthError(msg);
          return { success: false, error: msg };
        }

        const userId = `mentor-${matchedMentor.id}`;
        const authUserData: AuthUser = {
          uid: userId,
          displayName: matchedMentor.name,
          email: matchedMentor.email,
          photoURL: matchedMentor.avatarUrl || '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
          isDemo: true
        };
        const userProf: UserProfile = {
          userId,
          fullName: matchedMentor.name,
          email: matchedMentor.email,
          role: 'mentor',
          mentorId: matchedMentor.id,
          phone: matchedMentor.phone,
          district: 'Kota Bharu',
          avatarUrl: authUserData.photoURL || undefined,
          createdAt: new Date().toISOString()
        };

        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);
        setIsLoginModalOpen(false);
        void ensureDemoFirebaseAuth();
        return { success: true };
      }

      // 2. ADMIN LOGIN (Must use authorized admin email — NO random emails or backdoors)
      if (targetRole === 'admin') {
        if (!checkIsAdminEmail(cleanEmail)) {
          const msg = 'Emel ini tiada kebenaran Pentadbir Sistem. Sila log masuk menggunakan akaun Google Pentadbir yang sah.';
          setAuthError(msg);
          return { success: false, error: msg };
        }

        // Try Firebase Auth email/password first if configured
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          const fbUser = cred.user;
          const authUserData: AuthUser = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Pentadbir KBelia',
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            isDemo: false
          };
          const userProf: UserProfile = {
            userId: fbUser.uid,
            fullName: fbUser.displayName || 'Pentadbir Sistem KBelia',
            email: fbUser.email || cleanEmail,
            role: 'admin',
            district: 'Kota Bharu',
            avatarUrl: fbUser.photoURL || '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
            createdAt: new Date().toISOString()
          };
          setUser(authUserData);
          setUserProfile(userProf);
          saveSession(authUserData, userProf);
          setIsLoginModalOpen(false);
          return { success: true };
        } catch {
          const msg = 'Untuk keselamatan produksi, akaun Pentadbir hendaklah log masuk menggunakan Google Auth rasmi atau butang Demo Admin di bahagian pengujian.';
          setAuthError(msg);
          return { success: false, error: msg };
        }
      }

      // 3. REGULAR USER / USAHAWAN LOGIN
      // Reject admin login attempt inside entrepreneur tab unless authorized
      if (checkIsAdminEmail(cleanEmail)) {
        const msg = 'Emel pentadbir hendaklah menggunakan Log Masuk Google atau tab Pentadbir.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // Attempt real Firebase Email/Password authentication first
      try {
        const fbCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUser = fbCred.user;
        const userDocRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        const profileData: UserProfile = docSnap.exists()
          ? (docSnap.data() as UserProfile)
          : {
              userId: fbUser.uid,
              fullName: fbUser.displayName || cleanEmail.split('@')[0],
              email: cleanEmail,
              role: 'user',
              district: 'Kota Bharu',
              avatarUrl: fbUser.photoURL || '/assets/generated/avatar_youth_male_1793924250192.jpg',
              createdAt: new Date().toISOString()
            };

        const authUserData: AuthUser = {
          uid: fbUser.uid,
          displayName: profileData.fullName,
          email: cleanEmail,
          photoURL: profileData.avatarUrl || null,
          isDemo: false
        };
        setUser(authUserData);
        setUserProfile(profileData);
        saveSession(authUserData, profileData);
        setIsLoginModalOpen(false);
        return { success: true };
      } catch (fbErr: any) {
        // Fallback to local hashed registered account (when Email/Password provider is disabled in Firebase Console)
        let registeredUsers: StoredLocalAccount[] = [];
        try {
          const stored = localStorage.getItem(REGISTERED_USERS_KEY);
          if (stored) registeredUsers = JSON.parse(stored);
        } catch {
          // ignore
        }

        const matchedLocalUser = registeredUsers.find(
          u => u.email.trim().toLowerCase() === cleanEmail
        );

        if (!matchedLocalUser) {
          const notFoundMsg = `Akaun emel "${cleanEmail}" tidak dijumpai atau kata laluan tidak sah. Sila daftar akaun baharu atau log masuk dengan Google.`;
          setAuthError(notFoundMsg);
          return { success: false, error: notFoundMsg };
        }

        const incomingHash = await hashSecret(pass);
        if (incomingHash !== matchedLocalUser.passwordHash) {
          const passErr = 'Kata laluan yang anda masukkan tidak sah. Sila semak semula kata laluan anda.';
          setAuthError(passErr);
          return { success: false, error: passErr };
        }

        const authUserData: AuthUser = {
          uid: matchedLocalUser.userId,
          displayName: matchedLocalUser.fullName,
          email: cleanEmail,
          photoURL: matchedLocalUser.avatarUrl || '/assets/generated/avatar_youth_male_1793924250192.jpg',
          isDemo: true
        };

        const userProf: UserProfile = {
          userId: matchedLocalUser.userId,
          fullName: matchedLocalUser.fullName,
          email: cleanEmail,
          role: 'user',
          phone: matchedLocalUser.phone || '+60110000000',
          district: matchedLocalUser.district || 'Kota Bharu',
          businessName: matchedLocalUser.businessName,
          avatarUrl: authUserData.photoURL || undefined,
          createdAt: matchedLocalUser.createdAt
        };

        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);
        setIsLoginModalOpen(false);
        void ensureDemoFirebaseAuth();
        return { success: true };
      }
    } catch (e: any) {
      const msg = e?.message || 'Gagal memproses log masuk.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const registerNewUser = async (
    name: string,
    email: string,
    district: string,
    phone: string,
    businessName?: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);
      if (!name.trim() || !email.trim()) {
        const msg = 'Sila lengkapkan nama penuh dan alamat emel.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const rawPassword = (password || '').trim();
      if (rawPassword.length < 6) {
        const msg = 'Kata laluan mestilah sekurang-kurangnya 6 aksara.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Try real Firebase Auth registration first
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, rawPassword);
        const fbUser = cred.user;
        await updateProfile(fbUser, { displayName: name.trim() });

        const authUserData: AuthUser = {
          uid: fbUser.uid,
          displayName: name.trim(),
          email: cleanEmail,
          photoURL: '/assets/generated/avatar_youth_male_1793924250192.jpg',
          isDemo: false
        };

        const userProf: UserProfile = {
          userId: fbUser.uid,
          fullName: name.trim(),
          email: cleanEmail,
          role: 'user',
          phone: phone.trim() || '+60110000000',
          district: district || 'Kota Bharu',
          avatarUrl: authUserData.photoURL || undefined,
          businessName: businessName?.trim() || undefined,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', fbUser.uid), userProf);
        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);
        setIsLoginModalOpen(false);
        return { success: true };
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/email-already-in-use') {
          const msg = 'Emel ini telah didaftarkan. Sila log masuk menggunakan akaun sedia ada.';
          setAuthError(msg);
          return { success: false, error: msg };
        }
        // If Email/Password provider is not enabled in Firebase Console, fall back to salted SHA-256 local sandbox registry
        const userId = `registered-${Date.now()}`;
        const passwordHash = await hashSecret(rawPassword);
        const avatarUrl = '/assets/generated/avatar_youth_male_1793924250192.jpg';

        const authUserData: AuthUser = {
          uid: userId,
          displayName: name.trim(),
          email: cleanEmail,
          photoURL: avatarUrl,
          isDemo: true
        };

        const userProf: UserProfile = {
          userId,
          fullName: name.trim(),
          email: cleanEmail,
          role: 'user',
          phone: phone.trim() || '+60110000000',
          district: district || 'Kota Bharu',
          avatarUrl,
          businessName: businessName?.trim() || undefined,
          createdAt: new Date().toISOString()
        };

        let registry: StoredLocalAccount[] = [];
        try {
          const existing = localStorage.getItem(REGISTERED_USERS_KEY);
          if (existing) registry = JSON.parse(existing);
        } catch {
          // ignore
        }

        if (registry.some(u => u.email.toLowerCase() === cleanEmail)) {
          const msg = 'Emel ini telah didaftarkan dalam mod tempatan. Sila log masuk.';
          setAuthError(msg);
          return { success: false, error: msg };
        }

        registry.push({
          userId,
          fullName: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || '+60110000000',
          district: district || 'Kota Bharu',
          businessName: businessName?.trim() || undefined,
          passwordHash,
          avatarUrl,
          createdAt: userProf.createdAt || new Date().toISOString()
        });
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registry));

        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);
        setIsLoginModalOpen(false);
        void ensureDemoFirebaseAuth();
        return { success: true };
      }
    } catch (e: any) {
      const msg = e?.message || 'Gagal mendaftar pengguna baru.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const loginAsDemoUser = (
    type: DemoAccountType,
    customData?: Partial<UserProfile>
  ) => {
    let authUser: AuthUser;
    let profile: UserProfile;

    if (type === 'admin') {
      authUser = {
        uid: 'admin-nabil-01',
        displayName: 'Nabil Wahab (Demo Pentadbir)',
        email: ADMIN_EMAIL,
        photoURL: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        isDemo: true
      };
      profile = {
        userId: 'admin-nabil-01',
        fullName: 'Nabil Wahab (Pentadbir KBelia)',
        email: ADMIN_EMAIL,
        role: 'admin',
        phone: '+60199001122',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'admin_sec') {
      authUser = {
        uid: 'admin-urusetia-02',
        displayName: 'Urusetia KBelia Kelantan (Demo)',
        email: 'urusetia@kbelia.kelantan.gov.my',
        photoURL: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        isDemo: true
      };
      profile = {
        userId: 'admin-urusetia-02',
        fullName: 'Pegawai Urusetia KBelia Kelantan',
        email: 'urusetia@kbelia.kelantan.gov.my',
        role: 'admin',
        phone: '+6097481000',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_faizul') {
      authUser = {
        uid: 'demo-tenant-1',
        displayName: 'Ahmad Faizul Bin Razak',
        email: 'faizul.artisan@gmail.com',
        photoURL: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        isDemo: true
      };
      profile = {
        userId: 'demo-tenant-1',
        fullName: 'Ahmad Faizul Bin Razak',
        email: 'faizul.artisan@gmail.com',
        role: 'user',
        phone: '+601123456789',
        district: 'Bachok',
        businessName: "D'Kelate Artisan Coffee & Pastry",
        ssmNumber: '202303123456 (TR0234123-X)',
        avatarUrl: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_syafiqah') {
      // Fixed UID alignment: demo-tenant-2 matches biz-02 (Batik Belia Kontemporari)
      authUser = {
        uid: 'demo-tenant-2',
        displayName: 'Nur Syafiqah Binti Zakaria',
        email: 'syafiqah.batik@gmail.com',
        photoURL: '/assets/generated/avatar_youth_female_1793924250745.jpg',
        isDemo: true
      };
      profile = {
        userId: 'demo-tenant-2',
        fullName: 'Nur Syafiqah Binti Zakaria',
        email: 'syafiqah.batik@gmail.com',
        role: 'user',
        phone: '+60198765432',
        district: 'Kota Bharu',
        businessName: 'Batik Belia Kontemporari',
        ssmNumber: '202403987654 (KT0192837-W)',
        avatarUrl: '/assets/generated/avatar_youth_female_1793924250745.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_harith') {
      // Fixed UID alignment: demo-tenant-3 matches biz-03 (Studio Belia Multimedia KB)
      authUser = {
        uid: 'demo-tenant-3',
        displayName: 'Muhammad Harith Bin Yusoff',
        email: 'harith.multimedia@gmail.com',
        photoURL: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        isDemo: true
      };
      profile = {
        userId: 'demo-tenant-3',
        fullName: 'Muhammad Harith Bin Yusoff',
        email: 'harith.multimedia@gmail.com',
        role: 'user',
        phone: '+60139988776',
        district: 'Kota Bharu',
        businessName: 'Studio Belia Multimedia KB',
        ssmNumber: '202403445566 (KT0298112-D)',
        avatarUrl: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_wanazhar') {
      authUser = {
        uid: 'user-mentor-1',
        displayName: 'Prof. Madya Dr. Wan Azhar',
        email: 'wanazhar@umk.edu.my',
        photoURL: '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        isDemo: true
      };
      profile = {
        userId: 'user-mentor-1',
        fullName: 'Prof. Madya Dr. Wan Azhar',
        email: 'wanazhar@umk.edu.my',
        role: 'mentor',
        mentorId: 'mentor-1',
        phone: '60199887711',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_sitiaminah') {
      authUser = {
        uid: 'user-mentor-2',
        displayName: 'Puan Siti Aminah Binti Yusof',
        email: 'sitiaminah.coach@insken.gov.my',
        photoURL: '/assets/generated/usahawan_belia_wanita.jpg',
        isDemo: true
      };
      profile = {
        userId: 'user-mentor-2',
        fullName: 'Puan Siti Aminah Binti Yusof',
        email: 'sitiaminah.coach@insken.gov.my',
        role: 'mentor',
        mentorId: 'mentor-2',
        phone: '60129876543',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/usahawan_belia_wanita.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_khairul') {
      authUser = {
        uid: 'user-mentor-3',
        displayName: 'En. Khairul Hafiz Bin Razali, CA',
        email: 'khairul.audit@smeadvisor.my',
        photoURL: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        isDemo: true
      };
      profile = {
        userId: 'user-mentor-3',
        fullName: 'En. Khairul Hafiz Bin Razali, CA',
        email: 'khairul.audit@smeadvisor.my',
        role: 'mentor',
        mentorId: 'mentor-3',
        phone: '60139123456',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_norazila') {
      authUser = {
        uid: 'user-mentor-4',
        displayName: 'Ts. Dr. Norazila Binti Mat Deris',
        email: 'norazila.fiat@umk.edu.my',
        photoURL: '/assets/generated/avatar_youth_female_1793924250745.jpg',
        isDemo: true
      };
      profile = {
        userId: 'user-mentor-4',
        fullName: 'Ts. Dr. Norazila Binti Mat Deris',
        email: 'norazila.fiat@umk.edu.my',
        role: 'mentor',
        mentorId: 'mentor-4',
        phone: '60145556677',
        district: 'Jeli',
        avatarUrl: '/assets/generated/avatar_youth_female_1793924250745.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else {
      const guestId = `guest-${Date.now()}`;
      authUser = {
        uid: guestId,
        displayName: 'Usahawan Belia (Pelawat Demo)',
        email: 'belia.kelantan@niaga.my',
        photoURL: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        isDemo: true
      };
      profile = {
        userId: guestId,
        fullName: 'Usahawan Belia Kelantan',
        email: 'belia.kelantan@niaga.my',
        role: 'user',
        phone: '+60190000000',
        district: 'Kota Bharu',
        avatarUrl: '/assets/generated/avatar_youth_male_1793924250192.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    }

    saveSession(authUser, profile);
    setUser(authUser);
    setUserProfile(profile);
    setAuthError(null);
    setIsLoginModalOpen(false);
    void ensureDemoFirebaseAuth();
  };

  const logout = async () => {
    warningOpenRef.current = false;
    setIsSessionWarningOpen(false);
    setSessionCountdownSeconds(WARNING_COUNTDOWN_SEC);
    try {
      clearStoredSession();
      await fbSignOut(auth);
    } catch (error) {
      console.warn('Firebase logout notice:', error);
    } finally {
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    }
  };

  const terminateSessionNow = useCallback(async () => {
    await terminateSessionDueToIdle(true);
  }, [terminateSessionDueToIdle]);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    // Strictly forbid self-escalation or tampering with RBAC/identity fields from client
    const safeData = { ...data };
    delete safeData.role;
    delete safeData.mentorId;
    delete safeData.userId;
    const updated = { ...(userProfile || {}), ...safeData } as UserProfile;
    setUserProfile(updated);
    saveSession(user, updated);

    if (!user.isDemo && auth.currentUser) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, safeData, { merge: true });
      } catch (error) {
        console.warn('Could not sync updated profile to firestore:', error);
      }
    }
  };

  const changeUserPassword = async (
    newPassword: string,
    currentPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.' };
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      }

      if (user?.uid?.startsWith('registered-')) {
        if (!currentPassword) {
          return { success: false, error: 'Sila masukkan kata laluan semasa anda untuk pengesahan.' };
        }
        const storedRaw = localStorage.getItem(REGISTERED_USERS_KEY);
        const registry: StoredLocalAccount[] = storedRaw ? JSON.parse(storedRaw) : [];
        const idx = registry.findIndex(u => u.userId === user.uid);
        if (idx === -1) {
          return { success: false, error: 'Rekod akaun berdaftar tidak dijumpai.' };
        }
        const currHash = await hashSecret(currentPassword);
        if (currHash !== registry[idx].passwordHash) {
          return { success: false, error: 'Kata laluan semasa tidak sepadan.' };
        }
        registry[idx].passwordHash = await hashSecret(newPassword);
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registry));
        return { success: true };
      }

      if (user?.isDemo) {
        return {
          success: false,
          error: 'Akaun Mod Demo pembangunan menggunakan profil tetap dan tidak menyokong penukaran kata laluan.'
        };
      }

      return { success: false, error: 'Tiada pengguna aktif untuk menukar kata laluan.' };
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        return {
          success: false,
          error: 'Demi keselamatan akaun, sila log keluar dan log masuk semula sebelum menukar kata laluan anda.'
        };
      }
      return {
        success: false,
        error: err?.message || 'Gagal mengemas kini kata laluan. Sila cuba lagi.'
      };
    }
  };

  const isDemoSession = Boolean(user?.isDemo);

  const isAdmin = Boolean(
    user && (
      userProfile?.role === 'admin' ||
      (!isDemoSession && checkIsAdminEmail(user.email))
    )
  );
  const isMentor = Boolean(user && !isAdmin && userProfile?.role === 'mentor');
  const isYouth = Boolean(user && !isAdmin && !isMentor);
  const userRole: 'admin' | 'mentor' | 'user' | 'guest' = !user
    ? 'guest'
    : isAdmin
    ? 'admin'
    : isMentor
    ? 'mentor'
    : 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        isMentor,
        isYouth,
        userRole,
        isDemoSession,
        loading,
        authError,
        isLoginModalOpen,
        loginInitialTab,
        openLoginModal: (tab?: 'user' | 'admin' | 'mentor') => {
          if (tab) setLoginInitialTab(tab);
          setIsLoginModalOpen(true);
        },
        closeLoginModal: () => {
          setIsLoginModalOpen(false);
          setAuthError(null);
        },
        loginWithGoogle,
        loginWithCredentials,
        registerNewUser,
        loginAsDemoUser,
        logout,
        isSessionWarningOpen,
        sessionCountdownSeconds,
        keepSessionActive,
        terminateSessionNow,
        clearAuthError,
        updateProfileData,
        changeUserPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
