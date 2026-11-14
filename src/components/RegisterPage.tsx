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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UMKTab } from './UMKHeader';
import { KelantanDistrict } from '../types';

interface RegisterPageProps {
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

export const RegisterPage: React.FC<RegisterPageProps> = ({ setActiveTab }) => {
  const { 
    registerNewUser, 
    loginWithGoogle, 
    loginAsDemoUser,
    authError, 
    clearAuthError 
  } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Form Fields matching screenshot
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || firstName.trim() || lastName.trim();

    if (!fullName) {
      setErrorMessage(isEn ? 'Please enter your first and last name.' : 'Sila masukkan nama pertama dan nama akhir anda.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(isEn ? 'Please enter a valid email address.' : 'Sila masukkan alamat emel yang sah.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(isEn ? 'Password must be at least 6 characters.' : 'Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage(isEn ? 'You must agree to the Terms and Conditions & Privacy Policy.' : 'Sila bersetuju dengan Terma & Syarat serta Dasar Privasi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerNewUser(
        fullName,
        email.trim(),
        district,
        phone.trim() || '+60110000000',
        `${fullName} Enterprise`,
        password.trim()
      );

      if (res.success) {
        setSuccessMessage(isEn ? 'Registration successful! Launching your entrepreneur dashboard...' : 'Pendaftaran berjaya! Membuka papan pemuka usahawan belia anda...');
        setTimeout(() => {
          setActiveTab('merchant');
        }, 800);
      } else {
        setErrorMessage(res.error || (isEn ? 'Registration failed. Please try again.' : 'Pendaftaran gagal. Sila cuba lagi.'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || (isEn ? 'Error processing registration.' : 'Ralat semasa memproses pendaftaran.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSuccessMessage(isEn ? 'Google sign up successful! Redirecting...' : 'Pendaftaran Google berjaya! Mengalihkan ke papan pemuka...');
        setTimeout(() => {
          setActiveTab('merchant');
        }, 600);
      } else {
        setErrorMessage(res.error || (isEn ? 'Google sign up was unsuccessful.' : 'Pendaftaran Google tidak berjaya.'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error connecting to Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAdmin = () => {
    clearAuthError();
    loginAsDemoUser('admin');
    setTimeout(() => setActiveTab('admin'), 500);
  };

  const handleDemoMentor = () => {
    clearAuthError();
    loginAsDemoUser('mentor_wanazhar');
    setTimeout(() => setActiveTab('mentor'), 500);
  };

  return (
    <div 
      id="kbelia-register-page" 
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-black dark:text-white transition-colors duration-200"
    >
      <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ======================================================== */}
        {/* RIGHT COLUMN (DESKTOP): EXPANDED SIGN UP FORM            */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 w-full min-h-screen z-10 lg:col-span-7 xl:col-span-8 order-1 lg:order-2 bg-white dark:bg-slate-900">
          
          {/* TOP BAR: BACK TO DASHBOARD */}
          <div className="w-full flex items-center justify-between pt-2 pb-6">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                setActiveTab('landing');
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>{isEn ? 'Back' : 'Kembali'}</span>
            </button>

            {/* Mobile-only brand badge */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs dark:bg-blue-600">
                KB
              </div>
              <span className="font-extrabold text-xs text-black dark:text-white tracking-tight">
                KBelia
              </span>
            </div>
          </div>

          {/* CENTER FORM CONTAINER */}
          <div className="w-full max-w-[500px] lg:max-w-[540px] xl:max-w-[560px] mx-auto my-auto py-6">
            
            {/* HEADING & SUBTITLE */}
            <div className="mb-6 sm:mb-8 text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-white tracking-tight">
                {isEn ? 'Sign Up' : 'Daftar Akaun'}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-black/70 dark:text-white/75 mt-2 font-normal leading-relaxed">
                {isEn ? 'Enter your email and password to sign up!' : 'Masukkan maklumat dan kata laluan anda untuk mendaftar!'}
              </p>
            </div>

            {/* SOCIAL / QUICK ACTION BUTTONS (GOOGLE & YOUTH PRESET) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-black dark:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{isEn ? 'Sign up with Google' : 'Daftar dengan Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFirstName('Usahawan');
                  setLastName('Belia 2026');
                  setEmail('usahawan.belia@gmail.com');
                  setPassword('kbelia123');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-black dark:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                <span className="truncate">{isEn ? 'Youth Preset' : 'Isi Automatik'}</span>
              </button>
            </div>

            {/* DIVIDER: OR / ATAU */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-3.5 text-xs text-black/70 dark:text-white/75 font-medium">
                {isEn ? 'Or' : 'Atau'}
              </span>
            </div>

            {/* ALERT NOTICES: ERROR & SUCCESS */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-black dark:text-white text-xs flex items-start gap-2.5 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-black dark:text-white text-xs flex items-start gap-2.5 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{authError}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-black dark:text-white text-xs flex items-center gap-2.5 animate-fade-slide-up">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                <span className="font-bold flex-1 leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* FORM: SIGN UP */}
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* FIRST NAME & LAST NAME */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    {isEn ? 'First Name' : 'Nama Pertama'}<span className="text-black/70 dark:text-white/75">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isEn ? 'First Name' : 'Nama Pertama'}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    {isEn ? 'Last Name' : 'Nama Terakhir'}<span className="text-black/70 dark:text-white/75">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isEn ? 'Last Name' : 'Nama Terakhir'}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Email' : 'Emel'}<span className="text-black/70 dark:text-white/75">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Email' : 'Emel'}
                  className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
                />
              </div>

              {/* PASSWORD WITH SHOW/HIDE EYE */}
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  {isEn ? 'Password' : 'Kata Laluan'}<span className="text-black/70 dark:text-white/75">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEn ? 'Password' : 'Kata Laluan'}
                    className="w-full pl-3.5 pr-11 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all dark:focus:border-blue-500"
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

              {/* OPTIONAL KELANTAN DISTRICT & PHONE CHIPS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-black dark:text-white/75 mb-1">
                    {isEn ? 'District (Jajahan)' : 'Jajahan Kelantan'}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer dark:focus:border-blue-500"
                  >
                    {DISTRICT_LIST.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black dark:text-white/75 mb-1">
                    {isEn ? 'Phone / WhatsApp' : 'No. Telefon'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isEn ? 'Phone / WhatsApp' : 'No. Telefon'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              {/* TERMS & PRIVACY CHECKBOX */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-black dark:text-white/75 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <span className="leading-snug">
                    {isEn ? (
                      <>
                        By creating an account means you agree to the{' '}
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                          className="font-bold text-black dark:text-white hover:underline inline"
                        >
                          Terms and Conditions
                        </button>
                        , and our{' '}
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
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
                          onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                          className="font-bold text-black dark:text-white hover:underline inline"
                        >
                          Terma dan Syarat
                        </button>
                        , serta{' '}
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
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
                className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-600 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60 dark:bg-blue-600"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>{isSubmitting ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? 'Sign Up' : 'Daftar Sekarang')}</span>
              </button>

              {/* BOTTOM TOGGLE TO SIGN IN */}
              <div className="pt-2 text-center text-xs text-black/70 dark:text-white/75">
                <span>{isEn ? 'Already have an account? ' : 'Sudah ada akaun? '}</span>
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                    setActiveTab('login');
                  }}
                  className="font-bold text-black dark:text-white/75 hover:underline cursor-pointer"
                >
                  {isEn ? 'Sign In' : 'Log Masuk'}
                </button>
              </div>

            </form>

          </div>

          {/* BOTTOM QUICK DEMO TESTING FOOTER */}
          <div className="w-full pt-4 border-t border-slate-300 dark:border-slate-600 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-black/70 dark:text-white/75">
              <span>{isEn ? 'Quick Testing Demo Accounts:' : 'Akaun Pengujian Pantas (Demo):'}</span>
              <span className="text-[10px] text-black/70 dark:text-white/75">1-Klik Terus Masuk</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoMentor}
                className="p-2.5 bg-slate-50 hover:bg-amber-50/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-black dark:text-white">
                  <GraduationCap className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>Demo Mentor</span>
                </div>
                <div className="text-[10px] text-black/70 dark:text-white/75 truncate mt-0.5">
                  Dr. Wan Azhar (UMK)
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoAdmin}
                className="p-2.5 bg-slate-50 hover:bg-amber-50/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-black dark:text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  <span>Demo Admin</span>
                </div>
                <div className="text-[10px] text-black/70 dark:text-white/75 truncate mt-0.5">
                  Admin KBelia
                </div>
              </button>
            </div>

            <div className="text-center text-[10px] text-black/70 dark:text-white/75 pt-1">
              Hak Cipta Terpelihara © 2026 Portal KBelia Kelantan
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN (DESKTOP): CRISP WHITE + TOP-LEFT SKY GLOW   */}
        {/* ======================================================== */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden kbelia-important-header dark:bg-slate-800 select-none lg:col-span-5 xl:col-span-4 order-2 lg:order-1 border-r border-slate-300 dark:border-slate-600">
          
          {/* SOFT GEOMETRIC ACCENT PATTERN */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg 
              className="w-full h-full opacity-35" 
              xmlns="http://www.w3.org/2000/svg"
              width="100%" 
              height="100%"
            >
              <defs>
                <pattern id="register-grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(14, 165, 233, 0.14)" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#register-grid-pattern)" />
            </svg>

            {/* Moving Animated Soft Sky & Slate Accent Squares */}
            <div className="absolute top-[18%] right-[20%] w-[52px] h-[52px] bg-amber-100/50 border border-amber-300/70 rounded-lg animate-hero-float-slow"></div>
            <div className="absolute top-[34%] right-[10%] w-[48px] h-[48px] bg-amber-50/70 border border-amber-300/60 rounded-lg animate-hero-float-reverse"></div>
            <div className="absolute bottom-[26%] left-[14%] w-[54px] h-[54px] bg-slate-100 border border-slate-300 rounded-lg animate-hero-float-fast"></div>
            <div className="absolute bottom-[12%] right-[24%] w-[46px] h-[46px] bg-amber-50/60 border border-amber-300/60 rounded-lg animate-hero-float-slow"></div>
          </div>

          {/* CENTER BRAND EMBLEM & TYPOGRAPHY */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xs xl:max-w-sm mx-auto">
            
            {/* BRAND EMBLEM */}
            <div className="animate-hero-float-slow">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-13 h-13 xl:w-15 xl:h-15 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl xl:text-2xl shadow-md shadow-amber-500/20 border border-blue-600 dark:bg-blue-600">
                  <span>K</span>
                  <span className="text-white text-base xl:text-lg ml-0.5">B</span>
                </div>
                <span className="text-2xl xl:text-3xl font-black text-black dark:text-white tracking-tight">
                  KBelia
                </span>
              </div>
            </div>

            {/* SUBTITLE MOTTO */}
            <p className="text-xs xl:text-sm text-black dark:text-white font-normal leading-relaxed max-w-xs mt-1">
              Portal Rasmi Kiosk & Keusahawanan Belia Kelantan 2026
            </p>

            {/* WELCOME BADGE */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-amber-50 border border-amber-300 text-black shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Selamat Datang ke KBelia</span>
            </div>

          </div>

          {/* FLOATING DARK / LIGHT THEME TOGGLE (BOTTOM LEFT CORNER) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Tukar Mod Cerah/Gelap"
            title={theme === 'dark' ? 'Tukar ke Mod Cerah' : 'Tukar ke Mod Gelap'}
            className="absolute bottom-6 left-6 w-11 h-11 rounded-full bg-white hover:bg-amber-50 active:scale-95 text-black border border-slate-300 flex items-center justify-center shadow-sm transition-all cursor-pointer z-30 interactive-lift"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-black/70 dark:text-white/75" />
            ) : (
              <Moon className="w-5 h-5 text-black dark:text-white" />
            )}
          </button>

        </div>

      </main>

      {/* TERMS & PRIVACY MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-fade-slide-up">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="kbelia-important-header px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2 text-black dark:text-white/75 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Terma & Syarat Pendaftaran KBelia 2026</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3 text-xs text-black dark:text-white leading-relaxed">
                <p>
                  <strong>1. Kelayakan Pemohon:</strong> Terbuka kepada warganegara Malaysia berumur 18 hingga 40 tahun yang menetap atau berniaga di seluruh Negeri Kelantan.
                </p>
                <p>
                  <strong>2. Penggunaan Kiosk & Geran:</strong> Setiap pendaftaran melayakkan pemohon memohon sewaan Kiosk Belia bersubsidi serta Geran Permulaan tertakluk kepada semakan pihak pentadbir.
                </p>
                <p>
                  <strong>3. Dasar Privasi (PDPA 2010):</strong> Maklumat peribadi dan butiran perniagaan yang dikemukakan adalah sulit dan hanya digunakan bagi tujuan pengurusan program pemerkasaan keusahawanan belia negeri.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer dark:bg-blue-600"
              >
                Saya Bersetuju & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
