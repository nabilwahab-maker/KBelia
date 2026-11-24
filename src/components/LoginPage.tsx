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
  Sun,
  Moon,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UMKTab } from './UMKHeader';
import { KBeliaLogo } from './KBeliaLogo';
import { KelantanDistrict } from '../types';
import { getRoleTheme } from '../utils/roleTheme';

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
    userProfile,
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
  const isMentor = userProfile?.role === 'mentor';

  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Role: 'user' | 'mentor' | 'admin'
  const [activeRole, setActiveRole] = useState<'user' | 'admin' | 'mentor'>('user');
  const activeRoleTheme = getRoleTheme(
    activeRole === 'admin' ? 'admin' : activeRole === 'mentor' ? 'mentor' : 'belia'
  );

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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
      regPassword.trim()
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
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-black dark:text-white transition-colors duration-200"
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
              className="inline-flex items-center gap-1.5 text-sm sm:text-[0.9375rem] font-semibold text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>{isEn ? 'Back' : 'Kembali'}</span>
            </button>

            {/* Mobile-only official brand logo */}
            <div className="lg:hidden">
              <KBeliaLogo size="sm" />
            </div>
          </div>

          {/* ACTIVE USER SESSION BANNER IF ALREADY LOGGED IN */}
          {user && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-sm">
              <div>
                <div className="font-bold text-black dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>{isEn ? 'Active Session:' : 'Sesi Aktif:'} {user.email}</span>
                </div>
                <div className="text-[0.8125rem] text-black dark:text-white/75 mt-0.5">
                  {isEn ? 'Role:' : 'Peranan:'} {isAdmin ? 'Admin KBelia' : isMentor ? 'Mentor KBelia' : 'Usahawan Belia'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(isAdmin ? 'admin' : isMentor ? 'mentor' : 'merchant')}
                  className={`px-3.5 py-2 text-sm ${getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia').primaryButtonClass}`}
                >
                  Portal &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className={`px-3 py-2 text-[0.8125rem] ${getRoleTheme(isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia').secondaryButtonClass}`}
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-white tracking-tight">
                {authMode === 'login' 
                  ? (isEn ? 'Sign In' : 'Log Masuk') 
                  : (isEn ? 'Create Account' : 'Daftar Akaun Baharu')}
              </h1>
              <p className="text-[0.9375rem] lg:text-base text-black/70 dark:text-white/75 mt-2 font-normal leading-relaxed">
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
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-black dark:text-white text-sm flex items-start gap-2.5 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{authError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-black dark:text-white text-sm flex items-center gap-2.5 animate-fade-slide-up">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                <span className="font-bold flex-1 leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* FORM 1: LOGIN MODE */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* ROLE PILLS (Usahawan / Mentor / Pentadbir) */}
                <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-300 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('user');
                      clearAuthError();
                    }}
                    className={`flex-1 py-2 px-2 rounded-xl text-[0.8125rem] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeRole === 'user'
                        ? `${getRoleTheme('belia').segmentedActiveClass} shadow-xs`
                        : 'text-black dark:text-white hover:text-black dark:hover:text-white'
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
                    className={`flex-1 py-2 px-2 rounded-xl text-[0.8125rem] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeRole === 'mentor'
                        ? `${getRoleTheme('mentor').segmentedActiveClass} shadow-xs`
                        : 'text-black dark:text-white hover:text-black dark:hover:text-white'
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
                    className={`flex-1 py-2 px-2 rounded-xl text-[0.8125rem] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeRole === 'admin'
                        ? `${getRoleTheme('admin').segmentedActiveClass} shadow-xs`
                        : 'text-black dark:text-white hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Pentadbir</span>
                  </button>
                </div>

                {/* EMAIL INPUT */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                    {isEn ? 'Email *' : 'Emel *'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isEn ? 'Enter email address' : 'Masukkan alamat emel'}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* PASSWORD INPUT WITH SHOW/HIDE EYE */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                    {isEn ? 'Password *' : 'Kata Laluan *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEn ? 'Enter password' : 'Masukkan kata laluan'}
                      className="w-full pl-4 pr-11 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD ROW */}
                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 text-black dark:text-white/75 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30 cursor-pointer accent-blue-600"
                    />
                    <span>{isEn ? 'Keep me logged in' : 'Kekal log masuk'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-semibold text-black dark:text-white/75 hover:text-black transition-colors cursor-pointer dark:hover:text-white"
                  >
                    {isEn ? 'Forgot password?' : 'Lupa kata laluan?'}
                  </button>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-2.5 py-3.5 px-6 text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 ${activeRoleTheme.primaryButtonClass}`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? 'Sign In' : 'Log Masuk')}</span>
                </button>

                {/* GOOGLE SIGN IN - HANYA UNTUK PERANAN USAHAWAN */}
                {activeRole === 'user' && (
                  <div className="pt-1">
                    {/* DIVIDER: ATAU / OR */}
                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                      </div>
                      <span className="relative bg-white dark:bg-slate-900 px-3.5 text-sm text-black/70 dark:text-white/75 font-medium">
                        {isEn ? 'Or sign in with' : 'Atau log masuk dengan'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-black dark:text-white text-sm sm:text-[0.9375rem] font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                    >
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span>{isEn ? 'Google Sign-In' : 'Akaun Google'}</span>
                    </button>
                  </div>
                )}

                {/* BOTTOM TOGGLE TO SIGN UP */}
                {activeRole === 'user' && (
                  <div className="pt-2 text-center text-sm text-black/70 dark:text-white/75">
                    <span>{isEn ? "Don't have an account? " : "Belum ada akaun? "}</span>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                        clearAuthError();
                        setActiveTab('register');
                      }}
                      className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer"
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
                    <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                      {isEn ? 'First Name *' : 'Nama Pertama *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder={isEn ? 'Enter first name' : 'Masukkan nama pertama'}
                      className="w-full px-3.5 py-2.5 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                      {isEn ? 'Last Name *' : 'Nama Akhir *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder={isEn ? 'Enter last name' : 'Masukkan nama akhir'}
                      className="w-full px-3.5 py-2.5 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                    {isEn ? 'Email *' : 'Emel *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={isEn ? 'Enter email address' : 'Masukkan alamat emel'}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                  />
                </div>

                {/* PASSWORD WITH SHOW/HIDE EYE */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                    {isEn ? 'Password *' : 'Kata Laluan *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={isEn ? 'Enter password' : 'Masukkan kata laluan'}
                      className="w-full pl-3.5 pr-11 py-2.5 text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title={showRegPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* DISTRICT & PHONE CHIPS */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                      {isEn ? 'District' : 'Jajahan'}
                    </label>
                    <select
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer dark:focus:border-blue-500"
                    >
                      {DISTRICT_LIST.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">
                      {isEn ? 'Phone Number' : 'Nombor Telefon'}
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={isEn ? 'Enter phone number' : 'Masukkan nombor telefon'}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* TERMS & PRIVACY CHECKBOX */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-sm text-black dark:text-white/75 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={regAgreeTerms}
                      onChange={(e) => setRegAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30 cursor-pointer accent-blue-600 shrink-0"
                    />
                    <span className="leading-snug">
                      {isEn ? (
                        <>
                          By creating an account means you agree to the{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-black dark:text-white hover:underline inline"
                          >
                            Terms and Conditions
                          </button>
                          , and our{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-black dark:text-white hover:underline inline"
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
                            className="font-bold text-black dark:text-white hover:underline inline"
                          >
                            Terma dan Syarat
                          </button>
                          , serta{' '}
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                            className="font-bold text-black dark:text-white hover:underline inline"
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
                  className={`w-full mt-2 py-3.5 px-4 text-sm sm:text-[0.9375rem] flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 ${getRoleTheme('belia').primaryButtonClass}`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting 
                      ? (isEn ? 'Processing...' : 'Memproses...') 
                      : (isEn ? 'Sign Up' : 'Daftar')}
                  </span>
                </button>

                {/* BOTTOM TOGGLE TO SIGN IN */}
                <div className="pt-2 text-center text-sm text-black/70 dark:text-white/75">
                  <span>{isEn ? 'Already have an account? ' : 'Sudah ada akaun? '}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      clearAuthError();
                    }}
                    className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Sign In' : 'Log Masuk'}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* BOTTOM ISOLATED DEMO TESTING FOOTER */}
          <div className="w-full pt-4 border-t border-slate-300 dark:border-slate-600 space-y-2.5">
            <div className="flex items-center justify-between text-[0.8125rem] font-semibold text-black/70 dark:text-white/75">
              <span>{isEn ? 'Isolated Development Demo Mode:' : 'Mod Demo Pembangunan (Sesi Terasing):'}</span>
              <span className="text-[0.8125rem] text-black/70 dark:text-white/75">Ujian Luar Talian</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDemoBelia}
                className="p-2.5 bg-slate-50 hover:bg-[#0B6E52]/10 dark:bg-slate-800 dark:hover:bg-[#10B981]/15 border border-slate-300 dark:border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-black dark:text-white">
                  <Store className="w-3.5 h-3.5 text-[#0B6E52] dark:text-[#34D399] shrink-0" />
                  <span>Demo Belia</span>
                </div>
                <div className="text-[0.8125rem] text-black/70 dark:text-white/75 truncate mt-0.5">
                  Ahmad Faizul
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoMentor}
                className="p-2.5 bg-slate-50 hover:bg-[#1D4ED8]/10 dark:bg-slate-800 dark:hover:bg-[#0EA5E9]/15 border border-slate-300 dark:border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-black dark:text-white">
                  <GraduationCap className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#38BDF8] shrink-0" />
                  <span>Demo Mentor</span>
                </div>
                <div className="text-[0.8125rem] text-black/70 dark:text-white/75 truncate mt-0.5">
                  Dr. Wan Azhar (Mentor Dalaman)
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoAdmin}
                className="p-2.5 bg-slate-50 hover:bg-[#9A5628]/10 dark:bg-slate-800 dark:hover:bg-[#D98A4E]/15 border border-slate-300 dark:border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-black dark:text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9A5628] dark:text-[#D98A4E] shrink-0" />
                  <span>Demo Admin</span>
                </div>
                <div className="text-[0.8125rem] text-black/70 dark:text-white/75 truncate mt-0.5">
                  Admin KBelia
                </div>
              </button>
            </div>

            <div className="text-center text-[0.8125rem] text-black/70 dark:text-white/75 pt-1">
              Hak Cipta Terpelihara © 2026 Portal KBelia Kelantan
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN (DESKTOP): MODERN DARK SLATE + BESPOKE MOTION */}
        {/* ======================================================== */}
        <div
          className="hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden bg-slate-950 text-white select-none lg:col-span-5 xl:col-span-4 order-2 lg:order-1 border-r border-slate-800/90"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 16%, rgba(56, 189, 248, 0.18) 0%, transparent 48%), radial-gradient(circle at 84% 84%, rgba(37, 99, 235, 0.18) 0%, transparent 52%), linear-gradient(160deg, #070D1A 0%, #0F172A 55%, #091122 100%)'
          }}
        >
          {/* ANIMATED ARCHITECTURAL GRID, SWEEP BEAM & FLOATING GEOMETRY */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Drifting Architectural Blueprint Grid */}
            <div className="absolute -inset-[60px] animate-login-grid-drift opacity-75">
              <svg
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern id="login-dark-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.11)"
                      strokeWidth="1"
                    />
                    <circle cx="60" cy="60" r="1.4" fill="rgba(125, 211, 252, 0.28)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#login-dark-grid-pattern)" />
              </svg>
            </div>

            {/* Sweeping Luminous Light Beam */}
            <div
              className="absolute -top-1/2 -left-1/2 w-[140%] h-32 animate-login-beam-sweep"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.08) 35%, rgba(125, 211, 252, 0.2) 50%, rgba(56, 189, 248, 0.08) 65%, transparent 100%)',
                filter: 'blur(18px)'
              }}
            />

            {/* Floating Translucent Dark-Glass Geometric Shapes & Wireframes */}
            <div className="absolute top-[14%] left-[12%] w-16 h-16 rounded-2xl bg-slate-900/55 backdrop-blur-md border border-blue-400/30 shadow-[0_0_28px_rgba(59,130,246,0.12)] animate-login-float-a flex items-center justify-center">
              <div className="w-6 h-6 rounded-md border border-blue-300/35 rotate-12" />
            </div>

            <div className="absolute top-[22%] right-[11%] w-12 h-20 rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-400/25 shadow-[0_0_24px_rgba(37,99,235,0.14)] animate-login-float-b" />

            <div className="absolute bottom-[22%] left-[14%] w-20 h-12 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-400/25 shadow-[0_0_24px_rgba(59,130,246,0.1)] animate-login-float-c flex items-center justify-around px-2.5">
              <span className="w-2 h-2 rounded-xs bg-blue-400/70 animate-login-node-glow" />
              <span className="w-7 h-1 rounded-full bg-blue-400/35" />
            </div>

            <div className="absolute bottom-[15%] right-[14%] w-14 h-14 rounded-xl bg-slate-900/45 backdrop-blur-md border border-blue-300/25 animate-login-float-a" style={{ animationDelay: '-2.2s' }}>
              <div className="w-full h-full rounded-xl border border-dashed border-blue-400/25 scale-75" />
            </div>

            {/* Glowing Architectural Intersection Crosshairs */}
            <div
              className="absolute top-[36%] left-[26%] w-2.5 h-2.5 rotate-45 border border-blue-400/70 bg-blue-400/25 animate-login-node-glow"
              style={{ animationDelay: '-0.8s' }}
            />
            <div
              className="absolute bottom-[35%] right-[24%] w-2.5 h-2.5 rotate-45 border border-blue-400/70 bg-blue-400/25 animate-login-node-glow"
              style={{ animationDelay: '-2.1s' }}
            />
          </div>

          {/* CENTER BRAND EMBLEM, ORBIT RINGS, MOTTO & MODERN BADGE */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xs xl:max-w-sm mx-auto">
            {/* Orbital Rings + Breathing Halo + KB Emblem */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Soft Breathing Radial Glow */}
              <div className="absolute w-36 h-36 rounded-full bg-blue-500/20 blur-2xl animate-login-halo-breathe pointer-events-none" />

              {/* Outer Dashed Rotating Orbit Ring */}
              <div className="absolute w-28 h-28 rounded-full border border-dashed border-blue-400/35 animate-login-orbit-spin pointer-events-none">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
              </div>

              {/* Inner Counter-Rotating Arc Ring */}
              <div className="absolute w-22 h-22 rounded-full border border-blue-300/20 border-t-blue-400/75 animate-login-orbit-reverse pointer-events-none" />

              {/* Brand Mark Lockup */}
              <div className="relative flex items-center px-5 py-3.5 rounded-2xl bg-[#111916]/80 backdrop-blur-md border border-emerald-500/25 shadow-xl shadow-slate-950/60">
                <KBeliaLogo size="lg" tone="onDark" />
              </div>
            </div>

            {/* SUBTITLE MOTTO */}
            <p className="text-[0.9375rem] xl:text-sm text-slate-300 font-normal leading-relaxed max-w-xs">
              {isEn
                ? 'Official Kelantan Youth Kiosk & Entrepreneurship Portal'
                : 'Portal Rasmi Kiosk & Keusahawanan Belia Kelantan'}
            </p>
          </div>

          {/* FLOATING DARK / LIGHT THEME TOGGLE (BOTTOM LEFT CORNER) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isEn ? 'Toggle Light/Dark Mode' : 'Tukar Mod Cerah/Gelap'}
            title={theme === 'dark' ? (isEn ? 'Switch to Light Mode' : 'Tukar ke Mod Cerah') : (isEn ? 'Switch to Dark Mode' : 'Tukar ke Mod Gelap')}
            className="absolute bottom-6 left-6 w-11 h-11 rounded-full bg-slate-900/85 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/80 hover:border-blue-400/50 flex items-center justify-center shadow-lg shadow-slate-950/50 backdrop-blur-md transition-all cursor-pointer z-30"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-blue-300" />
            )}
          </button>
        </div>

      </main>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-fade-slide-up">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl overflow-hidden">
            <div className="bg-[#FAF8F3] dark:bg-[#101815] px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-[#E2DCCB] dark:border-[#24342D]">
              <div className="flex items-center gap-2 text-black dark:text-white/75 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Tetapan Semula Kata Laluan</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                aria-label="Tutup"
                className={activeRoleTheme.iconButtonClass}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed">
                Untuk keselamatan akaun usahawan berdaftar, sila hubungi pihak Admin KBelia Kelantan atau hantar permohonan ke emel rasmi pentadbir kami:
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 text-sm">
                <div className="font-bold text-black dark:text-white">Admin KBelia Kelantan</div>
                <div className="text-black dark:text-white/75 mt-0.5">Emel: urusetia@kbelia.kelantan.gov.my</div>
                <div className="text-black dark:text-white/75">Talian: +60 9-748 1957 (Pusat Pentadbiran Negeri)</div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className={`w-full py-2.5 text-sm ${activeRoleTheme.primaryButtonClass}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
