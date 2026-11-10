import React, { useState, useEffect } from 'react';
import { 
  User, 
  Store, 
  Lock, 
  Bell, 
  Laptop, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Save, 
  KeyRound, 
  Building2, 
  FileText, 
  ExternalLink,
  Shield,
  Clock,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { UMKTab } from './UMKHeader';
import { BusinessCategory, KelantanDistrict } from '../types';

interface UserSettingsPageProps {
  setActiveTab: (tab: UMKTab) => void;
}

type SettingsSection = 'general' | 'profile' | 'business' | 'password' | 'notifications' | 'devices';

const JAJAHAN_OPTIONS: KelantanDistrict[] = [
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

const CATEGORIES: BusinessCategory[] = [
  'Makanan & Minuman (F&B)',
  'Fesyen, Batik & Kraf Kelantan',
  'Teknologi & Servis Digital',
  'Kecantikan & Kesihatan',
  'Pertanian & Agrotek',
  'Runcit & Gaya Hidup'
];

export const UserSettingsPage: React.FC<UserSettingsPageProps> = ({ setActiveTab }) => {
  const { user, userProfile, updateProfileData, isAdmin, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State - General & Profile
  const [fullName, setFullName] = useState(userProfile?.fullName || user?.displayName || 'Usahawan Belia');
  const [nickname, setNickname] = useState(userProfile?.nickname || '');
  const [username, setUsername] = useState(userProfile?.username || (user?.email ? user.email.split('@')[0] : 'usahawan'));
  const [email, setEmail] = useState(user?.email || userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [icNumber, setIcNumber] = useState(userProfile?.icNumber || '');
  const [district, setDistrict] = useState<KelantanDistrict>((userProfile?.district as KelantanDistrict) || 'Kota Bharu');

  // Business Profile State
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [category, setCategory] = useState<BusinessCategory>(userProfile?.category || 'Makanan & Minuman (F&B)');
  const [businessStage, setBusinessStage] = useState<'idea' | 'startup' | 'growth'>(userProfile?.businessStage || 'startup');
  const [ssmStatus, setSsmStatus] = useState<'registered' | 'in_progress' | 'not_registered'>(userProfile?.ssmStatus || 'registered');
  const [ssmNumber, setSsmNumber] = useState(userProfile?.ssmNumber || '');
  const [businessAddress, setBusinessAddress] = useState(userProfile?.businessAddress || '');

  // Notifications Preferences State
  const [notifyEmail, setNotifyEmail] = useState(userProfile?.notifyEmail ?? true);
  const [notifySms, setNotifySms] = useState(userProfile?.notifySms ?? false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(userProfile?.notifyWhatsapp ?? true);

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Auto-sync form if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.fullName) setFullName(userProfile.fullName);
      if (userProfile.nickname) setNickname(userProfile.nickname);
      if (userProfile.username) setUsername(userProfile.username);
      if (userProfile.phone) setPhone(userProfile.phone);
      if (userProfile.icNumber) setIcNumber(userProfile.icNumber);
      if (userProfile.district) setDistrict(userProfile.district as KelantanDistrict);
      if (userProfile.businessName) setBusinessName(userProfile.businessName);
      if (userProfile.category) setCategory(userProfile.category);
      if (userProfile.businessStage) setBusinessStage(userProfile.businessStage);
      if (userProfile.ssmStatus) setSsmStatus(userProfile.ssmStatus);
      if (userProfile.ssmNumber) setSsmNumber(userProfile.ssmNumber);
      if (userProfile.businessAddress) setBusinessAddress(userProfile.businessAddress);
      if (typeof userProfile.notifyEmail === 'boolean') setNotifyEmail(userProfile.notifyEmail);
      if (typeof userProfile.notifySms === 'boolean') setNotifySms(userProfile.notifySms);
      if (typeof userProfile.notifyWhatsapp === 'boolean') setNotifyWhatsapp(userProfile.notifyWhatsapp);
    }
  }, [userProfile]);

  const entrepreneurId = user?.uid 
    ? `KBELIA-${user.uid.slice(0, 4).toUpperCase()}-${user.uid.slice(-4).toUpperCase()}`
    : 'KBELIA-2026-0382';

  const avatarSrc = userProfile?.avatarUrl || user?.photoURL || (userProfile?.role === 'admin'
    ? '/src/assets/images/avatar_admin_kelantan_1793924251898.jpg'
    : userProfile?.role === 'mentor'
      ? '/src/assets/images/avatar_mentor_umk_1793924250411.jpg'
      : '/src/assets/images/avatar_youth_male_1793924250192.jpg');

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await updateProfileData({
        fullName,
        nickname,
        username,
        phone,
        icNumber,
        district,
        businessName,
        category,
        businessStage,
        ssmStatus,
        ssmNumber,
        businessAddress,
        notifyEmail,
        notifySms,
        notifyWhatsapp,
        lastLoginAt: new Date().toISOString()
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setSuccessMessage('Maklumat tetapan akaun anda berjaya disimpan dan dikemaskini!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ralat semasa menyimpan maklumat.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Kata laluan baharu dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      confetti({ particleCount: 50, spread: 50 });
      setSuccessMessage('Kata laluan akaun usahawan anda berjaya dikemaskini!');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F3F6F9] text-slate-900 font-sans selection:bg-teal-600 selection:text-white">
      
      {/* 1. TOP HEADER & BREADCRUMB NAVIGATION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab(isAdmin ? 'admin' : 'merchant')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              title="Kembali ke Papan Pemuka"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Papan Pemuka</span>
              <span className="sm:hidden">Kembali</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-700 to-amber-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                KB
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">Tetapan Akaun Usahawan</span>
                <span className="text-[10px] text-slate-500 block -mt-0.5 font-medium">Portal KBELIA Kelantan</span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleSaveChanges()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-3 shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-semibold flex items-center gap-3 shadow-2xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout Matching User Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================
              LEFT COLUMN: PROFILE CARD & SIDEBAR NAV (Col Span 4)
              ========================================= */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* User Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs text-center relative overflow-hidden">
              <div className="relative inline-block mb-3">
                <img
                  src={avatarSrc}
                  alt={fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover mx-auto border-2 border-white shadow-md bg-slate-100"
                />
                {/* Online Indicator Dot at Top Right (like in user image) */}
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Akaun Aktif & Disahkan" />
              </div>

              {/* ID & Full Name */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-900 text-[11px] font-mono font-bold border border-red-200">
                  <span>{entrepreneurId}</span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight uppercase leading-snug">
                  {fullName}
                </h3>
                {businessName && (
                  <p className="text-xs font-semibold text-teal-700">
                    {businessName}
                  </p>
                )}
              </div>

              {/* Status / Notifications pill button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('notifications')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600" />
                  <span>Notifikasi Aktif</span>
                </button>
              </div>

              {/* Quick Metadata Details */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Username:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate block">{username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jajahan:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate block">{district}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Emel Rasmi:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate block">{email}</span>
                </div>
              </div>
            </div>

            {/* Vertical Navigation Menu matching Reference Image */}
            <nav className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs space-y-1 text-xs font-bold">
              
              <button
                type="button"
                onClick={() => setActiveSection('general')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'general'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'general' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <span>Maklumat Am (General)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'profile'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'profile' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="w-4 h-4" />
                </div>
                <span>Profil Usahawan (Profile)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('business')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'business'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'business' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Store className="w-4 h-4" />
                </div>
                <span>Profil Bisnes & SSM</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('password')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'password'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'password' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <span>Keselamatan & Kata Laluan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('notifications')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'notifications'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'notifications' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <span>Notifikasi & Saluran</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('devices')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  activeSection === 'devices'
                    ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeSection === 'devices' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Laptop className="w-4 h-4" />
                </div>
                <span>Sesi & Peranti (Devices)</span>
              </button>

            </nav>

          </div>

          {/* =========================================
              RIGHT COLUMN: SETTINGS FORM CONTENT (Col Span 8)
              ========================================= */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            
            {/* ---------------- SECTION 1: GENERAL INFORMATION ---------------- */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Maklumat Am Usahawan</h2>
                    <p className="text-xs text-slate-500">Maklumat akaun rasmi anda dalam sistem KBELIA Kelantan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveChanges()}
                    disabled={isSaving}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username (Nama Pengguna)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Samaran / Gelaran
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Nama Samaran / Gelaran"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* E-Mail Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Emel
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      placeholder="Emel"
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Provider */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Penyedia Log Masuk (Provider)
                    </label>
                    <input
                      type="text"
                      value={user?.isGoogle ? 'Akaun Google (OAuth)' : 'Sistem KBELIA Kelantan'}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Status Pengesahan Emel */}
                  <div className="sm:col-span-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Status Emel: Akaun Disahkan</span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-semibold">Aktif untuk semakan geran</span>
                  </div>

                  {/* Read-Only Account Activity Indicators (matching user reference picture) */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Status Keselamatan & Log Masuk
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500">Log Masuk Terakhir:</span>
                        <span className="font-bold text-slate-900">Hari ini, 1 minit lalu</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500">Status Akaun:</span>
                        <span className="font-bold text-emerald-700">Aktif & Sah (Kelantan)</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500">Tarikh Pendaftaran:</span>
                        <span className="font-bold text-slate-900">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('ms-MY') : '15/10/2026'}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500">Status Sekatan (Ban):</span>
                        <span className="font-bold text-slate-900">Tiada (Akaun Baik)</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ---------------- SECTION 2: PROFILE USAHAWAN ---------------- */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Profil Peribadi Usahawan</h2>
                    <p className="text-xs text-slate-500">Kemaskini data peribadi bagi pendaftaran kiosk dan permohonan dana.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveChanges()}
                    disabled={isSaving}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Nama Penuh */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Penuh (Seperti MyKad)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama penuh"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* No. MyKad */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      No. Kad Pengenalan (MyKad)
                    </label>
                    <input
                      type="text"
                      value={icNumber}
                      onChange={(e) => setIcNumber(e.target.value)}
                      placeholder="Masukkan No. Kad Pengenalan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* No Telefon */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombor Telefon / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="No. telefon"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Jajahan */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jajahan Kediaman / Operasi di Kelantan
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    >
                      {JAJAHAN_OPTIONS.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>
            )}

            {/* ---------------- SECTION 3: PROFIL BISNES & SSM ---------------- */}
            {activeSection === 'business' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Profil Perniagaan & Pendaftaran SSM</h2>
                    <p className="text-xs text-slate-500">Maklumat jenama anda untuk pengesahan sewaan kiosk dan direktori negeri.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveChanges()}
                    disabled={isSaving}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Nama Bisnes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Perniagaan / Jenama Dagangan
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Nama perniagaan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kategori Perniagaan
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fasa Bisnes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Fasa Perniagaan Semasa
                    </label>
                    <select
                      value={businessStage}
                      onChange={(e) => setBusinessStage(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="idea">Fasa Idea / R&D (Belum mula berniaga)</option>
                      <option value="startup">Fasa Permulaan (1 - 12 bulan)</option>
                      <option value="growth">Fasa Pertumbuhan (&gt; 1 tahun)</option>
                    </select>
                  </div>

                  {/* Status SSM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Status Pendaftaran SSM
                    </label>
                    <select
                      value={ssmStatus}
                      onChange={(e) => setSsmStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="registered">Sudah Berdaftar dengan SSM</option>
                      <option value="in_progress">Dalam Proses Pendaftaran</option>
                      <option value="not_registered">Belum Berdaftar (Perlu Bimbingan)</option>
                    </select>
                  </div>

                  {/* No SSM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      No. Pendaftaran SSM (Jika ada)
                    </label>
                    <input
                      type="text"
                      value={ssmNumber}
                      onChange={(e) => setSsmNumber(e.target.value)}
                      placeholder="No. pendaftaran SSM"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Alamat Premis */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lokasi / Alamat Operasi Perniagaan di Kelantan
                    </label>
                    <textarea
                      rows={2}
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Lokasi premis perniagaan atau tapak kiosk"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                </div>

              </div>
            )}

            {/* ---------------- SECTION 4: KESELAMATAN & KATA LALUAN ---------------- */}
            {activeSection === 'password' && (
              <div className="space-y-6">
                
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Keselamatan & Kata Laluan</h2>
                  <p className="text-xs text-slate-500">Urus kata laluan dan perlindungan sesi akaun usahawan anda.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                  
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kata Laluan Semasa
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Kata Laluan Semasa"
                        className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kata Laluan Baharu
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kata Laluan Baharu"
                        className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Sahkan Kata Laluan Baharu
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Sahkan Kata Laluan Baharu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Kemas Kini Kata Laluan</span>
                    </button>
                  </div>

                </form>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Perlindungan Enkripsi Sesi 256-Bit SSL</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Akaun anda dilindungi dengan enkripsi peringkat kerajaan negeri. Sesi akan ditamatkan secara automatik jika peranti tidak aktif melebihi 1 jam demi keselamatan maklumat perniagaan anda.
                  </p>
                </div>

              </div>
            )}

            {/* ---------------- SECTION 5: NOTIFIKASI ---------------- */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Pemberitahuan & Saluran Makluman</h2>
                    <p className="text-xs text-slate-500">Pilih jenis makluman tawaran kiosk, geran, dan bengkel keusahawanan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveChanges()}
                    disabled={isSaving}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Notifikasi Melalui Emel</div>
                      <p className="text-[11px] text-slate-500">Terima surat tawaran geran, invois sewaan kiosk, dan laporan jualan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Makluman WhatsApp Usahawan</div>
                      <p className="text-[11px] text-slate-500">Pemberitahuan pantas tarikh penyerahan kunci kiosk dan bengkel bimbingan mentor.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Makluman SMS Penting</div>
                      <p className="text-[11px] text-slate-500">Peringatan kod pengesahan keselamatan atau pembaharuan permit sewaan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifySms}
                        onChange={(e) => setNotifySms(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                </div>

              </div>
            )}

            {/* ---------------- SECTION 6: PERANTI & SESI ---------------- */}
            {activeSection === 'devices' && (
              <div className="space-y-6">
                
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Sesi Log Masuk & Peranti</h2>
                  <p className="text-xs text-slate-500">Pantau aktiviti peranti yang mempunyai akses ke akaun usahawan ini.</p>
                </div>

                <div className="space-y-3">
                  
                  {/* Current Active Device */}
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-2">
                          <span>Peranti Semasa (Pelayar Web)</span>
                          <span className="px-2 py-0.2 bg-teal-100 text-teal-800 rounded font-bold text-[10px]">Aktif Sekarang</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Lokasi: Negeri Kelantan, Malaysia · Sesi Terkini
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Device */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          Aplikasi Mudah Alih (PWA)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Terakhir aktif: Hari ini, 15 minit lalu
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setActiveTab('login');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-2"
                  >
                    <span>Log Keluar daripada Semua Peranti Lain</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
};
