import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  GraduationCap,
  Phone,
  MapPin,
  Sparkles,
  Sun,
  Moon,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UMKTab } from './UMKHeader';
import { KelantanDistrict } from '../types';

interface LoginPageProps {
  setActiveTab: (tab: UMKTab) => void;
  onOpenBooking?: () => void;
}

const DISTRICT_LIST: KelantanDistrict[] = [
  'Kota Bharu', 'Bachok', 'Pasir Mas', 'Tumpat', 'Pasir Puteh',
  'Machang', 'Tanah Merah', 'Jeli', 'Kuala Krai', 'Gua Musang'
];

// Clean Google Multi-color G Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const { 
    user, 
    isAdmin, 
    loginInitialTab,
    loginWithGoogle, 
    loginWithCredentials, 
    registerNewUser,
    loginAsDemoUser,
    logout, 
    authError, 
    clearAuthError 
  } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Role: 'user' | 'mentor' | 'admin'
  const [activeRole, setActiveRole] = useState<'user' | 'admin' | 'mentor'>('user');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // Register Form
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAgreeTerms, setRegAgreeTerms] = useState(true);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (loginInitialTab) {
      setActiveRole(loginInitialTab);
    }
    clearAuthError();
    setSuccessMsg(null);
  }, [loginInitialTab]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    clearAuthError();

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    const result = await loginWithCredentials(cleanEmail, cleanPass, activeRole);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(isEn ? 'Sign in successful! Loading dashboard...' : 'Log masuk berjaya! Membuka papan pemuka...');
      setTimeout(() => {
        if (activeRole === 'admin') setActiveTab('admin');
        else if (activeRole === 'mentor') setActiveTab('mentor');
        else setActiveTab('merchant');
      }, 500);
    }
  };

  // Handle Register Submit (Session Method - Direct to Dashboard)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    clearAuthError();

    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`.trim() || regFirstName.trim() || regLastName.trim();

    if (!fullName || !regEmail.trim()) {
      setIsSubmitting(false);
      return;
    }

    const res = await registerNewUser(
      fullName,
      regEmail.trim(),
      regDistrict,
      regPhone.trim() || '+60110000000',
      `${fullName} Enterprise`,
      regPassword.trim() || 'kbelia123'
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(isEn ? 'Registration successful! Launching your entrepreneur dashboard...' : 'Pendaftaran berjaya! Sesi aktif dicipta. Membuka papan pemuka usahawan...');
      setTimeout(() => {
        setActiveTab('merchant');
      }, 700);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    clearAuthError();
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg(isEn ? 'Google sign in successful!' : 'Log masuk Google berjaya!');
      setTimeout(() => setActiveTab('merchant'), 500);
    }
  };

  // 1-Click Demo Login Handlers for all 3 isolated roles
  const handleDemoBelia = () => {
    setActiveRole('user');
    clearAuthError();
    loginAsDemoUser('merchant_faizul');
    setSuccessMsg(isEn ? 'Logged in as Youth Entrepreneur (Ahmad Faizul)!' : 'Log masuk sebagai Usahawan Belia (Ahmad Faizul) berjaya!');
    setTimeout(() => setActiveTab('merchant'), 500);
  };

  const handleDemoAdmin = () => {
    setActiveRole('admin');
    clearAuthError();
    loginAsDemoUser('admin');
    setSuccessMsg(isEn ? 'Logged in as Demo Admin!' : 'Log masuk sebagai Pentadbir Demo berjaya!');
    setTimeout(() => setActiveTab('admin'), 500);
  };

  const handleDemoMentor = () => {
    setActiveRole('mentor');
    clearAuthError();
    loginAsDemoUser('mentor_wanazhar');
    setSuccessMsg(isEn ? 'Logged in as Demo Mentor (Dr. Wan Azhar)!' : 'Log masuk sebagai Mentor Demo (Dr. Wan Azhar) berjaya!');
    setTimeout(() => setActiveTab('mentor'), 500);
  };

  return (
    <div 
      id="kbelia-login-page" 
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200"
    >
      <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ======================================================== */}
        {/* RIGHT COLUMN (DESKTOP): EXPANDED AUTHENTICATION FORM     */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 w-full min-h-screen z-10 lg:col-span-7 xl:col-span-8 order-1 lg:order-2 bg-white dark:bg-slate-900">
          
          {/* TOP BAR: BACK TO DASHBOARD */}
          <div className="w-full flex items-center justify-between pt-2 pb-6">
            <button
              type="button"
              onClick={() => setActiveTab('landing')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>{isEn ? 'Back' : 'Kembali'}</span>
            </button>

            {/* Mobile-only brand badge */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                KB
              </div>
              <span className="font-extrabold text-xs text-slate-800 dark:text-sky-300 tracking-tight">
                KBelia
              </span>
            </div>
          </div>

          {/* ACTIVE USER SESSION BANNER IF ALREADY LOGGED IN */}
          {user && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs animate-fade-slide-up">
              <div>
                <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isEn ? 'Active Session:' : 'Sesi Aktif:'} {user.email}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {isEn ? 'Role:' : 'Peranan:'} {isAdmin ? 'Pentadbir Urusetia' : 'Usahawan Belia'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : 'merchant')}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-bold text-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Dashboard &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs hover:bg-slate-300 cursor-pointer transition-colors"
                >
                  {isEn ? 'Logout' : 'Log Keluar'}
                </button>
              </div>
            </div>
          )}

          {/* CENTER FORM CONTAINER (LARGER & MORE PROMINENT) */}
          <div className="w-full max-w-[500px] lg:max-w-[540px] xl:max-w-[560px] mx-auto my-auto py-6">
            
            {/* HEADING & SUBTITLE */}
            <div className="mb-6 sm:mb-8 text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {authMode === 'login' 
                  ? (isEn ? 'Sign In' : 'Log Masuk') 
                  : (isEn ? 'Create Account' : 'Daftar Akaun Baharu')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-2 font-normal leading-relaxed">
                {authMode === 'login'
                  ? (isEn 
                      ? 'Enter your email and password to sign in!' 
                      : 'Masukkan emel dan kata laluan anda untuk log masuk!')
                  : (isEn 
                      ? 'Register your official youth entrepreneur credentials.' 
                      : 'Isi butiran perniagaan dan akaun rasmi usahawan belia Kelantan.')}
              </p>
            </div>



            {/* ALERT NOTICES: ERROR & SUCCESS */}
            {authError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{authError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-slide-up">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold flex-1 leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* FORM 1: LOGIN MODE */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* ROLE PILLS (Usahawan / Mentor / Pentadbir) */}
                <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('user');
                      clearAuthError();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeRole === 'user'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span>Usahawan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('mentor');
                      clearAuthError();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeRole === 'mentor'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span>Mentor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('admin');
                      clearAuthError();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeRole === 'admin'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Pentadbir</span>
                  </button>
                </div>

                {/* EMAIL INPUT */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isEn ? 'Email' : 'Emel'}<span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isEn ? 'Email' : 'Emel'}
                      className="w-full px-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* PASSWORD INPUT WITH SHOW/HIDE EYE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isEn ? 'Password' : 'Kata Laluan'}<span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEn ? 'Password' : 'Kata Laluan'}
                      className="w-full pl-4 pr-11 py-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={showPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD ROW */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                    />
                    <span>{isEn ? 'Keep me logged in' : 'Kekal log masuk'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-800 transition-colors cursor-pointer"
                  >
                    {isEn ? 'Forgot password?' : 'Lupa kata laluan?'}
                  </button>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2.5 py-3.5 px-6 bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4 text-sky-100" />
                  <span>{isSubmitting ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? 'Sign In' : 'Log Masuk')}</span>
                </button>

                {/* GOOGLE SIGN IN - HANYA UNTUK PERANAN USAHAWAN */}
                {activeRole === 'user' && (
                  <div className="pt-1">
                    {/* DIVIDER: ATAU / OR */}
                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                      </div>
                      <span className="relative bg-white dark:bg-slate-900 px-3.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {isEn ? 'Or sign in with' : 'Atau log masuk dengan'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-sky-50/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                    >
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span>{isEn ? 'Sign in with Google' : 'Log masuk Google'}</span>
                    </button>
                  </div>
                )}

                {/* BOTTOM TOGGLE TO SIGN UP */}
                {activeRole === 'user' && (
                  <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    <span>{isEn ? "Don't have an account? " : "Belum ada akaun? "}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setActiveRole('user');
                        clearAuthError();
                      }}
                      className="font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {isEn ? 'Sign Up' : 'Daftar Sekarang'}
                    </button>
                  </div>
                )}

              </form>
            ) : (
              /* FORM 2: SIGN UP MODE */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* FIRST NAME & LAST NAME */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isEn ? 'First Name' : 'Nama Pertama'}<span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder={isEn ? 'First Name' : 'Nama Pertama'}
                      className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isEn ? 'Last Name' : 'Nama Terakhir'}<span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder={isEn ? 'Last Name' : 'Nama Terakhir'}
                      className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isEn ? 'Email' : 'Emel'}<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={isEn ? 'Email' : 'Emel'}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>

                {/* PASSWORD WITH SHOW/HIDE EYE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isEn ? 'Password' : 'Kata Laluan'}<span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={isEn ? 'Password' : 'Kata Laluan'}
                      className="w-full pl-3.5 pr-11 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={showRegPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* DISTRICT & PHONE CHIPS */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isEn ? 'District' : 'Jajahan Kelantan'}
                    </label>
                    <select
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
                    >
                      {DISTRICT_LIST.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isEn ? 'Phone / WhatsApp' : 'No. Telefon'}
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={isEn ? 'Phone / WhatsApp' : 'No. Telefon'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* TERMS & PRIVACY CHECKBOX */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={regAgreeTerms}
                      onChange={(e) => setRegAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600 shrink-0"
                    />
                    <span className="leading-snug">
                      {isEn ? (
                        <>
                          By creating an account means you agree to the{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-slate-800 dark:text-white hover:underline inline"
                          >
                            Terms and Conditions
                          </button>
                          , and our{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-slate-800 dark:text-white hover:underline inline"
                          >
                            Privacy Policy
                          </button>
                        </>
                      ) : (
                        <>
                          Dengan mendaftar akaun, anda bersetuju dengan{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-slate-800 dark:text-white hover:underline inline"
                          >
                            Terma dan Syarat
                          </button>
                          , serta{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-slate-800 dark:text-white hover:underline inline"
                          >
                            Dasar Privasi
                          </button>{' '}
                          KBelia Kelantan.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-4 h-4 text-sky-100" />
                  <span>
                    {isSubmitting 
                      ? (isEn ? 'Processing...' : 'Memproses...') 
                      : (isEn ? 'Sign Up' : 'Daftar Sekarang')}
                  </span>
                </button>

                {/* BOTTOM TOGGLE TO SIGN IN */}
                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>{isEn ? 'Already have an account? ' : 'Sudah ada akaun? '}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      clearAuthError();
                    }}
                    className="font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Sign In' : 'Log Masuk'}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* BOTTOM QUICK DEMO TESTING FOOTER */}
          <div className="w-full pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{isEn ? 'Quick Testing Demo Accounts:' : 'Akaun Pengujian Pantas (Demo):'}</span>
              <span className="text-[10px] text-slate-400">1-Klik Terus Masuk</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDemoBelia}
                className="p-2.5 bg-sky-50 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800/60 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-900 dark:text-sky-300">
                  <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Demo Belia</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Ahmad Faizul
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoMentor}
                className="p-2.5 bg-slate-50 hover:bg-sky-50/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-sky-300">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Demo Mentor</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Dr. Wan Azhar (UMK)
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoAdmin}
                className="p-2.5 bg-slate-50 hover:bg-sky-50/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Demo Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Pentadbir Urusetia
                </div>
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
              Hak Cipta Terpelihara © 2026 Portal KBelia Kelantan
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN (DESKTOP): CRISP WHITE + TOP-LEFT SKY GLOW   */}
        {/* ======================================================== */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden kbelia-important-header dark:bg-slate-800 select-none lg:col-span-5 xl:col-span-4 order-2 lg:order-1 border-r border-slate-200 dark:border-slate-700">
          
          {/* SOFT GEOMETRIC ACCENT PATTERN */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg 
              className="w-full h-full opacity-35" 
              xmlns="http://www.w3.org/2000/svg"
              width="100%" 
              height="100%"
            >
              <defs>
                <pattern id="login-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(14, 165, 233, 0.14)" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#login-grid-pattern)" />
            </svg>

            {/* Moving Animated Soft Sky & Slate Accent Squares */}
            <div className="absolute top-[18%] right-[20%] w-[52px] h-[52px] bg-sky-100/50 border border-sky-200/70 rounded-lg animate-hero-float-slow"></div>
            <div className="absolute top-[34%] right-[10%] w-[48px] h-[48px] bg-sky-50/70 border border-sky-200/60 rounded-lg animate-hero-float-reverse"></div>
            <div className="absolute bottom-[26%] left-[14%] w-[54px] h-[54px] bg-slate-100/70 border border-slate-200/80 rounded-lg animate-hero-float-fast"></div>
            <div className="absolute bottom-[12%] right-[24%] w-[46px] h-[46px] bg-sky-50/60 border border-sky-200/60 rounded-lg animate-hero-float-slow"></div>
          </div>

          {/* CENTER BRAND EMBLEM & TYPOGRAPHY */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xs xl:max-w-sm mx-auto">
            
            {/* BRAND EMBLEM */}
            <div className="animate-hero-float-slow">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-13 h-13 xl:w-15 xl:h-15 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl xl:text-2xl shadow-md shadow-sky-600/20 border border-sky-500">
                  <span>K</span>
                  <span className="text-sky-100 text-base xl:text-lg ml-0.5">B</span>
                </div>
                <span className="text-2xl xl:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  KBelia
                </span>
              </div>
            </div>

            {/* SUBTITLE MOTTO */}
            <p className="text-xs xl:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xs mt-1">
              Portal Rasmi Kapsul Niaga & Keusahawanan Belia Kelantan 2026
            </p>

            {/* WELCOME BADGE */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-800 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Selamat Datang ke KBelia</span>
            </div>

          </div>

          {/* FLOATING DARK / LIGHT THEME TOGGLE (BOTTOM LEFT CORNER) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Tukar Mod Cerah/Gelap"
            title={theme === 'dark' ? 'Tukar ke Mod Cerah' : 'Tukar ke Mod Gelap'}
            className="absolute bottom-6 left-6 w-11 h-11 rounded-full bg-white hover:bg-sky-50 active:scale-95 text-sky-700 border border-slate-200 flex items-center justify-center shadow-sm transition-all cursor-pointer z-30 interactive-lift"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-sky-700" />
            )}
          </button>

        </div>

      </main>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-fade-slide-up">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="kbelia-important-header px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Tetapan Semula Kata Laluan</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Untuk keselamatan akaun usahawan berdaftar, sila hubungi Urusetia KBelia Kelantan atau hantarkan permohonan ke emel rasmi pentadbir kami:
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-bold text-slate-800 dark:text-white">Urusetia KBelia Kelantan 2026</div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">Emel: urusetia@kbelia.kelantan.gov.my</div>
                <div className="text-slate-600 dark:text-slate-400">Talian: +60 9-748 1957 (Pusat Pentadbiran Negeri)</div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Faham & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
