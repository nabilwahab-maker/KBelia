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
      regPassword.trim() || 'kbelia123'
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessNotice('Pendaftaran berjaya! Sesi aktif dicipta terus.');
      setTimeout(() => {
        closeLoginModal();
      }, 700);
    }
  };

  return (
    <div 
      id="kbelia-login-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="kbelia-login-card"
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors"
      >
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between border-b ${
          activeRoleTab === 'admin' 
            ? 'bg-slate-900 border-slate-800' 
            : activeRoleTab === 'mentor'
              ? 'bg-purple-900 border-purple-800'
              : 'bg-red-900 border-red-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              {activeRoleTab === 'admin' ? <ShieldCheck className="w-4 h-4" /> : activeRoleTab === 'mentor' ? <GraduationCap className="w-4 h-4" /> : <Store className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {activeRoleTab === 'admin' ? 'Portal Pentadbir' : activeRoleTab === 'mentor' ? 'Portal Mentor' : 'Log Masuk Usahawan'}
              </h3>
              <p className="text-[10px] text-slate-300">KBELIA Kelantan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLoginModal}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="p-1.5 bg-slate-100 dark:bg-slate-900 grid grid-cols-3 gap-1 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('user');
              clearAuthError();
            }}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeRoleTab === 'user' ? 'bg-red-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
              activeRoleTab === 'mentor' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
              activeRoleTab === 'admin' ? 'bg-slate-900 text-amber-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pentadbir
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {activeRoleTab === 'user' && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setUserMode('login');
                  clearAuthError();
                }}
                className={`pb-1 cursor-pointer transition-colors border-b-2 ${
                  userMode === 'login'
                    ? 'border-red-700 text-red-700 dark:text-amber-400'
                    : 'border-transparent text-slate-500'
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
                    ? 'border-red-700 text-red-700 dark:text-amber-400'
                    : 'border-transparent text-slate-500'
                }`}
              >
                Daftar Baharu
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1">{authError}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold flex-1">{successNotice}</span>
            </div>
          )}

          {userMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emel
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Emel"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {activeRoleTab === 'mentor' ? 'PIN Mentor' : 'Kata Laluan'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? 'Sembunyi' : 'Papar'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeRoleTab === 'mentor' ? 'PIN' : 'Kata Laluan'}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Log Masuk Sekarang'}</span>
              </button>
            </form>
          )}

          {userMode === 'register' && activeRoleTab === 'user' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama Penuh"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emel *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Emel"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Telefon"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jajahan *
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {DISTRICT_LIST.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Laluan *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Kata Laluan"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Mendaftar...' : 'Daftar & Terus Buka Dashboard'}</span>
              </button>
            </form>
          )}

          {/* 1 Demo Admin & 1 Demo Mentor buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Log Masuk Pantas Demo
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser('mentor_wanazhar');
                  setSuccessNotice('Log masuk sebagai Mentor Demo berjaya!');
                  setTimeout(() => closeLoginModal(), 500);
                }}
                className="p-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 rounded-xl text-left cursor-pointer"
              >
                <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                  <span>Demo Mentor</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Wan Azhar</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser('admin');
                  setSuccessNotice('Log masuk sebagai Admin Demo berjaya!');
                  setTimeout(() => closeLoginModal(), 500);
                }}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-left cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Nabil (Urusetia)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
