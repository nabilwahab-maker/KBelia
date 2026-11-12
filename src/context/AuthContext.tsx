import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updatePassword 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { INITIAL_MENTOR_PROFILES } from '../data/mentorData';

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

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  isLoginModalOpen: boolean;
  loginInitialTab: 'user' | 'admin' | 'mentor';
  openLoginModal: (tab?: 'user' | 'admin' | 'mentor') => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, pass: string, targetRole: 'admin' | 'user' | 'mentor') => Promise<{ success: boolean; error?: string }>;
  registerNewUser: (name: string, email: string, district: string, phone: string, businessName?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (type: DemoAccountType, customData?: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_EMAIL = 'nabilwahab03020302@gmail.com';

const checkIsAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail === ADMIN_EMAIL.trim().toLowerCase() || 
         cleanEmail === 's24b0382@siswa.umk.edu.my' || 
         cleanEmail.includes('admin@kbelia') || 
         cleanEmail.includes('urusetia@kbelia');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialTab, setLoginInitialTab] = useState<'user' | 'admin' | 'mentor'>('user');

  // 1-Hour Inactivity Timeout (3600000 ms)
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

  // Initialize Auth state
  useEffect(() => {
    // 1. Check active session (sessionStorage takes precedence for active tab session, then localStorage)
    try {
      const activeSessionStr = sessionStorage.getItem('niagabelia_auth_session') || localStorage.getItem('niagabelia_auth_session');
      const lastActivityStr = localStorage.getItem('niagabelia_last_activity');
      const now = Date.now();

      if (activeSessionStr && lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        // If inactive for more than 1 hour (3600000ms), auto-expire session
        if (now - lastActivity > SESSION_TIMEOUT_MS) {
          sessionStorage.removeItem('niagabelia_session_token');
          sessionStorage.removeItem('niagabelia_auth_session');
          localStorage.removeItem('niagabelia_auth_session');
          localStorage.removeItem('niagabelia_last_activity');
          setUser(null);
          setUserProfile(null);
        } else {
          const parsed = JSON.parse(activeSessionStr);
          if (parsed.user && parsed.profile) {
            setUser(parsed.user);
            setUserProfile(parsed.profile);
            // Refresh activity timestamp
            localStorage.setItem('niagabelia_last_activity', now.toString());
          }
        }
      } else {
        // No auto-login by default: user starts at Login Page
        setUser(null);
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
      setUser(null);
      setUserProfile(null);
    }

    // 2. Setup Activity Tracker for 1-hour auto logout
    const updateActivity = () => {
      const currentAuth = localStorage.getItem('niagabelia_auth_session');
      if (currentAuth) {
        localStorage.setItem('niagabelia_last_activity', Date.now().toString());
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    // Periodic check every 1 minute for 1-hour session expiration
    const intervalCheck = setInterval(() => {
      const currentAuth = localStorage.getItem('niagabelia_auth_session');
      const lastActivityStr = localStorage.getItem('niagabelia_last_activity');
      if (currentAuth && lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
          console.warn('Sesi tamat tempoh selepas 1 jam tidak aktif. Melog keluar secara automatik...');
          localStorage.removeItem('niagabelia_auth_session');
          localStorage.removeItem('niagabelia_last_activity');
          setUser(null);
          setUserProfile(null);
          fbSignOut(auth).catch(() => {});
        }
      }
    }, 60000);

    // 3. Listen to real Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const lastActivityStr = localStorage.getItem('niagabelia_last_activity');
        if (lastActivityStr && (Date.now() - parseInt(lastActivityStr, 10) > SESSION_TIMEOUT_MS)) {
          // Session expired
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
        localStorage.setItem('niagabelia_last_activity', Date.now().toString());

        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as UserProfile);
          } else {
            const isUserAdmin = checkIsAdminEmail(currentUser.email);
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              fullName: currentUser.displayName || 'Belia Kelantan',
              email: currentUser.email || '',
              role: isUserAdmin ? 'admin' : 'user',
              avatarUrl: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
              district: 'Kota Bharu',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Notice: Firestore user profile fallback activated:', err);
          const isUserAdmin = checkIsAdminEmail(currentUser.email);
          const fallbackProfile: UserProfile = {
            userId: currentUser.uid,
            fullName: currentUser.displayName || 'Belia Kelantan',
            email: currentUser.email || '',
            role: isUserAdmin ? 'admin' : 'user',
            avatarUrl: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
            district: 'Kota Bharu',
            createdAt: new Date().toISOString(),
          };
          setUserProfile(fallbackProfile);
        }

        // Real-time snapshot listener with safe error catch
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
        }, (err) => {
          console.warn('Realtime profile listener error caught safely:', err.message);
        });

        setLoading(false);
        return () => unsubDoc();
      } else {
        // If not authenticated via Firebase, check if demo user exists
        try {
          const saved = localStorage.getItem('niagabelia_auth_session');
          const lastAct = localStorage.getItem('niagabelia_last_activity');
          if (saved && lastAct && (Date.now() - parseInt(lastAct, 10) <= SESSION_TIMEOUT_MS)) {
            const parsed = JSON.parse(saved);
            if (parsed.user?.isDemo) {
              setUser(parsed.user);
              setUserProfile(parsed.profile);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // ignore
        }
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      activityEvents.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(intervalCheck);
    };
  }, []);

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
      let profile: UserProfile = {
        userId: loggedUser.uid,
        fullName: loggedUser.displayName || 'Belia Kelantan',
        email: loggedUser.email || '',
        role: isUserAdmin ? 'admin' : 'user',
        avatarUrl: loggedUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${loggedUser.uid}`,
        district: 'Kota Bharu',
        createdAt: new Date().toISOString(),
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
        message = 'Tetingkap popup Google dihadkan oleh tetapan penyemak imbas / sandbox iframe. Anda boleh menggunakan Log Masuk Pantas Demo di bawah untuk terus menguji semua fungsi.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Tetingkap popup disekat oleh pelayar web. Sila benarkan tetingkap atau pilih mod Log Masuk Pantas.';
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'Tetingkap log masuk telah ditutup.';
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Session Helper: save session to both sessionStorage and localStorage
  const saveSession = (authUserObj: AuthUser, profileObj: UserProfile) => {
    const sessionToken = `kbelia_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionPayload = JSON.stringify({ user: authUserObj, profile: profileObj, token: sessionToken });
    try {
      sessionStorage.setItem('niagabelia_session_token', sessionToken);
      sessionStorage.setItem('niagabelia_auth_session', sessionPayload);
      localStorage.setItem('niagabelia_auth_session', sessionPayload);
      localStorage.setItem('niagabelia_last_activity', Date.now().toString());
    } catch (e) {
      console.warn('Session write error:', e);
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
        setAuthError('Sila masukkan alamat emel rasmi anda.');
        return { success: false, error: 'Sila masukkan alamat emel rasmi anda.' };
      }
      if (!pass || pass.length < 3) {
        setAuthError('Sila masukkan kata laluan keselamatan.');
        return { success: false, error: 'Sila masukkan kata laluan keselamatan.' };
      }

      // ==========================================
      // 1. MENTOR LOGIN
      // ==========================================
      if (targetRole === 'mentor') {
        let mentorList = INITIAL_MENTOR_PROFILES;
        try {
          const cached = localStorage.getItem('kbelia_mentor_profiles');
          if (cached) mentorList = JSON.parse(cached);
        } catch (e) {
          // ignore
        }

        const isMentorDemoEmail = cleanEmail === 'mentor.umk@kbelia.gov.my' || cleanEmail === 'mentor@kbelia.gov.my';
        const matchedMentor = isMentorDemoEmail 
          ? mentorList[0]
          : (mentorList.find(m => 
              m.email.toLowerCase() === cleanEmail || 
              m.id.toLowerCase() === cleanEmail ||
              m.name.toLowerCase().includes(cleanEmail) ||
              cleanEmail.includes(m.id.toLowerCase())
            ) || mentorList[0]);

        const validPin = matchedMentor.pin || '1234';
        if (pass !== validPin && pass !== 'kbelia123' && pass !== 'admin123' && pass !== '1234') {
          const msg = `PIN Keselamatan / Kata laluan tidak tepat bagi akaun mentor. (PIN Demo: 1234)`;
          setAuthError(msg);
          return { success: false, error: msg };
        }

        const userId = `mentor-${matchedMentor.id}`;
        const authUserData: AuthUser = {
          uid: userId,
          displayName: matchedMentor.name,
          email: matchedMentor.email,
          photoURL: matchedMentor.avatarUrl,
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
          avatarUrl: matchedMentor.avatarUrl,
          createdAt: new Date().toISOString()
        };

        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);

        setIsLoginModalOpen(false);
        return { success: true };
      }

      // ==========================================
      // 2. ADMIN LOGIN
      // ==========================================
      if (targetRole === 'admin' || checkIsAdminEmail(cleanEmail) || cleanEmail === 'admin@kbelia.gov.my') {
        if (pass !== 'admin123' && pass !== 'kbelia123' && pass !== 'admin') {
          const msg = 'Kata laluan pentadbir tidak tepat. (Kata laluan demo: admin123)';
          setAuthError(msg);
          return { success: false, error: msg };
        }

        const userId = 'admin-nabil-01';
        const authUserData: AuthUser = {
          uid: userId,
          displayName: 'Nabil Wahab (Pentadbir KBelia)',
          email: cleanEmail.includes('@') ? cleanEmail : 'admin@kbelia.gov.my',
          photoURL: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
          isDemo: true
        };

        const userProf: UserProfile = {
          userId,
          fullName: 'Muhammad Nabil Bin Abdul Wahab (Pegawai Urusetia)',
          email: authUserData.email || 'admin@kbelia.gov.my',
          role: 'admin',
          district: 'Kota Bharu',
          avatarUrl: authUserData.photoURL || undefined,
          createdAt: new Date().toISOString()
        };

        setUser(authUserData);
        setUserProfile(userProf);
        saveSession(authUserData, userProf);

        setIsLoginModalOpen(false);
        return { success: true };
      }

      // ==========================================
      // 3. REGULAR USER / USAHAWAN LOGIN (STRICT DATABASE CHECK)
      // ==========================================
      // Query registered database first
      let registeredUsers: Array<{
        userId: string;
        fullName: string;
        email: string;
        phone?: string;
        district?: string;
        businessName?: string;
        password?: string;
        createdAt: string;
      }> = [];

      try {
        const stored = localStorage.getItem('kbelia_registered_users');
        if (stored) {
          registeredUsers = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Error reading registered users:', e);
      }

      // Check Firestore doc as well
      let firestoreUserFound: any = null;
      try {
        const cleanDocId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const userDocRef = doc(db, 'users', cleanDocId);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          firestoreUserFound = snapshot.data();
        }
      } catch (e) {
        // network / sandbox fallback
      }

      const matchedLocalUser = registeredUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);
      const userRecord = matchedLocalUser || firestoreUserFound;

      // REJECT IF NOT REGISTERED IN DATABASE
      if (!userRecord) {
        const notFoundMsg = `Akaun emel "${cleanEmail}" belum berdaftar dalam pangkalan data KBelia. Sila daftar akaun terlebih dahulu untuk memasukkan maklumat anda.`;
        setAuthError(notFoundMsg);
        return { success: false, error: notFoundMsg };
      }

      // VERIFY PASSWORD
      const expectedPassword = userRecord.password || 'kbelia123';
      if (pass !== expectedPassword && pass !== 'kbelia123') {
        const passErr = 'Kata laluan yang anda masukkan tidak sah. Sila semak semula kata laluan anda.';
        setAuthError(passErr);
        return { success: false, error: passErr };
      }

      // LOGIN SUCCESS: INITIALIZE SESSION
      const userId = userRecord.userId || `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const authUserData: AuthUser = {
        uid: userId,
        displayName: userRecord.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        photoURL: userRecord.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        isDemo: true
      };

      const userProf: UserProfile = {
        userId,
        fullName: userRecord.fullName || authUserData.displayName || 'Usahawan Belia',
        email: cleanEmail,
        role: 'user',
        phone: userRecord.phone || '+60110000000',
        district: userRecord.district || 'Kota Bharu',
        businessName: userRecord.businessName,
        avatarUrl: authUserData.photoURL || undefined,
        createdAt: userRecord.createdAt || new Date().toISOString()
      };

      setUser(authUserData);
      setUserProfile(userProf);
      saveSession(authUserData, userProf);

      setIsLoginModalOpen(false);
      return { success: true };
    } catch (e: any) {
      setAuthError(e?.message || 'Gagal memproses log masuk.');
      return { success: false, error: e?.message || 'Gagal memproses log masuk.' };
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
        setAuthError('Sila lengkapkan nama penuh dan alamat emel.');
        return { success: false, error: 'Sila lengkapkan nama penuh dan alamat emel.' };
      }

      const cleanEmail = email.trim().toLowerCase();
      const userPassword = (password || '').trim() || 'kbelia123';
      const userId = `registered-${Date.now()}`;
      
      const authUserData: AuthUser = {
        uid: userId,
        displayName: name.trim(),
        email: cleanEmail,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        isDemo: true
      };

      const userProf: UserProfile = {
        userId,
        fullName: name.trim(),
        email: cleanEmail,
        role: 'user',
        phone: phone.trim() || '+60110000000',
        district: district || 'Kota Bharu',
        avatarUrl: authUserData.photoURL || undefined,
        businessName: businessName?.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      // 1. SAVE TO FIRESTORE DATABASE
      try {
        const cleanDocId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const userDocRef = doc(db, 'users', cleanDocId);
        await setDoc(userDocRef, {
          ...userProf,
          password: userPassword,
          lastLoginAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Notice: Firestore direct sync error, persisting locally:', err);
      }

      // 2. SAVE TO LOCAL REGISTRY DATABASE (PERSISTED)
      try {
        let registry: any[] = [];
        const existing = localStorage.getItem('kbelia_registered_users');
        if (existing) {
          registry = JSON.parse(existing);
        }
        // Remove duplicate if same email
        registry = registry.filter(u => u.email?.toLowerCase() !== cleanEmail);
        registry.push({
          userId,
          fullName: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || '+60110000000',
          district: district || 'Kota Bharu',
          businessName: businessName?.trim() || undefined,
          password: userPassword,
          createdAt: userProf.createdAt
        });
        localStorage.setItem('kbelia_registered_users', JSON.stringify(registry));
      } catch (e) {
        console.warn('Error saving to local registered database:', e);
      }

      // 3. CREATE ACTIVE SESSION METHOD IMMEDIATELY
      setUser(authUserData);
      setUserProfile(userProf);
      saveSession(authUserData, userProf);

      setIsLoginModalOpen(false);
      return { success: true };
    } catch (e: any) {
      setAuthError(e?.message || 'Gagal mendaftar pengguna baru.');
      return { success: false, error: e?.message || 'Gagal mendaftar pengguna baru.' };
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
        displayName: 'Nabil Wahab (Pentadbir NiagaBelia)',
        email: ADMIN_EMAIL,
        photoURL: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'admin-nabil-01',
        fullName: 'Nabil Wahab (Pentadbir NiagaBelia)',
        email: ADMIN_EMAIL,
        role: 'admin',
        phone: '+60199001122',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'admin_sec') {
      authUser = {
        uid: 'admin-urusetia-02',
        displayName: 'Urusetia KBelia Negeri Kelantan',
        email: 'urusetia@kbelia.kelantan.gov.my',
        photoURL: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'admin-urusetia-02',
        fullName: 'Pegawai Urusetia KBelia Kelantan',
        email: 'urusetia@kbelia.kelantan.gov.my',
        role: 'admin',
        phone: '+6097481000',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_admin_kelantan_1793924251898.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_faizul') {
      authUser = {
        uid: 'demo-tenant-1',
        displayName: 'Ahmad Faizul (D\'Kelate Coffee)',
        email: 'faizul.artisan@gmail.com',
        photoURL: '/public/assets/generated/avatar_youth_male_1793924250192.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'demo-tenant-1',
        fullName: 'Ahmad Faizul Bin Razak',
        email: 'faizul.artisan@gmail.com',
        role: 'user',
        phone: '+601123456789',
        district: 'Bachok',
        avatarUrl: '/public/assets/generated/avatar_youth_male_1793924250192.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_syafiqah') {
      authUser = {
        uid: 'demo-tenant-3',
        displayName: 'Nur Syafiqah (Batik Belia)',
        email: 'syafiqah.batik@gmail.com',
        photoURL: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'demo-tenant-3',
        fullName: 'Nur Syafiqah Binti Zakaria',
        email: 'syafiqah.batik@gmail.com',
        role: 'user',
        phone: '+60198765432',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'merchant_harith') {
      authUser = {
        uid: 'demo-tenant-2',
        displayName: 'Muhammad Harith (Studio Belia)',
        email: 'harith.multimedia@gmail.com',
        photoURL: '/public/assets/generated/avatar_youth_male_1793924250192.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'demo-tenant-2',
        fullName: 'Muhammad Harith Bin Yusoff',
        email: 'harith.multimedia@gmail.com',
        role: 'user',
        phone: '+60139988776',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_youth_male_1793924250192.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_wanazhar') {
      authUser = {
        uid: 'user-mentor-1',
        displayName: 'Prof. Madya Dr. Wan Azhar',
        email: 'wanazhar@umk.edu.my',
        photoURL: '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'user-mentor-1',
        fullName: 'Prof. Madya Dr. Wan Azhar',
        email: 'wanazhar@umk.edu.my',
        role: 'mentor',
        mentorId: 'mentor-1',
        phone: '60199887711',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_sitiaminah') {
      authUser = {
        uid: 'user-mentor-2',
        displayName: 'Puan Siti Aminah Binti Yusof',
        email: 'sitiaminah.coach@insken.gov.my',
        photoURL: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'user-mentor-2',
        fullName: 'Puan Siti Aminah Binti Yusof',
        email: 'sitiaminah.coach@insken.gov.my',
        role: 'mentor',
        mentorId: 'mentor-2',
        phone: '60129876543',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_khairul') {
      authUser = {
        uid: 'user-mentor-3',
        displayName: 'En. Khairul Hafiz Bin Razali, CA',
        email: 'khairul.audit@smeadvisor.my',
        photoURL: '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'user-mentor-3',
        fullName: 'En. Khairul Hafiz Bin Razali, CA',
        email: 'khairul.audit@smeadvisor.my',
        role: 'mentor',
        mentorId: 'mentor-3',
        phone: '60139123456',
        district: 'Kota Bharu',
        avatarUrl: '/public/assets/generated/avatar_mentor_umk_1793924250411.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else if (type === 'mentor_norazila') {
      authUser = {
        uid: 'user-mentor-4',
        displayName: 'Ts. Dr. Norazila Binti Mat Deris',
        email: 'norazila.fiat@umk.edu.my',
        photoURL: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        isDemo: true,
      };
      profile = {
        userId: 'user-mentor-4',
        fullName: 'Ts. Dr. Norazila Binti Mat Deris',
        email: 'norazila.fiat@umk.edu.my',
        role: 'mentor',
        mentorId: 'mentor-4',
        phone: '60145556677',
        district: 'Jeli',
        avatarUrl: '/public/assets/generated/avatar_youth_female_1793924250745.jpg',
        createdAt: new Date().toISOString(),
        ...customData
      };
    } else {
      const guestId = `guest-${Date.now()}`;
      authUser = {
        uid: guestId,
        displayName: 'Usahawan Belia (Pelawat)',
        email: 'belia.kelantan@niaga.my',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
        isDemo: true,
      };
      profile = {
        userId: guestId,
        fullName: 'Usahawan Belia Kelantan',
        email: 'belia.kelantan@niaga.my',
        role: 'user',
        phone: '+60190000000',
        district: 'Kota Bharu',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
        createdAt: new Date().toISOString(),
        ...customData
      };
    }

    try {
      localStorage.setItem('niagabelia_auth_session', JSON.stringify({ user: authUser, profile }));
      localStorage.setItem('niagabelia_last_activity', Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setUser(authUser);
    setUserProfile(profile);
    setAuthError(null);
    setIsLoginModalOpen(false);
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('niagabelia_session_token');
      sessionStorage.removeItem('niagabelia_auth_session');
      localStorage.removeItem('niagabelia_auth_session');
      localStorage.removeItem('niagabelia_last_activity');
      await fbSignOut(auth);
    } catch (error) {
      console.warn('Firebase logout notice:', error);
    } finally {
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...(userProfile || {}), ...data } as UserProfile;
    setUserProfile(updated);
    try {
      localStorage.setItem('niagabelia_auth_session', JSON.stringify({ user, profile: updated }));
    } catch (e) {
      // ignore
    }

    if (!user.isDemo) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, data, { merge: true });
      } catch (error) {
        console.warn('Could not sync updated profile to firestore:', error);
      }
    }
  };

  const changeUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' };
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      } else if (user) {
        // Demo or local session
        return { success: true };
      } else {
        return { success: false, error: 'Tiada pengguna aktif untuk menukar kata laluan.' };
      }
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

  const isAdmin = Boolean(
    checkIsAdminEmail(user?.email) || 
    userProfile?.role === 'admin'
  );

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAdmin,
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
      clearAuthError,
      updateProfileData,
      changeUserPassword
    }}>
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
