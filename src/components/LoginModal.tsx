import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  ShieldCheck, 
  LogIn, 
  AlertCircle, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  CheckCircle2, 
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { KelantanDistrict } from '../types';

const DISTRICT_LIST: KelantanDistrict[] = [
  'Kota Bharu', 'Bachok', 'Pasir Mas', 'Tumpat', 'Pasir Puteh',
  'Machang', 'Tanah Merah', 'Jeli', 'Kuala Krai', 'Gua Musang'
];

export const LoginModal: React.FC = () => {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
    loginInitialTab,
    loginWithGoogle,
    loginWithCredentials,
    registerNewUser,
    loginAsDemoUser, 
    authError, 
    clearAuthError 
  } = useAuth();

  // Role: 'user' | 'mentor' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<'user' | 'admin' | 'mentor'>('user');
  
  // Mode: 'login' | 'register'
  const [userMode, setUserMode] = useState<'login' | 'register'>('login');

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [regPassword, setRegPassword] = useState('');
  const [regBusiness, setRegBusiness] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginModalOpen) {
      setActiveRoleTab(loginInitialTab || 'user');
      setSuccessNotice(null);
      clearAuthError();
    }
  }, [isLoginModalOpen, loginInitialTab]);

  if (!isLoginModalOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessNotice(null);
    clearAuthError();

    const res = await loginWithCredentials(email.trim(), password.trim(), activeRoleTab);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessNotice('Log masuk berjaya! Membuka papan pemuka...');
      setTimeout(() => {
        closeLoginModal();
      }, 500);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessNotice(null);
    clearAuthError();

    const res = await registerNewUser(
      regName.trim(),
      regEmail.trim(),
      regDistrict,
      regPhone.trim(),
      regBusiness.trim() || undefined,
      regPassword.trim()
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessNotice('Pendaftaran berjaya! Sesi aktif dicipta terus.');
      setTimeout(() => {
        closeLoginModal();
      }, 700);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setSuccessNotice(null);
    clearAuthError();
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (res.success) {
      setSuccessNotice('Log masuk Google berjaya!');
      setTimeout(() => closeLoginModal(), 500);
    }
  };

  return (
    <div 
      id="kbelia-login-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="kbelia-login-card"
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors"
      >
        {/* Header */}
        <div className="p-4 kbelia-important-header dark:bg-slate-800 text-black dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
              {activeRoleTab === 'admin' ? <ShieldCheck className="w-4 h-4" /> : activeRoleTab === 'mentor' ? <GraduationCap className="w-4 h-4" /> : <Store className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-black dark:text-white">
                {activeRoleTab === 'admin' ? 'Portal Pentadbir' : activeRoleTab === 'mentor' ? 'Portal Mentor' : 'Log Masuk Usahawan'}
              </h3>
              <p className="text-[10px] text-black/70 dark:text-white/75">KBelia Kelantan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLoginModal}
            className="p-1.5 text-black/70 hover:text-black dark:text-white dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="p-1.5 bg-slate-50 dark:bg-slate-900 grid grid-cols-3 gap-1 border-b border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('user');
              clearAuthError();
            }}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeRoleTab === 'user' ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-600' : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
            }`}
          >
            Usahawan
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('mentor');
              setUserMode('login');
              clearAuthError();
            }}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeRoleTab === 'mentor' ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-600' : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
            }`}
          >
            Mentor
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('admin');
              setUserMode('login');
              clearAuthError();
            }}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeRoleTab === 'admin' ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-600' : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
            }`}
          >
            Pentadbir
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {activeRoleTab === 'user' && (
            <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setUserMode('login');
                  clearAuthError();
                }}
                className={`pb-1 cursor-pointer transition-colors border-b-2 ${
                  userMode === 'login'
                    ? 'border-blue-600 text-black dark:text-white/75'
                    : 'border-transparent text-black/70 dark:text-white/75'
                }`}
              >
                Log Masuk Sedia Ada
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMode('register');
                  clearAuthError();
                }}
                className={`pb-1 cursor-pointer transition-colors border-b-2 ${
                  userMode === 'register'
                    ? 'border-blue-600 text-black dark:text-white/75'
                    : 'border-transparent text-black/70 dark:text-white/75'
                }`}
              >
                Daftar Baharu
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-black dark:text-white text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-black dark:text-white/75 shrink-0 mt-0.5" />
              <span className="flex-1">{authError}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-black dark:text-white text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
              <span className="font-bold flex-1">{successNotice}</span>
            </div>
          )}

          {userMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Emel
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Emel rasmi anda"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-black dark:text-white">
                    {activeRoleTab === 'mentor' ? 'PIN Mentor' : 'Kata Laluan'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? 'Sembunyi' : 'Papar'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeRoleTab === 'mentor' ? 'PIN keselamatan' : 'Minimum 6 aksara'}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 dark:bg-blue-600"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Log Masuk Sekarang'}</span>
              </button>

              {activeRoleTab === 'user' && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.36 7.35 24 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
                  </svg>
                  <span>Log Masuk dengan Google</span>
                </button>
              )}
            </form>
          )}

          {userMode === 'register' && activeRoleTab === 'user' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-black dark:text-white mb-1">
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama Penuh"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black dark:text-white mb-1">
                  Emel *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Emel"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-black dark:text-white mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Telefon"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black dark:text-white mb-1">
                    Jajahan *
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    {DISTRICT_LIST.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black dark:text-white mb-1">
                  Kata Laluan *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Kata Laluan"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-black dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 dark:bg-blue-600"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Mendaftar...' : 'Daftar & Terus Buka Dashboard'}</span>
              </button>
            </form>
          )}

          {/* Isolated Development Demo Mode Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[10px] font-bold text-black/70 dark:text-white/75 uppercase tracking-wider text-center">
              Mod Demo Pembangunan (Terasing)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser('merchant_faizul');
                  setSuccessNotice('Log masuk Mod Demo Belia berjaya!');
                  setTimeout(() => closeLoginModal(), 400);
                }}
                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-rose-600 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>Belia</span>
                </div>
                <div className="text-[10px] text-black/70 dark:text-white/75 truncate">Ahmad Faizul</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser('mentor_wanazhar');
                  setSuccessNotice('Log masuk Mod Demo Mentor berjaya!');
                  setTimeout(() => closeLoginModal(), 400);
                }}
                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-rose-600 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>Mentor</span>
                </div>
                <div className="text-[10px] text-black/70 dark:text-white/75 truncate">Dr. Wan Azhar</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser('admin');
                  setSuccessNotice('Log masuk Mod Demo Admin berjaya!');
                  setTimeout(() => closeLoginModal(), 400);
                }}
                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-rose-600 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-black/70 dark:text-white/75 truncate">Urusetia</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
